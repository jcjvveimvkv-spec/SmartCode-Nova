// /app/lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================================
// Lazy-loaded Supabase client for Server Components/API Routes
// ============================================================
let supabaseInstance: any = null;

export async function createClient() {
    // Only create the client when called
    const cookieStore = await cookies();
    
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}

// ============================================================
// Admin client for bypassing RLS (use with caution)
// ============================================================
let supabaseAdminInstance: any = null;

export function getSupabaseAdmin() {
    if (!supabaseAdminInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            // Use anon key as fallback for development
            const { createClient: createAdminClient } = require('@supabase/supabase-js');
            supabaseAdminInstance = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            );
            return supabaseAdminInstance;
        }
        
        const { createClient: createAdminClient } = require('@supabase/supabase-js');
        supabaseAdminInstance = createAdminClient(supabaseUrl, supabaseServiceKey);
    }
    return supabaseAdminInstance;
}