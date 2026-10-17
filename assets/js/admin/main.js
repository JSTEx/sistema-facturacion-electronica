// Modulo principal del panel admin: gestion de usuarios y permisos (Supabase).
window.toastTheme = {
    background: '#eff6ff',
    color: '#1e3a8a',
    iconColor: '#2563eb'
};

// Funcion: callAdminApi
// Que hace: Llama a la funcion serverless /api/users con el token de sesion.
async function callAdminApi(payload) {
    const session = await getSupabaseSession();
    const token = session ? session.access_token : null;
    if (!token) {
        throw new Error('Sesion no valida. Vuelve a iniciar sesion.');
    }

    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    let data = {};
    try {
        data = await response.json();
    } catch (_) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || `Error del servidor (${response.status})`);
    }

    return data;
}

// Funcion: loadUsers
// Que hace: Carga los perfiles de usuario desde Supabase.
async function loadUsers() {
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, email, role, description')
        .order('email', { ascending: true });

    if (error) {
        console.error('Error cargando usuarios:', error);
        return [];
    }

    return (data || []).map((u) => ({ ...u, uid: u.id }));
}

// Funcion: updateProfile
// Que hace: Actualiza rol/descripcion de un perfil.
async function updateProfile(id, changes) {
    const { error } = await window.supabaseClient
        .from('profiles')
        .update(changes)
        .eq('id', id);

    if (error) {
        console.error('Error actualizando perfil:', error);
        throw new Error('No se pudo actualizar el usuario');
    }
}

// Funcion: deleteProfile
// Que hace: Elimina solo el perfil (conserva el acceso de autenticacion).
async function deleteProfile(id) {
    const { error } = await window.supabaseClient
        .from('profiles')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error eliminando perfil:', error);
        throw new Error('No se pudo eliminar el perfil');
    }
}

// Funcion: logAction
// Que hace: Registra una accion del administrador en la auditoria.
async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const { error } = await window.supabaseClient.from('admin_audit').insert({
        admin_email: admin ? admin.email : null,
        action,
        target
    });

    if (error) {
        console.error('Error registrando auditoría:', error);
    }
}

// Funcion: countAdmins
// Que hace: Cuenta cuantos administradores hay en la lista.
function countAdmins(list) {
    return list.filter((u) => String(u?.role || '').toLowerCase() === 'admin').length;
}

let currentPage = 1;
let pageSize = 10;
let currentFilter = '';
let usersSkeletonPending = true;

