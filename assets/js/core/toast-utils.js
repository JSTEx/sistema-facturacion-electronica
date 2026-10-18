// Notificaciones toast propias (sin librerias externas): exito, error e informacion.
// Funcion: showToast
// Que hace: Muestra una notificacion flotante auto-ocultable.
(function () {
    'use strict';

    const ICON_SVG = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const PALETTES = {
        light: {
            success: { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)', color: '#ffffff', iconColor: '#dcfce7', progress: 'rgba(240, 253, 244, 0.95)' },
            warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 58%, #b45309 100%)', color: '#fffbeb', iconColor: '#fef3c7', progress: 'rgba(255, 251, 235, 0.95)' },
            danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 55%, #b91c1c 100%)', color: '#fef2f2', iconColor: '#fee2e2', progress: 'rgba(254, 242, 242, 0.95)' },
            info: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)', color: '#eff6ff', iconColor: '#dbeafe', progress: 'rgba(239, 246, 255, 0.95)' }
        },
        dark: {
            success: { background: 'linear-gradient(135deg, #064e3b 0%, #065f46 58%, #047857 100%)', color: '#ecfdf5', iconColor: '#6ee7b7', progress: 'rgba(209, 250, 229, 0.95)' },
            warning: { background: 'linear-gradient(135deg, #78350f 0%, #92400e 58%, #b45309 100%)', color: '#fef3c7', iconColor: '#fde68a', progress: 'rgba(254, 243, 199, 0.95)' },
            danger: { background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 58%, #b91c1c 100%)', color: '#fee2e2', iconColor: '#fecaca', progress: 'rgba(254, 226, 226, 0.95)' },
            info: { background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 58%, #2563eb 100%)', color: '#dbeafe', iconColor: '#bfdbfe', progress: 'rgba(219, 234, 254, 0.95)' }
        }
    };

    function esc(value) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function resolveType(icon, explicit) {
        const name = String(icon || '').toLowerCase();
        let type = explicit;
        if (!type) {
            if (name === 'error') type = 'danger';
            else if (name === 'warning') type = 'warning';
            else if (name === 'info' || name === 'question') type = 'info';
            else type = 'success';
        }
        if (!PALETTES.light[type]) type = 'success';
        return type;
    }

    function getRoot(position) {
        const safePosition = String(position || 'top-end').replace(/[^a-z-]/gi, '');
        const rootId = `uiToastRoot-${safePosition}`;
        let root = document.getElementById(rootId);
        if (!root) {
            root = document.createElement('div');
            root.id = rootId;
            root.className = `ui-toast-root ui-toast-pos-${safePosition}`;
            document.body.appendChild(root);
        }
        return root;
    }

    function showToast(title, icon = 'success', timer = 1600, position = 'top-end', options = {}) {
        const opts = options || {};
        const type = resolveType(icon, opts.toastType);
        const isDark = document.documentElement.classList.contains('dark-mode');
        const palette = (isDark ? PALETTES.dark : PALETTES.light)[type];
        const background = opts.background || palette.background;
        const color = opts.color || palette.color;
        const iconColor = opts.iconColor || palette.iconColor;
        const progressColor = opts.progressBarColor || palette.progress;
        const duration = Number(opts.timer) > 0 ? Number(opts.timer) : (Number(timer) > 0 ? Number(timer) : 2500);
        const iconSvg = ICON_SVG[type] || ICON_SVG.success;

        const root = getRoot(position);
        const toast = document.createElement('div');
        toast.className = `ui-toast ui-toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.style.background = background;
        toast.style.color = color;
        toast.innerHTML = `
            <span class="ui-toast-icon" style="color:${esc(iconColor)}">${iconSvg}</span>
            <span class="ui-toast-text">${esc(title)}</span>
            <span class="ui-toast-progress" style="background:${esc(progressColor)}"></span>
        `;
        root.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('is-visible'));

        const remove = () => {
            toast.classList.remove('is-visible');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
                if (root && !root.childElementCount) root.remove();
            }, 200);
        };

        const progressEl = toast.querySelector('.ui-toast-progress');
        if (progressEl) {
            progressEl.style.transition = `transform ${duration}ms linear`;
            requestAnimationFrame(() => { progressEl.style.transform = 'scaleX(0)'; });
        }

        const timerId = setTimeout(remove, duration);
        toast.addEventListener('click', () => {
            clearTimeout(timerId);
            remove();
        });

        return Promise.resolve({ isConfirmed: true, isDismissed: false, dismiss: undefined, value: undefined });
    }

    window.showToast = showToast;
})();
