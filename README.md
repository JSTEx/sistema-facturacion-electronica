# Sistema de Facturación Electrónica / Electronic Billing System

Aplicación web para gestión de facturas con autenticación en Firebase y panel de administración de usuarios.

Web app for invoice management with Firebase authentication and an admin user panel.

## URL pública / Public URL (GitHub Pages)

- Sitio / Site: [https://jstex.github.io/sistema-facturacion-electronica/](https://jstex.github.io/sistema-facturacion-electronica/)
- Login: [https://jstex.github.io/sistema-facturacion-electronica/pages/login.html](https://jstex.github.io/sistema-facturacion-electronica/pages/login.html)
- Admin: [https://jstex.github.io/sistema-facturacion-electronica/pages/admin.html](https://jstex.github.io/sistema-facturacion-electronica/pages/admin.html)

## Estructura del proyecto / Project Structure

```text
.
├── index.html
├── LICENSE
├── README.md
├── assets/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── anti-inspection.js
│   │   ├── app-utils.js
│   │   └── ui-utils.js
│   └── external/
│       ├── files/
│       ├── images/
│       └── videos/
├── config/
│   └── firebase-inicial.json
├── docs/
│   └── INSTRUCCIONES_FIREBASE.md
├── pages/
│   ├── admin.html
│   └── login.html
└── templates/
    ├── plantilla-base.html
    └── plantilla-formulario.html
```

## Notas / Notes

- Usa rutas relativas entre `index.html`, `pages/` y `assets/`.
- Use relative paths between `index.html`, `pages/`, and `assets/`.
- Para recursos multimedia nuevos, usa `assets/external/`.
- For new media resources, use `assets/external/`.
- Documentación Firebase / Firebase docs: `docs/INSTRUCCIONES_FIREBASE.md`.

## Ejecutar localmente / Run Locally

### Opción 1: Live Server (VS Code)

- Abre `index.html` y selecciona **Open with Live Server**.
- Open `index.html` and select **Open with Live Server**.

### Opción 2: Python HTTP Server

1. En la raíz del proyecto, ejecuta / From the project root, run:

```bash
python -m http.server 5500
```

1. Abre en el navegador / Open in your browser:

- `http://localhost:5500/`
- `http://localhost:5500/pages/login.html`

## Instalar librerías (CDN) / Install libraries (CDN)

Este proyecto es HTML/CSS/JS estático (sin `package.json`), así que la forma más simple es usar CDN.

This project is static HTML/CSS/JS (no `package.json`), so the easiest approach is using a CDN.

- Agrega el script en el `<head>` de `index.html` (o en la página donde lo usarás).
- Usa la librería desde `window` en tu JavaScript.

- Add the script in the `<head>` of `index.html` (or the specific page where it is used).
- Use the library from `window` in your JavaScript.

Ejemplo / Example (`anime.js`):

```html
<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
```

```js
if (window.anime) {
    window.anime({
        targets: '.mi-elemento',
        translateY: [0, -4, 0],
        duration: 1200,
        loop: true
    });
}
```

### Librerías recomendadas (CDN) / Recommended libraries (CDN)

| Librería / Library | Úsala para / Use it for | CDN (pegar en head) |
| --- | --- | --- |
| Anime.js | Animaciones UI (badges, notificaciones, transiciones) / UI animations (badges, notifications, transitions) | `<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>` |
| Chart.js | Gráficas de ventas, pagadas vs pendientes, reportes / Sales charts, paid vs pending, reports | `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` |
| IMask | Máscaras de input para dinero, NIT, teléfono / Input masks for currency, tax ID, phone | `<script src="https://cdn.jsdelivr.net/npm/imask"></script>` |
