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

window.filterInvoicesByStatus = filterInvoicesByStatus;
window.sortInvoicesDescById = sortInvoicesDescById;
window.searchInvoices = searchInvoices;
window.paginateList = paginateList;
