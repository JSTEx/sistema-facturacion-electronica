function showToast(title, icon = 'success', timer = 1600, position = 'top-end', options = {}) {
    if (!window.Swal) return;
    const iconName = String(icon || '').toLowerCase();
    const inferredType = iconName === 'error' ? 'danger' : (iconName === 'warning' ? 'warning' : 'success');
    const toastType = options.toastType || inferredType;
    const unifiedTimer = 2500;
    const isDarkMode = document.documentElement.classList.contains('dark-mode');

    const palettes = {
        light: {
            success: { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)', color: '#ffffff', iconColor: '#dcfce7', progressBar: 'rgba(240, 253, 244, 0.95)' },
            warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 58%, #b45309 100%)', color: '#fffbeb', iconColor: '#fef3c7', progressBar: 'rgba(255, 251, 235, 0.95)' },
            danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 55%, #b91c1c 100%)', color: '#fef2f2', iconColor: '#fee2e2', progressBar: 'rgba(254, 242, 242, 0.95)' }
        },
        dark: {
            success: { background: 'linear-gradient(135deg, #064e3b 0%, #065f46 58%, #047857 100%)', color: '#ecfdf5', iconColor: '#6ee7b7', progressBar: 'rgba(209, 250, 229, 0.95)' },
            warning: { background: 'linear-gradient(135deg, #78350f 0%, #92400e 58%, #b45309 100%)', color: '#fef3c7', iconColor: '#fde68a', progressBar: 'rgba(254, 243, 199, 0.95)' },
            danger: { background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 58%, #b91c1c 100%)', color: '#fee2e2', iconColor: '#fecaca', progressBar: 'rgba(254, 226, 226, 0.95)' }
        }
    };

    const basePalette = (isDarkMode ? palettes.dark : palettes.light)[toastType] || (isDarkMode ? palettes.dark.success : palettes.light.success);
    const background = options.background || basePalette.background;
    const color = options.color || basePalette.color;
    const iconColor = options.iconColor || basePalette.iconColor;
    const progressBarColor = options.progressBarColor || basePalette.progressBar;

    return Swal.fire({
        toast: true,
        position: position || 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer: unifiedTimer,
        timerProgressBar: true,
        background,
        color,
        iconColor,
        didOpen: (toastEl) => {
            const progressBarEl = toastEl.querySelector('.swal2-timer-progress-bar');
            if (progressBarEl) progressBarEl.style.background = progressBarColor;
        },
        customClass: {
            popup: `swal-toast-${toastType}`
        }
    });
}

window.showToast = showToast;
