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
    const hasActiveToastTimer = !!document.querySelector('.swal2-popup.swal2-toast .swal2-timer-progress-bar');

    const applyTheme = () => {
        html.classList.toggle('dark-mode', nextIsDarkMode);
        localStorage.setItem(storageKey, nextIsDarkMode ? '1' : '0');
    };

    if (prefersReducedMotion || hasActiveToastTimer) {
        applyTheme();
        return;
    }

    html.classList.add('theme-transitioning');

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
