# Checklist corto - Refactor seguro de Admin

## 1) Carga inicial
- [ ] Abrir `pages/admin.html` y confirmar que no aparece loader infinito.
- [ ] Confirmar que muestra el usuario actual en la barra superior.
- [ ] Confirmar que lista usuarios existentes en la tabla.

## 2) Operaciones CRUD
- [ ] Crear usuario nuevo (rol user) y verificar que aparece en tabla.
- [ ] Editar rol o descripción de un usuario y verificar persistencia.
- [ ] Eliminar un usuario no actual y validar actualización de tabla.
- [ ] Verificar que no permite eliminar la cuenta actualmente logueada.

## 3) Reglas de negocio
- [ ] Verificar que no permite despromover tu propia cuenta admin.
- [ ] Verificar que no permite dejar el sistema sin administradores.
- [ ] Verificar validación de dominio de correo al crear usuario.

## 4) Realtime y recarga
- [ ] Recargar con Ctrl+F5 y confirmar que los usuarios siguen visibles.
- [ ] Realizar un cambio y confirmar actualización inmediata de la tabla.

## 5) Cierre del refactor
- [ ] Confirmar que no aparece el error de "módulos de administración".
- [ ] Confirmar que no hay errores en `core.js`, `ui.js`, `app.js` y `pages/admin.html`.
- [ ] Solo después de pasar todo, integrar cambios a la rama estable.
