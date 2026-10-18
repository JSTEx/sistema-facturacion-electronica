// Utilidades de listas: filtrar, buscar, ordenar y paginar facturas.
// Funcion: filterInvoicesByStatus
// Que hace: Gestiona la logica de filterInvoicesByStatus.
function filterInvoicesByStatus(invoices, status) {
    const list = Array.isArray(invoices) ? invoices : [];
    if (status === 'all') return [...list];
    if (status === 'late') {
        const today = new Date().toISOString().split('T')[0];
        return list.filter((inv) => {
            if (!inv) return false;
            const normalizedStatus = String(inv.status || '').toLowerCase();
            if (normalizedStatus === 'late' || normalizedStatus === 'vencida') return true;
            const dueDate = String(inv.dueDate || '').trim();
            return dueDate && dueDate < today;
        });
    }
    return list.filter((inv) => inv && inv.status === status);
}

// Funcion: sortInvoicesDescById
// Que hace: Gestiona la logica de sortInvoicesDescById.
function sortInvoicesDescById(invoices) {
    const list = Array.isArray(invoices) ? [...invoices] : [];
    return list.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
}

// Funcion: stripAccents
// Funcion: Elimina tildes/diacriticos para busqueda insensible a acentos.
function stripAccents(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Funcion: searchInvoices
// Que hace: Gestiona la logica de searchInvoices (insensible a mayusculas y acentos).
function searchInvoices(invoices, term) {
    const list = Array.isArray(invoices) ? invoices : [];
    const normalizedTerm = stripAccents(String(term || '')).toLowerCase().trim();
    if (!normalizedTerm) return [...list];

    return list.filter((inv) => {
        const numberText = stripAccents(String(inv?.number || '')).toLowerCase();
        const clientText = stripAccents(String(inv?.client || '')).toLowerCase();
        return numberText.includes(normalizedTerm) || clientText.includes(normalizedTerm);
    });
}

// Funcion: paginateList
// Que hace: Gestiona la logica de paginateList.
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

window.filterInvoicesByStatus = filterInvoicesByStatus;
window.sortInvoicesDescById = sortInvoicesDescById;
window.searchInvoices = searchInvoices;
window.paginateList = paginateList;
window.stripAccents = stripAccents;