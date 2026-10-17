// Capa de acceso a Supabase: helpers de espera y utilidades comunes de datos.
async function waitForSupabaseReady(options = {}) {
    const maxAttempts = Number(options.maxAttempts) || 100;
    const intervalMs = Number(options.intervalMs) || 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (window.__supabaseReady && window.supabaseClient) return true;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return false;
}

async function getSupabaseSession() {
    const ready = await waitForSupabaseReady();
    if (!ready) return null;
    const { data, error } = await window.supabaseAuth.getSession();
    if (error) {
        console.error('Error leyendo sesion Supabase:', error);
        return null;
    }
    return data?.session || null;
}

async function getSupabaseUser() {
    const session = await getSupabaseSession();
    return session?.user || null;
}

async function getProfileByEmail(email) {
    if (!email) return null;
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle();
    if (error) {
        console.error('Error leyendo perfil por email:', error);
        return null;
    }
    return data || null;
}

async function getProfileById(id) {
    if (!id) return null;
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) {
        console.error('Error leyendo perfil por id:', error);
        return null;
    }
    return data || null;
}

window.waitForSupabaseReady = waitForSupabaseReady;
window.getSupabaseSession = getSupabaseSession;
window.getSupabaseUser = getSupabaseUser;
window.getProfileByEmail = getProfileByEmail;
window.getProfileById = getProfileById;
