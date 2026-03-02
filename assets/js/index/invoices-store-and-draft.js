        async function loadInvoices() {
            const data = await getFirebaseData('invoices');
            return normalizeInvoices(data);
        }

        async function saveInvoices(invoicesList) {
            const ok = await setFirebaseData('invoices', invoicesList);
            if (!ok) {
                throw new Error('No se pudo guardar en Firebase');
            }
        }

        async function saveInvoiceRecord(invoice) {
            const ok = await setFirebaseData(`invoices/${String(invoice.id)}`, invoice);
            if (!ok) {
                throw new Error('No se pudo guardar la factura en Firebase');
            }
        }

        async function deleteInvoiceRecord(id) {
            const ok = await setFirebaseData(`invoices/${String(id)}`, null);
            if (!ok) {
                throw new Error('No se pudo eliminar la factura en Firebase');
            }
        }

        function isLegacyInvoicesObject(rawInvoices) {
            if (!rawInvoices || typeof rawInvoices !== 'object' || Array.isArray(rawInvoices)) return false;
            const keys = Object.keys(rawInvoices);
            if (keys.length === 0) return false;
            const allNumericKeys = keys.every(key => String(parseInt(key, 10)) === key);
            if (!allNumericKeys) return false;
            return true;
        }

        async function migrateInvoicesIfLegacy(rawInvoices) {
            let legacyList = null;
            if (Array.isArray(rawInvoices)) {
                legacyList = rawInvoices.filter(Boolean);
            } else if (isLegacyInvoicesObject(rawInvoices)) {
                legacyList = Object.values(rawInvoices).filter(Boolean);
            }

            if (!legacyList) return rawInvoices;

            const migrated = {};
            legacyList.forEach((inv) => {
                if (inv && inv.id) {
                    migrated[String(inv.id)] = inv;
                }
            });
            await setFirebaseData('invoices', migrated);
            return migrated;
        }

        async function readInvoicesStrict() {
            const invoicesRef = window.firebaseRef(window.firebaseDB, 'invoices');
            const snapshot = await window.firebaseGet(invoicesRef);
            return snapshot.exists() ? snapshot.val() : [];
        }

        async function loadInvoicesWithRetry(maxAttempts = 6) {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    let raw = await readInvoicesStrict();
                    raw = await migrateInvoicesIfLegacy(raw);
                    return normalizeInvoices(raw);
                } catch (error) {
                    console.error(`Error cargando facturas (intento ${attempt}/${maxAttempts}):`, error);
                    if (attempt === maxAttempts) throw error;
                    await new Promise(resolve => setTimeout(resolve, 250 * attempt));
                }
            }
            return [];
        }

        let invoices = [];
        let currentFilter = 'all';
        let editingId = null;
        let currentPage = 1;
        const invoicesPerPage = 30;
        let invoicesInitialized = false;
        let stopInvoicesRealtime = null;
        const INVOICE_DRAFT_KEY = 'invoiceDraftV1';
        let draftSaveTimer = null;

        function buildInvoiceDraft() {
            const rows = Array.from(document.querySelectorAll('#itemsTableBody tr'));
            return {
                dia: document.getElementById('dia').value,
                mes: document.getElementById('mes').value,
                anio: document.getElementById('anio').value,
                numero: document.getElementById('numero').value,
                cliente: document.getElementById('cliente').value || '',
                direccion: document.getElementById('direccion').value || '',
                abono: document.getElementById('abono').value || '0',
                detalleDespacho: document.getElementById('detalleDespacho').value || '',
                fechaVencimiento: document.getElementById('fechaVencimiento').value || '',
                fechaPago: document.getElementById('fechaPago').value || '',
                estado: document.getElementById('estado').value || 'pending',
                estadoManualLock: document.getElementById('estadoManualLock')?.checked || false,
                items: rows.map((row) => ({
                    cant: row.querySelector('.item-cant')?.value || '1',
                    desc: row.querySelector('.item-desc')?.value || '',
                    precio: row.querySelector('.item-precio')?.value || ''
                }))
            };
        }

        function hasMeaningfulDraftData(draft) {
            if (!draft) return false;
            const hasClientData = !!String(draft.cliente || '').trim() || !!String(draft.direccion || '').trim();
            const hasAbonoData = (parseFloat(draft.abono) || 0) > 0;
            const hasStatusLock = !!draft.estadoManualLock;
            const hasStatusDetails = !!String(draft.detalleDespacho || '').trim() || !!String(draft.fechaVencimiento || '').trim() || !!String(draft.fechaPago || '').trim();
            const hasItemsData = Array.isArray(draft.items) && draft.items.some((item) => {
                const desc = String(item.desc || '').trim();
                const precio = String(item.precio || '').trim();
                return desc.length > 0 || (precio.length > 0 && precio !== '0' && precio !== '0.00');
            });
            return hasClientData || hasItemsData || hasAbonoData || hasStatusDetails || hasStatusLock;
        }

        function saveDraftNow() {
            if (editingId) return;
            const formView = document.getElementById('invoiceFormView');
            if (!formView || formView.classList.contains('hidden')) return;

            const draft = buildInvoiceDraft();
            if (hasMeaningfulDraftData(draft)) {
                localStorage.setItem(INVOICE_DRAFT_KEY, JSON.stringify(draft));
            } else {
                localStorage.removeItem(INVOICE_DRAFT_KEY);
            }
        }

        function scheduleDraftSave() {
            if (editingId) return;
            clearTimeout(draftSaveTimer);
            draftSaveTimer = setTimeout(saveDraftNow, 300);
        }

        function clearInvoiceDraft() {
            localStorage.removeItem(INVOICE_DRAFT_KEY);
            clearTimeout(draftSaveTimer);
        }

        function restoreDraftIfExists() {
            if (editingId) return;
            const rawDraft = localStorage.getItem(INVOICE_DRAFT_KEY);
            if (!rawDraft) return;

            try {
                const draft = JSON.parse(rawDraft);
                if (!hasMeaningfulDraftData(draft)) return;

                document.getElementById('dia').value = draft.dia || document.getElementById('dia').value;
                document.getElementById('mes').value = draft.mes || document.getElementById('mes').value;
                document.getElementById('anio').value = draft.anio || document.getElementById('anio').value;
                document.getElementById('numero').value = draft.numero || document.getElementById('numero').value;
                document.getElementById('cliente').value = draft.cliente || '';
                document.getElementById('direccion').value = draft.direccion || '';
                document.getElementById('abono').value = draft.abono || '0';
                document.getElementById('detalleDespacho').value = draft.detalleDespacho || '';
                document.getElementById('fechaVencimiento').value = draft.fechaVencimiento || '';
                document.getElementById('fechaPago').value = draft.fechaPago || '';
                document.getElementById('estado').value = draft.estado || 'pending';
                document.getElementById('estadoManualLock').checked = !!draft.estadoManualLock;
                syncEstadoPreviousStatus();

                if (Array.isArray(draft.items) && draft.items.length > 0) {
                    const tbody = document.getElementById('itemsTableBody');
                    tbody.innerHTML = '';
                    draft.items.forEach((item, idx) => {
                        const row = document.createElement('tr');
                        row.className = 'border-b border-gray-100';
                        row.innerHTML = `
                            <td class="py-2 px-2 text-center" data-label="#">
                                <span class="item-index text-gray-700 font-semibold">${idx + 1}</span>
                            </td>
                            <td class="py-2 px-2" data-label="Cant.">
                                <input type="number" min="0" step="0.01" value="${item.cant || 1}" class="item-cant w-full px-2 py-1.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:border-gray-900" oninput="calculateTotals()">
                            </td>
                            <td class="py-2 px-2" data-label="Descripcion">
                                <textarea class="item-desc item-desc-area w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="Descripción del item" rows="2">${item.desc || ''}</textarea>
                            </td>
                            <td class="py-2 px-2" data-label="Precio">
                                <input type="number" min="0" step="0.01" value="${item.precio || ''}" class="item-precio w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="0.00" oninput="calculateTotals()">
                            </td>
                            <td class="py-2 px-2 text-right" data-label="Valor">
                                <span class="item-valor text-gray-900 font-medium">0.00</span>
                            </td>
                            <td class="py-2 px-2 text-center remove-cell" data-label="Eliminar">
                                <button type="button" class="removeItemBtn" onclick="removeItem(this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    <span class="remove-label">Eliminar item</span>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                }

                renumberItemRows();
                syncAllItemDescHeights();
                updateStatusSections(document.getElementById('estado').value);
                calculateTotals();
                showToast('Borrador restaurado', 'info', 2500, 'top-end', { toastType: 'success' });
            } catch (error) {
                console.warn('No se pudo restaurar el borrador:', error);
                localStorage.removeItem(INVOICE_DRAFT_KEY);
            }
        }

        // Cargar facturas solo después de validar autenticación Firebase
        async function initInvoicesRealtime() {
            if (invoicesInitialized) return;
            invoicesInitialized = true;

            window.__invoiceDataLoading = true;
            hideAppLoading();
            updateInvoiceList();

            try {
                invoices = await loadInvoicesWithRetry();
                window.__invoiceDataLoading = false;
                updateInvoiceList();
                maybeNotifyBackupReminder();
            } catch (error) {
                console.error('No se pudieron cargar facturas al iniciar:', error);
                invoices = [];
                window.__invoiceDataLoading = false;
                updateInvoiceList();
                maybeNotifyBackupReminder();
            }

            const subscribe = () => {
                const invoicesRef = window.firebaseRef(window.firebaseDB, 'invoices');
                stopInvoicesRealtime = window.firebaseOnValue(
                    invoicesRef,
                    (snapshot) => {
                        invoices = normalizeInvoices(snapshot.val());
                        updateInvoiceList();
                    },
                    (error) => {
                        console.error('Error en listener de facturas:', error);
                        setTimeout(subscribe, 500);
                    }
                );
            };

            subscribe();
        }

