        showAppLoading('Verificando sesion...');
        (async function enforceAuthGuard() {
            const ready = await waitForFirebaseReady();
            if (!ready) {
                hideAppLoading();
                window.location.replace('pages/login.html');
                return;
            }

            window.firebaseAuthStateChanged(window.firebaseAuth, async (user) => {
                if (!user) {
                    window.location.replace('pages/login.html');
                    return;
                }

                const users = normalizeUsers(await getFirebaseData('users'));
                const userData = users.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());

                if (!userData) {
                    await window.firebaseAuth.signOut();
                    hideAppLoading();
                    window.location.replace('pages/login.html');
                    return;
                }

                localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, role: userData.role, uid: user.uid || '' }));
                currentUser = { email: userData.email, role: userData.role, uid: user.uid || '' };
                initInvoicesRealtime();
            });
        })();

        let currentUser = null;
        const PAGE_VIEW = new URLSearchParams(window.location.search).get('view') === 'history' ? 'history' : 'active';
        const IS_HISTORY_VIEW = PAGE_VIEW === 'history';

        function isPaidInvoiceStatus(status) {
            const normalized = String(status || '').toLowerCase();
            return normalized === 'paid' || normalized === 'pagada' || normalized === 'pagadas';
        }

        function isInvoiceOverdue(invoice) {
            if (!invoice) return false;
            const normalizedStatus = String(invoice.status || '').toLowerCase();
            const dueDate = String(invoice.dueDate || '').trim();
            const today = getTodayISODate();
            return normalizedStatus === 'late' || normalizedStatus === 'vencida' || (dueDate && dueDate < today);
        }

        function prioritizeOverdueInvoices(list) {
            const safeList = Array.isArray(list) ? [...list] : [];
            return safeList.sort((a, b) => {
                const aOverdue = isInvoiceOverdue(a) ? 1 : 0;
                const bOverdue = isInvoiceOverdue(b) ? 1 : 0;
                if (aOverdue !== bOverdue) return bOverdue - aOverdue;
                return Number(b?.id || 0) - Number(a?.id || 0);
            });
        }

        function animateOverdueNotificationIcons() {
            if (!window.anime) return;

            document.querySelectorAll('.overdue-notification-icon').forEach((iconEl, index) => {
                if (iconEl.dataset.animeInit === '1') return;
                iconEl.dataset.animeInit = '1';

                window.anime({
                    targets: iconEl,
                    scale: [1, 1.08, 1],
                    duration: 1350,
                    easing: 'easeInOutSine',
                    loop: true,
                    delay: index * 60
                });

                const dotEl = iconEl.querySelector('.overdue-notification-dot');
                if (!dotEl) return;

                window.anime({
                    targets: dotEl,
                    scale: [0.9, 1.18, 0.9],
                    opacity: [1, 0.6, 1],
                    duration: 1100,
                    easing: 'easeOutQuad',
                    loop: true,
                    delay: index * 45
                });
            });
        }

        function attachAnimePressFeedback(buttonEl) {
            if (!window.anime) return;

            if (!buttonEl || buttonEl.dataset.animeHoverInit === '1') return;
            buttonEl.dataset.animeHoverInit = '1';

            buttonEl.addEventListener('mouseenter', () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1.035,
                    duration: 150,
                    easing: 'easeOutQuad'
                });
            });

            buttonEl.addEventListener('mouseleave', () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1,
                    duration: 180,
                    easing: 'easeOutQuad'
                });
            });

            const pressDown = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 0.95,
                    duration: 85,
                    easing: 'easeOutQuad'
                });
            };

            const pressUp = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1.035,
                    duration: 115,
                    easing: 'easeOutQuad'
                });
            };

            const resetState = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1,
                    duration: 120,
                    easing: 'easeOutQuad'
                });
            };

            buttonEl.addEventListener('mousedown', pressDown);
            buttonEl.addEventListener('mouseup', pressUp);
            buttonEl.addEventListener('mouseleave', resetState);
            buttonEl.addEventListener('touchstart', pressDown, { passive: true });
            buttonEl.addEventListener('touchend', pressUp, { passive: true });
            buttonEl.addEventListener('blur', resetState);
        }

        function attachAnimeSoftFeedback(buttonEl) {
            if (!window.anime) return;

            if (!buttonEl || buttonEl.dataset.animeSoftInit === '1') return;
            buttonEl.dataset.animeSoftInit = '1';

            buttonEl.addEventListener('mouseenter', () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1.035,
                    duration: 150,
                    easing: 'easeOutQuad'
                });
            });

            buttonEl.addEventListener('mouseleave', () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1,
                    duration: 170,
                    easing: 'easeOutQuad'
                });
            });

            const pressDown = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 0.95,
                    duration: 85,
                    easing: 'easeOutQuad'
                });
            };

            const pressUp = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1.035,
                    duration: 115,
                    easing: 'easeOutQuad'
                });
            };

            const resetState = () => {
                window.anime.remove(buttonEl);
                window.anime({
                    targets: buttonEl,
                    scale: 1,
                    duration: 120,
                    easing: 'easeOutQuad'
                });
            };

            buttonEl.addEventListener('mousedown', pressDown);
            buttonEl.addEventListener('mouseup', pressUp);
            buttonEl.addEventListener('mouseleave', resetState);
            buttonEl.addEventListener('touchstart', pressDown, { passive: true });
            buttonEl.addEventListener('touchend', pressUp, { passive: true });
            buttonEl.addEventListener('blur', resetState);
        }

        function initAnimeButtonDemo() {
            if (!window.anime) return;

            const interactiveButtons = [
                document.getElementById('btnNewInvoice'),
                document.getElementById('btnHistoryView'),
                document.getElementById('btnAdminPanel')
            ];

            const softButtons = [
                document.getElementById('btnBackupExport'),
                document.getElementById('btnBackupImport')
            ];

            interactiveButtons.forEach(attachAnimePressFeedback);
            softButtons.forEach(attachAnimeSoftFeedback);
        }

        function configurePageModeUI() {
            const historyBtn = document.getElementById('btnHistoryView');
            const historyBtnLabel = historyBtn ? historyBtn.querySelector('span') : null;
            const historyBtnIcon = historyBtn ? historyBtn.querySelector('svg') : null;
            const listTitle = document.getElementById('invoiceListTitle');
            const newInvoiceBtn = document.getElementById('btnNewInvoice');
            const filterSelect = document.getElementById('filterSelect');
            const searchInput = document.getElementById('searchInput');

            if (historyBtn) {
                if (IS_HISTORY_VIEW) {
                    if (historyBtnLabel) historyBtnLabel.textContent = 'Volver a activas';
                    else historyBtn.textContent = 'Volver a activas';
                    if (historyBtnIcon) {
                        historyBtnIcon.innerHTML = '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>';
                    }
                    historyBtn.href = 'index.html';
                } else {
                    if (historyBtnLabel) historyBtnLabel.textContent = 'Historial pagadas';
                    else historyBtn.textContent = 'Historial pagadas';
                    if (historyBtnIcon) {
                        historyBtnIcon.innerHTML = '<path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle>';
                    }
                    historyBtn.href = 'pages/historial.html';
                }
            }

            if (listTitle) {
                listTitle.textContent = IS_HISTORY_VIEW ? 'Historial de Pagadas' : 'Facturas Activas';
            }

            if (newInvoiceBtn && IS_HISTORY_VIEW) {
                newInvoiceBtn.classList.add('hidden');
            }

            if (searchInput) {
                searchInput.placeholder = IS_HISTORY_VIEW ? 'Buscar facturas pagadas...' : 'Buscar facturas activas...';
            }

            if (filterSelect) {
                const allOption = filterSelect.querySelector('option[value="all"]');
                const paidOption = filterSelect.querySelector('option[value="paid"]');

                if (IS_HISTORY_VIEW) {
                    if (allOption) allOption.textContent = 'Todas las pagadas';
                    Array.from(filterSelect.options).forEach((opt) => {
                        if (opt.value !== 'all' && opt.value !== 'paid') opt.remove();
                    });
                    if (paidOption) paidOption.textContent = 'Pagada al 100%';
                } else {
                    if (allOption) allOption.textContent = 'Todas las activas';
                    if (paidOption) paidOption.remove();
                }

                filterSelect.value = 'all';
            }
        }

        function loadCurrentUser() {
            try {
                return JSON.parse(localStorage.getItem('currentUser') || 'null');
            } catch {
                return null;
            }
        }

        function canCreateInvoices() {
            return !!currentUser;
        }

        function isInvoiceOwner(invoice) {
            return !!(currentUser && invoice && invoice.createdByEmail && invoice.createdByEmail.toLowerCase() === currentUser.email.toLowerCase());
        }

        function getInvoiceCreatorText(invoice) {
            if (!invoice || !invoice.createdByEmail) return 'Creada por: Usuario no registrado';
            return `Creada por: ${invoice.createdByEmail}`;
        }

        function getInvoiceOwnershipBadge(invoice) {
            if (isInvoiceOwner(invoice) && canEditInvoice(invoice)) {
                return '<p class="mt-1"><span class="owner-edit-badge">Creada por ti · editable</span></p>';
            }

            if (currentUser && currentUser.role === 'admin') {
                return `<p class="mt-1"><span class="creator-info-badge">${getInvoiceCreatorText(invoice)}</span></p>`;
            }

            if (currentUser && currentUser.role === 'user' && !isInvoiceOwner(invoice)) {
                return '<p class="mt-1"><span class="not-owner-badge">Creada por otro usuario</span></p>';
            }

            return '';
        }

        function canEditInvoice(invoice) {
            if (!currentUser) return false;
            if (currentUser.role === 'admin') return true;
            return isInvoiceOwner(invoice);
        }

        function canSeeInvoiceAmount(invoice) {
            if (!currentUser || !invoice) return false;
            if (currentUser.role === 'admin') return true;
            return isInvoiceOwner(invoice);
        }

        function canViewInvoice(invoice) {
            if (!currentUser || !invoice) return false;
            if (currentUser.role === 'admin') return true;
            return isInvoiceOwner(invoice);
        }

        function filterInvoicesByVisibility(list) {
            if (!currentUser || !Array.isArray(list)) return [];
            const baseList = currentUser.role === 'admin' ? list : list.filter(inv => isInvoiceOwner(inv));
            if (IS_HISTORY_VIEW) {
                return baseList.filter(inv => isPaidInvoiceStatus(inv && inv.status));
            }
            return baseList.filter(inv => !isPaidInvoiceStatus(inv && inv.status));
        }

        function ensureCanCreateInvoices() {
            if (canCreateInvoices()) return true;
            Swal.fire({
                icon: 'error',
                title: 'Sin permisos',
                text: 'Tu usuario no tiene permisos para crear facturas.',
                confirmButtonColor: '#1a1a1a'
            });
            return false;
        }

        function ensureCanEditInvoice(invoice) {
            if (canEditInvoice(invoice)) return true;
            Swal.fire({
                icon: 'error',
                title: 'Sin permisos',
                text: 'Solo puedes editar las facturas creadas por tu usuario.',
                confirmButtonColor: '#1a1a1a'
            });
            return false;
        }

        function ensureCanViewInvoice(invoice) {
            if (canViewInvoice(invoice)) return true;
            Swal.fire({
                icon: 'error',
                title: 'Sin permisos',
                text: 'Solo puedes ver las facturas creadas por tu usuario.',
                confirmButtonColor: '#1a1a1a'
            });
            return false;
        }

        function ensureAdminAction(actionName = 'esta acción') {
            if (currentUser && currentUser.role === 'admin') return true;
            Swal.fire({
                icon: 'error',
                title: 'Sin permisos',
                text: `Solo administradores pueden realizar ${actionName}.`,
                confirmButtonColor: '#1a1a1a'
            });
            return false;
        }

        // Require login: si no hay usuario logueado, redirigir a login
        (function ensureLogin(){
            try {
                const current = loadCurrentUser();
                if (!current) {
                    window.location.href = 'pages/login.html';
                    return;
                }
                currentUser = current;
                // Mostrar email en navbar si existe el elemento
                document.addEventListener('DOMContentLoaded', () => {
                    configurePageModeUI();
                    const el = document.getElementById('currentUserEmail');
                    if (el) el.textContent = current.email;

                    const newInvoiceBtn = document.getElementById('btnNewInvoice');
                    if (newInvoiceBtn && !canCreateInvoices()) {
                        newInvoiceBtn.classList.add('hidden');
                    }

                    const backupExportBtn = document.getElementById('btnBackupExport');
                    const backupImportBtn = document.getElementById('btnBackupImport');
                    const canUseBackupControls = !!(current && current.role === 'admin');
                    if (backupExportBtn) backupExportBtn.classList.toggle('hidden', !canUseBackupControls);
                    if (backupImportBtn) backupImportBtn.classList.toggle('hidden', !canUseBackupControls);

                    // Mostrar botón 'Panel de Usuarios' solo para administradores
                    try {
                        const adminContainer = document.getElementById('adminPanelBtnContainer');
                        if (adminContainer) {
                            adminContainer.innerHTML = '';
                            if (current && current.role === 'admin') {
                                const btn = document.createElement('button');
                                btn.id = 'btnAdminPanel';
                                btn.className = 'admin-users-btn px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2';
                                btn.style.marginRight = '6px';
                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg><span>Usuarios</span>';
                                btn.onclick = () => { window.location.href = 'pages/admin.html'; };
                                adminContainer.appendChild(btn);
                            }
                            initAnimeButtonDemo();
                        }
                    } catch(e) { console.error('admin button render error', e); }
                });
            } catch(e) {
                console.error('Auth check error', e);
            }
        })();

        // Funciones de carga y guardado
