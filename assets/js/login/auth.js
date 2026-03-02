async function initAuthFlow() {
    showAppLoading('Verificando sesion...');
    const ready = await waitForFirebaseReady({
        required: ['firebaseAuth', 'firebaseAuthStateChanged', 'firebaseSignIn', 'firebaseDB']
    });
    if (!ready) {
        hideAppLoading();
        showToast('Firebase no se pudo inicializar. Recarga la pagina.', 'error', 2800);
        return;
    }

    hideAppLoading();

    let isLoggingIn = false;

    window.firebaseAuthStateChanged(window.firebaseAuth, async (user) => {
        if (isLoggingIn) return;

        if (user) {
            const users = normalizeUsers(await getFirebaseData('users'));
            const userData = users.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());
            if (userData) {
                localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, role: userData.role }));
                window.location.replace(userData.role === 'admin' ? 'admin.html' : '../index.html');
            }
        }
    });

    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        isLoggingIn = true;

        showAppLoading('Iniciando sesion...');

        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');
        const errorMessage = document.getElementById('errorMessage');

        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        errorMessage.classList.add('hidden');

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            await window.firebaseSignIn(window.firebaseAuth, email, password);

            const users = normalizeUsers(await getFirebaseData('users'));
            const userData = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

            if (userData) {
                localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, role: userData.role }));
                showToast('Inicio de sesion exitoso.', 'success', 1400);
                setTimeout(() => {
                    window.location.replace(userData.role === 'admin' ? 'admin.html' : '../index.html');
                }, 350);
            } else {
                errorMessage.textContent = 'Usuario autenticado, pero sin rol asignado en la base de datos.';
                showToast('Usuario autenticado, pero sin rol asignado.', 'error', 2600);
                errorMessage.classList.remove('hidden');
                await window.firebaseAuth.signOut();
                isLoggingIn = false;
                hideAppLoading();
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            isLoggingIn = false;
            hideAppLoading();
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');

            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                errorMessage.textContent = 'Email o contraseña incorrectos. Verifica tus credenciales.';
                showToast('Email o contrasena incorrectos.', 'error', 2400);
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage.textContent = 'Demasiados intentos fallidos. Intenta más tarde.';
                showToast('Demasiados intentos fallidos. Intenta mas tarde.', 'error', 2600);
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage.textContent = 'Error de red. Verifica tu conexión a internet.';
                showToast('Error de red. Verifica tu conexion a internet.', 'error', 2600);
            } else {
                errorMessage.textContent = 'Error de autenticación: ' + error.message;
                showToast('Error de autenticacion. Intenta de nuevo.', 'error', 2600);
            }
            errorMessage.classList.remove('hidden');
        }
    });
}

initAuthFlow();
