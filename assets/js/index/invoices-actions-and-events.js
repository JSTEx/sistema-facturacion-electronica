        function downloadInvoicePdf(inv, canViewAmount) {
            if (!ensureCanViewInvoice(inv)) return;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                Swal.fire({
                    icon: 'error',
                    title: 'PDF no disponible',
                    text: 'No se pudo cargar la librería de PDF.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const left = 48;
            const right = pageWidth - 48;
            const normalizedStatus = String(inv.status || '').toLowerCase();
            const statusTextForPdf = normalizedStatus === 'paid' ? 'Pagada al 100%' : getStatusText(inv.status);
            const statusColorMap = {
                dispatch: [30, 64, 175],
                paid: [6, 95, 70],
                pending: [146, 64, 14],
                late: [153, 27, 27],
                abono: [21, 94, 117],
                saldo_actual: [91, 33, 182]
            };
            const statusColor = statusColorMap[normalizedStatus] || [17, 24, 39];

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text(`Factura #${inv.number}`, pageWidth / 2, 56, { align: 'center' });

            let y = 92;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', left, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(inv.client || ''), left + 52, y);

            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.text('Dirección:', left, y);
            doc.setFont('helvetica', 'normal');
            doc.text(canViewAmount ? String(inv.address || 'N/A') : 'Oculta', left + 62, y);

            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', left, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(formatDateSV(inv.date) || ''), left + 42, y);

            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.text('Estado:', left, y);
            doc.setTextColor(...statusColor);
            doc.setFont('helvetica', 'bold');
            doc.text(statusTextForPdf, left + 50, y);
            doc.setTextColor(17, 17, 17);

            const today = getTodayISODate();
            const dueIsLate = !!(inv.dueDate && (normalizedStatus === 'late' || inv.dueDate < today));
            const saldoForPdf = canViewAmount
                ? `$${Math.max(0, Number.isFinite(Number(inv.saldoActual)) ? Number(inv.saldoActual) : (Number(inv.amount || 0) - Number(inv.abono || 0))).toFixed(2)}`
                : 'Oculto';

            const metaBadges = [];
            if (normalizedStatus === 'paid') {
                metaBadges.push({
                    text: 'PAGO: PAGADA AL 100%',
                    bg: [220, 252, 231],
                    fg: [22, 101, 52]
                });
            }

            if (normalizedStatus !== 'paid' && Number(inv.abono || 0) > 0) {
                metaBadges.push({
                    text: `SALDO ACTUAL: ${saldoForPdf}`,
                    bg: [237, 233, 254],
                    fg: [91, 33, 182]
                });
            }

            if (inv.dueDate) {
                metaBadges.push({
                    text: `VENCE: ${formatDateSV(inv.dueDate)}`,
                    bg: dueIsLate ? [254, 226, 226] : [254, 243, 199],
                    fg: dueIsLate ? [153, 27, 27] : [146, 64, 14]
                });
            }

            if (inv.paidDate) {
                metaBadges.push({
                    text: `FECHA DE PAGO: ${formatDateSV(inv.paidDate)}`,
                    bg: [209, 250, 229],
                    fg: [6, 95, 70]
                });
            }

            if (inv.dispatchDetail) {
                const dispatchText = String(inv.dispatchDetail).trim();
                const maxDispatchLineLength = 36;
                const dispatchWords = dispatchText.split(/\s+/).filter(Boolean);
                const dispatchChunks = [];
                let currentChunk = '';

                dispatchWords.forEach((word) => {
                    const candidate = currentChunk ? `${currentChunk} ${word}` : word;
                    if (candidate.length <= maxDispatchLineLength) {
                        currentChunk = candidate;
                        return;
                    }

                    if (currentChunk) {
                        dispatchChunks.push(currentChunk);
                        currentChunk = word;
                    } else {
                        dispatchChunks.push(word.slice(0, maxDispatchLineLength));
                        currentChunk = word.slice(maxDispatchLineLength);
                    }
                });

                if (currentChunk) {
                    dispatchChunks.push(currentChunk);
                }

                if (!dispatchChunks.length) {
                    dispatchChunks.push(dispatchText);
                }

                dispatchChunks.forEach((chunk, chunkIndex) => {
                    metaBadges.push({
                        text: chunkIndex === 0 ? `DESPACHO: ${chunk}` : chunk,
                        bg: [219, 234, 254],
                        fg: [30, 64, 175]
                    });
                });
            }

            let badgesEndY = y;
            if (metaBadges.length) {
                const badgePaddingX = 6;
                const badgeHeight = 14;
                const badgeGapX = 6;
                const badgeGapY = 5;
                let badgeX = left;
                let badgeY = y + 10;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);

                metaBadges.forEach((badge) => {
                    const textWidth = doc.getTextWidth(badge.text);
                    const badgeWidth = textWidth + (badgePaddingX * 2);
                    const maxX = right;

                    if (badgeX + badgeWidth > maxX) {
                        badgeX = left;
                        badgeY += badgeHeight + badgeGapY;
                    }

                    doc.setFillColor(...badge.bg);
                    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 7, 7, 'F');
                    doc.setTextColor(...badge.fg);
                    doc.text(badge.text, badgeX + badgePaddingX, badgeY + 9.5);

                    badgeX += badgeWidth + badgeGapX;
                });

                doc.setTextColor(17, 17, 17);
                badgesEndY = badgeY + badgeHeight;
            }

            const bodyRows = (inv.items || []).map(item => {
                const price = canViewAmount ? `$${Number(item.precio || 0).toFixed(2)}` : 'Oculto';
                const rowTotal = canViewAmount ? `$${Number(item.total || 0).toFixed(2)}` : 'Oculto';
                return [String(item.cant ?? ''), String(item.desc ?? ''), price, rowTotal];
            });

            doc.autoTable({
                startY: badgesEndY + 12,
                head: [['Cant.', 'Descripción', 'Precio', 'Total']],
                body: bodyRows,
                margin: { left, right: 48 },
                styles: { font: 'helvetica', fontSize: 11, cellPadding: 6 },
                headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });

            const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 120;
            const totalLabel = 'TOTAL';
            const totalValue = canViewAmount ? `$${Number(inv.amount || 0).toFixed(2)}` : 'Oculto';

            doc.setDrawColor(209, 213, 219);
            doc.roundedRect(right - 210, tableEndY + 16, 210, 42, 8, 8, 'S');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text(totalLabel, right - 190, tableEndY + 40);
            doc.setTextColor(17, 24, 39);
            doc.setFontSize(24);
            doc.text(totalValue, right - 20, tableEndY + 42, { align: 'right' });

            doc.save(`Factura-${inv.number}.pdf`);
        }

        function previewInvoicePdf(inv, canViewAmount) {
            if (!ensureCanViewInvoice(inv)) return;
            const normalizedStatus = String(inv.status || '').toLowerCase();
            const today = getTodayISODate();
            const dueIsLate = !!(inv.dueDate && (normalizedStatus === 'late' || inv.dueDate < today));
            const statusText = normalizedStatus === 'paid' ? 'Pagada al 100%' : getStatusText(inv.status);
            const addressText = canViewAmount ? (inv.address || 'N/A') : 'Oculta';
            const totalText = canViewAmount ? `$${Number(inv.amount || 0).toFixed(2)}` : 'Oculto';
            const totalFinalText = canViewAmount ? `$${Number(inv.amount || 0).toFixed(2)}` : 'Oculto';
            const saldoPreview = canViewAmount
                ? `$${Math.max(0, Number.isFinite(Number(inv.saldoActual)) ? Number(inv.saldoActual) : (Number(inv.amount || 0) - Number(inv.abono || 0))).toFixed(2)}`
                : 'Oculto';

            const paidBadgeHtml = normalizedStatus === 'paid'
                ? `<span class="pdf-meta-badge pdf-meta-badge-paid">PAGO: PAGADA AL 100%</span>`
                : '';
            const saldoBadgeHtml = normalizedStatus !== 'paid' && Number(inv.abono || 0) > 0
                ? `<span class="pdf-meta-badge pdf-meta-badge-saldo">SALDO ACTUAL: ${saldoPreview}</span>`
                : '';
            const dueBadgeHtml = inv.dueDate
                ? `<span class="pdf-meta-badge ${dueIsLate ? 'pdf-meta-badge-due-late' : 'pdf-meta-badge-due'}">VENCE: ${formatDateSV(inv.dueDate)}</span>`
                : '';
            const paidDateBadgeHtml = inv.paidDate
                ? `<span class="pdf-meta-badge pdf-meta-badge-paid-date">FECHA DE PAGO: ${formatDateSV(inv.paidDate)}</span>`
                : '';
            const dispatchBadgeHtml = inv.dispatchDetail
                ? `<span class="pdf-meta-badge pdf-meta-badge-dispatch">DESPACHO: ${inv.dispatchDetail}</span>`
                : '';
            const metaBadgesHtml = [paidBadgeHtml, saldoBadgeHtml, dueBadgeHtml, paidDateBadgeHtml, dispatchBadgeHtml]
                .filter(Boolean)
                .join('');

            const amountValue = Number(inv.amount || 0);
            const amountAsWords = canViewAmount
                ? `${amountValue.toFixed(2)} dólares`
                : 'Oculto';
            const invoiceNumber = String(inv.number || '').padStart(5, '0');
            const items = Array.isArray(inv.items) ? inv.items : [];
            const minRows = 14;

            const itemsRows = items.map(item => {
                const qty = Number(item.cant || 0);
                const priceValue = Number(item.precio || 0);
                const lineTotalValue = Number(item.total || 0);
                const priceText = canViewAmount ? `$${priceValue.toFixed(2)}` : 'Oculto';
                const gravadaText = canViewAmount ? `$${lineTotalValue.toFixed(2)}` : 'Oculto';

                return `
                    <tr>
                        <td class="pdf-legacy-cell-center">${qty || ''}</td>
                        <td>${item.desc || ''}</td>
                        <td class="pdf-legacy-cell-right">${priceText}</td>
                        <td class="pdf-legacy-cell-right"></td>
                        <td class="pdf-legacy-cell-right"></td>
                        <td class="pdf-legacy-cell-right">${gravadaText}</td>
                    </tr>
                `;
            }).join('');

            const emptyRowsCount = Math.max(0, minRows - items.length);
            const emptyRows = Array.from({ length: emptyRowsCount }, () => `
                <tr>
                    <td>&nbsp;</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            `).join('');

            const invoiceCardHtml = `
                    <div class="pdf-copy">
                        <div class="pdf-legacy-card">
                            <div class="pdf-legacy-head">
                                <div class="pdf-legacy-brand">
                                    <div class="pdf-legacy-logo">Creaciones Rachell</div>
                                    <div class="pdf-legacy-brand-sub">CONFECCION DE ROPA INTIMA</div>
                                    <div>Calle al Volcán, Col. Boquín San Ramón,</div>
                                    <div>#9, Mejicanos, San Salvador.</div>
                                    <div>Tel.: 2274-7541</div>
                                    <div class="pdf-legacy-pay">Condiciones de Pago: <span>${statusText}</span></div>
                                </div>
                                <div class="pdf-legacy-docbox">
                                    <div class="pdf-legacy-doc-title">COMPROBANTE DE CREDITO FISCAL</div>
                                    <div class="pdf-legacy-doc-sub">19UN000C</div>
                                    <div class="pdf-legacy-doc-number-row"><span>N°</span><strong>${invoiceNumber}</strong></div>
                                    <div>REGISTRO N°: 238069-7</div>
                                    <div>NIT: 1115-051273-102-7</div>
                                </div>
                            </div>

                            <div class="pdf-legacy-fields">
                                <div class="pdf-legacy-field"><span>Señor:</span> <strong>${inv.client || 'N/A'}</strong></div>
                                <div class="pdf-legacy-field"><span>Fecha:</span> <strong>${formatDateSV(inv.date) || ''}</strong></div>
                                <div class="pdf-legacy-field"><span>Dirección:</span> <strong>${addressText}</strong></div>
                                <div class="pdf-legacy-field"><span>NIT:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>Dept.:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>Registro No.:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>No. y F. Nota de Remisión Anterior:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>Giro:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>Venta a Cuenta de:</span> <strong></strong></div>
                                <div class="pdf-legacy-field"><span>Cond. de Pago:</span> <strong>${statusText}</strong></div>
                            </div>

                            ${metaBadgesHtml ? `<div class="pdf-legacy-meta-badges">${metaBadgesHtml}</div>` : ''}

                            <div class="pdf-legacy-table-wrap">
                                <table class="pdf-legacy-table">
                                    <thead>
                                        <tr>
                                            <th class="pdf-legacy-col-qty">CANT.</th>
                                            <th>Descripción</th>
                                            <th class="pdf-legacy-col-price pdf-legacy-cell-right">PRECIO UNITARIO</th>
                                            <th class="pdf-legacy-col-tax pdf-legacy-cell-right">VTAS. NO SUJETAS</th>
                                            <th class="pdf-legacy-col-tax pdf-legacy-cell-right">VENTAS EXENTAS</th>
                                            <th class="pdf-legacy-col-tax pdf-legacy-cell-right">VENTAS GRAVADAS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsRows}
                                        ${emptyRows}
                                    </tbody>
                                </table>
                            </div>

                            <div class="pdf-legacy-bottom">
                                <div class="pdf-legacy-son">SON: <strong>${amountAsWords}</strong></div>
                                <div class="pdf-legacy-totals">
                                    <div><span>SUMAS</span><strong>${totalText}</strong></div>
                                    <div><span>(-) IVA RETENIDO</span><strong>$0.00</strong></div>
                                    <div><span>13% DE IVA</span><strong>$0.00</strong></div>
                                    <div><span>SUB-TOTAL</span><strong>${totalText}</strong></div>
                                    <div><span>VENTAS NO SUJETAS</span><strong>$0.00</strong></div>
                                    <div><span>VENTAS EXENTAS</span><strong>$0.00</strong></div>
                                    <div class="pdf-legacy-total-final"><span>VENTA TOTAL</span><strong>${totalFinalText}</strong></div>
                                </div>
                            </div>

                            <div class="pdf-legacy-foot">
                                <div>Original-Cliente-Blanco</div>
                                <div>Duplicado-Emisor-Amarillo</div>
                                <div>Triplicado-Cliente-Verde</div>
                            </div>
                        </div>
                    </div>
            `;

            const copiesHtml = `
                <div class="pdf-copy-slot">${invoiceCardHtml}</div>
                <div class="pdf-copy-slot">${invoiceCardHtml}</div>
                <div class="pdf-copy-slot">${invoiceCardHtml}</div>
            `;

            const baseHref = new URL('./', window.location.href).href;
            const html = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Factura #${inv.number}</title>
                    <base href="${baseHref}">
                    <link rel="stylesheet" href="assets/css/app.css">
                </head>
                <body class="pdf-preview">
                    <div class="pdf-shell">
                    <div class="pdf-actions">
                        <button class="pdf-action-btn pdf-action-print" onclick="window.print()">Imprimir</button>
                        <button class="pdf-action-btn pdf-action-close" onclick="window.close()">Cerrar</button>
                    </div>
                    <div class="pdf-fit-area" id="pdfFitArea">
                        <div class="pdf-copies" id="pdfCopies">
                            ${copiesHtml}
                        </div>
                    </div>
                    </div>
                    <script>
                        document.documentElement.style.setProperty('--pdf-scale', '1');
                    <\/script>
                </body>
                </html>
            `;

            try {
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                const previewUrl = URL.createObjectURL(blob);
                const opened = window.open(previewUrl, '_blank');

                if (!opened) {
                    URL.revokeObjectURL(previewUrl);
                    Swal.fire({
                        icon: 'warning',
                        title: 'Ventana bloqueada',
                        text: 'Permite ventanas emergentes para previsualizar el PDF.',
                        confirmButtonColor: '#1a1a1a'
                    });
                    return;
                }

                setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
            } catch (error) {
                const fallbackWindow = window.open('', '_blank');
                if (fallbackWindow) {
                    fallbackWindow.document.open();
                    fallbackWindow.document.write(html);
                    fallbackWindow.document.close();
                }
                console.error('Error mostrando previsualizacion:', error);
            }
        }

        function viewInvoice(id) {
            const inv = invoices.find(i => i.id === id);
            if (!inv) return;
            if (!ensureCanViewInvoice(inv)) return;
            const normalizedStatus = String(inv.status || '').toLowerCase();
            const today = getTodayISODate();
            const dueIsLate = !!(inv.dueDate && (normalizedStatus === 'late' || inv.dueDate < today));
            const statusText = normalizedStatus === 'paid' ? 'Pagada al 100%' : getStatusText(inv.status);
            const canViewAmount = canSeeInvoiceAmount(inv);
            const addressText = canViewAmount ? (inv.address || 'N/A') : 'Oculta';
            const abonoText = canViewAmount ? `$${Number(inv.abono || 0).toFixed(2)}` : 'Oculto';
            const saldoText = canViewAmount
                ? `$${Math.max(0, Number.isFinite(Number(inv.saldoActual)) ? Number(inv.saldoActual) : (Number(inv.amount || 0) - Number(inv.abono || 0))).toFixed(2)}`
                : 'Oculto';
            const paymentMeta = normalizedStatus === 'paid'
                ? '<p class="mt-1"><span class="invoice-meta-badge invoice-meta-badge-paid">PAGO: PAGADA AL 100%</span></p>'
                : `<p><strong>Abono:</strong> ${abonoText}</p><p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge invoice-meta-badge-saldo">SALDO ACTUAL:</span><span class="invoice-meta-value invoice-meta-value-saldo">${saldoText}</span></p>`;
            const dueDateMeta = inv.dueDate
                ? `<p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge ${dueIsLate ? 'invoice-meta-badge-due-late' : 'invoice-meta-badge-due'}">VENCE:</span><span class="invoice-meta-value ${dueIsLate ? 'invoice-meta-value-due-late' : 'invoice-meta-value-due'}">${formatDateSV(inv.dueDate)}</span></p>`
                : '';
            const paidDateMeta = inv.paidDate
                ? `<p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge invoice-meta-badge-paid-date">FECHA DE PAGO:</span><span class="invoice-meta-value invoice-meta-value-paid-date">${formatDateSV(inv.paidDate)}</span></p>`
                : '';
            const dispatchMeta = inv.dispatchDetail
                ? `<p class="mt-1 invoice-meta-row"><span class="invoice-meta-badge invoice-meta-badge-dispatch">DESPACHO:</span><span class="invoice-meta-value invoice-meta-value-dispatch">${inv.dispatchDetail}</span></p>`
                : '';
            const changeLogButton = '<button type="button" class="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline" onclick="showInvoiceChangeLog(' + inv.id + ')">Ver historial de cambios</button>';

            let itemsHtml = '<table class="w-full text-sm border-collapse"><tr class="border-b"><th class="text-left p-2">Cant.</th><th class="text-left p-2">Descripción</th><th class="text-left p-2">Precio</th><th class="text-right p-2">Total</th></tr>';
            
            inv.items.forEach(item => {
                const itemPrice = canViewAmount ? `$${item.precio.toFixed(2)}` : 'Oculto';
                const itemTotal = canViewAmount ? `$${item.total.toFixed(2)}` : 'Oculto';
                itemsHtml += `<tr class="border-b"><td class="p-2">${item.cant}</td><td class="p-2">${item.desc}</td><td class="p-2">${itemPrice}</td><td class="text-right p-2">${itemTotal}</td></tr>`;
            });
            
            itemsHtml += '</table>';
            const totalHtml = canViewAmount
                ? `<div class="invoice-modal-total-box has-total"><span class="invoice-modal-total-label">Total</span><span class="invoice-modal-total-value">$${inv.amount.toFixed(2)}</span></div>`
                : '<div class="invoice-modal-total-box"><span class="invoice-modal-total-label">Total</span><span class="invoice-modal-total-value is-hidden">Oculto</span></div>';

            Swal.fire({
                title: `Factura #${inv.number}`,
                html: `
                    <div class="invoice-modal-content text-left">
                        <div class="invoice-modal-meta">
                            <p><strong>Cliente:</strong> ${inv.client}</p>
                            <p><strong>Dirección:</strong> ${addressText}</p>
                            <p><strong>Fecha:</strong> ${formatDateSV(inv.date)}</p>
                            <p><strong>Estado:</strong> ${statusText}</p>
                            ${changeLogButton}
                            ${paymentMeta}
                            ${dueDateMeta}
                            ${paidDateMeta}
                            ${dispatchMeta}
                        </div>
                        <div class="invoice-modal-items">
                            ${itemsHtml}
                        </div>
                        <div class="invoice-modal-total">
                            ${totalHtml}
                        </div>
                    </div>
                `,
                showDenyButton: true,
                denyButtonText: 'Previsualizar PDF',
                denyButtonColor: '#2563eb',
                showCancelButton: true,
                cancelButtonText: 'Descargar PDF',
                cancelButtonColor: '#059669',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#1a1a1a'
            }).then((result) => {
                if (result.isDenied) {
                    previewInvoicePdf(inv, canViewAmount);
                }
                if (result.dismiss === Swal.DismissReason.cancel) {
                    try {
                        downloadInvoicePdf(inv, canViewAmount);
                    } catch (error) {
                        console.error('Error descargando PDF:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'No se pudo descargar',
                            text: 'Ocurrio un error al generar el PDF.',
                            confirmButtonColor: '#1a1a1a'
                        });
                    }
                }
            });
        }

        function editInvoice(id) {
            const inv = invoices.find(i => i.id === id);
            if (!inv) return;
            if (!ensureCanEditInvoice(inv)) return;

            editingId = id;
            document.getElementById('invoiceListView').classList.add('hidden');
            document.getElementById('invoiceFormView').classList.remove('hidden');
            
            document.getElementById('dia').value = inv.date.split('-')[2];
            document.getElementById('mes').value = inv.date.split('-')[1];
            document.getElementById('anio').value = inv.date.split('-')[0];
            document.getElementById('numero').value = inv.number;
            document.getElementById('cliente').value = inv.client;
            document.getElementById('direccion').value = inv.address || '';
            document.getElementById('abono').value = Number(inv.abono || 0).toFixed(2);
            document.getElementById('detalleDespacho').value = inv.dispatchDetail || '';
            document.getElementById('fechaVencimiento').value = inv.dueDate || '';
            document.getElementById('fechaPago').value = inv.paidDate || '';
            document.getElementById('estadoManualLock').checked = !!inv.manualStatusLocked;
            
            const legacyToCanonicalStatus = {
                pagada: 'paid',
                pagadas: 'paid',
                pendiente: 'pending',
                pendientes: 'pending',
                vencida: 'late',
                vencidas: 'late',
                despacho: 'dispatch',
                abono: 'abono',
                'saldo actual': 'saldo_actual',
                'sado actual': 'saldo_actual'
            };
            const normalizedStatus = String(inv.status || '').toLowerCase();
            document.getElementById('estado').value = legacyToCanonicalStatus[normalizedStatus] || normalizedStatus || 'pending';
            syncEstadoPreviousStatus();
            
            resetItemsTable();
            if (inv.items && inv.items.length > 0) {
                const tbody = document.getElementById('itemsTableBody');
                tbody.innerHTML = '';
                inv.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-100';
                    row.innerHTML = `
                        <td class="py-2 px-2 text-center" data-label="#">
                            <span class="item-index text-gray-700 font-semibold">0</span>
                        </td>
                        <td class="py-2 px-2" data-label="Cant.">
                            <input type="number" min="0" step="0.01" value="${item.cant}" class="item-cant w-full px-2 py-1.5 border border-gray-200 rounded text-center text-sm focus:outline-none focus:border-gray-900" oninput="calculateTotals()">
                        </td>
                        <td class="py-2 px-2" data-label="Descripcion">
                            <textarea class="item-desc item-desc-area w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="Descripción del item" rows="2">${item.desc}</textarea>
                        </td>
                        <td class="py-2 px-2" data-label="Precio">
                            <input type="number" min="0" step="0.01" value="${item.precio}" class="item-precio w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-900" placeholder="0.00" oninput="calculateTotals()">
                        </td>
                        <td class="py-2 px-2 text-right" data-label="Valor">
                            <span class="item-valor text-gray-900 font-medium">${item.total.toFixed(2)}</span>
                        </td>
                        <td class="py-2 px-2 text-center remove-cell" data-label="Eliminar">
                            <button type="button" onclick="removeItem(this)" class="removeItemBtn text-gray-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                <span class="remove-label">Eliminar item</span>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                renumberItemRows();
                syncAllItemDescHeights();
            }

            document.querySelector('.invoiceFormTitle').textContent = 'Editar Factura';
            document.getElementById('submitBtn').textContent = 'Guardar cambios';
            
            updateStatusSections(document.getElementById('estado').value);
            calculateTotals();
        }

        function deleteInvoice(id) {
            if (!(currentUser && currentUser.role === 'admin')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Sin permisos',
                    text: 'Solo los administradores pueden eliminar facturas.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }
            Swal.fire({
                title: '¿Eliminar factura?',
                text: "Esta acción no se puede deshacer",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#1a1a1a',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const deletedInvoice = invoices.find(inv => inv.id === id);
                    if (!deletedInvoice) return;
                    const updatedInvoices = invoices.filter(inv => inv.id !== id);
                    try {
                        await deleteInvoiceRecord(id);
                        await saveAdminAuditRecord(createAuditEntry('deleted', deletedInvoice));
                        invoices = updatedInvoices;
                        updateInvoiceList();

                        const undoResult = await Swal.fire({
                            toast: true,
                            position: 'bottom-end',
                            icon: 'warning',
                            title: `Factura #${deletedInvoice.number} eliminada`,
                            showConfirmButton: true,
                            confirmButtonText: 'Deshacer',
                            confirmButtonColor: '#10b981',
                            timer: 5000,
                            timerProgressBar: true
                        });

                        if (undoResult.isConfirmed) {
                            await saveInvoiceRecord(deletedInvoice);
                            await saveAdminAuditRecord(createAuditEntry('restored', deletedInvoice));
                            updateInvoiceList();
                            showToast(`Factura #${deletedInvoice.number} restaurada`, 'success', 1800, 'top-end', { toastType: 'success' });
                        }
                    } catch (error) {
                        console.error('Error eliminando factura:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'No se pudo eliminar',
                            text: 'Firebase rechazó la operación. Verifica sesión y reglas de seguridad.',
                            confirmButtonColor: '#1a1a1a'
                        });
                    }
                }
            });
        }

        document.getElementById('searchInput').addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const listContainer = document.getElementById('invoiceList');
            const emptyState = document.getElementById('emptyState');
            const paginationContainer = document.getElementById('paginationContainer');
            
            const visible = filterInvoicesByVisibility(invoices);
            const baseFiltered = filterInvoicesByStatus(visible, currentFilter);
            let filtered = searchInvoices(baseFiltered, term);
            filtered = prioritizeOverdueInvoices(filtered);
            
            if (term && filtered.length === 0) {
                listContainer.classList.add('hidden');
                emptyState.classList.remove('hidden');
                paginationContainer.classList.add('hidden');
                emptyState.innerHTML = '<p class="text-gray-500 text-base">No se encontraron resultados</p>';
            } else if (term) {
                emptyState.classList.add('hidden');
                listContainer.classList.remove('hidden');
                currentPage = 1;
                renderSearchResults(filtered);
            } else {
                updateInvoiceList();
            }
        });

        document.getElementById('itemsTableBody').addEventListener('input', function(e) {
            if (e.target && e.target.classList.contains('item-desc-area')) {
                autoResizeItemDesc(e.target);
            }
            scheduleDraftSave();
        });

        document.getElementById('invoiceForm').addEventListener('input', function () {
            scheduleDraftSave();
        });

        document.getElementById('estado').addEventListener('change', function(e) {
            const previousStatus = String(e.target.dataset.prevStatus || '').toLowerCase();
            const nextStatus = String(e.target.value || '').toLowerCase();
            const estadoManualLockEl = document.getElementById('estadoManualLock');
            const abonoInputEl = document.getElementById('abono');

            if (estadoManualLockEl && !estadoManualLockEl.checked && previousStatus === 'paid' && nextStatus !== 'paid') {
                estadoManualLockEl.checked = true;
                if (abonoInputEl) {
                    abonoInputEl.value = '0.00';
                }
            }

            updateStatusSections(e.target.value);
            calculateTotals();
            syncEstadoPreviousStatus();
        });

        document.getElementById('estadoManualLock').addEventListener('change', function() {
            calculateTotals();
        });

        document.getElementById('fechaVencimiento').addEventListener('change', function() {
            calculateTotals();
        });

        document.getElementById('fechaPago').addEventListener('change', function() {
            scheduleDraftSave();
        });

        document.getElementById('detalleDespacho').addEventListener('input', function() {
            scheduleDraftSave();
        });

        function renderSearchResults(filtered) {
            const listContainer = document.getElementById('invoiceList');
            const paginationContainer = document.getElementById('paginationContainer');
            
            filtered = prioritizeOverdueInvoices(filtered);
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
            listContainer.innerHTML = paginatedInvoices.map(inv => renderInvoiceCard(inv, canDelete, false)).join('');
            animateOverdueNotificationIcons();
        }

        document.getElementById('filterSelect').addEventListener('change', function(e) {
            currentFilter = e.target.value;
            currentPage = 1;
            document.getElementById('searchInput').value = '';
            updateInvoiceList();
        });

        document.getElementById('btnBackupExport').addEventListener('click', function() {
            exportInvoicesBackup();
        });

        document.getElementById('btnBackupImport').addEventListener('click', async function() {
            const input = document.getElementById('backupImportInput');
            if (!input) return;

            if (!window.Swal) {
                input.click();
                return;
            }

            const lastBackupText = getLastBackupExportLabel();
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Importar copia de seguridad',
                html: `<p class="mb-2">Selecciona un archivo <strong>.json</strong> exportado desde este sistema.</p><p class="text-sm text-gray-500">La importación reemplaza las facturas actuales.</p><p class="text-xs text-gray-500 mt-2">${lastBackupText}</p>`,
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#1a1a1a'
            });

            if (result.isConfirmed) {
                input.click();
            }
        });

        document.getElementById('backupImportInput').addEventListener('change', async function(event) {
            const file = event.target.files && event.target.files[0];
            try {
                await importInvoicesBackupFile(file);
            } finally {
                event.target.value = '';
            }
        });

        function logout() {
            return confirmLogout({
                redirectUrl: 'pages/login.html',
                confirmTitle: 'Cerrar sesion',
                confirmText: 'Estas seguro de que deseas salir?',
                confirmButtonText: 'Si, salir',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#dc2626',
                successTitle: 'Hasta pronto',
                successText: 'Sesion cerrada correctamente'
            });
        }

        // Inicializar Dark Mode al cargar la página
        initDarkMode({ respectSystem: true });

        // Inicializar apartados dinámicos por estado
        updateStatusSections(document.getElementById('estado').value || 'pending');

        // Ejemplo mínimo de anime.js en botón
        initAnimeButtonDemo();

        // Inicializar el select de filtro
        document.getElementById('filterSelect').value = 'all';
        updateInvoiceList();
