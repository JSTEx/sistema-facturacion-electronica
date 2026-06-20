# Medidas de Seguridad Implementadas

## 📋 Resumen

Este documento describe las medidas de seguridad implementadas en el sistema de facturación electrónica para proteger contra inspección no autorizada, descargas de archivos y acceso a herramientas de desarrollo.

## 🔒 Medidas Anti-Inspección

### 1. Bloqueo de Clic Derecho
- **Función**: `blockRightClick()`
- **Descripción**: Deshabilita el menú contextual del navegador (clic derecho)
- **Propósito**: Evitar que usuarios accedan a opciones como "Inspeccionar elemento" o "Ver código fuente"
- **Mensaje**: "Clic derecho deshabilitado en esta aplicación."

### 2. Bloqueo de Selección de Texto
- **Función**: `blockTextSelection()`
- **Descripción**: Previene la selección de texto en la página
- **Excepciones**: Permite selección cuando se usan combinaciones Ctrl+C o Cmd+C (para copiar)
- **Propósito**: Dificultar la copia de contenido sensible

### 3. Bloqueo de Arrastrar y Soltar
- **Función**: `blockDragStart()`
- **Descripción**: Bloquea el arrastre de imágenes y enlaces con atributo `download`
- **Propósito**: Prevenir la extracción de recursos (imágenes, documentos)

### 4. Bloqueo de Descargas
- **Función**: `blockDownloads()`
- **Descripción**: Intercepta clics en enlaces y bloquea descargas de archivos
- **Extensiones Bloqueadas**: 80+ extensiones incluyendo:
  - **Documentos**: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .json
  - **Imágenes**: .jpg, .jpeg, .png, .gif, .svg, .webp, .bmp, .ico, .tiff, .psd, .raw
  - **Videos**: .mp4, .avi, .mov, .wmv, .flv, .mkv, .webm
  - **Audio**: .mp3, .wav
  - **Ejecutables**: .exe, .dmg, .pkg, .apk, .ipa, .msi, .app
  - **Comprimidos**: .zip, .rar, .7z, .tar, .gz, .bz2
  - **Certificados/Claves**: .pem, .key, .p12, .pfx, .cer, .crt
  - **SSH**: .ssh, .sshpub, .ssh-rsa, .ssh-dss
- **Propósito**: Evitar descarga no autorizada de archivos del sistema

### 5. Detección de Herramientas de Desarrollo (DevTools)
- **Función**: `detectDevTools()`
- **Descripción**: Detecta si las DevTools están abiertas monitoreando el tamaño de ventana
- **Umbral**: 160px de diferencia entre `outerWidth - innerWidth` o `outerHeight - innerHeight`
- **Intervalo**: Verificación cada 1.5 segundos
- **Propósito**: Alertar cuando un usuario intenta inspeccionar el código
- **Nota**: No bloquea las DevTools, solo detecta y advierte

### 6. Bloqueo de Atajos de Teclado
- **Función**: `blockKeyboardShortcuts()`
- **Combinaciones Bloqueadas**:
  - `F12` - Abre DevTools en la mayoría de navegadores
  - `Ctrl+Shift+I` o `Cmd+Shift+I` - Alternativa para abrir DevTools
  - `Ctrl+Shift+J` o `Cmd+Shift+J` - Alternativa para abrir consola
  - `Ctrl+U` o `Cmd+U` - Ver código fuente de la página
- **Propósito**: Prevenir acceso directo a herramientas de desarrollo

### 7. Protección contra Iframes
- **Función**: `protectIframe()`
- **Descripción**: Detecta si la página está cargada dentro de un iframe
- **Acción**: Redirige al padre si se detecta iframe
- **Propósito**: Prevenir clickjacking y carga no autorizada en sitios externos

### 8. Advertencias en Consola
- **Función**: `warn()`
- **Descripción**: Muestra advertencias estilizadas en la consola del navegador
- **Estilo**: Icono de advertencia ⚠ en color ámbar
- **Propósito**: Notificar al usuario sobre acciones bloqueadas

## 📁 Archivos Modificados

### Archivos Principales
- `assets/js/core/security.js` - Módulo principal de seguridad
- `index.html` - Página principal
- `pages/admin.html` - Panel de administración
- `pages/login.html` - Página de inicio de sesión
- `templates/plantilla-base.html` - Plantilla base
- `templates/plantilla-formulario.html` - Plantilla de formularios
- `sw.js` - Service Worker (incluye security.js en cache)

## ⚙️ Configuración

El módulo de seguridad es configurable a través del objeto `CONFIG`:

```javascript
const CONFIG = {
    enableDevToolsDetection: true,      // Detectar DevTools
    enableRightClickBlock: true,        // Bloquear clic derecho
    enableTextSelectionBlock: true,     // Bloquear selección de texto
    enableDragBlock: true,              // Bloquear arrastrar
    enableIframeProtection: true,       // Protección anti-iframes
    enableKeyboardShortcutsBlock: true, // Bloquear atajos de teclado
    enableConsoleWarning: true,         // Mostrar advertencias en consola
    allowedOrigins: ['self'],           // Orígenes permitidos
    checkInterval: 1500,                // Intervalo de verificación (ms)
    devToolsThreshold: 160              // Umbral de detección DevTools (px)
};
```

Para deshabilitar una medida, cambiar el valor a `false`.

## 🚀 Inicialización

El módulo se inicializa automáticamente cuando el DOM está listo:

```javascript
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

## 📊 Estado del Sistema

Al cargar, se muestra un mensaje en consola:
```
🔒 Sistema de Seguridad Activo
```

## ⚠️ Limitaciones

1. **Detección de DevTools**: No es 100% precisa, puede generar falsos positivos
2. **Ofuscación**: El código JavaScript sigue siendo accesible en el navegador
3. **Inspección de Red**: Las peticiones HTTP siguen siendo visibles en la pestaña Network
4. **Bypass**: Usuarios avanzados pueden deshabilitar JavaScript o modificar el código en tiempo de ejecución

## 🛡️ Recomendaciones Adicionales

Para mayor seguridad, considerar implementar:

1. **Ofuscación de código**: Usar herramientas como UglifyJS o Terser
2. **Minificación**: Reducir y ofuscar el código en producción
3. **Validación del lado del servidor**: Nunca confiar solo en validaciones del cliente
4. **HTTPS**: Siempre usar HTTPS en producción
5. **CSP (Content Security Policy)**: Implementar cabeceras de seguridad
6. **Rate Limiting**: Limitar intentos de acceso en el servidor
7. **Logs de seguridad**: Registrar intentos de acceso sospechosos

## 📝 Notas de Implementación

- El módulo usa una IIFE (Immediately Invoked Function Expression) para evitar contaminar el scope global
- Todos los eventos se registran en la fase de captura para máxima efectividad
- El código usa `'use strict'` para prevenir errores comunes
- Las extensiones bloqueadas se almacenan en un array para fácil mantenimiento

## 🔄 Historial de Cambios

### v1.0.0 (2026-06-19)
- Implementación inicial de medidas anti-inspección
- Bloqueo de clic derecho, selección de texto y arrastrar
- Detección de DevTools
- Bloqueo de atajos de teclado
- Protección contra iframes
- Lista de 80+ extensiones bloqueadas

## 📄 Licencia

Este módulo de seguridad es parte del sistema de facturación electrónica y está protegido bajo la misma licencia del proyecto.