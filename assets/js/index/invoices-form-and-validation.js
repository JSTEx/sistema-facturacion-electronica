        function showInvoiceForm() {
            if (!ensureCanCreateInvoices()) return;
            editingId = null;
            document.getElementById('invoiceListView').classList.add('hidden');
            document.getElementById('invoiceFormView').classList.remove('hidden');
            
            const today = new Date();
            document.getElementById('dia').value = today.getDate();
            document.getElementById('mes').value = today.getMonth() + 1;
            document.getElementById('anio').value = today.getFullYear();
            
            generateInvoiceNumber();
            
            document.querySelector('.invoiceFormTitle').textContent = 'Crear Factura Provisional';
            document.getElementById('submitBtn').textContent = 'Crear factura';
            
            // Limpiar solo los campos específicos en lugar de hacer reset completo
            document.getElementById('cliente').value = '';
            document.getElementById('direccion').value = '';
            document.getElementById('abono').value = '0';
            document.getElementById('detalleDespacho').value = '';
            document.getElementById('fechaVencimiento').value = '';
            document.getElementById('fechaPago').value = '';
            document.getElementById('estado').value = 'dispatch';
            document.getElementById('estadoManualLock').checked = false;
            syncEstadoPreviousStatus();
            updateStatusSections('dispatch');
            resetItemsTable();
            calculateTotals();
            restoreDraftIfExists();
        }

        function generateInvoiceNumber() {
            // El número de factura es basado en la cantidad actual de facturas + 1
            const nextNumber = invoices.length + 1;
            document.getElementById('numero').value = nextNumber;
        }

        function cancelInvoice() {
            Swal.fire({
                title: '¿Cancelar?',
                text: "Se perderán los datos ingresados",
                icon: 'warning',
                showCancelButton: true,
                // Confirm = Sí, cancelar -> mostrar en rojo
                confirmButtonColor: '#dc2626',
                // Cancel = No, continuar -> mostrar en verde
                cancelButtonColor: '#16a34a',
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No, continuar'
            }).then((result) => {
                if (result.isConfirmed) {
                    resetForm();
                }
            });
        }

        function resetForm() {
            document.getElementById('invoiceForm').reset();
            document.getElementById('invoiceFormView').classList.add('hidden');
            document.getElementById('invoiceListView').classList.remove('hidden');
            editingId = null;
            resetItemsTable();
            calculateTotals();
            clearInvoiceDraft();
        }

        function resetItemsTable() {
            document.getElementById('itemsTableBody').innerHTML = `
                <tr class="border-b border-gray-100">
                    <td class="py-2 px-2 text-center" data-label="#">
                        <span class="item-index text-gray-700 font-semibold">1</span>
                    </td>
                    <td class="py-2 px-2" data-label="Cant.">
                        <input type="number" min="0" step="0.01" value="1" class="item-cant w-full px-2 py-1.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:border-gray-900" oninput="calculateTotals()">
                    </td>
                    <td class="py-2 px-2" data-label="Descripcion">
                        <textarea class="item-desc item-desc-area w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="Descripción del item" rows="2"></textarea>
                    </td>
                    <td class="py-2 px-2" data-label="Precio">
                        <input type="number" min="0" step="0.01" class="item-precio w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="0.00" oninput="calculateTotals()">
                    </td>
                    <td class="py-2 px-2 text-right" data-label="Valor">
                        <span class="item-valor text-gray-900 font-medium">0</span>
                    </td>
                    <td class="py-2 px-2 text-center remove-cell" data-label="Eliminar">
                        <button type="button" class="removeItemBtn" onclick="removeItem(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            <span class="remove-label">Eliminar item</span>
                        </button>
                    </td>
                </tr>
            `;
            renumberItemRows();
            syncAllItemDescHeights();
        }

        function renumberItemRows() {
            const rows = document.querySelectorAll('#itemsTableBody tr');
            rows.forEach((row, index) => {
                const indexEl = row.querySelector('.item-index');
                if (indexEl) {
                    indexEl.textContent = String(index + 1);
                }
            });
        }

        function addItem() {
            if (!ensureCanCreateInvoices()) return;
            const tbody = document.getElementById('itemsTableBody');
            const newRow = document.createElement('tr');
            newRow.className = 'border-b border-gray-100';
            newRow.innerHTML = `
                <td class="py-2 px-2 text-center" data-label="#">
                    <span class="item-index text-gray-700 font-semibold">0</span>
                </td>
                <td class="py-2 px-2" data-label="Cant.">
                    <input type="number" min="0" step="0.01" value="1" class="item-cant w-full px-2 py-1.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:border-gray-900" oninput="calculateTotals()">
                </td>
                <td class="py-2 px-2" data-label="Descripcion">
                    <textarea class="item-desc item-desc-area w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="Descripción del item" rows="2"></textarea>
                </td>
                <td class="py-2 px-2" data-label="Precio">
                    <input type="number" min="0" step="0.01" class="item-precio w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="0.00" oninput="calculateTotals()">
                </td>
                <td class="py-2 px-2 text-right" data-label="Valor">
                    <span class="item-valor text-gray-900 font-medium">0</span>
                </td>
                <td class="py-2 px-2 text-center remove-cell" data-label="Eliminar">
                    <button type="button" class="removeItemBtn" onclick="removeItem(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span class="remove-label">Eliminar item</span>
                    </button>
                </td>
            `;
            tbody.appendChild(newRow);
            renumberItemRows();
            syncAllItemDescHeights();
            scheduleDraftSave();
        }

        async function removeItem(btn) {
            if (!ensureCanCreateInvoices()) return;
            const rows = document.querySelectorAll('#itemsTableBody tr');
            if (rows.length <= 1) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se puede eliminar',
                    text: 'Debe haber al menos un item en la factura',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            if (window.Swal) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: '¿Eliminar item?',
                    text: 'Esta acción quitará el item de la factura.',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#334155'
                });

                if (!result.isConfirmed) return;
            } else if (!window.confirm('¿Eliminar este item de la factura?')) {
                return;
            }

            btn.closest('tr').remove();
            renumberItemRows();
            calculateTotals();
            scheduleDraftSave();
        }

        function autoResizeItemDesc(textarea) {
            if (!textarea) return;
            textarea.style.height = 'auto';
            const maxHeight = 180;
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
        }

        function syncAllItemDescHeights() {
            document.querySelectorAll('.item-desc-area').forEach(autoResizeItemDesc);
        }

        function getTodayISODate() {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        function formatDateSV(dateValue) {
            const raw = String(dateValue || '').trim();
            if (!raw) return '';

            const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (isoMatch) {
                return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
            }

            const isoDateTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T/);
            if (isoDateTimeMatch) {
                return `${isoDateTimeMatch[3]}-${isoDateTimeMatch[2]}-${isoDateTimeMatch[1]}`;
            }

            const timestampMatch = raw.match(/^\d{10,13}$/);
            if (timestampMatch) {
                const numericValue = Number(raw);
                const timestamp = raw.length === 10 ? numericValue * 1000 : numericValue;
                const parsedTsDate = new Date(timestamp);
                if (!Number.isNaN(parsedTsDate.getTime())) {
                    const tsDay = String(parsedTsDate.getDate()).padStart(2, '0');
                    const tsMonth = String(parsedTsDate.getMonth() + 1).padStart(2, '0');
                    const tsYear = parsedTsDate.getFullYear();
                    if (tsYear >= 1900 && tsYear <= 2100) {
                        return `${tsDay}-${tsMonth}-${tsYear}`;
                    }
                }
            }

            const parsedDate = new Date(raw);
            if (Number.isNaN(parsedDate.getTime())) return raw;

            const day = String(parsedDate.getDate()).padStart(2, '0');
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const year = parsedDate.getFullYear();
            if (year < 1900 || year > 2100) return raw;
            return `${day}-${month}-${year}`;
        }

        function formatDateTimeSV(dateValue) {
            const raw = String(dateValue || '').trim();
            if (!raw) return '';

            const timestampMatch = raw.match(/^\d{10,13}$/);
            if (timestampMatch) {
                const numericValue = Number(raw);
                const timestamp = raw.length === 10 ? numericValue * 1000 : numericValue;
                const parsedTsDate = new Date(timestamp);
                if (!Number.isNaN(parsedTsDate.getTime())) {
                    const tsDay = String(parsedTsDate.getDate()).padStart(2, '0');
                    const tsMonth = String(parsedTsDate.getMonth() + 1).padStart(2, '0');
                    const tsYear = parsedTsDate.getFullYear();
                    const tsHours = String(parsedTsDate.getHours()).padStart(2, '0');
                    const tsMinutes = String(parsedTsDate.getMinutes()).padStart(2, '0');
                    if (tsYear >= 1900 && tsYear <= 2100) {
                        return `${tsDay}-${tsMonth}-${tsYear} ${tsHours}:${tsMinutes}`;
                    }
                }
            }

            const parsedDate = new Date(raw);
            if (Number.isNaN(parsedDate.getTime())) return raw;

            const day = String(parsedDate.getDate()).padStart(2, '0');
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const year = parsedDate.getFullYear();
            if (year < 1900 || year > 2100) return raw;
            const hours = String(parsedDate.getHours()).padStart(2, '0');
            const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
            return `${day}-${month}-${year} ${hours}:${minutes}`;
        }

        function getAuditActionLabel(action) {
            const normalized = String(action || '').toLowerCase();
            const labels = {
                created: 'Creada',
                updated: 'Actualizada',
                deleted: 'Eliminada',
                restored: 'Restaurada',
                backup_imported: 'Respaldo importado'
            };
            return labels[normalized] || normalized || 'Evento';
        }

        function getAuditActionBadgeStyle(action) {
            const normalized = String(action || '').toLowerCase();
            const isDark = document.documentElement.classList.contains('dark-mode');

            const tones = {
                created: {
                    light: { bg: '#dcfce7', fg: '#166534', bd: '#86efac' },
                    dark: { bg: '#064e3b', fg: '#86efac', bd: '#059669' }
                },
                updated: {
                    light: { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' },
                    dark: { bg: '#78350f', fg: '#fde68a', bd: '#d97706' }
                },
                deleted: {
                    light: { bg: '#fee2e2', fg: '#991b1b', bd: '#fca5a5' },
                    dark: { bg: '#7f1d1d', fg: '#fecaca', bd: '#ef4444' }
                },
                restored: {
                    light: { bg: '#e0f2fe', fg: '#075985', bd: '#7dd3fc' },
                    dark: { bg: '#0c4a6e', fg: '#bae6fd', bd: '#0284c7' }
                },
                backup_imported: {
                    light: { bg: '#ede9fe', fg: '#5b21b6', bd: '#c4b5fd' },
                    dark: { bg: '#4c1d95', fg: '#ddd6fe', bd: '#7c3aed' }
                },
                default: {
                    light: { bg: '#f3f4f6', fg: '#374151', bd: '#d1d5db' },
                    dark: { bg: '#1f2937', fg: '#e5e7eb', bd: '#475569' }
                }
            };

            const tone = (tones[normalized] || tones.default)[isDark ? 'dark' : 'light'];
            return `background-color:${tone.bg};color:${tone.fg};border-color:${tone.bd};`;
        }

        function getAuditDayGroup(dateValue) {
            const parsed = new Date(String(dateValue || '').trim());
            if (Number.isNaN(parsed.getTime())) return 'older';

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const entryDay = new Date(parsed);
            entryDay.setHours(0, 0, 0, 0);

            const diffDays = Math.round((today.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'today';
            if (diffDays === 1) return 'yesterday';
            return 'older';
        }

        function showInvoiceChangeLog(invoiceId) {
            const invoice = invoices.find(item => Number(item?.id) === Number(invoiceId));
            if (!invoice) return;

            const entries = Array.isArray(invoice.changeLog)
                ? [...invoice.changeLog].filter(Boolean).reverse()
                : [];

            if (!entries.length) {
                Swal.fire({
                    icon: 'info',
                    title: `Sin historial #${invoice.number}`,
                    text: 'Esta factura aún no tiene eventos registrados.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            const isDark = document.documentElement.classList.contains('dark-mode');
            const itemStyle = isDark
                ? 'border-color:#334155;background-color:#0f172a;'
                : 'border-color:#e5e7eb;background-color:#ffffff;';
            const metaTextStyle = isDark ? 'color:#cbd5e1;' : 'color:#6b7280;';

            const renderEntry = (entry) => {
                const actionLabel = getAuditActionLabel(entry.action);
                const actionBadgeStyle = getAuditActionBadgeStyle(entry.action);
                const whenText = formatDateTimeSV(entry.at);
                const byText = entry.byEmail || 'desconocido';
                const statusText = entry.invoiceStatus ? ` · Estado: ${getStatusText(entry.invoiceStatus)}` : '';

                return `<li class="border rounded-lg px-3 py-2 mb-2" style="${itemStyle}"><p><span class="audit-log-badge inline-flex items-center px-2 py-0.5 rounded-full border font-semibold" style="${actionBadgeStyle}">${actionLabel}</span></p><p class="audit-log-meta mt-1" style="${metaTextStyle}">${whenText} · ${byText}${statusText}</p></li>`;
            };

            const grouped = { today: [], yesterday: [], older: [] };
            entries.forEach((entry) => {
                grouped[getAuditDayGroup(entry.at)].push(entry);
            });

            const headingStyle = isDark ? 'color:#e2e8f0;' : 'color:#1f2937;';
            const groupMap = [
                { key: 'today', label: 'Hoy' },
                { key: 'yesterday', label: 'Ayer' },
                { key: 'older', label: 'Anteriores' }
            ];

            const sectionsHtml = groupMap
                .filter(group => grouped[group.key].length > 0)
                .map(group => {
                    const groupItems = grouped[group.key].map(renderEntry).join('');
                    return `<section class="mb-3"><h4 class="text-sm font-semibold mb-2" style="${headingStyle}">${group.label}</h4><ul class="list-none m-0 p-0">${groupItems}</ul></section>`;
                })
                .join('');

            Swal.fire({
                title: `Historial #${invoice.number}`,
                html: `<div class="text-left max-h-[360px] overflow-y-auto">${sectionsHtml}</div>`,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#1a1a1a',
                width: 680
            });
        }

        function updateStatusSections(statusValue) {
            const status = String(statusValue || '').toLowerCase();
            const dispatchWrapper = document.getElementById('dispatchWrapper');
            const dueDateWrapper = document.getElementById('dueDateWrapper');
            const paidDateWrapper = document.getElementById('paidDateWrapper');

            if (dispatchWrapper) dispatchWrapper.classList.toggle('hidden', status !== 'dispatch');
            if (dueDateWrapper) dueDateWrapper.classList.remove('hidden');
            if (paidDateWrapper) paidDateWrapper.classList.toggle('hidden', status !== 'paid');
        }

        function syncEstadoPreviousStatus() {
            const estadoEl = document.getElementById('estado');
            if (!estadoEl) return;
            estadoEl.dataset.prevStatus = String(estadoEl.value || 'pending').toLowerCase();
        }

        function getPaymentSummary(totalValue) {
            const total = Math.max(0, Number(totalValue) || 0);
            const abonoInput = document.getElementById('abono');
            const abonoRaw = abonoInput ? (parseFloat(abonoInput.value) || 0) : 0;
            const abono = Math.max(0, abonoRaw);
            const abonoAplicado = Math.min(abono, total);
            const saldoActual = Math.max(0, total - abonoAplicado);
            const hasAbono = abono > 0;

            return { total, abono, abonoAplicado, saldoActual, hasAbono };
        }

        function resolveStatusByBusinessRules(options = {}) {
            const total = Math.max(0, Number(options.total) || 0);
            const abonoAplicado = Math.max(0, Number(options.abonoAplicado) || 0);
            const selectedStatus = String(options.selectedStatus || 'pending').toLowerCase();
            const dueDate = String(options.dueDate || '').trim();
            const today = getTodayISODate();
            const estadoManualLock = !!options.estadoManualLock;

            if (estadoManualLock) return selectedStatus || 'pending';

            if (selectedStatus === 'dispatch') return 'dispatch';
            if (selectedStatus === 'paid') return 'paid';
            if (total > 0 && abonoAplicado >= total) return 'paid';
            if (total > 0 && abonoAplicado > 0) return 'saldo_actual';

            if (selectedStatus === 'abono' || selectedStatus === 'saldo_actual') return 'pending';

            if (selectedStatus === 'late') {
                if (dueDate && dueDate >= today) return 'pending';
                return 'late';
            }

            if (selectedStatus === 'pending') {
                if (dueDate && dueDate < today) return 'late';
                return 'pending';
            }

            return 'pending';
        }

        function updatePaymentDerivedUI(payment) {
            const saldoWrapper = document.getElementById('saldoActualWrapper');
            const saldoAmount = document.getElementById('saldoActualAmount');
            const abonoInput = document.getElementById('abono');
            if (saldoWrapper && saldoAmount) {
                saldoAmount.textContent = payment.saldoActual.toFixed(2);
                saldoWrapper.classList.toggle('hidden', !payment.hasAbono);
            }

            const estadoEl = document.getElementById('estado');
            if (!estadoEl) return;

            const currentStatus = estadoEl.value || 'pending';
            const dueDate = document.getElementById('fechaVencimiento')?.value || '';
            const estadoManualLock = document.getElementById('estadoManualLock')?.checked || false;
            const resolvedStatus = resolveStatusByBusinessRules({
                total: payment.total,
                abonoAplicado: payment.abonoAplicado,
                selectedStatus: currentStatus,
                dueDate,
                estadoManualLock
            });

            if (resolvedStatus && resolvedStatus !== currentStatus) {
                estadoEl.value = resolvedStatus;
            }

            if (estadoEl.value === 'paid') {
                if (abonoInput) {
                    abonoInput.value = payment.total.toFixed(2);
                }
                if (saldoWrapper && saldoAmount) {
                    saldoAmount.textContent = '0.00';
                    saldoWrapper.classList.add('hidden');
                }
            }

            updateStatusSections(estadoEl.value);
            syncEstadoPreviousStatus();
        }

        function calculateTotals() {
            const rows = document.querySelectorAll('#itemsTableBody tr');
            let total = 0;
            
            rows.forEach(row => {
                const cant = parseFloat(row.querySelector('.item-cant').value) || 0;
                const precio = parseFloat(row.querySelector('.item-precio').value) || 0;
                const valor = cant * precio;
                row.querySelector('.item-valor').textContent = valor.toFixed(2);
                total += valor;
            });
            
            document.getElementById('totalAmount').textContent = total.toFixed(2);
            const payment = getPaymentSummary(total);
            updatePaymentDerivedUI(payment);
            scheduleDraftSave();
        }

        function buildValidationErrorsHtml(errors) {
            const safeErrors = Array.isArray(errors) ? errors : [];
            const groups = {
                general: [],
                statusDates: [],
                items: [],
                amounts: []
            };

            const decorateStatusMentions = (text) => {
                let formatted = String(text || '');
                const replacements = [
                    { pattern: /\bSaldo\s+Actual\b/gi, html: '<span class="status-badge status-saldo">Saldo Actual</span>' },
                    { pattern: /\bPagada\b/gi, html: '<span class="status-badge status-paid">Pagada</span>' },
                    { pattern: /\bPendiente\b/gi, html: '<span class="status-badge status-pending">Pendiente</span>' },
                    { pattern: /\bVencida\b/gi, html: '<span class="status-badge status-late">Vencida</span>' },
                    { pattern: /\bDespacho\b/gi, html: '<span class="status-badge status-dispatch">Despacho</span>' },
                    { pattern: /\bAbono\b/gi, html: '<span class="status-badge status-abono">Abono</span>' }
                ];

                replacements.forEach(rule => {
                    formatted = formatted.replace(rule.pattern, rule.html);
                });

                return formatted;
            };

            safeErrors.forEach(err => {
                const message = String(err || '').trim();
                if (!message) return;

                const normalized = message.toLowerCase();

                if (normalized.includes('item')) {
                    groups.items.push(message);
                    return;
                }

                if (normalized.includes('abono') || normalized.includes('total')) {
                    groups.amounts.push(message);
                    return;
                }

                if (normalized.includes('fecha') || normalized.includes('vencimiento') || normalized.includes('pago') || normalized.includes('estado') || normalized.includes('despacho')) {
                    groups.statusDates.push(message);
                    return;
                }

                groups.general.push(message);
            });

            const seen = new Set();
            const unique = list => list.filter(msg => {
                if (seen.has(msg)) return false;
                seen.add(msg);
                return true;
            });

            const sections = [
                { title: 'General', items: unique(groups.general) },
                { title: 'Fechas y estado', items: unique(groups.statusDates) },
                { title: 'Items', items: unique(groups.items) },
                { title: 'Montos', items: unique(groups.amounts) }
            ].filter(section => section.items.length > 0);

            const totalErrors = sections.reduce((acc, section) => acc + section.items.length, 0);
            const shouldSplitItems = totalErrors > 2;

            return sections.map(section => `
                <div style="text-align:left; margin: 0 0 12px 0;">
                    <p style="font-weight:700; margin:0 0 6px 0;">${section.title}</p>
                    <ul style="margin:0; padding-left:${shouldSplitItems ? '0' : '18px'}; list-style:${shouldSplitItems ? 'none' : 'disc'};">
                        ${section.items.map((item, idx) => `<li style="${shouldSplitItems ? 'padding:6px 8px; margin:0; border-bottom:' + (idx < section.items.length - 1 ? '1px solid rgba(148,163,184,0.35)' : 'none') + ';' : ''}">${decorateStatusMentions(item)}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        }

        async function handleSubmit(e) {
            e.preventDefault();
            if (!ensureCanCreateInvoices()) return;
            
            const dia = document.getElementById('dia').value;
            const mes = document.getElementById('mes').value;
            const anio = document.getElementById('anio').value;
            const numero = document.getElementById('numero').value;
            const cliente = document.getElementById('cliente').value.trim();
            
            const errors = [];
            const clearIds = ['dia', 'mes', 'anio', 'numero', 'cliente', 'estado', 'abono', 'detalleDespacho', 'fechaVencimiento', 'fechaPago'];
            clearIds.forEach(id => document.getElementById(id).classList.remove('input-error'));

            const addError = (id, message) => {
                const el = document.getElementById(id);
                if (el) el.classList.add('input-error');
                errors.push(message);
            };

            if (!dia) {
                addError('dia', 'Día requerido');
            } else if (dia < 1 || dia > 31) {
                addError('dia', 'Día inválido (1 a 31)');
            }

            if (!mes) {
                addError('mes', 'Mes requerido');
            } else if (mes < 1 || mes > 12) {
                addError('mes', 'Mes inválido (1 a 12)');
            }

            if (!anio) {
                addError('anio', 'Año requerido');
            } else if (anio < 2020 || anio > 2100) {
                addError('anio', 'Año inválido (2020 a 2100)');
            }

            if (!numero) {
                addError('numero', 'Número requerido');
            }

            if (!cliente) {
                addError('cliente', 'Cliente requerido');
            }

            const estado = document.getElementById('estado').value;
            if (!estado) {
                addError('estado', 'Estado requerido');
            }

            const allowedStatuses = new Set(['dispatch', 'abono', 'saldo_actual', 'paid', 'pending', 'late']);
            if (estado && !allowedStatuses.has(estado)) {
                addError('estado', 'Estado inválido');
            }

            const detalleDespacho = document.getElementById('detalleDespacho').value.trim();
            const fechaVencimiento = document.getElementById('fechaVencimiento').value;
            const fechaPago = document.getElementById('fechaPago').value;
            const invoiceDateIso = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const todayIso = getTodayISODate();

            const isValidIsoDate = (isoDate) => {
                if (!isoDate) return false;
                const parsed = new Date(`${isoDate}T00:00:00`);
                if (Number.isNaN(parsed.getTime())) return false;
                return parsed.toISOString().slice(0, 10) === isoDate;
            };

            if (dia && mes && anio && !isValidIsoDate(invoiceDateIso)) {
                addError('dia', 'La fecha de factura no es válida');
                addError('mes', 'La fecha de factura no es válida');
                addError('anio', 'La fecha de factura no es válida');
            }

            if (estado === 'dispatch' && !detalleDespacho) {
                addError('detalleDespacho', 'Detalle de Despacho requerido para estado Despacho');
            }

            if (estado === 'dispatch' && detalleDespacho && detalleDespacho.length < 3) {
                addError('detalleDespacho', 'Detalle de Despacho demasiado corto (mínimo 3 caracteres)');
            }

            if ((estado === 'pending' || estado === 'late') && !fechaVencimiento) {
                addError('fechaVencimiento', 'Fecha de vencimiento requerida para estado Pendiente/Vencida');
            }

            if (fechaVencimiento && !isValidIsoDate(fechaVencimiento)) {
                addError('fechaVencimiento', 'Fecha de vencimiento inválida');
            }

            if (estado === 'paid' && !fechaPago) {
                addError('fechaPago', 'Fecha de pago requerida para estado Pagada');
            }

            if (fechaPago && !isValidIsoDate(fechaPago)) {
                addError('fechaPago', 'Fecha de pago inválida');
            }

            const shouldValidateDueDateAsRequired = estado === 'pending';

            if (shouldValidateDueDateAsRequired && fechaVencimiento && isValidIsoDate(invoiceDateIso) && fechaVencimiento < invoiceDateIso) {
                addError('fechaVencimiento', 'La fecha de vencimiento no puede ser anterior a la fecha de factura');
            }

            if (fechaPago && isValidIsoDate(invoiceDateIso) && fechaPago < invoiceDateIso) {
                addError('fechaPago', 'La fecha de pago no puede ser anterior a la fecha de factura');
            }

            if (estado !== 'paid' && fechaPago) {
                addError('fechaPago', 'La fecha de pago solo aplica cuando el estado es Pagada');
            }

            if (estado === 'late' && fechaVencimiento && fechaVencimiento >= todayIso) {
                addError('fechaVencimiento', 'Para estado Vencida, la fecha de vencimiento debe ser menor a hoy');
            }

            if (estado === 'pending' && fechaVencimiento && fechaVencimiento < todayIso) {
                addError('fechaVencimiento', 'Para estado Pendiente, la fecha de vencimiento no puede ser anterior a hoy');
            }

            const rows = document.querySelectorAll('#itemsTableBody tr');
            let hasItems = false;

            // Limpiar resaltados anteriores de inputs
            document.querySelectorAll('#itemsTableBody .item-desc, #itemsTableBody .item-precio, #itemsTableBody .item-cant').forEach(input => {
                input.classList.remove('input-error');
            });

            rows.forEach((row, index) => {
                const desc = row.querySelector('.item-desc').value.trim();
                const precio = parseFloat(row.querySelector('.item-precio').value) || 0;
                const cant = parseFloat(row.querySelector('.item-cant').value) || 0;
                const hasAny = desc || precio > 0 || cant > 0;
                const isComplete = desc && precio > 0 && cant > 0;

                if (isComplete) {
                    hasItems = true;
                } else if (hasAny) {
                    const missing = [];
                    if (!desc) {
                        row.querySelector('.item-desc').classList.add('input-error');
                        missing.push('descripción');
                    }
                    if (precio <= 0) {
                        row.querySelector('.item-precio').classList.add('input-error');
                        missing.push('precio');
                    }
                    if (cant <= 0) {
                        row.querySelector('.item-cant').classList.add('input-error');
                        missing.push('cantidad');
                    }
                    if (missing.length) {
                        errors.push(`Item ${index + 1}: falta ${missing.join(', ')}`);
                    }
                }
            });

            if (!hasItems) {
                errors.push('Agregue al menos un item completo');
            }

            const totalValue = parseFloat(document.getElementById('totalAmount').textContent) || 0;
            const abonoValue = parseFloat(document.getElementById('abono').value) || 0;

            if (totalValue <= 0) {
                errors.push('El total de la factura debe ser mayor a 0');
            }

            if (abonoValue < 0) {
                addError('abono', 'El abono no puede ser negativo');
            }
            if (abonoValue > totalValue) {
                addError('abono', 'El abono no puede ser mayor al total de la factura');
            }

            if (estado === 'abono' && abonoValue <= 0) {
                addError('abono', 'Para estado Abono, el abono debe ser mayor a 0');
            }

            if (estado === 'saldo_actual' && (abonoValue <= 0 || abonoValue >= totalValue)) {
                addError('abono', 'Para estado Saldo Actual, el abono debe ser mayor a 0 y menor al total');
            }

            if (errors.length) {
                Swal.fire({
                    icon: 'error',
                    title: 'Corrige los campos',
                    html: buildValidationErrorsHtml(errors),
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            await saveInvoice();
        }

        async function saveInvoice() {
            if (!ensureCanCreateInvoices()) return;
            const total = parseFloat(document.getElementById('totalAmount').textContent);
            const payment = getPaymentSummary(total);
            const selectedStatus = document.getElementById('estado').value;
            const estadoManualLock = document.getElementById('estadoManualLock').checked;
            const dueDate = document.getElementById('fechaVencimiento').value || '';
            const paidDateInput = document.getElementById('fechaPago').value || '';
            const dispatchDetailInput = document.getElementById('detalleDespacho').value.trim();

            const statusToSave = resolveStatusByBusinessRules({
                total: payment.total,
                abonoAplicado: payment.abonoAplicado,
                selectedStatus,
                dueDate,
                estadoManualLock
            });

            const paymentToSave = statusToSave === 'paid'
                ? {
                    ...payment,
                    abono: payment.total,
                    abonoAplicado: payment.total,
                    saldoActual: 0,
                    hasAbono: payment.total > 0
                }
                : payment;

            const dispatchDetail = statusToSave === 'dispatch' ? dispatchDetailInput : '';
            const paidDate = statusToSave === 'paid' ? (paidDateInput || getTodayISODate()) : '';
            const dueDateToSave = dueDate;

            if (editingId) {
                const existing = invoices.find(inv => inv.id === editingId);
                if (!existing || !ensureCanEditInvoice(existing)) return;
            }
            
            const items = [];
            document.querySelectorAll('#itemsTableBody tr').forEach(row => {
                const desc = row.querySelector('.item-desc').value.trim();
                const cant = parseFloat(row.querySelector('.item-cant').value) || 0;
                const precio = parseFloat(row.querySelector('.item-precio').value) || 0;
                
                if (desc && precio > 0) {
                    items.push({ desc, cant, precio, total: cant * precio });
                }
            });

            const nowIso = new Date().toISOString();

            if (editingId) {
                const invoiceIndex = invoices.findIndex(inv => inv.id === editingId);
                if (invoiceIndex !== -1) {
                    const updatedInvoices = [...invoices];
                    const existingInvoice = invoices[invoiceIndex];
                    const updateAudit = createAuditEntry('updated', existingInvoice);
                    updatedInvoices[invoiceIndex] = {
                        ...existingInvoice,
                        number: document.getElementById('numero').value,
                        client: document.getElementById('cliente').value,
                        date: `${document.getElementById('anio').value}-${String(document.getElementById('mes').value).padStart(2, '0')}-${String(document.getElementById('dia').value).padStart(2, '0')}`,
                        amount: total,
                        status: statusToSave,
                        abono: paymentToSave.abono,
                        saldoActual: paymentToSave.saldoActual,
                        manualStatusLocked: estadoManualLock,
                        dispatchDetail,
                        dueDate: dueDateToSave,
                        paidDate,
                        address: document.getElementById('direccion').value,
                        items: items,
                        createdByEmail: existingInvoice.createdByEmail || (currentUser ? currentUser.email : null),
                        createdAt: existingInvoice.createdAt || nowIso,
                        updatedAt: nowIso,
                        updatedByEmail: currentUser ? currentUser.email : '',
                        changeLog: appendChangeLog(existingInvoice.changeLog, updateAudit)
                    };
                    try {
                        await saveInvoiceRecord(updatedInvoices[invoiceIndex]);
                        await saveAdminAuditRecord(updateAudit);
                        invoices = updatedInvoices;
                        resetForm();
                        updateInvoiceList();
                        showToast(`Factura #${document.getElementById('numero').value} actualizada`, 'success', 1800, 'top-end', { toastType: 'success' });
                    } catch (error) {
                        console.error('Error guardando factura:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'No se pudo guardar',
                            text: 'Firebase rechazó el guardado. Verifica sesión y reglas de seguridad.',
                            confirmButtonColor: '#1a1a1a'
                        });
                    }
                }
            } else {
                const createAudit = createAuditEntry('created');
                const newInvoice = {
                    id: Date.now(),
                    number: document.getElementById('numero').value,
                    client: document.getElementById('cliente').value,
                    date: `${document.getElementById('anio').value}-${String(document.getElementById('mes').value).padStart(2, '0')}-${String(document.getElementById('dia').value).padStart(2, '0')}`,
                    amount: total,
                    status: statusToSave,
                    abono: paymentToSave.abono,
                    saldoActual: paymentToSave.saldoActual,
                    manualStatusLocked: estadoManualLock,
                    dispatchDetail,
                    dueDate: dueDateToSave,
                    paidDate,
                    address: document.getElementById('direccion').value,
                    items: items,
                    createdByEmail: currentUser ? currentUser.email : null,
                    createdAt: nowIso,
                    updatedAt: nowIso,
                    updatedByEmail: currentUser ? currentUser.email : '',
                    changeLog: appendChangeLog([], createAudit)
                };

                const updatedInvoices = [...invoices, newInvoice];

                try {
                    await saveInvoiceRecord(newInvoice);
                    await saveAdminAuditRecord({ ...createAudit, invoiceId: newInvoice.id, invoiceNumber: newInvoice.number, invoiceStatus: newInvoice.status });
                    invoices = updatedInvoices;
                    resetForm();
                    updateInvoiceList();
                    showToast(`Factura #${newInvoice.number} creada`, 'success', 1800, 'top-end', { toastType: 'success' });
                } catch (error) {
                    console.error('Error creando factura:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo crear la factura',
                        text: 'Firebase rechazó el guardado. Verifica sesión y reglas de seguridad.',
                        confirmButtonColor: '#1a1a1a'
                    });
                }
            }
        }

