// Configuracion centralizada de Supabase - compartida entre todas las paginas.
// Reemplaza a Firebase.
//
// Como obtener estos valores:
//   Supabase Dashboard > Project Settings > API
//     - url      => "Project URL"        (https://xxxxx.supabase.co)
//     - anonKey  => "publishable" key    (clave publica, segura para el navegador)
//
// IMPORTANTE: la publishable key es publica y puede ir en el frontend SOLO porque
// el acceso real lo controla RLS (Row Level Security). Nunca pongas aqui la
// "secret"/"service_role" key.
window.SUPABASE_CONFIG = {
    url: 'https://civibrbkknspgqlarnwr.supabase.co',
    anonKey: 'sb_publishable_RMvGQZDkYK4dEkUs0RtKCw_8vH4opyb'
};
