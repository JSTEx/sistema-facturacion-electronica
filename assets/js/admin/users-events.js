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
        if (users.find(u => String(u?.email || '').toLowerCase() === email.toLowerCase())) {
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
                const valid = imported.every(u => u && u.email && u.role);
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

async function waitForAdminSessionReady(options = {}) {
    const maxAttempts = Number(options.maxAttempts) || 120;
    const intervalMs = Number(options.intervalMs) || 40;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const firebaseUserReady = !!(window.firebaseAuth && window.firebaseAuth.currentUser);
        const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const hasAdminLocalState = !!(localUser && localUser.email && String(localUser.role || '').toLowerCase() === 'admin');

        if (firebaseUserReady || hasAdminLocalState) return true;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return false;
}

function startUsersRealtimeSubscription() {
    if (window.__adminUsersRealtimeBound) return;
    if (!window.firebaseRef || !window.firebaseDB || !window.firebaseOnValue) return;

    const usersRef = window.firebaseRef(window.firebaseDB, 'users');
    window.firebaseOnValue(usersRef, () => {
        render();
    });

    window.__adminUsersRealtimeBound = true;
}

document.addEventListener('DOMContentLoaded', async function () {
    initDarkMode({ respectSystem: false });

    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const el = document.getElementById('currentUserEmail');
    if (el && cur) el.textContent = cur.email;

    bindAdminEvents();

    const firebaseReady = await waitForFirebaseReady({
        required: ['firebaseDB', 'firebaseRef', 'firebaseOnValue', 'firebaseGet', 'firebaseChild']
    });

    if (!firebaseReady) {
        showToast('No se pudo conectar a Firebase para cargar usuarios.', 'error', 2600);
        return;
    }

    await waitForAdminSessionReady();
    await render();
    startUsersRealtimeSubscription();
});

window.addEventListener('admin-auth-ready', async function () {
    await render();
    startUsersRealtimeSubscription();
});

window.render = render;
window.openEditDialog = openEditDialog;
