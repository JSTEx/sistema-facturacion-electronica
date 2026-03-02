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

window.showAppLoading = showAppLoading;
window.hideAppLoading = hideAppLoading;
