// Configuracion centralizada de Supabase - compartida entre todas las paginas.
// Reemplaza a Firebase.
//
// Como obtener estos valores:
//   Supabase Dashboard > Project Settings > API
//     - url      => "Project URL"        (https://xxxxx.supabase.co)
//     - anonKey  => "anon public" key    (clave publica, segura para el navegador)
//
// IMPORTANTE: la anon key es publica y puede ir en el frontend SOLO porque el
// acceso real lo controla RLS (Row Level Security). Nunca pongas aqui la
// "service_role" key.
window.SUPABASE_CONFIG = {
    url: 'https://TU-PROYECTO.supabase.co',
    anonKey: 'TU_ANON_KEY'
};
