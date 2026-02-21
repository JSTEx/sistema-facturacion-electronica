# Configuración Firebase - Autenticación y Seguridad

## ✅ Implementación Completada

Se ha implementado **Firebase Email/Password Authentication** en tu sistema de facturación. Ahora los usuarios se autentican de forma segura usando Firebase Authentication.

---

## 📋 Pasos para Completar la Configuración

### 1. Habilitar Email/Password Authentication en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **facturacionelectronica-c2155**
3. En el menú lateral, ve a **Authentication** (Autenticación)
4. Ve a la pestaña **Sign-in method** (Método de inicio de sesión)
5. Haz clic en **Email/Password**
6. **Activa** el interruptor para habilitar Email/Password
7. Haz clic en **Guardar**

---

### 2. Crear Usuario Admin Inicial

Como ya no usamos SHA-256, necesitas crear el usuario admin manualmente:

**Opción A: Desde Firebase Console**
1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user**
3. Email: `admin@admin.com`
4. Password: `admin123` (cámbiala después)
5. Haz clic en **Add user**

**Opción B: Desde el código (temporal)**
Puedes agregar temporalmente este código en login.html después de ensureDefaultAdmin():
```javascript
// SOLO PARA CREAR ADMIN INICIAL - ELIMINAR DESPUÉS
window.firebaseCreateUser = window.firebaseSignIn; // import createUserWithEmailAndPassword
window.firebaseCreateUser(window.firebaseAuth, 'admin@admin.com', 'admin123')
    .then(() => console.log('Admin creado'))
    .catch(e => console.log('Error o ya existe:', e.message));
```

Después de crear el admin, **agrega manualmente** este usuario a la base de datos:
1. Ve a **Realtime Database** en Firebase Console
2. En la raíz, crea/edita el nodo `users`
3. Agrega:
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

---

### 3. Actualizar Reglas de Seguridad de Realtime Database

Para habilitar las **reglas estrictas** que requieren autenticación:

1. Ve a **Realtime Database** en Firebase Console
2. Haz clic en la pestaña **Rules** (Reglas)
3. Reemplaza las reglas actuales con estas:

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

4. Haz clic en **Publish** (Publicar)

---

## 🔐 Cómo Funciona Ahora

### Autenticación
- Los usuarios se autentican con Firebase Authentication
- Las contraseñas se almacenan de forma segura en Firebase (no en tu base de datos)
- Solo usuarios autenticados pueden acceder a los datos

### Gestión de Usuarios desde Admin
- ✅ **Crear usuarios**: Se crean tanto en Firebase Auth como en la base de datos
- ✅ **Editar roles**: Solo se modifica el rol en la base de datos
- ⚠️ **Eliminar usuarios**: Solo se eliminan de la base de datos (quedan en Firebase Auth)
- ℹ️ **Cambiar contraseñas**: Los usuarios deben cambiarlas desde Firebase Auth

### Limitaciones del Frontend
Como esto es una aplicación frontend (GitHub Pages), hay limitaciones:
- No se pueden eliminar usuarios de Firebase Auth desde admin (requiere Admin SDK en backend)
- No se pueden resetear contraseñas desde admin (requiere Cloud Functions)

**Soluciones**:
1. Los usuarios pueden resetear su contraseña usando Firebase Auth
2. Los admins pueden eliminar usuarios de Firebase Auth desde la consola de Firebase

---

## 🚀 Flujo de Usuario

1. **Login**: Usuario ingresa email/password → Firebase valida → Se carga el role desde la base de datos
2. **Crear factura**: Solo usuarios autenticados pueden crear/editar
3. **Logout**: Cierra sesión en Firebase Auth y limpia localStorage
4. **Admin crea usuario**: Se registra en Firebase Auth + se guarda role en base de datos
5. **Verificación**: Todas las páginas verifican que el usuario esté autenticado con Firebase

---

## ⚠️ Importante

### Seguridad
- Con las nuevas reglas, **solo usuarios autenticados** podrán leer/escribir datos
- Los usuarios no autenticados serán redirigidos automáticamente al login
- Firebase Auth maneja la seguridad de las contraseñas

### Migración de Usuarios Existentes
Si tenías usuarios con el sistema anterior (SHA-256):
1. Estos usuarios **ya no funcionarán** porque Firebase Auth no los tiene registrados
2. Debes crear cada usuario nuevamente desde admin.html
3. Los usuarios usarán el nuevo email/password registrado en Firebase

### Testing
1. Prueba crear un usuario admin desde Firebase Console
2. Inicia sesión con ese usuario
3. Crea otros usuarios desde admin.html
4. Verifica que solo usuarios autenticados puedan acceder a index.html y admin.html

---

## 📝 Resumen de Cambios

### login.html
- Ahora usa `signInWithEmailAndPassword` de Firebase Auth
- Verifica la autenticación de Firebase antes de permitir acceso
- Carga el role del usuario desde Realtime Database

### admin.html
- Los nuevos usuarios se crean en Firebase Auth automáticamente
- Ya no se hashean contraseñas (Firebase lo maneja)
- Solo se puede editar el role de usuarios, no sus contraseñas
- Al eliminar, solo se quita de la base de datos (no de Firebase Auth)

### index.html
- Verifica que el usuario esté autenticado con Firebase
- Cierra sesión correctamente usando `signOut()`

---

## 🆘 Solución de Problemas

**Error: "No hay usuario admin configurado"**
→ Crea el usuario admin según las instrucciones del paso 2

**Error: "auth/invalid-credential"**
→ El email/password son incorrectos o el usuario no existe en Firebase Auth

**Error: "Permission denied"**
→ Las reglas de Firebase aún no están actualizadas. Ve al paso 3

**No puedo acceder después de login**
→ Verifica que el usuario exista tanto en Firebase Auth como en `/users` de Realtime Database con un role asignado

---

## 🎯 Próximos Pasos Opcionales

Para una solución más completa, considera:
1. **Firebase Cloud Functions**: Para eliminar usuarios de Firebase Auth desde admin
2. **Password Reset**: Implementar recuperación de contraseña por email
3. **Email Verification**: Requerir verificación de email al crear usuarios
4. **Reglas más granulares**: Permitir que usuarios solo vean sus propias facturas

---

¡La implementación está completa! Sigue estos pasos y tendrás un sistema de autenticación seguro y escalable. 🎉
