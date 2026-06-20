# Vercel Analytics - Implementación

## 📋 Resumen

Este documento describe la implementación de Vercel Analytics en el sistema de facturación electrónica para rastrear visitas de usuarios y eventos importantes.

## 🚀 Características

### Tracking Automático
- **Page Views**: Rastrea automáticamente las vistas de página
- **SPA Routing**: Detecta cambios de ruta en aplicaciones de página única
- **Navegación**: Intercepta clics en enlaces internos para trackear navegación

### API de Eventos Personalizados
- `Analytics.trackPageView(path)` - Trackear página vista manualmente
- `Analytics.trackEvent(name, data)` - Trackear evento personalizado
- `Analytics.trackClick(elementName, data)` - Trackear clics en elementos
- `Analytics.trackFormSubmit(formName, data)` - Trackear envíos de formularios
- `Analytics.trackError(errorName, errorMessage, data)` - Trackear errores

### Configuración Flexible
- Modo debug para desarrollo
- Auto-tracking configurable
- Tracking de page views opcional

## 📦 Instalación

```bash
npm install @vercel/analytics
```

> **Nota**: El paquete se instaló pero se adaptó para HTML/JS vanilla en lugar de Next.js.

## 📁 Archivos Creados/Modificados

### Archivos Nuevos
- `assets/js/core/analytics.js` - Módulo principal de analytics

### Archivos Modificados
- `index.html` - Integrado analytics.js
- `pages/admin.html` - Integrado analytics.js
- `pages/login.html` - Integrado analytics.js
- `templates/plantilla-base.html` - Integrado analytics.js
- `templates/plantilla-formulario.html` - Integrado analytics.js
- `sw.js` - Agregado analytics.js al cache del Service Worker

## ⚙️ Configuración

El módulo se configura a través del objeto `CONFIG`:

```javascript
const CONFIG = {
    scriptSrc: 'https://cdn.vercel-insights.com/script.js',
    debug: false,              // Modo debug (logs en consola)
    autoTrack: true,           // Tracking automático de page views
    trackPageViews: true,      // Habilitar tracking de páginas
    trackOutboundLinks: false  // Tracking de enlaces externos
};
```

## 🔧 Uso

### Inicialización Automática
El módulo se inicializa automáticamente cuando el DOM está listo:

```javascript
// No requiere configuración adicional
// Se ejecuta automáticamente al cargar la página
```

### Uso Manual

```javascript
// Verificar si está listo
if (Analytics.isReady()) {
    console.log('Analytics está activo');
}

// Trackear página vista personalizada
Analytics.trackPageView('/ruta-personalizada');

// Trackear evento personalizado
Analytics.trackEvent('button_click', {
    buttonId: 'submitBtn',
    page: 'invoice-form'
});

// Trackear clic en elemento
Analytics.trackClick('new_invoice_button');

// Trackear envío de formulario
Analytics.trackFormSubmit('invoice_form', {
    invoiceCount: 3,
    totalAmount: 1500.00
});

// Trackear error
Analytics.trackError('firebase_error', 'Error al guardar factura', {
    userId: 'user@example.com'
});

// Habilitar modo debug
Analytics.setDebug(true);
```

## 📊 Eventos Trackeados Automáticamente

### Page Views
- **Inicial**: Al cargar la página
- **Navegación**: Al hacer clic en enlaces internos
- **Historial**: Al usar botones atrás/adelante del navegador
- **Hash changes**: Para SPAs con hash routing

### Rutas Trackeadas
- `/` - Página principal (index.html)
- `/pages/historial.html` - Historial de facturas
- `/pages/admin.html` - Panel de administración
- `/pages/login.html` - Página de login
- Cualquier ruta personalizada

## 🎯 Eventos Recomendados para Trackear

### En la Página Principal (index.html)
```javascript
// Al crear una factura
Analytics.trackFormSubmit('invoice_created', {
    invoiceNumber: 8420,
    client: 'Cliente Ejemplo',
    total: 1500.00
});

// Al exportar datos
Analytics.trackClick('export_button');

// Al importar datos
Analytics.trackClick('import_button');

// Al buscar facturas
Analytics.trackEvent('search_invoices', {
    searchTerm: 'factura 123'
});

// Al filtrar facturas
Analytics.trackEvent('filter_invoices', {
    filterType: 'paid'
});
```

### En la Página de Login (pages/login.html)
```javascript
// Login exitoso
Analytics.trackEvent('login_success', {
    email: 'user@example.com'
});

// Login fallido
Analytics.trackEvent('login_failed', {
    email: 'user@example.com',
    reason: 'invalid_password'
});
```

### En el Panel de Admin (pages/admin.html)
```javascript
// Al crear usuario
Analytics.trackFormSubmit('user_created', {
    role: 'admin'
});

// Al eliminar usuario
Analytics.trackEvent('user_deleted', {
    userId: 'user@example.com'
});

// Al exportar usuarios
Analytics.trackClick('export_users');

// Al importar usuarios
Analytics.trackClick('import_users');
```

## 🔍 Modo Debug

Para activar el modo debug durante desarrollo:

```javascript
// En la consola del navegador
Analytics.setDebug(true);
```

Esto mostrará logs en consola con el prefijo `[Analytics]` en color azul:

```
[Analytics] Inicializando Vercel Analytics...
[Analytics] Script de Vercel Analytics cargado exitosamente
[Analytics] Auto-tracking de page views configurado
[Analytics] Page view trackeada: /
```

## 🌐 Despliegue en Vercel

