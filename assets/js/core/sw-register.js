(function () {
    if (!('serviceWorker' in navigator)) return;

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) return;

    window.addEventListener('load', function () {
        const inPagesFolder = window.location.pathname.includes('/pages/');
        const swPath = inPagesFolder ? '../sw.js' : 'sw.js';

        navigator.serviceWorker.register(swPath).catch((error) => {
            console.warn('No se pudo registrar Service Worker:', error);
        });
    });
})();
