// Logica de inicio de sesion, validaciones y manejo de estado de auth (Supabase).
async function initAuthFlow() {
    showAppLoading('Verificando sesion...');
    const ready = await waitForSupabaseReady();
    if (!ready) {
        hideAppLoading();
        showToast('Supabase no se pudo inicializar. Revisa la configuracion y recarga la pagina.', 'error', 2800);
        return;
    }

    // Si ya existe una sesion valida, redirigir directamente.
    const existingUser = await getSupabaseUser();
    if (existingUser?.email) {
        const existingProfile = await getProfileByEmail(existingUser.email);
        if (existingProfile) {
            localStorage.setItem('currentUser', JSON.stringify({
                email: existingProfile.email,
                role: existingProfile.role,
                uid: existingProfile.id
            }));
            window.location.replace('../index.html');
            return;
        }
    }

    hideAppLoading();

    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

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
            const { data, error } = await window.supabaseAuth.signInWithPassword({ email, password });
            if (error) throw error;

            const profile = await getProfileByEmail(data?.user?.email || email);

            if (profile) {
                localStorage.setItem('currentUser', JSON.stringify({
                    email: profile.email,
                    role: profile.role,
                    uid: profile.id
                }));
                showToast('Inicio de sesion exitoso.', 'success', 1400);
                setTimeout(() => {
                    window.location.replace('../index.html');
                }, 350);
            } else {
                errorMessage.textContent = 'Usuario autenticado, pero sin perfil asignado en la base de datos.';
                showToast('Usuario autenticado, pero sin perfil asignado.', 'error', 2600);
                errorMessage.classList.remove('hidden');
                await window.supabaseAuth.signOut();
                hideAppLoading();
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            hideAppLoading();
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');

            const rawMessage = String(error?.message || '').toLowerCase();

            if (rawMessage.includes('invalid login credentials')) {
                errorMessage.textContent = 'Email o contraseña incorrectos. Verifica tus credenciales.';
                showToast('Email o contrasena incorrectos.', 'error', 2400);
            } else if (rawMessage.includes('email not confirmed')) {
                errorMessage.textContent = 'Debes confirmar tu correo antes de iniciar sesión.';
                showToast('Correo no confirmado.', 'error', 2600);
            } else if (error?.status === 429 || rawMessage.includes('too many')) {
                errorMessage.textContent = 'Demasiados intentos fallidos. Intenta más tarde.';
                showToast('Demasiados intentos fallidos. Intenta mas tarde.', 'error', 2600);
            } else if (rawMessage.includes('failed to fetch') || error instanceof TypeError) {
                errorMessage.textContent = 'Error de red. Verifica tu conexión a internet.';
                showToast('Error de red. Verifica tu conexion a internet.', 'error', 2600);
            } else {
                errorMessage.textContent = 'Error de autenticación: ' + (error?.message || 'intenta de nuevo.');
                showToast('Error de autenticacion. Intenta de nuevo.', 'error', 2600);
            }
            errorMessage.classList.remove('hidden');
        }
    });
}

initAuthFlow();
