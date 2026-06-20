/**
 * Módulo de Analytics para Vercel Web Analytics
 * Integración oficial para proyectos HTML/JavaScript vanilla
 * 
 * Este módulo carga el script de Vercel Analytics y proporciona
 * una API para trackear eventos personalizados.
 * 
 * @module analytics
 * @version 2.0.0
 */

const Analytics = (function() {
    'use strict';

    // Configuración
    const CONFIG = {
        // Script source - Vercel automáticamente sirve el script en esta ruta
        // cuando el proyecto está desplegado en Vercel
        scriptSrc: '/_vercel/insights/script.js',
        // Para desarrollo local, usamos el script de debug
        debugScriptSrc: 'https://va.vercel-scripts.com/v1/script.debug.js',
        debug: false,
        isProduction: typeof window !== 'undefined' && 
                      (window.location.hostname.includes('vercel.app') || 
                       window.location.hostname.includes('vercel.com') ||
                       !window.location.hostname.includes('localhost'))
    };

    // Estado
    let isInitialized = false;
    let scriptElement = null;

    /**
     * Inicializa la cola de eventos de Vercel Analytics
     * Esto permite que los eventos se capturen incluso antes de que el script se cargue
     */
    function initQueue() {
        if (window.va) return;
        
        window.va = function va(...params) {
            (window.vaq = window.vaq || []).push(params);
        };
    }

    /**
     * Inicializa Vercel Analytics
     * Carga el script de forma asíncrona desde Vercel
     */
    function init(config = {}) {
        if (isInitialized) {
            log('Analytics ya está inicializado');
            return;
        }

        log('Inicializando Vercel Web Analytics...');

        // Actualizar configuración si se proporciona
        if (config.debug !== undefined) {
            CONFIG.debug = config.debug;
        }

        // Inicializar la cola de eventos
        initQueue();

        // Determinar qué script cargar
        const scriptSrc = CONFIG.isProduction ? CONFIG.scriptSrc : CONFIG.debugScriptSrc;
        
        // Evitar cargar el script múltiples veces
        if (document.head.querySelector(`script[src*="${scriptSrc}"]`)) {
            log('Script de analytics ya está cargado');
            isInitialized = true;
            return;
        }

        // Crear y configurar el script
        scriptElement = document.createElement('script');
        scriptElement.src = scriptSrc;
        scriptElement.defer = true;
        
        // Agregar atributos data- para configuración
        scriptElement.setAttribute('data-sdk-name', '@vercel/analytics');
        scriptElement.setAttribute('data-sdk-version', '2.0.1');

        // Manejar carga exitosa
        scriptElement.onload = function() {
            isInitialized = true;
            log('Script de Vercel Analytics cargado exitosamente');
        };

        // Manejar errores de carga
        scriptElement.onerror = function() {
            const errorMessage = CONFIG.isProduction 
                ? 'Asegúrate de habilitar Web Analytics en tu proyecto Vercel. Ver: https://vercel.com/docs/analytics/quickstart'
                : 'No se pudo cargar el script de analytics. Verifica tu conexión o bloqueos de anuncios.';
            
            log(`Error al cargar el script de Vercel Analytics. ${errorMessage}`, 'error');
        };

        // Agregar el script al head
        document.head.appendChild(scriptElement);
        log('Script de Vercel Analytics agregado al DOM');
    }

    /**
     * Trackea una vista de página
     * @param {Object} options - Opciones del pageview
     * @param {string} [options.route] - Ruta de la página
     * @param {string} [options.path] - Path de la página
     */
    function trackPageView(options = {}) {
        if (!window.va) {
            log('Función va() no disponible. Asegúrate de que Analytics esté inicializado.', 'warn');
            return;
        }

        try {
            const path = options.path || getCurrentPath();
            const route = options.route || path;
            
            window.va('pageview', { route, path });
            log('Page view trackeada:', route);
        } catch (error) {
            log('Error al trackear page view:', error, 'error');
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
     * @param {Object} [properties] - Propiedades del evento (solo valores primitivos: string, number, boolean, null)
     * 
     * Nota: Los eventos personalizados requieren que el proyecto tenga habilitado
     * el plan de Analytics con Custom Events en Vercel.
     */
    function trackEvent(name, properties) {
        if (!window.va) {
            log('Función va() no disponible. Asegúrate de que Analytics esté inicializado.', 'warn');
            return;
        }

        try {
            // Validar propiedades (solo primitivos permitidos)
            if (properties) {
                const validatedProps = {};
                for (const [key, value] of Object.entries(properties)) {
                    if (typeof value === 'object' && value !== null) {
                        log(`Propiedad "${key}" ignorada: Los objetos anidados no están permitidos`, 'warn');
                    } else {
                        validatedProps[key] = value;
                    }
                }
                
                window.va('event', { name, data: validatedProps });
                log('Evento trackeado:', name, validatedProps);
            } else {
                window.va('event', { name });
                log('Evento trackeado:', name);
            }
        } catch (error) {
            log('Error al trackear evento:', error, 'error');
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
     * Configura un hook beforeSend para filtrar o modificar eventos antes de enviarlos
     * @param {Function} callback - Función que recibe el evento y retorna el evento modificado o null para cancelarlo
     */
    function beforeSend(callback) {
        if (!window.va) {
            log('Función va() no disponible. Asegúrate de que Analytics esté inicializado.', 'warn');
            return;
        }

        try {
            window.va('beforeSend', callback);
            log('beforeSend hook configurado');
        } catch (error) {
            log('Error al configurar beforeSend:', error, 'error');
        }
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
        return isInitialized && typeof window.va !== 'undefined';
    }

    /**
     * Log interno para debugging
     * @param {...any} args - Argumentos a loguear
     */
    function log(...args) {
        if (!CONFIG.debug) return;
        
        const level = typeof args[args.length - 1] === 'string' && 
                     ['error', 'warn', 'info'].includes(args[args.length - 1]) 
                     ? args.pop() 
                     : 'log';
        
        console[level]('%c[Vercel Analytics]', 'color: #0070f3; font-weight: bold;', ...args);
    }

    // API pública
    return {
        init: init,
        trackPageView: trackPageView,
        trackEvent: trackEvent,
        trackClick: trackClick,
        trackFormSubmit: trackFormSubmit,
        trackError: trackError,
        beforeSend: beforeSend,
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

// Hacer disponible globalmente
window.Analytics = Analytics;

// Exportar para uso en módulos ES6 (si aplica)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}
