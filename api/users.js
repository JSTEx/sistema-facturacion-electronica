// Funcion serverless (Vercel): gestion de usuarios con service_role.
// Se invoca desde el panel admin con el token de sesion del administrador.
//
// Variables de entorno requeridas en Vercel (Project Settings > Environment Variables):
//   SUPABASE_URL                -> URL del proyecto (https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY   -> clave service_role (SECRETA, nunca en el frontend)
//
// Endpoints (POST):
//   { action: 'create', email, password, role }   -> crea usuario auth (+ perfil por trigger)
//   { action: 'delete', userId }                  -> elimina usuario auth (el perfil cae en cascada)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Metodo no permitido' });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Faltan variables de entorno de Supabase en el servidor' });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1) Validar el token del llamante.
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData || !userData.user) {
        return res.status(401).json({ error: 'Token invalido o expirado' });
    }

    // 2) Verificar que el llamante sea administrador.
    const { data: callerProfile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return res.status(403).json({ error: 'Requiere permisos de administrador' });
    }

    const body = req.body || {};
    const action = body.action;

    try {
        if (action === 'create') {
            const email = String(body.email || '').trim().toLowerCase();
            const password = String(body.password || '');
            const role = body.role === 'admin' ? 'admin' : 'user';

            if (!email || password.length < 6) {
                return res.status(400).json({ error: 'Email o contrasena invalidos (minimo 6 caracteres)' });
            }

            const { data, error } = await admin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role }
            });

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            return res.status(200).json({ user: { id: data.user.id, email: data.user.email, role } });
        }

        if (action === 'delete') {
            const userId = String(body.userId || '');
            if (!userId) {
                return res.status(400).json({ error: 'Falta userId' });
            }

            if (userId === userData.user.id) {
                return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
            }

            const { error } = await admin.auth.admin.deleteUser(userId);
            if (error) {
                return res.status(400).json({ error: error.message });
            }

            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Accion no valida' });
    } catch (error) {
        console.error('Error en /api/users:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
