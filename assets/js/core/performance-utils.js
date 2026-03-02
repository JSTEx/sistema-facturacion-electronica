function runLazyLoading(root = document) {
    const lazyElements = root.querySelectorAll('[data-src], [data-srcset], [data-poster], [data-bg-src]');
    if (!lazyElements.length) return;

    const applySource = (element) => {
        if (element.dataset.src) {
            element.setAttribute('src', element.dataset.src);
            element.removeAttribute('data-src');
        }
        if (element.dataset.srcset) {
            element.setAttribute('srcset', element.dataset.srcset);
            element.removeAttribute('data-srcset');
        }
        if (element.dataset.poster) {
            element.setAttribute('poster', element.dataset.poster);
            element.removeAttribute('data-poster');
        }
        if (element.dataset.bgSrc) {
            element.style.backgroundImage = `url("${element.dataset.bgSrc}")`;
            element.removeAttribute('data-bg-src');
        }
        element.classList.add('lazy-loaded');
    };

    if (!('IntersectionObserver' in window)) {
        lazyElements.forEach(applySource);
        return;
    }

    const observer = new IntersectionObserver((entries, lazyObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            applySource(entry.target);
            lazyObserver.unobserve(entry.target);
        });
    }, {
        root: null,
        rootMargin: '150px 0px',
        threshold: 0.01
    });

    lazyElements.forEach((element) => observer.observe(element));
}

function applyNativeLazyLoadingHints(root = document) {
    root.querySelectorAll('img:not([loading])').forEach((img) => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
    });

    root.querySelectorAll('iframe:not([loading])').forEach((iframe) => {
        iframe.setAttribute('loading', 'lazy');
    });
}

function createSkeletonRows(options = {}) {
    const count = Number(options.count) || 5;
    const columns = Number(options.columns) || 4;
    return Array.from({ length: count }).map(() => {
        const cells = Array.from({ length: columns }).map(() => '<td class="p-2"><div class="skeleton-line"></div></td>').join('');
        return `<tr class="skeleton-row">${cells}</tr>`;
    }).join('');
}

function createSkeletonCards(options = {}) {
    const count = Number(options.count) || 6;
    return Array.from({ length: count }).map(() => `
        <div class="invoice-skeleton-card">
            <div class="skeleton-line w-1\/2 mb-2"></div>
            <div class="skeleton-line w-1\/3 mb-4"></div>
            <div class="skeleton-line w-2\/3 mb-2"></div>
            <div class="skeleton-line w-1\/3"></div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function () {
    applyNativeLazyLoadingHints(document);
    runLazyLoading(document);
});

window.runLazyLoading = runLazyLoading;
window.applyNativeLazyLoadingHints = applyNativeLazyLoadingHints;
window.createSkeletonRows = createSkeletonRows;
window.createSkeletonCards = createSkeletonCards;
