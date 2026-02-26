# Configuración Firebase - Autenticación y Seguridad

## ✅ Implementación completada

El sistema usa **Firebase Email/Password Authentication** para login y control de acceso.

## 📋 Pasos de configuración

### 1) Habilitar Email/Password en Firebase

1. Ve a Firebase Console.
2. Abre tu proyecto: **facturacionelectronica-c2155**.
3. En **Authentication** → **Sign-in method**.
4. Activa **Email/Password** y guarda.

### 2) Crear usuario admin inicial

#### Opción A (recomendada): desde Firebase Console

1. Ve a **Authentication** → **Users**.
2. Crea un usuario:

   - Email: `admin@admin.com`
   - Password: `admin123` (cámbiala luego)

Luego agrega ese usuario en Realtime Database dentro de `users`:

```json
{
  "users": [
    {
      "email": "admin@admin.com",
      "role": "admin"
    }
  ]
}
```

### 3) Reglas de Realtime Database

En **Realtime Database** → **Rules**, publica:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "invoices": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "adminAudit": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🔐 Flujo actual

- `pages/login.html`: autentica con Firebase Auth.
- `index.html`: requiere sesión válida para gestionar facturas.
- `pages/admin.html`: requiere sesión y rol `admin`.

## ⚠️ Migración de usuarios antiguos

Si tenías usuarios del esquema anterior:

1. Debes crearlos nuevamente desde `pages/admin.html` o Firebase Console.
2. Verifica que también existan en `users` con su `role`.

## 🧪 Pruebas rápidas

1. Inicia sesión con admin.
2. Crea un usuario nuevo desde `pages/admin.html`.
3. Verifica acceso:

   - Usuario normal → `index.html`
   - Admin → `pages/admin.html`

4. Confirma que sin sesión redirige a `pages/login.html`.

## 🆘 Errores comunes

- `auth/invalid-credential`: credenciales inválidas o usuario no existe en Auth.
- `Permission denied`: reglas de Realtime Database no publicadas correctamente.
- Login exitoso pero sin acceso: falta el usuario en `/users` o no tiene `role`.
