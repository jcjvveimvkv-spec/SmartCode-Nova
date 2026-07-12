import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }

        console.log('🔍 Fetching user data for ID:', id);

        // Get user from user_balances
        const { data: user, error } = await supabaseAdmin
            .from('user_balances')
            .select('*')
            .eq('user_id', id)
            .maybeSingle();

        // If user not found, create default
        if (error || !user) {
            console.log('⚠️ User not found, returning default values');
            return NextResponse.json({
                success: true,
                data: {
                    id: id,
                    email: 'Unknown',
                    full_name: 'User',
                    funding_balance: 0,
                    bonus_usdt: 0,
                    referral_earned: 0,
                    promo_earned: 0,
                    total_balance: 0
                }
            });
        }

        console.log('✅ User found, Balance:', user.funding_balance);

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                funding_balance: user.funding_balance || 0,
                bonus_usdt: user.bonus_usdt || 0,
                referral_earned: user.referral_earned || 0,
                promo_earned: user.promo_earned || 0,
                total_balance: (user.funding_balance || 0) + (user.bonus_usdt || 0) + (user.referral_earned || 0)
            }
        });

    } catch (error: any) {
        console.error('❌ Error fetching user:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}