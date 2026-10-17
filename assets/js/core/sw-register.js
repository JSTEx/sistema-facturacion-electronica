// Registro del Service Worker y control basico de su activacion.
(function () {
    if (!('serviceWorker' in navigator)) return;

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) return;

    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('No se pudo registrar Service Worker:', error);
        });
    });
})();