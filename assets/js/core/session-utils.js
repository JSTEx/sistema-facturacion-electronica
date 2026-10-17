// Gestion de sesion local: usuario actual, persistencia y cierre.
async function confirmLogout(options = {}) {
    const redirectUrl = options.redirectUrl || '/login';
    const confirmTitle = options.confirmTitle || 'Cerrar sesión';
    const confirmText = options.confirmText || '¿Estás seguro de que deseas salir?';
    const confirmButtonText = options.confirmButtonText || 'Sí, salir';
    const cancelButtonText = options.cancelButtonText || 'Cancelar';
    const successTitle = options.successTitle || '¡Hasta pronto!';
    const successText = options.successText || 'Sesión cerrada correctamente';
    const confirmButtonColor = options.confirmButtonColor || '#1a1a1a';
    const cancelButtonColor = options.cancelButtonColor || '#d33';
    const successDelay = Number(options.successDelay) || 600;

// Funcion: runLogout
// Que hace: Gestiona la logica de runLogout.
    const runLogout = async () => {
        const darkModeSetting = localStorage.getItem('darkMode');
        try {
            await window.supabaseAuth.signOut();
        } catch (error) {
            console.error('Error al cerrar sesión en Supabase:', error);
        }
        localStorage.clear();
        if (darkModeSetting) localStorage.setItem('darkMode', darkModeSetting);
        setTimeout(() => { window.location.href = redirectUrl; }, successDelay);
    };

    if (!window.Swal) {
        await runLogout();
        return;
    }

    const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor,
        confirmButtonText,
        cancelButtonText
    });

    if (result.isConfirmed) {
        await Swal.fire({
            icon: 'success',
            title: successTitle,
            text: successText,
            confirmButtonColor,
            timer: 1500,
            showConfirmButton: false
        });
        await runLogout();
    }
}

window.confirmLogout = confirmLogout;