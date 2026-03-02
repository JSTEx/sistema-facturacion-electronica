showAppLoading('Verificando sesion...');

(async function enforceAdminAuthGuard() {
    const ready = await waitForFirebaseReady();
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

        const users = normalizeUsers(await getFirebaseData('users'));
        const userData = users.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());

        if (!userData || userData.role !== 'admin') {
            await window.firebaseAuth.signOut();
            hideAppLoading();
            window.location.replace('login.html');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, role: userData.role }));
        hideAppLoading();
        window.dispatchEvent(new CustomEvent('admin-auth-ready'));
    });
})();

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
