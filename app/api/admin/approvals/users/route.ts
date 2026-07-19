// app/api/admin/approvals/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key directly for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('🔍 Fetching user info for:', userId);

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Try 1: Get from user_balances
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('full_name, email, funding_balance')
      .eq('user_id', userId)
      .single();

    if (!balanceError && balanceData) {
      console.log('✅ Found in user_balances:', balanceData);
      // If we have an email, return it
      if (balanceData.email) {
        return NextResponse.json({
          success: true,
          data: {
            email: balanceData.email,
            full_name: balanceData.full_name || `User ${userId.slice(0, 8)}`
          }
        });
      }
    }

    // Try 2: Get from auth.users via admin API
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!authError && authUser?.user) {
        const email = authUser.user.email || '';
        const metadata = authUser.user.user_metadata || {};
        const name = metadata.full_name || metadata.name || '';
        
        console.log('✅ Found in auth.admin:', { email, name });
        
        // If we have an email, update user_balances with it
        if (email) {
          // Update user_balances with the email
          await supabaseAdmin
            .from('user_balances')
            .update({ email: email })
            .eq('user_id', userId);
        }
        
        return NextResponse.json({
          success: true,
          data: {
            email: email || 'No email',
            full_name: name || `User ${userId.slice(0, 8)}`
          }
        });
      }
    } catch (adminError) {
      console.log('Admin API error:', adminError);
    }

    // Try 3: Direct query to auth.users (if accessible)
    try {
      const { data: authData, error: authError } = await supabaseAdmin
        .from('auth.users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (!authError && authData) {
        const email = authData.email || '';
        const metadata = authData.raw_user_meta_data || {};
        const name = metadata.full_name || metadata.name || '';
        
        console.log('✅ Found in auth.users:', { email, name });
        
        // Update user_balances with the email
        if (email) {
          await supabaseAdmin
            .from('user_balances')
            .update({ email: email })
            .eq('user_id', userId);
        }
        
        return NextResponse.json({
          success: true,
          data: {
            email: email || 'No email',
            full_name: name || `User ${userId.slice(0, 8)}`
          }
        });
      }
    } catch (authError) {
      console.log('auth.users query error:', authError);
    }

    // Fallback: Use user ID
    console.log('⚠️ No info found, using fallback');
    return NextResponse.json({
      success: true,
      data: {
        email: 'No email',
        full_name: `User ${userId.slice(0, 8)}`
      }
    });

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user'
    }, { status: 500 });
  }
}