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
