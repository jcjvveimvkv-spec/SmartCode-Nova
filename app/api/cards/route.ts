import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        console.log('📡 GET /api/cards - Params:', { userId, status });

        // ============================================================
        // USE ADMIN CLIENT FOR BYPASSING RLS
        // ============================================================
        console.log('🔐 Creating Supabase admin client...');
        const supabase = getSupabaseAdmin();
        console.log('✅ Supabase admin client created');

        let query = supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching cards:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        if (data && data.length > 0) {
            console.log('📊 Sample card data:', {
                id: data[0].id,
                card_holder_name: data[0].card_holder_name,
                cvv: data[0].cvv ? 'present' : 'missing',
            });
        }

        console.log(`📊 Found ${data?.length || 0} cards`);
        return NextResponse.json({
            success: true,
            data: data || []
        });

    } catch (error: any) {
        console.error('❌ Error in GET /api/cards:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch cards'
        }, { status: 500 });
    }
}