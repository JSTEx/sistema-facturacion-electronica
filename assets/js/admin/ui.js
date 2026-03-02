const { logAction, loadUsers, saveUsers, countAdmins } = window.adminData;

async function render() {
    const state = window.adminState;
    const allUsers = await loadUsers();
    const tbody = document.getElementById('usersBody');
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const filter = (state.currentFilter || '').toLowerCase();
    const filtered = allUsers.filter(u => u.email.toLowerCase().includes(filter));

    state.pageSize = parseInt(document.getElementById('pageSize').value || '10');
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * state.pageSize;
    const pageItems = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = '';
    pageItems.forEach((u, idx) => {
        const globalIndex = allUsers.indexOf(u);
        const isCurrent = current && current.email && (u.email.toLowerCase() === current.email.toLowerCase());
        const rowNumber = start + idx + 1;
        const descriptionIndicator = u.description ? ` <span class="admin-description-indicator text-xs" title="${u.description}">📝</span>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="admin-row-number p-2 text-center font-semibold">${rowNumber}</td><td class="p-2">${u.email}${descriptionIndicator}${isCurrent ? ' <span class="text-xs muted-text">(Cuenta actual)</span>' : ''}</td><td class="p-2 text-center">${u.role}</td><td class="p-2 text-center">${isCurrent ? '<span class="text-xs muted-text">-</span>' : `<button data-index="${globalIndex}" class="editBtn px-2 py-1 bg-blue-500 text-white rounded mr-2">Editar</button><button data-index="${globalIndex}" class="delBtn px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>`}</td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('currentPage').textContent = state.currentPage;

    document.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', async function () {
        const idx = parseInt(this.getAttribute('data-index'));
        const users = await loadUsers();
        const target = users[idx];

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

async function openEditDialog(index) {
    const users = await loadUsers();
    const target = users[index];
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const { value: formValues } = await Swal.fire({
        title: `Editar ${target.email}`,
        html:
            `<div class="edit-user-form">` +
            `<p class="edit-user-note">Las contraseñas se gestionan mediante Firebase Authentication. Los usuarios pueden cambiarlas desde su perfil.</p>` +
            `<div class="edit-user-group">` +
            `<label class="edit-user-field-label">Rol del usuario</label>` +
            `<select id="swal-role" class="edit-user-select"><option value="user">Usuario</option><option value="admin">Administrador</option></select>` +
            `</div>` +
            `<div class="edit-user-group is-tight">` +
            `<label class="edit-user-field-label">Descripción</label>` +
            `<textarea id="swal-description" class="edit-user-textarea" placeholder="Agrega notas sobre este usuario (proyectos, empresa, contacto, etc.)"></textarea>` +
            `</div>` +
            `</div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'edit-user-popup',
            title: 'edit-user-title',
            htmlContainer: 'edit-user-html',
            confirmButton: 'edit-user-confirm',
            cancelButton: 'edit-user-cancel',
            actions: 'edit-user-actions'
        },
        didOpen: () => {
            const roleSelect = document.getElementById('swal-role');
            if (roleSelect) roleSelect.value = target.role;
            const descField = document.getElementById('swal-description');
            if (descField) descField.value = target.description || '';
        },
        preConfirm: () => {
            return {
                newRole: document.getElementById('swal-role').value,
                newDescription: (document.getElementById('swal-description')?.value || '').trim()
            };
        }
    });

    if (formValues) {
        if (current && current.email && current.email.toLowerCase() === target.email.toLowerCase() && formValues.newRole !== 'admin') {
            Swal.fire({ icon: 'error', title: 'Acción no permitida', text: 'No puedes despromover tu propia cuenta.' });
            return;
        }

        target.role = formValues.newRole;
        target.description = formValues.newDescription;
        await saveUsers(users);
        await logAction('edit', target.email);
        showToast('Usuario actualizado', 'success', 1200);
        await render();
    }
}

function bindAdminEvents() {
    const state = window.adminState;

    document.getElementById('userForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('uemail').value.trim();
        const pass = document.getElementById('upass').value;
        const role = document.getElementById('urole').value;

        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'yandex.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            Swal.fire({
                icon: 'warning',
                title: 'Dominio no permitido',
                text: `Solo se permiten emails de: ${allowedDomains.join(', ')}`,
                confirmButtonColor: '#f97316'
            });
            return;
        }

        const users = await loadUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'El usuario ya existe', confirmButtonColor: '#1f2937' });
            return;
        }

        try {
            const userCredential = await window.firebaseCreateUser(window.firebaseProvisionAuth, email, pass);
            await window.firebaseProvisionAuth.signOut();

            users.push({ email, role, uid: userCredential.user.uid });
            await saveUsers(users);
            this.reset();
            await logAction('create', email);
            showToast('Usuario creado en Firebase Auth', 'success', 1400);
            await render();
        } catch (error) {
            console.error('Error creando usuario:', error);
            if (error.code === 'auth/email-already-in-use') {
                Swal.fire({ icon: 'error', title: 'Error', text: 'El email ya está registrado en Firebase', confirmButtonColor: '#dc2626' });
            } else if (error.code === 'auth/weak-password') {
                Swal.fire({ icon: 'error', title: 'Error', text: 'La contraseña debe tener al menos 6 caracteres', confirmButtonColor: '#dc2626' });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error al crear usuario: ' + error.message, confirmButtonColor: '#dc2626' });
            }
        }
    });

    document.getElementById('exportBtn').addEventListener('click', async function () {
        const users = await loadUsers();
        const data = JSON.stringify(users);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('importBtn').addEventListener('click', function () {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const imported = JSON.parse(reader.result);
                if (!Array.isArray(imported)) throw new Error('Formato incorrecto');
                const valid = imported.every(u => u.email && u.password && u.role);
                if (!valid) throw new Error('Formato incorrecto');
                await setFirebaseData('users', imported);
                showToast('Usuarios importados', 'success', 1200);
                await render();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Archivo inválido' });
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('userSearch').addEventListener('input', function (e) {
        state.currentFilter = e.target.value;
        state.currentPage = 1;
        render();
    });

    document.getElementById('pageSize').addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value);
        state.currentPage = 1;
        render();
    });

    document.getElementById('prevPage').addEventListener('click', function () {
        if (state.currentPage > 1) {
            state.currentPage--;
            render();
        }
    });

    document.getElementById('nextPage').addEventListener('click', function () {
        state.currentPage++;
        render();
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    initDarkMode({ respectSystem: false });

    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const el = document.getElementById('currentUserEmail');
    if (el && cur) el.textContent = cur.email;

    bindAdminEvents();
    await render();

    const usersRef = window.firebaseRef(window.firebaseDB, 'users');
    window.firebaseOnValue(usersRef, () => {
        render();
    });
});

window.render = render;
window.openEditDialog = openEditDialog;
