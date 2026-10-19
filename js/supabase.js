const supabaseUrl = 'https://gfiarmrfdapzepbkcrnl.supabase.co';
const supabaseKey = 'sb_publishable_i9SnUXJKHTkXN4YFIL2rjA_V0k6xd2L';

// Inicializar el cliente y guardarlo globalmente
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
console.log("Supabase inicializado correctamente.");
