# Configuración Supabase - Autenticación, Base de Datos y Seguridad

## ✅ Resumen

El sistema usa **Supabase** para:
- **Auth** (email/password) → login y control de acceso.
- **PostgreSQL** → tablas `profiles`, `invoices`, `admin_audit`.
- **Row Level Security (RLS)** → cada usuario ve/edita solo lo suyo; el admin, todo.
- **Realtime** → la lista de facturas y el panel de usuarios se actualizan solos.

## 📋 Pasos de configuración

### 1) Crear el proyecto en Supabase

Al crear el proyecto, usa estos ajustes de seguridad:

| Opción | Valor | Motivo |
| --- | --- | --- |
| Enable Data API | **Activado** | Lo usa `supabase-js` (REST/PostgREST). |
| Automatically expose new tables | **Desactivado** | Controlamos el acceso con GRANT + RLS (las migraciones incluyen los GRANT explícitos). |
| Enable automatic RLS | **Activado** | Red de seguridad; igual añadimos políticas explícitas. |

### 2) Aplicar el esquema (tablas + RLS + realtime)

En **SQL Editor**, pega y ejecuta el contenido de:

```text
supabase/migrations/0001_init.sql
```

Esto crea `profiles`, `invoices`, `admin_audit`, el trigger de perfil, las políticas RLS, los GRANT y la publicación de realtime.

### 3) Copiar la URL y la anon key al frontend

En **Project Settings → API**:

1. Copia **Project URL** y **anon public** key.
2. Pega ambos en `assets/js/core/supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
    url: 'https://TU-PROYECTO.supabase.co',
    anonKey: 'TU_ANON_KEY'
};
```

> La **anon key** es pública y puede estar en el frontend porque el acceso real lo controla RLS.
> La **service_role key** es SECRETA y **nunca** debe ir en el frontend.

### 4) Habilitar Email/Password en Supabase Auth

En **Authentication → Providers → Email**, activa **Email/Password**.

### 5) Crear el primer administrador

1. En **Authentication → Users**, crea el usuario (ej. `admin@tu-dominio.com`) con su contraseña.
2. Copia el **User UID**.
3. En **SQL Editor**, promuévelo a admin:

```sql
update public.profiles
set role = 'admin'
where id = 'PEGA-AQUI-EL-UID';
```

El trigger `handle_new_user` crea el perfil automáticamente al registrar el usuario. Si no aparece, insértalo:

```sql
insert into public.profiles (id, email, role)
values ('PEGA-AQUI-EL-UID', 'admin@tu-dominio.com', 'admin');
```

## 🖥️ Backend serverless (crear/eliminar usuarios)

Crear y eliminar usuarios requiere la `service_role` key y por eso vive en una función de Vercel:

```text
api/users.js
```

### Variables de entorno en Vercel

En **Vercel → Project Settings → Environment Variables**, agrega:

| Variable | Valor |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secreta) |

La función valida el token de sesión del administrador antes de ejecutar cualquier acción, así que aunque la ruta sea pública, solo un admin logueado puede usarla.

> Nota: la gestión de usuarios desde el panel requiere desplegar en **Vercel** (por la función `api/`).
> Un despliegue puramente estático (GitHub Pages) no ejecuta `api/`, por lo que crear/eliminar usuarios no funcionará allí.

## 🔐 Flujo actual

- `/login`: autentica con Supabase Auth (`signInWithPassword`).
- `index.html`: requiere sesión válida y un perfil en `profiles` para gestionar facturas.
- `/admin`: requiere sesión y rol `admin`.

## 🗂️ Modelo de datos

- `profiles` → `id` (uuid, = usuario de Auth), `email`, `role` (`user`/`admin`), `description`.
- `invoices` → campos de la factura + `items` (jsonb) + `change_log` (jsonb) + `owner_id`.
- `admin_audit` → `time`, `admin_email`, `action`, `target`.

## ⚠️ Migrar datos desde la versión anterior (Firebase)

1. En la versión anterior, usa **Exportar** para descargar el respaldo cifrado de facturas.
2. Ya migrado a Supabase, usa **Importar** para restaurar ese respaldo (reemplaza el dataset actual).
3. Vuelve a crear los usuarios desde `/admin` o desde el dashboard de Supabase.

## 🧪 Pruebas rápidas

1. Inicia sesión con el admin.
2. Crea un usuario nuevo desde `/admin`.
3. Verifica acceso:
   - Usuario normal → `index.html`
   - Admin → `/admin`
4. Confirma que sin sesión redirige a `/login`.
5. Crea una factura y verifica que aparece en `invoices` (Table Editor).

## 🆘 Errores comunes

- `Invalid login credentials`: email/contraseña incorrectos o usuario inexistente.
- Login correcto pero sin acceso: falta el perfil en `profiles` o no tiene `role`.
- `new row violates row-level security policy`: RLS activo sin política/GRANT para esa operación.
- Al crear/eliminar usuario desde el panel: revisa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel y los logs de la función `api/users.js`.
