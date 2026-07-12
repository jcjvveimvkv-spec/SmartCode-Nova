import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

// ============================================================
// GET
// ============================================================
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await context.params;
        
        console.log('📡 Fetching user data for ID:', userId);

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: user, error } = await supabase
            .from('user_balances')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            
            if (error.code === 'PGRST116') {
                console.log('👤 User not found in user_balances');
                
                // Try to get user from auth
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
                
                if (authError || !authUser) {
                    console.error('❌ Auth user not found:', authError);
                    return NextResponse.json({
                        success: false,
                        error: 'User not found'
                    }, { status: 404 });
                }
                
                const { data: newUser, error: insertError } = await supabase
                    .from('user_balances')
                    .insert({
                        user_id: userId,
                        email: authUser.user.email,
                        full_name: authUser.user.user_metadata?.full_name || '',
                        funding_balance: 0,
                        bonus_usdt: 0,
                        referral_earned: 0,
                        promo_earned: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('❌ Failed to create user_balances:', insertError);
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to create user profile'
                    }, { status: 500 });
                }

                console.log('✅ Created new user_balances record for:', userId);
                return NextResponse.json({
                    success: true,
                    data: newUser
                });
            }

            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        console.log('✅ User data fetched successfully:', user.email);
        
        const totalBalance = (user.funding_balance || 0) + 
                           (user.bonus_usdt || 0) + 
                           (user.referral_earned || 0) + 
                           (user.promo_earned || 0);

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                total_balance: totalBalance
            }
        });

    } catch (error: any) {
        console.error('❌ Error in GET /api/users/[id]:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch user'
        }, { status: 500 });
    }
}