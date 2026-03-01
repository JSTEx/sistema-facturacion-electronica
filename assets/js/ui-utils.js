function showToast(title, icon = 'success', timer = 1600, position = 'top-end', options = {}) {
    if (!window.Swal) return;
    const iconName = String(icon || '').toLowerCase();
    const inferredType = iconName === 'error' ? 'danger' : (iconName === 'warning' ? 'warning' : 'success');
    const toastType = options.toastType || inferredType; // success, warning, danger
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

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Vencida hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    return `Vence en ${diffDays} días`;
}

function getStatusClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'dispatch' || normalized === 'despacho') return 'status-dispatch';
    if (normalized === 'abono') return 'status-abono';
    if (normalized === 'saldo_actual' || normalized === 'saldo actual' || normalized === 'sado actual') return 'status-saldo';
    if (normalized === 'paid' || normalized === 'pagada' || normalized === 'pagadas') return 'status-paid';
    if (normalized === 'late' || normalized === 'vencida' || normalized === 'vencidas') return 'status-late';
    return 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'dispatch': 'Despacho',
        'despacho': 'Despacho',
        'abono': 'Abono',
        'saldo_actual': 'Saldo Actual',
        'saldo actual': 'Saldo Actual',
        'sado actual': 'Saldo Actual',
        'paid': 'Pagada',
        'pagada': 'Pagada',
        'pagadas': 'Pagada',
        'pending': 'Pendiente',
        'pendiente': 'Pendiente',
        'pendientes': 'Pendiente',
        'late': 'Vencida',
        'vencida': 'Vencida',
        'vencidas': 'Vencida'
    };
    return statusMap[String(status || '').toLowerCase()] || status;
}

function getStatusPdfChipData(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'dispatch' || normalized === 'despacho') {
        return { text: 'Despacho', background: '#dbeafe', color: '#1e40af' };
    }
    if (normalized === 'abono') {
        return { text: 'Abono', background: '#dcfce7', color: '#166534' };
    }
    if (normalized === 'saldo_actual' || normalized === 'saldo actual' || normalized === 'sado actual') {
        return { text: 'Saldo Actual', background: '#ede9fe', color: '#5b21b6' };
    }
    if (normalized === 'paid' || normalized === 'pagada' || normalized === 'pagadas') {
        return { text: 'Pagada', background: '#d1fae5', color: '#065f46' };
    }
    if (normalized === 'late' || normalized === 'vencida' || normalized === 'vencidas') {
        return { text: 'Vencida', background: '#fee2e2', color: '#991b1b' };
    }
    return { text: 'Pendiente', background: '#fef3c7', color: '#92400e' };
}

function filterInvoicesByStatus(invoices, status) {
    const list = Array.isArray(invoices) ? invoices : [];
    if (status === 'all') return [...list];
    return list.filter((inv) => inv && inv.status === status);
}

function sortInvoicesDescById(invoices) {
    const list = Array.isArray(invoices) ? [...invoices] : [];
    return list.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
}

function searchInvoices(invoices, term) {
    const list = Array.isArray(invoices) ? invoices : [];
    const normalizedTerm = String(term || '').toLowerCase().trim();
    if (!normalizedTerm) return [...list];

    return list.filter((inv) => {
        const numberText = String(inv?.number || '').toLowerCase();
        const clientText = String(inv?.client || '').toLowerCase();
        return numberText.includes(normalizedTerm) || clientText.includes(normalizedTerm);
    });
}

function paginateList(items, currentPage, pageSize) {
    const list = Array.isArray(items) ? items : [];
    const safePageSize = Math.max(1, Number(pageSize) || 1);
    const totalPages = Math.max(1, Math.ceil(list.length / safePageSize));
    const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);
    const startIndex = (safeCurrentPage - 1) * safePageSize;
    const endIndex = startIndex + safePageSize;

    return {
        totalPages,
        currentPage: safeCurrentPage,
        startIndex,
        endIndex,
        pageItems: list.slice(startIndex, endIndex)
    };
}

window.showToast = showToast;
window.formatDate = formatDate;
window.getStatusClass = getStatusClass;
window.getStatusText = getStatusText;
window.getStatusPdfChipData = getStatusPdfChipData;
window.filterInvoicesByStatus = filterInvoicesByStatus;
window.sortInvoicesDescById = sortInvoicesDescById;
window.searchInvoices = searchInvoices;
window.paginateList = paginateList;
