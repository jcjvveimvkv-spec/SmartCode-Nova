import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET - With proper async params handling for Next.js 16
// ============================================================
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // In Next.js 16, params is a Promise, so we need to await it
        const { id: userId } = await context.params;
        
        console.log('📡 Fetching user data for ID:', userId);

        if (!userId) {
            console.error('❌ No user ID provided');
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }

        // Fetch user from user_balances table
        const { data: user, error } = await supabaseAdmin
            .from('user_balances')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            
            // If user not found in user_balances, try to get from auth
            if (error.code === 'PGRST116') {
                console.log('👤 User not found in user_balances, checking auth...');
                
                // Try to get user from auth
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
                
                if (authError || !authUser) {
                    console.error('❌ Auth user not found:', authError);
                    return NextResponse.json({
                        success: false,
                        error: 'User not found'
                    }, { status: 404 });
                }
                
                // Create user_balances record if it doesn't exist
                const { data: newUser, error: insertError } = await supabaseAdmin
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
        
        // Calculate total balance
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