const { logAction, loadUsers, saveUsers, countAdmins } = window.adminData;

async function render() {
    const state = window.adminState;
    const allUsers = await loadUsers();
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const filter = (state.currentFilter || '').toLowerCase();
    const filtered = allUsers.filter((u) => String(u?.email || '').toLowerCase().includes(filter));

    state.pageSize = parseInt(document.getElementById('pageSize').value || '10');
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * state.pageSize;
    const pageItems = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = '';
    pageItems.forEach((u, idx) => {
        const globalIndex = allUsers.indexOf(u);
        const userEmail = String(u?.email || '');
        const userRole = String(u?.role || '');
        const isCurrent = current && current.email && (userEmail.toLowerCase() === String(current.email).toLowerCase());
        const rowNumber = start + idx + 1;
        const descriptionIndicator = u.description ? ` <span class="admin-description-indicator text-xs" title="${u.description}">📝</span>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="admin-row-number p-2 text-center font-semibold">${rowNumber}</td><td class="p-2">${userEmail}${descriptionIndicator}${isCurrent ? ' <span class="text-xs muted-text">(Cuenta actual)</span>' : ''}</td><td class="p-2 text-center">${userRole}</td><td class="p-2 text-center">${isCurrent ? '<span class="text-xs muted-text">-</span>' : `<button data-index="${globalIndex}" class="editBtn px-2 py-1 bg-blue-500 text-white rounded mr-2">Editar</button><button data-index="${globalIndex}" class="delBtn px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>`}</td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('currentPage').textContent = state.currentPage;

    document.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', async function () {
        const idx = parseInt(this.getAttribute('data-index'));
        const users = await loadUsers();
        const target = users[idx];
        if (!target) return;

        const adminCount = countAdmins(users);
        const isTargetAdmin = target.role === 'admin';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

        if (currentUser && currentUser.email && currentUser.email.toLowerCase() === target.email.toLowerCase()) {
            Swal.fire({ icon: 'error', title: 'No permitido', text: 'No puedes eliminar la cuenta con la que estás logueado.' });
            return;
        }
        if (isTargetAdmin && adminCount <= 1) {
            Swal.fire({ icon: 'error', title: 'No permitido', text: 'Debe existir al menos un administrador.' });
            return;
        }

        Swal.fire({
            title: 'Eliminar usuario?',
            html: `
                <p>Eliminar <strong>${target.email}</strong> no se puede deshacer.</p>
                <p class="admin-delete-note">Para eliminarlo completamente, también se borrará de Firebase Authentication.</p>
                <div class="admin-delete-fields">
                    <label for="deleteUserPassword" class="admin-delete-label">Contraseña actual del usuario</label>
                    <input id="deleteUserPassword" type="password" class="swal2-input admin-delete-input" placeholder="Ingresa la contraseña del usuario">
                    <label class="admin-delete-warning">
                        <input id="forceDeleteDbOnly" type="checkbox">
                        Forzar eliminación solo en base de datos (no borrar en Firebase Authentication)
                    </label>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#16a34a',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar',
            preConfirm: () => {
                const forceDbOnly = !!document.getElementById('forceDeleteDbOnly')?.checked;
                const password = (document.getElementById('deleteUserPassword')?.value || '').trim();
                if (!forceDbOnly && !password) {
                    Swal.showValidationMessage('Debes ingresar la contraseña actual del usuario para eliminarlo de Firebase Authentication.');
                    return false;
                }
                return { password, forceDbOnly };
            }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const forceDbOnly = !!res.value?.forceDbOnly;

                if (forceDbOnly) {
                    users.splice(idx, 1);
                    await saveUsers(users);
                    await logAction('delete-db-only', target.email);
                    showToast('Usuario eliminado solo en base de datos', 'success', 1700);
                    await render();
                    return;
                }

                try {
                    const targetPassword = res.value.password;
                    const authCredential = await window.firebaseSignIn(window.firebaseProvisionAuth, target.email, targetPassword);
                    await window.firebaseDeleteUser(authCredential.user);
                    await window.firebaseProvisionAuth.signOut();

                    users.splice(idx, 1);
                    await saveUsers(users);
                    await logAction('delete', target.email);
                    showToast('Usuario eliminado de Firebase Auth y base de datos', 'success', 1700);
                    await render();
                } catch (error) {
                    console.error('Error eliminando usuario en Firebase Auth:', error);
                    try { await window.firebaseProvisionAuth.signOut(); } catch (_) {}

                    let message = 'No se pudo eliminar el usuario en Firebase Authentication.';
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        message = 'La contraseña ingresada no es correcta.';
                    } else if (error.code === 'auth/user-not-found') {
                        message = 'El usuario no existe en Firebase Authentication.';
                    } else if (error.code === 'auth/too-many-requests') {
                        message = 'Demasiados intentos. Intenta de nuevo más tarde.';
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'No se eliminó',
                        text: `${message} La cuenta no fue borrada de la base de datos para mantener consistencia.`,
                        confirmButtonColor: '#dc2626'
                    });
                }
            }
        });
    }));

    document.querySelectorAll('.editBtn').forEach(b => b.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'));
        openEditDialog(idx);
    }));
}

