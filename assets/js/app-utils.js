function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-eye-icon');
    if (!input || !icon) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    if (isPassword) {
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

function showAppLoading(message) {
    const overlay = document.getElementById('appLoading');
    if (!overlay) return;
    const text = overlay.querySelector('.app-loading-text');
    if (text && message) text.textContent = message;
    overlay.classList.remove('app-loading-hidden');
}

function hideAppLoading() {
    const overlay = document.getElementById('appLoading');
    if (!overlay) return;
    overlay.classList.add('app-loading-hidden');
}

function normalizeUsers(rawUsers) {
    if (Array.isArray(rawUsers)) return rawUsers.filter(Boolean);
    if (rawUsers && typeof rawUsers === 'object') return Object.values(rawUsers);
    return [];
}

async function getFirebaseData(path) {
    try {
        const dbRef = window.firebaseRef(window.firebaseDB);
        const snapshot = await window.firebaseGet(window.firebaseChild(dbRef, path));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error reading from Firebase:', error);
        return null;
    }
}

async function setFirebaseData(path, data) {
    try {
        await window.firebaseSet(window.firebaseRef(window.firebaseDB, path), data);
        return true;
    } catch (error) {
        console.error('Error writing to Firebase:', error);
        return false;
    }
}

async function waitForFirebaseReady(options = {}) {
    const maxAttempts = Number(options.maxAttempts) || 100;
    const intervalMs = Number(options.intervalMs) || 30;
    const required = Array.isArray(options.required) ? options.required : [
        'firebaseAuth',
        'firebaseAuthStateChanged',
        'firebaseDB'
    ];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const ready = required.every((key) => !!window[key]);
        if (ready) return true;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return false;
}

function initDarkMode(options = {}) {
    const storageKey = options.storageKey || 'darkMode';
    const respectSystem = options.respectSystem !== false;
    const savedMode = localStorage.getItem(storageKey);
    const isSavedDark = savedMode === '1' || savedMode === 'true';

    if (savedMode !== null) {
        if (isSavedDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        return;
    }

    if (respectSystem) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem(storageKey, '1');
        } else {
            localStorage.setItem(storageKey, '0');
        }
    } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem(storageKey, '0');
    }
}

function toggleDarkMode(storageKey = 'darkMode') {
    const html = document.documentElement;
    const nextIsDarkMode = !html.classList.contains('dark-mode');
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyTheme = () => {
        html.classList.toggle('dark-mode', nextIsDarkMode);
        localStorage.setItem(storageKey, nextIsDarkMode ? '1' : '0');
    };

    if (prefersReducedMotion) {
        applyTheme();
        return;
    }

    html.classList.add('theme-transitioning');

    const cleanup = () => {
        setTimeout(() => {
            html.classList.remove('theme-transitioning');
        }, 260);
    };

    if (typeof document.startViewTransition === 'function') {
        const transition = document.startViewTransition(() => {
            applyTheme();
        });

        if (transition && transition.finished && typeof transition.finished.finally === 'function') {
            transition.finished.finally(cleanup);
        } else {
            cleanup();
        }
        return;
    }

    requestAnimationFrame(() => {
        applyTheme();
        requestAnimationFrame(cleanup);
    });
}

async function confirmLogout(options = {}) {
    const redirectUrl = options.redirectUrl || 'login.html';
    const confirmTitle = options.confirmTitle || 'Cerrar sesión';
    const confirmText = options.confirmText || '¿Estás seguro de que deseas salir?';
    const confirmButtonText = options.confirmButtonText || 'Sí, salir';
    const cancelButtonText = options.cancelButtonText || 'Cancelar';
    const successTitle = options.successTitle || '¡Hasta pronto!';
    const successText = options.successText || 'Sesión cerrada correctamente';
    const confirmButtonColor = options.confirmButtonColor || '#1a1a1a';
    const cancelButtonColor = options.cancelButtonColor || '#d33';
    const successDelay = Number(options.successDelay) || 600;

    const runLogout = async () => {
        const darkModeSetting = localStorage.getItem('darkMode');
        await window.firebaseAuth.signOut();
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

window.togglePasswordVisibility = togglePasswordVisibility;
window.showAppLoading = showAppLoading;
window.hideAppLoading = hideAppLoading;
window.normalizeUsers = normalizeUsers;
window.getFirebaseData = getFirebaseData;
window.setFirebaseData = setFirebaseData;
window.waitForFirebaseReady = waitForFirebaseReady;
window.initDarkMode = initDarkMode;
window.toggleDarkMode = toggleDarkMode;
window.confirmLogout = confirmLogout;
