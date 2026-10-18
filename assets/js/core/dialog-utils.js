// Dialogos, alertas, confirmaciones y toasts propios (sin librerias externas).
// Expone: showDialog(options) -> Promise<{isConfirmed,isDenied,isDismissed,dismiss,value}>
//         DialogDismiss (constantes de motivo de cierre)
(function () {
    'use strict';

    const DialogDismiss = {
        cancel: 'cancel',
        backdrop: 'backdrop',
        esc: 'esc',
        timer: 'timer',
        close: 'close',
        deny: 'deny'
    };

    const ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };

    function esc(value) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getRoot(id, className) {
        let root = document.getElementById(id);
        if (!root) {
            root = document.createElement('div');
            root.id = id;
            root.className = className;
            document.body.appendChild(root);
        }
        return root;
    }

    function buildIcon(icon, iconColor) {
        if (!icon || !ICONS[icon]) return '';
        const style = iconColor ? ` style="color:${esc(iconColor)}"` : '';
        return `<div class="ui-dialog-icon ui-dialog-icon-${icon}"${style}>${ICONS[icon]}</div>`;
    }

    function cls(base, extra) {
        return extra ? `${base} ${extra}` : base;
    }

    // showDialog: replica la API de las alertas previas (estilo SweetAlert).
    function showDialog(options) {
        const opts = options || {};
        return new Promise((resolve) => {
            const root = getRoot('uiDialogRoot', 'ui-dialog-root');
            const overlay = document.createElement('div');
            overlay.className = cls('ui-dialog-overlay', opts.toast ? 'is-toast' : '');
            if (opts.toast) {
                const position = String(opts.position || 'top-end').replace(/[^a-z-]/gi, '');
                overlay.classList.add(`ui-dialog-pos-${position}`);
            }

            const popup = document.createElement('div');
            const cc = opts.customClass || {};
            popup.className = cls('ui-dialog', opts.toast ? 'ui-dialog-as-toast' : '');
            if (cc.popup) popup.classList.add(...String(cc.popup).split(/\s+/).filter(Boolean));
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-modal', opts.toast ? 'false' : 'true');
            const maxWidth = opts.width
                ? (typeof opts.width === 'number' ? `${opts.width}px` : String(opts.width))
                : (opts.toast ? '' : '520px');
            if (maxWidth) popup.style.maxWidth = maxWidth;

            let closed = false;
            let timerId = null;

            const finish = (result) => {
                if (closed) return;
                closed = true;
                if (timerId) clearTimeout(timerId);
                document.removeEventListener('keydown', onKeyDown);
                overlay.classList.remove('is-visible');
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    if (!root.querySelector('.ui-dialog-overlay')) root.remove();
                }, 180);
                resolve(result);
            };

            const onKeyDown = (event) => {
                if (event.key === 'Escape' && opts.allowEscapeKey !== false) {
                    finish({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: DialogDismiss.esc, value: undefined });
                }
            };

            const parts = [];
            parts.push(buildIcon(opts.icon, opts.iconColor));

            if (opts.title) {
                parts.push(`<h2 class="${cls('ui-dialog-title', cc.title)}">${esc(opts.title)}</h2>`);
            }

            let contentHtml = '';
            if (opts.html) contentHtml = opts.html;
            else if (opts.text) contentHtml = `<p>${esc(opts.text)}</p>`;
            if (contentHtml) {
                parts.push(`<div class="${cls('ui-dialog-content', cc.htmlContainer)}">${contentHtml}</div>`);
            }

            if (opts.input) {
                const inputType = opts.input === true ? 'text' : String(opts.input);
                const attrs = opts.inputAttributes || {};
                const attrString = Object.keys(attrs)
                    .map((key) => `${key}="${esc(attrs[key])}"`)
                    .join(' ');
                parts.push(`<input class="${cls('ui-dialog-input', cc.input)}" type="${esc(inputType)}" placeholder="${esc(opts.inputPlaceholder || '')}" value="${esc(opts.inputValue || '')}" ${attrString}>`);
            }

            parts.push('<p class="ui-dialog-error" hidden></p>');

            const showDeny = !!opts.showDenyButton;
            const showCancel = !!opts.showCancelButton;
            const showConfirm = opts.showConfirmButton !== false;

            const buttons = [];
            if (showConfirm) {
                buttons.push(`<button type="button" class="${cls('ui-dialog-btn ui-dialog-btn-confirm', cc.confirmButton)}" data-role="confirm">${esc(opts.confirmButtonText || 'OK')}</button>`);
            }
            if (showDeny) {
                buttons.push(`<button type="button" class="${cls('ui-dialog-btn ui-dialog-btn-deny', cc.denyButton)}" data-role="deny">${esc(opts.denyButtonText || 'No')}</button>`);
            }
            if (showCancel) {
                buttons.push(`<button type="button" class="${cls('ui-dialog-btn ui-dialog-btn-cancel', cc.cancelButton)}" data-role="cancel">${esc(opts.cancelButtonText || 'Cancelar')}</button>`);
            }
            if (buttons.length) {
                parts.push(`<div class="${cls('ui-dialog-actions', cc.actions)}">${buttons.join('')}</div>`);
            }

            popup.innerHTML = parts.join('');
            overlay.appendChild(popup);
            root.appendChild(overlay);

            const confirmBtn = popup.querySelector('[data-role="confirm"]');
            const denyBtn = popup.querySelector('[data-role="deny"]');
            const cancelBtn = popup.querySelector('[data-role="cancel"]');
            const inputEl = popup.querySelector('.ui-dialog-input');
            const errorEl = popup.querySelector('.ui-dialog-error');

            if (opts.background) popup.style.background = opts.background;
            if (opts.color) popup.style.color = opts.color;
            if (opts.confirmButtonColor && confirmBtn) { confirmBtn.style.background = opts.confirmButtonColor; confirmBtn.style.borderColor = opts.confirmButtonColor; }
            if (opts.denyButtonColor && denyBtn) { denyBtn.style.background = opts.denyButtonColor; denyBtn.style.borderColor = opts.denyButtonColor; }
            if (opts.cancelButtonColor && cancelBtn) { cancelBtn.style.background = opts.cancelButtonColor; cancelBtn.style.borderColor = opts.cancelButtonColor; }

            const setError = (message) => {
                if (!errorEl) return;
                if (message) { errorEl.textContent = message; errorEl.hidden = false; }
                else { errorEl.textContent = ''; errorEl.hidden = true; }
            };

            const setBusy = (busy) => {
                [confirmBtn, denyBtn, cancelBtn].forEach((btn) => { if (btn) btn.disabled = busy; });
            };

            const runConfirm = () => {
                setError('');
                let value = inputEl ? inputEl.value : undefined;

                if (opts.input && typeof opts.inputValidator === 'function') {
                    const validation = opts.inputValidator(value);
                    if (validation) { setError(validation); return; }
                }

                if (typeof opts.preConfirm !== 'function') {
                    finish({ isConfirmed: true, isDenied: false, isDismissed: false, dismiss: undefined, value });
                    return;
                }

                let pre;
                try {
                    pre = opts.preConfirm();
                } catch (error) {
                    setError(error && error.message ? error.message : 'Error inesperado');
                    return;
                }

                if (pre && typeof pre.then === 'function') {
                    setBusy(true);
                    pre.then((resolvedValue) => {
                        setBusy(false);
                        if (resolvedValue === false || resolvedValue === undefined) return;
                        finish({ isConfirmed: true, isDenied: false, isDismissed: false, dismiss: undefined, value: resolvedValue });
                    }).catch((error) => {
                        setBusy(false);
                        setError(error && error.message ? error.message : 'Error inesperado');
                    });
                    return;
                }

                if (pre === false || pre === undefined) return;
                finish({ isConfirmed: true, isDenied: false, isDismissed: false, dismiss: undefined, value: pre });
            };

            if (confirmBtn) confirmBtn.addEventListener('click', runConfirm);
            if (denyBtn) denyBtn.addEventListener('click', () => {
                finish({ isConfirmed: false, isDenied: true, isDismissed: false, dismiss: DialogDismiss.deny, value: undefined });
            });
            if (cancelBtn) cancelBtn.addEventListener('click', () => {
                finish({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: DialogDismiss.cancel, value: undefined });
            });

            if (!opts.toast && opts.allowOutsideClick !== false) {
                overlay.addEventListener('mousedown', (event) => {
                    if (event.target === overlay) {
                        finish({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: DialogDismiss.backdrop, value: undefined });
                    }
                });
            }

            document.addEventListener('keydown', onKeyDown);

            if (typeof opts.didOpen === 'function') {
                try { opts.didOpen(popup); } catch (error) { console.error('didOpen error', error); }
            }

            if (inputEl) {
                inputEl.focus({ preventScroll: true });
            } else if (opts.focusConfirm !== false && confirmBtn && !opts.toast) {
                confirmBtn.focus({ preventScroll: true });
            }

            requestAnimationFrame(() => overlay.classList.add('is-visible'));

            if (opts.toast && opts.timerProgressBar && Number(opts.timer) > 0) {
                const bar = document.createElement('span');
                bar.className = 'ui-dialog-progress';
                popup.appendChild(bar);
                requestAnimationFrame(() => {
                    bar.style.transition = `transform ${Number(opts.timer)}ms linear`;
                    bar.style.transform = 'scaleX(0)';
                });
            }

            if (opts.timer && Number(opts.timer) > 0) {
                timerId = setTimeout(() => {
                    finish({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: DialogDismiss.timer, value: undefined });
                }, Number(opts.timer));
            }
        });
    }

    window.showDialog = showDialog;
    window.DialogDismiss = DialogDismiss;
})();
