/**
 * Módulo de Analytics para Vercel
 * Adaptado para proyectos HTML/JS vanilla (no Next.js)
 * 
 * @module analytics
 * @version 1.0.0
 */

const Analytics = (function() {
    'use strict';

    // Configuración
    const CONFIG = {
        scriptSrc: 'https://cdn.vercel-insights.com/script.js',
        debug: false,
        autoTrack: true,
        trackPageViews: true,
        trackOutboundLinks: false
    };

    // Estado
    let isInitialized = false;
    let scriptElement = null;

    /**
     * Inicializa Vercel Analytics
     * Carga el script de forma asíncrona
     */
    function init() {
        if (isInitialized) {
            log('Analytics ya está inicializado');
            return;
        }

        log('Inicializando Vercel Analytics...');

        // Crear elemento script
        scriptElement = document.createElement('script');
        scriptElement.src = CONFIG.scriptSrc;
        scriptElement.async = true;
        scriptElement.defer = true;

        // Manejar carga exitosa
        scriptElement.onload = function() {
            log('Script de Vercel Analytics cargado exitosamente');
            isInitialized = true;

            // Auto-track page views si está habilitado
            if (CONFIG.autoTrack && CONFIG.trackPageViews) {
                setupAutoTracking();
            }
        };

        // Manejar error de carga
        scriptElement.onerror = function() {
            log('Error al cargar el script de Vercel Analytics', 'error');
        };

        // Agregar script al head
        document.head.appendChild(scriptElement);

        log('Script de Vercel Analytics agregado al DOM');
    }

    /**
     * Configura el tracking automático de page views
     * Escucha cambios en el historial del navegador (SPA routing)
     */
    function setupAutoTracking() {
        // Track inicial
        trackPageView();

        // Track cambios de ruta (popstate para navegación con historial)
        window.addEventListener('popstate', function() {
            trackPageView();
        });

        // Track cambios de hash (para SPAs con hash routing)
        window.addEventListener('hashchange', function() {
            trackPageView();
        });

        // Interceptar clicks en enlaces para trackear navegación
        document.addEventListener('click', function(event) {
            const link = event.target.closest('a');
            if (link && isInternalLink(link)) {
                // Pequeño delay para asegurar que la navegación ocurra
                setTimeout(trackPageView, 100);
            }
        });

        log('Auto-tracking de page views configurado');
    }

    /**
     * Verifica si un enlace es interno (del mismo dominio)
     * @param {HTMLAnchorElement} link - Elemento de enlace
     * @returns {boolean} True si es un enlace interno
     */
    function isInternalLink(link) {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('//')) {
            return false;
        }
        return true;
    }

    /**
     * Trackea una página vista
     * @param {string} [path] - Ruta personalizada (opcional)
     */
    function trackPageView(path) {
        if (!isInitialized) {
            log('Analytics no está inicializado. No se puede trackear page view.', 'warn');
            return;
        }

        const pagePath = path || getCurrentPath();
        
        // Vercel Analytics detecta automáticamente los page views,
        // pero podemos forzar un trackeo si es necesario
        if (typeof window.va !== 'undefined') {
            window.va('pageview', pagePath);
            log('Page view trackeada:', pagePath);
        } else {
            log('Vercel Analytics no está disponible', 'warn');
        }
    }

    /**
     * Obtiene la ruta actual de la página
     * @returns {string} Ruta actual
     */
    function getCurrentPath() {
        // Para SPAs con hash routing
        if (window.location.hash) {
            return window.location.hash.substring(1) || '/';
        }
        // Para rutas normales
        return window.location.pathname || '/';
    }

    /**
     * Trackea un evento personalizado
     * @param {string} name - Nombre del evento
     * @param {Object} [data] - Datos adicionales del evento
     */
    function trackEvent(name, data) {
        if (!isInitialized) {
            log('Analytics no está inicializado. No se puede trackear evento.', 'warn');
            return;
        }

        if (typeof window.va !== 'undefined') {
            window.va('event', {
                name: name,
                data: data || {}
            });
            log('Evento trackeado:', name, data);
        } else {
            log('Vercel Analytics no está disponible', 'warn');
        }
    }

    /**
     * Trackea un evento de clic
     * @param {string} elementName - Nombre del elemento clickeado
     * @param {Object} [data] - Datos adicionales
     */
    function trackClick(elementName, data) {
        trackEvent('click', {
            element: elementName,
            ...data
        });
    }

    /**
     * Trackea un evento de formulario
     * @param {string} formName - Nombre del formulario
     * @param {Object} [data] - Datos adicionales
     */
    function trackFormSubmit(formName, data) {
        trackEvent('form_submit', {
            form: formName,
            ...data
        });
    }

    /**
     * Trackea un error
     * @param {string} errorName - Nombre del error
     * @param {string} [errorMessage] - Mensaje de error
     * @param {Object} [data] - Datos adicionales
     */
    function trackError(errorName, errorMessage, data) {
        trackEvent('error', {
            error: errorName,
            message: errorMessage,
            ...data
        });
    }

    /**
     * Habilita/deshabilita el modo debug
     * @param {boolean} enabled - Estado del debug
     */
    function setDebug(enabled) {
        CONFIG.debug = enabled;
        log('Modo debug:', enabled ? 'activado' : 'desactivado');
    }

    /**
     * Verifica si Analytics está inicializado
     * @returns {boolean} Estado de inicialización
     */
    function isReady() {
        return isInitialized;
    }

    /**
     * Log interno para debugging
     * @param {...any} args - Argumentos a loguear
     */
    function log(...args) {
        if (CONFIG.debug) {
            console.log('%c[Analytics]', 'color: #0070f3; font-weight: bold;', ...args);
        }
    }

    // API pública
    return {
        init: init,
        trackPageView: trackPageView,
        trackEvent: trackEvent,
        trackClick: trackClick,
        trackFormSubmit: trackFormSubmit,
        trackError: trackError,
        setDebug: setDebug,
        isReady: isReady,
        getCurrentPath: getCurrentPath
    };
})();

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Analytics.init();
        });
    } else {
        Analytics.init();
    }
}

// Exportar para uso en módulos ES6 (si aplica)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}