async function renderUsers() {
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;

    try {
        if (usersSkeletonPending) {
            tbody.innerHTML = window.createSkeletonRows
                ? window.createSkeletonRows({ count: 5, columns: 4 })
                : '<tr><td colspan="4" class="p-3 text-center muted-text">Cargando usuarios...</td></tr>';
        }

        const allUsers = await loadUsers();
        usersSkeletonPending = false;
        const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

        const filter = String(currentFilter || '').toLowerCase();
        const filtered = allUsers.filter((u) => String(u?.email || '').toLowerCase().includes(filter));

        pageSize = parseInt(document.getElementById('pageSize')?.value || '10', 10);
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);

        tbody.innerHTML = '';

        if (pageItems.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" class="p-3 text-center muted-text">No hay usuarios para mostrar.</td>';
            tbody.appendChild(tr);
        }

        pageItems.forEach((u, idx) => {
            const globalIndex = allUsers.indexOf(u);
            const userEmail = String(u?.email || '');
            const userRole = String(u?.role || 'user');
            const isCurrent = current && current.email && userEmail.toLowerCase() === String(current.email).toLowerCase();
            const rowNumber = start + idx + 1;
            const descriptionIndicator = u.description ? ` <span class="admin-description-indicator text-xs" title="${u.description}">📝</span>` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="admin-row-number p-2 text-center font-semibold">${rowNumber}</td><td class="p-2">${userEmail}${descriptionIndicator}${isCurrent ? ' <span class="text-xs muted-text">(Cuenta actual)</span>' : ''}</td><td class="p-2 text-center">${userRole}</td><td class="p-2 text-center">${isCurrent ? '<span class="text-xs muted-text">-</span>' : `<button data-index="${globalIndex}" class="editBtn px-2 py-1 bg-blue-500 text-white rounded mr-2">Editar</button><button data-index="${globalIndex}" class="delBtn px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>`}</td>`;
            tbody.appendChild(tr);
        });

        const currentPageEl = document.getElementById('currentPage');
        if (currentPageEl) currentPageEl.textContent = String(currentPage);

        document.querySelectorAll('.delBtn').forEach((button) => button.addEventListener('click', async function () {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            const users = await loadUsers();
            const target = users[idx];
            if (!target) return;

            const adminCount = countAdmins(users);
            const isTargetAdmin = String(target.role || '').toLowerCase() === 'admin';
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

            if (currentUser?.email && currentUser.email.toLowerCase() === String(target.email || '').toLowerCase()) {
                Swal.fire({ icon: 'error', title: 'No permitido', text: 'No puedes eliminar la cuenta con la que estás logueado.' });
                return;
            }

            if (isTargetAdmin && adminCount <= 1) {
                Swal.fire({ icon: 'error', title: 'No permitido', text: 'Debe existir al menos un administrador.' });
                return;
            }

            const result = await Swal.fire({
                title: 'Eliminar usuario?',
                html: `
                    <p>Eliminar <strong>${target.email}</strong> no se puede deshacer.</p>
                    <p class="admin-delete-note">Se eliminará el acceso del usuario (autenticación) y su perfil.</p>
                    <div class="admin-delete-fields">
                        <label class="admin-delete-warning">
                            <input id="forceProfileOnly" type="checkbox">
                            Eliminar solo el perfil (no borrar el acceso de autenticación)
                        </label>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#16a34a',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'No, cancelar',
                preConfirm: () => ({
                    forceProfileOnly: !!document.getElementById('forceProfileOnly')?.checked
                })
            });

            if (!result.isConfirmed) return;

            const forceProfileOnly = !!result.value?.forceProfileOnly;

            try {
                if (forceProfileOnly) {
                    await deleteProfile(target.id);
                    await logAction('delete-profile-only', target.email);
                    showToast('Perfil eliminado (acceso de autenticación conservado)', 'success', 1900);
                } else {
                    await callAdminApi({ action: 'delete', userId: target.id });
                    await logAction('delete', target.email);
                    showToast('Usuario eliminado de autenticación y perfiles', 'success', 1700);
                }
                await renderUsers();
            } catch (error) {
                console.error('Error eliminando usuario:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'No se eliminó',
                    text: error.message || 'No se pudo eliminar el usuario.',
                    confirmButtonColor: '#dc2626'
                });
            }
        }));

        document.querySelectorAll('.editBtn').forEach((button) => button.addEventListener('click', function () {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            openEditDialog(idx);
        }));
    } catch (error) {
        console.error('Admin render error:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-red-400">Error cargando usuarios.</td></tr>';
    }
}

async function openEditDialog(index) {
    const users = await loadUsers();
    const target = users[index];
    if (!target) return;

    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const { value: formValues } = await Swal.fire({
        title: `Editar ${target.email}`,
        html:
            `<div class="edit-user-form">` +
            `<p class="edit-user-note">Las contraseñas se gestionan mediante Supabase Auth. Los usuarios pueden cambiarlas desde su perfil.</p>` +
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
        preConfirm: () => ({
            newRole: document.getElementById('swal-role').value,
            newDescription: (document.getElementById('swal-description')?.value || '').trim()
        })
    });

    if (!formValues) return;

    if (current?.email && current.email.toLowerCase() === String(target.email || '').toLowerCase() && formValues.newRole !== 'admin') {
        Swal.fire({ icon: 'error', title: 'Acción no permitida', text: 'No puedes despromover tu propia cuenta.' });
        return;
    }

    try {
        await updateProfile(target.id, { role: formValues.newRole, description: formValues.newDescription });
        await logAction('edit', target.email);
        showToast('Usuario actualizado', 'success', 1200);
        await renderUsers();
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo actualizar el usuario' });
    }
}