### Paso 1: Habilitar Web Analytics en Vercel

1. Ir al dashboard de Vercel
2. Navegar a **Analytics** en la barra lateral
3. Seleccionar el proyecto
4. Hacer clic en **Enable** en el header

> **Nota**: Habilitar Web Analytics agregará nuevas rutas:
> - `/_vercel/insights/*` - Endpoint de insights
> - `/<unique-path>/*` - Endpoint de datos

### Paso 2: Desplegar la Aplicación

```bash
vercel deploy
```

O si tienes el repositorio conectado:

```bash
git push origin main
```

### Paso 3: Verificar Funcionamiento

1. Abrir la aplicación en el navegador
2. Ir a la pestaña **Network** en DevTools
3. Buscar peticiones a `/_vercel/insights/` o `/api/insights/`
4. Deberías ver peticiones `Fetch/XHR` exitosas

### Paso 4: Ver Datos en Dashboard

1. Ir a **Analytics** en el dashboard de Vercel
2. Verás:
   - **Page Views**: Número de visitas por página
   - **Unique Visitors**: Visitantes únicos
   - **Top Pages**: Páginas más visitadas
   - **Referrers**: Sitios de origen
   - **Countries**: Distribución geográfica
   - **Browsers**: Navegadores utilizados
   - **Devices**: Dispositivos (mobile/desktop)

## 📈 Métricas Disponibles

### Page Views
- Vistas totales por página
- Tendencias temporales (últimas 24h, 7 días, 30 días)
- Páginas más populares

### Visitantes
- Visitantes únicos
- Visitantes recurrentes
- Tasa de retención

### Rendimiento
- Tiempo de carga promedio
- Core Web Vitals (LCP, FID, CLS)

### Tecnología
- Navegadores más usados
- Sistemas operativos
- Tipos de dispositivo

## 🔒 Consideraciones de Privacidad

### Datos Recopilados
Vercel Analytics recopila:
- **URLs**: Rutas visitadas
- **Referrer**: Sitio de origen
- **User Agent**: Navegador y sistema operativo
- **Country**: País aproximado por IP
- **Device Type**: Mobile/Desktop/Tablet

### Datos NO Recopilados
- Información personal identificable (PII)
- Direcciones IP exactas
- Cookies de seguimiento
- Datos de formularios

### Cumplimiento
- **GDPR**: Compatible (no requiere consentimiento de cookies)
- **CCPA**: Compatible
- **LGPD**: Compatible

## 🛠️ Troubleshooting

### No aparecen datos en el dashboard

1. **Verificar que Analytics esté habilitado en Vercel**
   - Ir a Settings → Analytics
   - Confirmar que el botón dice "Enabled"

2. **Verificar que el script se cargue**
   - Abrir DevTools → Network
   - Buscar `cdn.vercel-insights.com/script.js`
   - Debe tener status 200

3. **Verificar peticiones de tracking**
   - En Network, filtrar por "insights"
   - Deberías ver peticiones POST a `/_vercel/insights/`

4. **Esperar propagación**
   - Los datos pueden tardar hasta 24 horas en aparecer
   - El dashboard muestra datos en tiempo real para page views

### El script no se carga

1. **Verificar conexión a internet**
   - El script se carga desde CDN
   - Requiere conexión a `cdn.vercel-insights.com`

2. **Verificar CSP (Content Security Policy)**
   - Si usas CSP, agregar:
   ```
   script-src 'self' https://cdn.vercel-insights.com;
   ```

3. **Verificar AdBlockers**
   - Algunos adblockers bloquean analytics
   - Probar en modo incógnito sin extensiones

### Errores en consola

```javascript
// Error: "Vercel Analytics no está disponible"
// Solución: Verificar que el script se cargue correctamente

// Error: "Analytics no está inicializado"
// Solución: El script tarda en cargar, usar Analytics.isReady() antes de trackear
```

## 📝 Notas de Implementación

### Adaptación para HTML/JS Vanilla
El paquete `@vercel/analytics` está diseñado para Next.js, pero se adaptó para funcionar en proyectos HTML/JS vanilla:

1. **Carga de Script**: Se carga dinámicamente desde CDN
2. **Auto-tracking**: Se implementó manualmente para detectar cambios de ruta
3. **API**: Se wrappeó en un módulo IIFE para evitar contaminar el scope global
4. **Inicialización**: Auto-inicialización cuando el DOM está listo

### Diferencias con Next.js
| Característica | Next.js | HTML/JS Vanilla |
|----------------|---------|------------------|
| Instalación | `npm install @vercel/analytics` | Igual |
| Componente | `<Analytics />` | No aplica |
| Inicialización | Automática | Automática (DOMContentLoaded) |
| Routing | Automático (App Router) | Manual (popstate, hashchange) |
| API | `va()` global | `Analytics.trackEvent()` |

## 🔄 Historial de Cambios

### v1.0.0 (2026-06-19)
- Implementación inicial de Vercel Analytics
- Módulo `analytics.js` adaptado para HTML/JS vanilla
- Integración en todas las páginas del proyecto
- Auto-tracking de page views
- API de eventos personalizados
- Modo debug para desarrollo
- Actualización de Service Worker

## 📚 Referencias

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Vercel Analytics Dashboard](https://vercel.com/docs/analytics/dashboard)
- [Privacy Policy](https://vercel.com/docs/analytics/privacy)

## 📄 Licencia

Este módulo de analytics es parte del sistema de facturación electrónica y está protegido bajo la misma licencia del proyecto.