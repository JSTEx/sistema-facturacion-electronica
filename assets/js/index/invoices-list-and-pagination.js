        function renderInvoiceSkeletonList(count = 6) {
            const listContainer = document.getElementById('invoiceList');
            const emptyState = document.getElementById('emptyState');
            const paginationContainer = document.getElementById('paginationContainer');
            const totalCount = document.getElementById('totalCount');
            if (!listContainer || !emptyState || !paginationContainer) return;

            if (totalCount) totalCount.textContent = 'Cargando...';
            emptyState.classList.add('hidden');
            paginationContainer.classList.add('hidden');
            listContainer.classList.remove('hidden');
            listContainer.classList.add('invoice-skeleton-grid');
            listContainer.innerHTML = window.createSkeletonCards
                ? window.createSkeletonCards({ count })
                : Array.from({ length: count }).map(() => '<div class="invoice-skeleton-card"><div class="skeleton-line"></div></div>').join('');
        }

        function updateInvoiceList() {
            const listContainer = document.getElementById('invoiceList');
            const emptyState = document.getElementById('emptyState');
            const totalCount = document.getElementById('totalCount');
            const paginationContainer = document.getElementById('paginationContainer');

            if (window.__invoiceDataLoading === true) {
                renderInvoiceSkeletonList(6);
                return;
            }

            if (listContainer) listContainer.classList.remove('invoice-skeleton-grid');
            
            const visible = filterInvoicesByVisibility(invoices);
            let filtered = filterInvoicesByStatus(visible, currentFilter);
            filtered = prioritizeOverdueInvoices(filtered);
            updateOperationalAlerts(visible);
            
            totalCount.textContent = IS_HISTORY_VIEW ? `${filtered.length} pagadas` : `${filtered.length} activas`;
            
            if (visible.length === 0) {
                emptyState.classList.remove('hidden');
                listContainer.classList.add('hidden');
                paginationContainer.classList.add('hidden');
                emptyState.innerHTML = IS_HISTORY_VIEW
                    ? `<p class="text-gray-500 text-base">Aún no hay facturas pagadas en el historial</p>`
                    : `<p class="text-gray-500 text-base">Aún no hay facturas activas. Crea una factura para comenzar</p>`;
                return;
            }
            
            if (filtered.length === 0) {
                emptyState.classList.remove('hidden');
                listContainer.classList.add('hidden');
                paginationContainer.classList.add('hidden');
                if (currentFilter === 'all') {
                    emptyState.innerHTML = IS_HISTORY_VIEW
                        ? `<p class="text-gray-500 text-base">No hay facturas pagadas para mostrar</p>`
                        : `<p class="text-gray-500 text-base">No hay facturas activas para mostrar</p>`;
                } else {
                    emptyState.innerHTML = `<p class="text-gray-500 text-base">No hay facturas con estado "${getStatusText(currentFilter)}"</p>`;
                }
                return;
            }
            
            emptyState.classList.add('hidden');
            listContainer.classList.remove('hidden');
            
            const paginationData = paginateList(filtered, currentPage, invoicesPerPage);
            const totalPages = paginationData.totalPages;
            currentPage = paginationData.currentPage;
            const paginatedInvoices = paginationData.pageItems;
            
            // Mostrar u ocultar paginación
            if (totalPages > 1) {
                paginationContainer.classList.remove('hidden');
                renderPaginationButtons(totalPages);
            } else {
                paginationContainer.classList.add('hidden');
            }
            const canDelete = currentUser && currentUser.role === 'admin';
            listContainer.innerHTML = paginatedInvoices.map(inv => renderInvoiceCard(inv, canDelete, true)).join('');
            animateOverdueNotificationIcons();
        }

        function renderInvoiceCard(inv, canDelete, withTitle = false) {
            if (!canViewInvoice(inv)) return '';
            const statusClass = getStatusClass(inv.status);
            const normalizedStatus = String(inv.status || '').toLowerCase();
            const statusText = normalizedStatus === 'paid' ? 'Pagada al 100%' : getStatusText(inv.status);
            const canViewAmount = canSeeInvoiceAmount(inv);
            const amountText = canViewAmount ? `$${inv.amount.toFixed(2)}` : 'Monto oculto';
            const abonoValue = Number(inv.abono || 0);
            const saldoValue = Number.isFinite(Number(inv.saldoActual))
                ? Math.max(0, Number(inv.saldoActual))
                : Math.max(0, Number(inv.amount || 0) - abonoValue);
            const isOverdue = isInvoiceOverdue(inv);
            const today = getTodayISODate();
            const dueIsLate = !!(inv.dueDate && (normalizedStatus === 'late' || inv.dueDate < today));
            const saldoHtml = (canViewAmount && abonoValue > 0 && String(inv.status || '').toLowerCase() !== 'paid')
                ? `<p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge invoice-meta-badge-saldo">SALDO ACTUAL:</span><span class="invoice-meta-value invoice-meta-value-saldo">$${saldoValue.toFixed(2)}</span></p>`
                : '';
            const dueDateHtml = inv.dueDate
                ? `<p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge ${dueIsLate ? 'invoice-meta-badge-due-late' : 'invoice-meta-badge-due'}">VENCE:</span><span class="invoice-meta-value ${dueIsLate ? 'invoice-meta-value-due-late' : 'invoice-meta-value-due'}">${formatDateSV(inv.dueDate)}</span></p>`
                : '';
            const paidDateHtml = inv.paidDate ? `<p class="text-xs text-gray-500 mt-1">FECHA DE PAGO: ${formatDateSV(inv.paidDate)}</p>` : '';
            const dispatchHtml = inv.dispatchDetail ? `<p class="text-xs text-gray-500 mt-1">DESPACHO: ${inv.dispatchDetail}</p>` : '';
            const manualStatusClass = isOverdue ? 'manual-status-with-alert' : '';
            const manualStatusHtml = inv.manualStatusLocked
                ? `<p class="text-xs italic text-gray-500 mb-2 ${manualStatusClass}">Estado manual</p>`
                : '';
            const statusDetailHtml = inv.status === 'dispatch'
                ? dispatchHtml
                : (inv.status === 'paid' ? paidDateHtml : dueDateHtml);
            const overdueNotificationHtml = isOverdue
                ? `<div class="overdue-notification-icon" title="Factura vencida" aria-label="Factura vencida"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><i class="overdue-notification-dot" aria-hidden="true"></i></div>`
                : '';
            const actionRowClass = isOverdue ? 'flex justify-end gap-3 mb-2 pl-9' : 'flex justify-end gap-3 mb-2';
            const cardStateClass = isOverdue ? 'invoice-card-overdue' : '';
            const viewTitle = withTitle ? ' title="Ver"' : '';
            const editTitle = withTitle ? ' title="Editar"' : '';
            const deleteTitle = withTitle ? ' title="Eliminar"' : '';

            return `
            <div class="invoice-card ${cardStateClass} bg-white border border-gray-200 rounded-lg p-5 relative">
                ${manualStatusHtml}
                ${overdueNotificationHtml}
                <div class="${actionRowClass}">
                    <button onclick="viewInvoice(${inv.id})" class="text-gray-400 hover:text-gray-600 transition-colors"${viewTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    ${canEditInvoice(inv) ? `
                    <button onclick="editInvoice(${inv.id})" class="text-gray-400 hover:text-blue-600 transition-colors"${editTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    ` : ''}
                    ${canDelete ? `
                    <button onclick="deleteInvoice(${inv.id})" class="text-gray-400 hover:text-red-600 transition-colors"${deleteTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    ` : ''}
                </div>
                <div class="mb-3">
                    <h3 class="text-lg font-semibold text-gray-900 leading-tight">${inv.client}</h3>
                    <p class="text-sm text-gray-500 mt-0">Factura #${inv.number}</p>
                    ${getInvoiceOwnershipBadge(inv)}
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <span class="text-2xl font-bold text-gray-900">${amountText}</span>
                        ${saldoHtml}
                        ${statusDetailHtml}
                    </div>
                    <div class="flex items-center gap-6"></div>
                </div>
                <div class="mt-2 flex justify-end">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            `;
        }

        function renderPaginationButtons(totalPages) {
            const pageButtonsContainer = document.getElementById('pageButtons');
            pageButtonsContainer.innerHTML = '';
            
            // Mostrar números de página (máximo 5 botones)
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);
            
            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.className = `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    i === currentPage 
                        ? 'bg-gray-900 text-white' 
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`;
                btn.textContent = i;
                btn.onclick = () => goToPage(i);
                pageButtonsContainer.appendChild(btn);
            }
        }

        function goToPage(page) {
            currentPage = page;
            updateInvoiceList();
        }

        function nextPage() {
            const listContainer = document.getElementById('invoiceList');
            if (!listContainer.classList.contains('hidden')) {
                const visible = filterInvoicesByVisibility(invoices);
                const filtered = filterInvoicesByStatus(visible, currentFilter);
                const totalPages = paginateList(filtered, currentPage, invoicesPerPage).totalPages;
                if (currentPage < totalPages) {
                    currentPage++;
                    updateInvoiceList();
                }
            }
        }

        function previousPage() {
            if (currentPage > 1) {
                currentPage--;
                updateInvoiceList();
            }
        }

