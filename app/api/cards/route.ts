import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        console.log('📡 GET /api/cards - Params:', { userId, status });

        let query = supabaseAdmin
            .from('cards')
            .select('*')  // This selects ALL fields including cvv and card_holder_name
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

        // Log what we're returning
        if (data && data.length > 0) {
            console.log('📊 Sample card data:', {
                id: data[0].id,
                card_holder_name: data[0].card_holder_name,
                cvv: data[0].cvv ? 'present' : 'missing',
            });
        }

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