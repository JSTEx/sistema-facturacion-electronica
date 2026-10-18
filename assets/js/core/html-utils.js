// Utilidades de HTML: escapar texto no confiable antes de insertarlo en innerHTML.
// Funcion: escapeHtml
// Que hace: Escapa caracteres peligrosos para evitar inyeccion de HTML/JS (XSS).
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

window.escapeHtml = escapeHtml;
