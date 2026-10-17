// Cliente central de Supabase. Crea window.supabaseClient y helpers de auth.
// Se carga como modulo (type="module") para poder importar supabase-js desde CDN.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

(function initSupabaseClient() {
    const config = window.SUPABASE_CONFIG || {};

    const isConfigured = config.url
        && config.anonKey
        && !String(config.url).includes('TU-PROYECTO')
        && !String(config.anonKey).includes('TU_ANON_KEY');

    if (!isConfigured) {
        console.warn('[Supabase] Configura assets/js/core/supabase-config.js con tu URL y anon key.');
        window.__supabaseReady = false;
        return;
    }

    try {
        const client = createClient(config.url, config.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        window.supabaseClient = client;
        window.supabaseAuth = client.auth;
        window.__supabaseReady = true;
    } catch (error) {
        console.error('[Supabase] No se pudo inicializar el cliente:', error);
        window.__supabaseReady = false;
    }
})();
