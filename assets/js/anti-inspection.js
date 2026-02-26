(function () {
    function blockEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('keydown', function (event) {
        const key = String(event.key || '').toLowerCase();

        if (key === 'f12') {
            blockEvent(event);
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
            blockEvent(event);
            return;
        }

        if ((event.ctrlKey || event.metaKey) && key === 'u') {
            blockEvent(event);
        }
    });
})();