// Funcion: bindAdminEvents
// Que hace: Gestiona la logica de bindAdminEvents.
function bindAdminEvents() {
    document.getElementById('userForm')?.addEventListener('submit', async function (e) {
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

        try {
            await callAdminApi({ action: 'create', email, password: pass, role });
            this.reset();
            await logAction('create', email);
            showToast('Usuario creado', 'success', 1400);
            await renderUsers();
        } catch (error) {
            console.error('Error creando usuario:', error);
            const message = error.message || 'Error al crear usuario';
            if (message.toLowerCase().includes('already')) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'El email ya está registrado', confirmButtonColor: '#dc2626' });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#dc2626' });
            }
        }
    });

    document.getElementById('exportBtn')?.addEventListener('click', async function () {
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

    document.getElementById('importBtn')?.addEventListener('click', function () {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile')?.addEventListener('change', function (e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const imported = JSON.parse(reader.result);
                if (!Array.isArray(imported)) throw new Error('Formato incorrecto');

                const rows = imported
                    .filter((u) => u && u.email)
                    .map((u) => ({
                        id: u.id || u.uid || null,
                        email: String(u.email).trim(),
                        role: String(u.role || '').toLowerCase() === 'admin' ? 'admin' : 'user',
                        description: u.description || ''
                    }))
                    .filter((u) => u.id);

                if (!rows.length) throw new Error('No hay usuarios válidos (falta id/uid)');

                const { error } = await window.supabaseClient
                    .from('profiles')
                    .upsert(rows, { onConflict: 'id' });
                if (error) throw error;

                showToast('Usuarios importados', 'success', 1200);
                await renderUsers();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Archivo inválido' });
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('userSearch')?.addEventListener('input', function (e) {
        currentFilter = e.target.value;
        currentPage = 1;
        renderUsers();
    });

    document.getElementById('pageSize')?.addEventListener('change', function (e) {
        pageSize = parseInt(e.target.value, 10);
        currentPage = 1;
        renderUsers();
    });

    document.getElementById('prevPage')?.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage -= 1;
            renderUsers();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function () {
        currentPage += 1;
        renderUsers();
    });
}

// Funcion: bindRealtimeUsers
// Que hace: Se suscribe a cambios de la tabla profiles via Supabase Realtime.
function bindRealtimeUsers() {
    if (window.__adminUsersRealtimeBound) return;

    window.supabaseClient
        .channel('profiles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            renderUsers();
        })
        .subscribe();

    window.__adminUsersRealtimeBound = true;
}

// Funcion: logout
// Que hace: Gestiona la logica de logout.
function logout() {
    return confirmLogout({
        confirmTitle: 'Salir del panel',
        confirmText: 'Estas seguro de que deseas salir del panel de usuarios?',
        confirmButtonText: 'Si, salir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#dc2626',
        successTitle: 'Hasta pronto',
        successText: 'Sesion cerrada correctamente'
    });
}

window.logout = logout;

showAppLoading('Verificando sesion...');

(async function enforceAdminAuthGuard() {
    const ready = await waitForSupabaseReady();
    if (!ready) {
        hideAppLoading();
        window.location.replace('login.html');
        return;
    }

    const user = await getSupabaseUser();
    if (!user) {
        window.location.replace('login.html');
        return;
    }

    const profile = await getProfileByEmail(user.email);

    if (!profile || String(profile.role || '').toLowerCase() !== 'admin') {
        await window.supabaseAuth.signOut();
        hideAppLoading();
        window.location.replace('login.html');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({ email: profile.email, role: profile.role, uid: profile.id }));

    const currentEmail = document.getElementById('currentUserEmail');
    if (currentEmail) currentEmail.textContent = profile.email;

    hideAppLoading();
    await renderUsers();
    bindRealtimeUsers();
})();

document.addEventListener('DOMContentLoaded', function () {
    initDarkMode({ respectSystem: false });
    bindAdminEvents();

    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const el = document.getElementById('currentUserEmail');
    if (el && cur) el.textContent = cur.email;
});
