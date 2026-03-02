window.toastTheme = {
    background: '#eff6ff',
    color: '#1e3a8a',
    iconColor: '#2563eb'
};

const ADMIN_USER_PATHS = ['users', 'usuarios', 'Users', 'Usuarios'];
let adminUsersPath = 'users';

function normalizeList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
    return [];
}

function pickFirstString(candidates, keys) {
    for (const source of candidates) {
        if (!source || typeof source !== 'object') continue;
        for (const key of keys) {
            const value = source[key];
            if (value === null || value === undefined) continue;
            const parsed = String(value).trim();
            if (parsed) return parsed;
        }
    }
    return '';
}

function normalizeSingleUser(record) {
    if (!record) return null;

    if (typeof record === 'string') {
        const email = record.trim();
        if (!email) return null;
        return { email, role: 'user' };
    }

    if (typeof record !== 'object') return null;

    const candidates = [
        record,
        record.profile,
        record.user,
        record.data,
        record.info,
        record.usuario
    ].filter(Boolean);

    const email = pickFirstString(candidates, ['email', 'userEmail', 'mail', 'correo']);
    if (!email) return null;

    const rawRole = pickFirstString(candidates, ['role', 'rol', 'userRole']).toLowerCase();
    const inferredRole = candidates.some((item) => item?.isAdmin === true || item?.admin === true) ? 'admin' : 'user';
    const role = rawRole || inferredRole;
    const uid = pickFirstString(candidates, ['uid', 'id', 'userId']);

    return {
        ...record,
        email,
        role,
        uid
    };
}

function extractUserRecords(rawUsers, depth = 0) {
    if (depth > 4 || rawUsers === null || rawUsers === undefined) return [];

    if (Array.isArray(rawUsers)) {
        return rawUsers.flatMap((item) => extractUserRecords(item, depth + 1));
    }

    if (typeof rawUsers !== 'object') {
        return [];
    }

    const direct = normalizeSingleUser(rawUsers);
    if (direct) return [rawUsers];

    const containerKeys = ['users', 'usuarios', 'Users', 'Usuarios', 'items', 'list', 'data', 'records'];
    const gathered = [];

    containerKeys.forEach((key) => {
        if (rawUsers[key] !== undefined) {
            gathered.push(...extractUserRecords(rawUsers[key], depth + 1));
        }
    });

    if (gathered.length > 0) return gathered;

    return Object.values(rawUsers).flatMap((value) => extractUserRecords(value, depth + 1));
}

async function readPath(path) {
    const viaWrapper = await getFirebaseData(path);
    if (viaWrapper !== null && viaWrapper !== undefined) return viaWrapper;

    if (window.firebaseGet && window.firebaseRef && window.firebaseDB) {
        try {
            const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, path));
            return snap.exists() ? snap.val() : null;
        } catch (error) {
            console.error(`Error leyendo ${path}:`, error);
        }
    }

    return null;
}

async function loadUsers() {
    let bestPath = 'users';
    let bestCount = -1;
    let bestValue = null;

    for (const path of ADMIN_USER_PATHS) {
        const raw = await readPath(path);
        if (raw === null || raw === undefined) continue;

        const records = extractUserRecords(raw);
        const count = records.length;

        if (count > bestCount) {
            bestCount = count;
            bestPath = path;
            bestValue = raw;
        }
    }

    adminUsersPath = bestPath;

    const source = bestValue ?? [];
    const extracted = extractUserRecords(source);
    const normalized = (extracted.length > 0 ? extracted : normalizeList(source))
        .map((item) => normalizeSingleUser(item))
        .filter(Boolean);

    const dedup = new Map();
    normalized.forEach((user) => dedup.set(String(user.email).toLowerCase(), user));
    return Array.from(dedup.values());
}

async function saveUsers(list) {
    await setFirebaseData(adminUsersPath || 'users', list);
}

async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const rawAudits = await getFirebaseData('adminAudit');
    const audits = Array.isArray(rawAudits)
        ? [...rawAudits]
        : (rawAudits && typeof rawAudits === 'object' ? Object.values(rawAudits).filter(Boolean) : []);

    audits.push({
        time: new Date().toISOString(),
        admin: admin ? admin.email : null,
        action,
        target
    });

    await setFirebaseData('adminAudit', audits);
}

function countAdmins(list) {
    return list.filter((u) => String(u?.role || '').toLowerCase() === 'admin').length;
}

let currentPage = 1;
let pageSize = 10;
let currentFilter = '';

async function renderUsers() {
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;

    try {
        const allUsers = await loadUsers();
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
            });

            if (!result.isConfirmed) return;

            const forceDbOnly = !!result.value?.forceDbOnly;

            if (forceDbOnly) {
                users.splice(idx, 1);
                await saveUsers(users);
                await logAction('delete-db-only', target.email);
                showToast('Usuario eliminado solo en base de datos', 'success', 1700);
                await renderUsers();
                return;
            }

            try {
                const targetPassword = result.value.password;
                const authCredential = await window.firebaseSignIn(window.firebaseProvisionAuth, target.email, targetPassword);
                await window.firebaseDeleteUser(authCredential.user);
                await window.firebaseProvisionAuth.signOut();

                users.splice(idx, 1);
                await saveUsers(users);
                await logAction('delete', target.email);
                showToast('Usuario eliminado de Firebase Auth y base de datos', 'success', 1700);
                await renderUsers();
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

    target.role = formValues.newRole;
    target.description = formValues.newDescription;
    await saveUsers(users);
    await logAction('edit', target.email);
    showToast('Usuario actualizado', 'success', 1200);
    await renderUsers();
}

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

        const users = await loadUsers();
        if (users.find((u) => String(u?.email || '').toLowerCase() === email.toLowerCase())) {
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
            await renderUsers();
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
                const valid = imported.every((u) => u && u.email && u.role);
                if (!valid) throw new Error('Formato incorrecto');
                await setFirebaseData(adminUsersPath || 'users', imported);
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

function bindRealtimeUsers() {
    if (window.__adminUsersRealtimeBound) return;
    if (!window.firebaseRef || !window.firebaseDB || !window.firebaseOnValue) return;

    ADMIN_USER_PATHS.forEach((path) => {
        const refPath = window.firebaseRef(window.firebaseDB, path);
        window.firebaseOnValue(refPath, () => {
            renderUsers();
        });
    });

    window.__adminUsersRealtimeBound = true;
}

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
    const ready = await waitForFirebaseReady({ required: ['firebaseAuth', 'firebaseAuthStateChanged', 'firebaseDB', 'firebaseRef', 'firebaseGet', 'firebaseChild'] });
    if (!ready) {
        hideAppLoading();
        window.location.replace('login.html');
        return;
    }

    window.firebaseAuthStateChanged(window.firebaseAuth, async (user) => {
        if (!user) {
            window.location.replace('login.html');
            return;
        }

        const users = await loadUsers();
        const userData = users.find((u) => String(u?.email || '').toLowerCase() === String(user.email || '').toLowerCase());

        if (!userData || String(userData.role || '').toLowerCase() !== 'admin') {
            await window.firebaseAuth.signOut();
            hideAppLoading();
            window.location.replace('login.html');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, role: userData.role }));

        const currentEmail = document.getElementById('currentUserEmail');
        if (currentEmail) currentEmail.textContent = userData.email;

        hideAppLoading();
        await renderUsers();
        bindRealtimeUsers();
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    initDarkMode({ respectSystem: false });
    bindAdminEvents();

    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const el = document.getElementById('currentUserEmail');
    if (el && cur) el.textContent = cur.email;
});
