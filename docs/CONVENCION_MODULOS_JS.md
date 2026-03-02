# Convención de módulos JavaScript

Este documento define cómo organizar el JavaScript del proyecto para mantener una estructura clara y escalable.

## 1) Estructura base

- `assets/js/core/` → utilidades globales reutilizables en varias páginas.
- `assets/js/index/` → lógica específica de `index.html`.
- `assets/js/admin/` → lógica específica de `pages/admin.html` (actualmente estable en `main.js`).
- `assets/js/login/` → lógica específica de `pages/login.html`.

## 2) Regla principal

Separar por **funcionalidad**, no por tamaño arbitrario.

Ejemplos:

- autenticación / permisos
- estado y datos
- render de tabla/listado
- formularios y validación
- eventos de UI
- importación/exportación

## 3) Convención de nombres

Usar nombres descriptivos con guiones:

- `access-control-auth.js`
- `invoices-store-and-draft.js`
- `invoices-form-and-validation.js`
- `invoices-list-and-pagination.js`
- `invoices-actions-and-events.js`
- `main.js` (excepción temporal para `admin`, por estabilidad)

## 4) Orden de carga en HTML

La carga debe respetar dependencias:

1. librerías externas (`SweetAlert`, `anime`, `Firebase`, etc.)
2. `assets/js/core/*`
3. módulos de página de menor a mayor dependencia
4. `assets/js/anti-inspection.js`

Si un módulo usa funciones/variables globales de otro, debe cargarse después.

Nota: en el panel de administración (`pages/admin.html`) se mantiene `assets/js/admin/main.js` como fuente única estable para evitar regresiones de carga.

## 5) Estado global (window)

Cuando sea necesario compartir estado entre módulos, usar un único objeto global por página.

Ejemplos:

- `window.adminState`
- `window.adminData`

Evitar crear variables globales sueltas nuevas sin necesidad.

## 6) Checklist antes de cerrar cambios

- [ ] No quedan scripts inline grandes en HTML.
- [ ] No quedan archivos obsoletos sin uso.
- [ ] Las rutas en `<script src="...">` están actualizadas.
- [ ] `get_errors` sin errores en archivos modificados.
- [ ] Nombres de archivo reflejan claramente su responsabilidad.

## 7) Regla para cambios futuros

Si un archivo supera una responsabilidad clara (por ejemplo mezcla render + validación + eventos), dividirlo en módulos más específicos y actualizar el orden de carga del HTML correspondiente.
