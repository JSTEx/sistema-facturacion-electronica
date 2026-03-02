        window.toastTheme = {
            background: '#ecfdf5',
            color: '#065f46',
            iconColor: '#16a34a'
        };

        const BACKUP_REMINDER_LAST_KEY = 'lastBackupReminderAt';
        const BACKUP_LAST_EXPORT_KEY = 'lastBackupExportAt';
        const BACKUP_REMINDER_INTERVAL_MS = 1000 * 60 * 60 * 24;

        function normalizeInvoices(rawInvoices) {
            const list = Array.isArray(rawInvoices)
                ? rawInvoices.filter(Boolean)
                : (rawInvoices && typeof rawInvoices === 'object' ? Object.values(rawInvoices) : []);

            return list
                .map(normalizeInvoiceRecord)
                .filter(Boolean);
        }

        function normalizeInvoiceRecord(record) {
            if (!record || typeof record !== 'object') return null;
            const parsedId = Number(record.id);
            if (!Number.isFinite(parsedId)) return null;

            const items = Array.isArray(record.items)
                ? record.items
                    .filter(Boolean)
                    .map((item) => {
                        const quantity = Math.max(0, Number(item.cant || 0));
                        const price = Math.max(0, Number(item.precio || 0));
                        return {
                            desc: String(item.desc || '').trim(),
                            cant: quantity,
                            precio: price,
                            total: Math.max(0, Number(item.total || quantity * price))
                        };
                    })
                : [];

            const changeLog = Array.isArray(record.changeLog)
                ? record.changeLog.filter(Boolean).slice(-25)
                : [];

            return {
                ...record,
                id: parsedId,
                number: String(record.number || ''),
                client: String(record.client || '').trim(),
                date: String(record.date || ''),
                amount: Math.max(0, Number(record.amount || 0)),
                status: String(record.status || 'pending').toLowerCase(),
                abono: Math.max(0, Number(record.abono || 0)),
                saldoActual: Math.max(0, Number(record.saldoActual || 0)),
                dispatchDetail: String(record.dispatchDetail || '').trim(),
                dueDate: String(record.dueDate || '').trim(),
                paidDate: String(record.paidDate || '').trim(),
                address: String(record.address || '').trim(),
                items,
                createdByEmail: record.createdByEmail || '',
                createdAt: record.createdAt || '',
                updatedByEmail: record.updatedByEmail || '',
                updatedAt: record.updatedAt || '',
                changeLog
            };
        }

        function toInvoicesMap(invoiceList) {
            const map = {};
            normalizeInvoices(invoiceList).forEach((invoice) => {
                map[String(invoice.id)] = invoice;
            });
            return map;
        }

        function createAuditEntry(action, invoiceRef = null) {
            const nowIso = new Date().toISOString();
            return {
                action,
                at: nowIso,
                byEmail: currentUser?.email || 'desconocido',
                byRole: currentUser?.role || 'unknown',
                invoiceId: invoiceRef?.id || null,
                invoiceNumber: invoiceRef?.number || null,
                invoiceStatus: invoiceRef?.status || null
            };
        }

        function appendChangeLog(existingLog, entry) {
            const safeLog = Array.isArray(existingLog) ? [...existingLog] : [];
            safeLog.push(entry);
            return safeLog.slice(-25);
        }

        async function saveAdminAuditRecord(entry) {
            const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await setFirebaseData(`adminAudit/${key}`, entry);
        }

        function getDateDiffFromToday(isoDate) {
            const raw = String(isoDate || '').trim();
            if (!raw) return null;
            const due = new Date(`${raw}T00:00:00`);
            if (Number.isNaN(due.getTime())) return null;

            const todayRaw = getTodayISODate();
            const today = new Date(`${todayRaw}T00:00:00`);
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.round((due.getTime() - today.getTime()) / oneDay);
        }

        function updateOperationalAlerts(invoiceList) {
            const container = document.getElementById('operationalAlerts');
            if (!container) return;

            if (IS_HISTORY_VIEW) {
                container.classList.add('hidden');
                return;
            }

            const visibleInvoices = Array.isArray(invoiceList) ? invoiceList : [];
            let overdueCount = 0;
            let todayCount = 0;
            let soonCount = 0;

            visibleInvoices.forEach((invoice) => {
                const normalizedStatus = String(invoice?.status || '').toLowerCase();
                if (normalizedStatus === 'paid') return;

                const diffDays = getDateDiffFromToday(invoice?.dueDate);
                if (diffDays === null) return;

                if (diffDays < 0 || normalizedStatus === 'late' || normalizedStatus === 'vencida') {
                    overdueCount += 1;
                    return;
                }

                if (diffDays === 0) {
                    todayCount += 1;
                    return;
                }

                if (diffDays > 0 && diffDays <= 3) {
                    soonCount += 1;
                }
            });

            const overdueEl = document.getElementById('alertOverdueCount');
            const todayEl = document.getElementById('alertTodayCount');
            const soonEl = document.getElementById('alertSoonCount');
            if (overdueEl) overdueEl.textContent = String(overdueCount);
            if (todayEl) todayEl.textContent = String(todayCount);
            if (soonEl) soonEl.textContent = String(soonCount);

            const hasAlerts = overdueCount > 0 || todayCount > 0 || soonCount > 0;
            container.classList.toggle('hidden', !hasAlerts);
        }

        function maybeNotifyBackupReminder(force = false) {
            if (!(currentUser && currentUser.role === 'admin')) return;

            const now = Date.now();
            const last = Number(localStorage.getItem(BACKUP_REMINDER_LAST_KEY) || 0);
            if (!force && now - last < BACKUP_REMINDER_INTERVAL_MS) return;

            localStorage.setItem(BACKUP_REMINDER_LAST_KEY, String(now));

            if (window.showToast) {
                showToast('Recordatorio: realiza una copia de seguridad manual (Exportar)', 'warning', 4200, 'top-end', { toastType: 'warning' });
            }
        }

        function getLastBackupExportLabel() {
            const raw = localStorage.getItem(BACKUP_LAST_EXPORT_KEY);
            if (!raw) return 'Aún no has exportado una copia de seguridad.';
            return `Último respaldo exportado: ${formatDateTimeSV(raw)}`;
        }

        function uint8ArrayToBase64(bytes) {
            const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
            return btoa(binary);
        }

        function base64ToUint8Array(base64) {
            const binary = atob(base64);
            return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
        }

        async function deriveBackupKey(password, saltBytes) {
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            return window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: saltBytes,
                    iterations: 120000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        }

        async function requestBackupPassword(mode) {
            const title = mode === 'import' ? 'Clave de respaldo' : 'Crear clave de respaldo';
            const text = mode === 'import'
                ? 'Ingresa la clave usada al exportar para descifrar el respaldo.'
                : 'Crea una clave para cifrar este respaldo y proteger correos/datos sensibles.';

            if (window.Swal) {
                const result = await Swal.fire({
                    title,
                    text,
                    input: 'password',
                    inputPlaceholder: 'Clave (mínimo 6 caracteres)',
                    inputAttributes: {
                        autocapitalize: 'off',
                        autocorrect: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: mode === 'import' ? 'Descifrar' : 'Cifrar y exportar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#1a1a1a',
                    cancelButtonColor: '#334155',
                    inputValidator: (value) => {
                        const safe = String(value || '').trim();
                        if (safe.length < 6) return 'Usa una clave de al menos 6 caracteres.';
                        return undefined;
                    }
                });

                if (!result.isConfirmed) return '';
                return String(result.value || '').trim();
            }

            const fallback = window.prompt(mode === 'import'
                ? 'Ingresa la clave del respaldo:'
                : 'Crea una clave para cifrar el respaldo:');
            const safe = String(fallback || '').trim();
            return safe.length >= 6 ? safe : '';
        }

        async function encryptBackupPayload(payloadObject, password) {
            const encoder = new TextEncoder();
            const plainText = JSON.stringify(payloadObject);
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await deriveBackupKey(password, salt);

            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoder.encode(plainText)
            );

            return {
                metadata: {
                    ...payloadObject.metadata,
                    encrypted: true,
                    algorithm: 'AES-GCM',
                    kdf: 'PBKDF2-SHA-256',
                    iterations: 120000
                },
                encryptedBackup: {
                    salt: uint8ArrayToBase64(salt),
                    iv: uint8ArrayToBase64(iv),
                    cipher: uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
                }
            };
        }

        async function decryptBackupPayload(encryptedJson, password) {
            const encryptedBlock = encryptedJson?.encryptedBackup;
            if (!encryptedBlock?.salt || !encryptedBlock?.iv || !encryptedBlock?.cipher) {
                throw new Error('Formato de respaldo cifrado inválido');
            }

            const salt = base64ToUint8Array(encryptedBlock.salt);
            const iv = base64ToUint8Array(encryptedBlock.iv);
            const cipherBytes = base64ToUint8Array(encryptedBlock.cipher);
            const key = await deriveBackupKey(password, salt);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                cipherBytes
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedBuffer));
        }

        async function exportInvoicesBackup() {
            if (!ensureAdminAction('el respaldo manual')) return;
            if (!(window.crypto && window.crypto.subtle)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Navegador no compatible',
                    text: 'Tu navegador no soporta cifrado seguro para respaldos.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            const backupPassword = await requestBackupPassword('export');
            if (!backupPassword) return;

            const exportedAt = new Date().toISOString();
            const payload = {
                metadata: {
                    exportedAt,
                    exportedBy: currentUser?.email || 'desconocido',
                    totalInvoices: Array.isArray(invoices) ? invoices.length : 0,
                    app: 'FacturacionElectronica'
                },
                invoices: toInvoicesMap(invoices)
            };

            const encryptedPayload = await encryptBackupPayload(payload, backupPassword);

            const fileContent = JSON.stringify(encryptedPayload, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            anchor.href = url;
            anchor.download = `backup-seguro-facturas-${timestamp}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);

            showToast('Copia de seguridad cifrada exportada', 'success', 2200, 'top-end', { toastType: 'success' });
            localStorage.setItem(BACKUP_REMINDER_LAST_KEY, String(Date.now()));
            localStorage.setItem(BACKUP_LAST_EXPORT_KEY, exportedAt);
        }

        async function importInvoicesBackupFile(file) {
            if (!ensureAdminAction('la importación de respaldo')) return;
            if (!file) return;
            const text = await file.text();
            let parsed;

            try {
                parsed = JSON.parse(text);
            } catch {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo inválido',
                    text: 'El JSON del respaldo no es válido.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            let sourceForImport = parsed;

            if (parsed?.encryptedBackup?.cipher) {
                if (!(window.crypto && window.crypto.subtle)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Navegador no compatible',
                        text: 'No se puede descifrar este respaldo en este navegador.',
                        confirmButtonColor: '#1a1a1a'
                    });
                    return;
                }

                const password = await requestBackupPassword('import');
                if (!password) return;

                try {
                    sourceForImport = await decryptBackupPayload(parsed, password);
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo descifrar',
                        text: 'Clave incorrecta o archivo de respaldo dañado.',
                        confirmButtonColor: '#1a1a1a'
                    });
                    return;
                }
            }

            const incomingSource = sourceForImport?.invoices ?? sourceForImport;
            const normalizedIncoming = normalizeInvoices(incomingSource);
            if (!normalizedIncoming.length) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin facturas válidas',
                    text: 'El respaldo no contiene facturas válidas para importar.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            const confirm = await Swal.fire({
                icon: 'warning',
                title: '¿Importar respaldo? ',
                html: `<p>Se reemplazarán las facturas actuales por <strong>${normalizedIncoming.length}</strong> facturas del archivo.</p>`,
                showCancelButton: true,
                confirmButtonText: 'Sí, importar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#059669',
                cancelButtonColor: '#1a1a1a'
            });

            if (!confirm.isConfirmed) return;

            const invoicesMap = toInvoicesMap(normalizedIncoming);
            const ok = await setFirebaseData('invoices', invoicesMap);
            if (!ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo importar',
                    text: 'Firebase rechazó la importación del respaldo.',
                    confirmButtonColor: '#1a1a1a'
                });
                return;
            }

            invoices = normalizedIncoming;
            updateInvoiceList();
            await saveAdminAuditRecord({
                action: 'backup_imported',
                at: new Date().toISOString(),
                byEmail: currentUser?.email || 'desconocido',
                byRole: currentUser?.role || 'unknown',
                importedInvoices: normalizedIncoming.length
            });
            showToast('Respaldo importado correctamente', 'success', 2200, 'top-end', { toastType: 'success' });
            localStorage.setItem(BACKUP_REMINDER_LAST_KEY, String(Date.now()));
        }

        // Verificar autenticación obligatoria con Firebase Auth
        // Mostrar loader hasta verificar sesion
