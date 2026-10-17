// Tema visual: alternancia claro/oscuro y persistencia de preferencia.
// Funcion: syncThemeSwitch
// Que hace: Sincroniza el estado visual (aria-checked) del switch de tema con la clase html.dark-mode.
function syncThemeSwitch() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    document.querySelectorAll('.theme-switch').forEach((el) => {
        el.setAttribute('aria-checked', isDark ? 'true' : 'false');
    });
}

// Funcion: initDarkMode
// Que hace: Gestiona la logica de initDarkMode.
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
        syncThemeSwitch();
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
    syncThemeSwitch();
}

// Funcion: toggleDarkMode
// Que hace: Gestiona la logica de toggleDarkMode.
function toggleDarkMode(storageKey = 'darkMode') {
    const html = document.documentElement;
    const nextIsDarkMode = !html.classList.contains('dark-mode');
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasActiveToastTimer = !!document.querySelector('.swal2-popup.swal2-toast .swal2-timer-progress-bar');

// Funcion: applyTheme
// Que hace: Gestiona la logica de applyTheme.
    const applyTheme = () => {
        html.classList.toggle('dark-mode', nextIsDarkMode);
        localStorage.setItem(storageKey, nextIsDarkMode ? '1' : '0');
        syncThemeSwitch();
    };

    if (prefersReducedMotion || hasActiveToastTimer) {
        applyTheme();
        return;
    }

    html.classList.add('theme-transitioning');

// Funcion: cleanup
// Que hace: Gestiona la logica de cleanup.
    const cleanup = () => {
        setTimeout(() => {
            html.classList.remove('theme-transitioning');
        }, 260);
    };

    requestAnimationFrame(() => {
        applyTheme();
        requestAnimationFrame(cleanup);
    });
}

window.initDarkMode = initDarkMode;
window.toggleDarkMode = toggleDarkMode;
window.syncThemeSwitch = syncThemeSwitch;