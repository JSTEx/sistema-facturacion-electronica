function showToast(title, icon = 'success', timer = 1600, position = 'top-end', options = {}) {
    if (!window.Swal) return;
    const theme = Object.assign({}, window.toastTheme || {}, options || {});
    const toastType = options.toastType || 'success'; // success, warning, danger
    
    return Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        background: theme.background,
        color: theme.color,
        iconColor: theme.iconColor,
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
