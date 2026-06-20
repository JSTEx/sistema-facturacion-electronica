// Medidas de seguridad para proteger la aplicación contra inspección y ataques básicos.
(function () {
    'use strict';

    const CONFIG = {
        enableDevToolsDetection: true,
        enableRightClickBlock: true,
        enableTextSelectionBlock: true,
        enableDragBlock: true,
        enableIframeProtection: true,
        enableKeyboardShortcutsBlock: true,
        enableConsoleWarning: true,
        allowedOrigins: ['self'],
        checkInterval: 1500,
        devToolsThreshold: 160
    };

    const state = {
        devToolsOpen: false,
        lastWidth: window.outerWidth - window.innerWidth,
        lastHeight: window.outerHeight - window.innerHeight
    };

    function warn(message) {
        if (!CONFIG.enableConsoleWarning) return;
        console.warn('%c⚠ Seguridad', 'color: #f59e0b; font-weight: bold; font-size: 12px;', message);
    }

    function blockRightClick(e) {
        if (!CONFIG.enableRightClickBlock) return;
        e.preventDefault();
        warn('Clic derecho deshabilitado en esta aplicación.');
    }

    function blockTextSelection(e) {
        if (!CONFIG.enableTextSelectionBlock) return;
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
    }

    function blockDragStart(e) {
        if (!CONFIG.enableDragBlock) return;
        const target = e.target;
        const isImage = target.tagName === 'IMG';
        const isAnchor = target.tagName === 'A' && target.hasAttribute('download');
        if (isImage || isAnchor) {
            e.preventDefault();
            warn('Arrastrar y guardar recursos está deshabilitado.');
        }
    }

    function blockDownloads(e) {
        const target = e.target;
        const isAnchor = target.tagName === 'A';
        if (!isAnchor) return;

        const href = target.getAttribute('href') || '';
        const download = target.getAttribute('download') || '';

        const blockedExtensions = [
            '.pdf', '.json', '.csv', '.txt', '.zip', '.rar', '.exe', '.dmg',
            '.pkg', '.apk', '.ipa', '.doc', '.docx', '.xls', '.xlsx', '.ppt',
            '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.mp4',
            '.mp3', '.wav', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
            '.bmp', '.ico', '.tiff', '.psd', '.ai', '.eps', '.indd', '.raw',
            '.heic', '.heif', '.avif', '.jxl', '.7z', '.tar', '.gz', '.bz2',
            '.xz', '.zst', '.lz', '.lz4', '.lzma', '.lzo', '.rz', '.z', '.Z',
            '.tgz', '.tbz2', '.rpm', '.deb', '.iso', '.img', '.vhd', '.vmdk',
            '.vdi', '.qcow2', '.squashfs', '.appimage', '.flatpak', '.snap',
            '.msi', '.msp', '.cab', '.msu', '.dmg', '.app', '.xap', '.appx',
            '.appxbundle', '.msix', '.msixbundle', '.cer', '.crt', '.pem',
            '.p7b', '.p7c', '.p12', '.pfx', '.key', '.pub', '.asc', '.gpg',
            '.sig', '.sign', '.dsa', '.elgamal', '.rsa', '.ecdsa', '.ed25519',
            '.ssh', '.sshpub', '.ssh-rsa', '.ssh-dss', '.ecdsa-sha2',
            '.sk-ecdsa', '.sk-ed25519', '.ed25519-sk', '.ecdsa-sk'
        ];

        const hasBlockedExtension = blockedExtensions.some(ext => href.toLowerCase().endsWith(ext));

        if (hasBlockedExtension || download) {
            e.preventDefault();
            warn('Descarga de archivos bloqueada por seguridad.');
        }
    }

    function detectDevTools() {
        if (!CONFIG.enableDevToolsDetection) return;

        const width = window.outerWidth - window.innerWidth;
        const height = window.outerHeight - window.innerHeight;

        if (width > CONFIG.devToolsThreshold || height > CONFIG.devToolsThreshold) {
            if (!state.devToolsOpen) {
                state.devToolsOpen = true;
                warn('Herramientas de desarrollo detectadas.');
            }
        } else {
            state.devToolsOpen = false;
        }

        state.lastWidth = width;
        state.lastHeight = height;
    }

    function blockKeyboardShortcuts(e) {
        if (!CONFIG.enableKeyboardShortcutsBlock) return;

        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            warn('Atajo de teclado bloqueado.');
        }
    }

    function protectIframe() {
        if (!CONFIG.enableIframeProtection) return;
        if (window.top !== window.self) {
            window.top.location = window.self.location;
            warn('Intento de iframe detectado.');
        }
    }

    function init() {
        protectIframe();

        document.addEventListener('contextmenu', blockRightClick);
        document.addEventListener('selectstart', blockTextSelection);
        document.addEventListener('dragstart', blockDragStart);
        document.addEventListener('click', blockDownloads);
        document.addEventListener('keydown', blockKeyboardShortcuts);

        if (CONFIG.enableDevToolsDetection) {
            setInterval(detectDevTools, CONFIG.checkInterval);
        }

        console.log('%c🔒 Sistema de Seguridad Activo', 'color: #10b981; font-weight: bold; font-size: 14px;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();