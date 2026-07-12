import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-server';
import { notifyUserPromoClaim } from '@/app/lib/notifications';

// Helper to generate unique referral code
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// GET: Fetch Referrals
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📡 GET /api/referral - UserId:', userId);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('referrals')
      .select(\
        *,
        referrer:user_balances!referrals_referrer_id_fkey(
          user_id,
          email,
          full_name,
          funding_balance,
          bonus_usdt
        ),
        referred:user_balances!referrals_referred_id_fkey(
          user_id,
          email,
          full_name,
          funding_balance,
          bonus_usdt
        )
      \)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(\eferrer_id.eq.\,referred_id.eq.\\);
    }

    const { data: referrals, error } = await query;

    if (error) {
      console.error('❌ Error fetching referrals:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log(\📊 Found \ referrals\);
    return NextResponse.json({
      success: true,
      data: referrals || []
    });

  } catch (error: any) {
    console.error('❌ Error in GET /api/referral:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch referrals'
    }, { status: 500 });
  }
}

// ============================================================
// POST: Create a New Referral
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerId, referredId, bonusAmount, referrerCode } = body;

    console.log('📝 Creating referral:', { referrerId, referredId, bonusAmount, referrerCode });

    if (!referrerId || !referredId) {
      return NextResponse.json({
        success: false,
        error: 'Referrer ID and Referred ID are required'
      }, { status: 400 });
    }

    if (referrerId === referredId) {
      return NextResponse.json({
        success: false,
        error: 'You cannot refer yourself'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: checkError } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Referral already exists',
        data: existing
      }, { status: 400 });
    }

    let referralCode = referrerCode;
    if (!referralCode) {
      const { data: codeData } = await supabase
        .from('user_referral_codes')
        .select('code')
        .eq('user_id', referrerId)
        .single();
      
      referralCode = codeData?.code || null;
    }

    const bonusAmountValue = bonusAmount || 7;
    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        bonus_amount: bonusAmountValue,
        status: 'pending',
        referrer_code: referralCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating referral:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Referral created successfully:', referral.id);

    if (referralCode) {
      const { data: currentData } = await supabase
        .from('user_referral_codes')
        .select('total_signups')
        .eq('code', referralCode)
        .single();
      
      const currentSignups = currentData?.total_signups || 0;
      
      const { error: updateError } = await supabase
        .from('user_referral_codes')
        .update({
          total_signups: currentSignups + 1,
          updated_at: new Date().toISOString()
        })
        .eq('code', referralCode);

      if (updateError) {
        console.error('Error updating referral code stats:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: referral,
      message: 'Referral created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in POST /api/referral:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create referral'
    }, { status: 500 });
  }
}

// ============================================================
// PUT: Update Referral Status
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, status, adminNote } = body;

    console.log('📝 Updating referral:', { referralId, status, adminNote });

    if (!referralId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Referral ID and status are required'
      }, { status: 400 });
    }

    if (!['pending', 'approved', 'paid', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: referral, error: fetchError } = await supabase
      .from('referrals')
      .select('*, referrer:user_balances!referrals_referrer_id_fkey(email, full_name)')
      .eq('id', referralId)
      .single();

    if (fetchError || !referral) {
      console.error('❌ Referral not found:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Referral not found'
      }, { status: 404 });
    }

    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      
      const bonusAmount = referral.bonus_amount || 7;
      const { data: userBalance } = await supabase
        .from('user_balances')
        .select('bonus_usdt')
        .eq('user_id', referral.referrer_id)
        .single();
      
      const currentBonus = userBalance?.bonus_usdt || 0;
      
      const { error: bonusError } = await supabase
        .from('user_balances')
        .update({
          bonus_usdt: currentBonus + bonusAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referral.referrer_id);

      if (bonusError) {
        console.error('Error adding bonus:', bonusError);
      }

      const { error: payoutError } = await supabase
        .from('referral_payouts')
        .insert({
          referral_id: referralId,
          referrer_id: referral.referrer_id,
          amount_usdt: bonusAmount,
          status: 'completed',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (payoutError) {
        console.error('Error creating payout record:', payoutError);
      }
    }

    if (adminNote) {
      updateData.admin_notes = adminNote;
    }

    const { data: updatedReferral, error: updateError } = await supabase
      .from('referrals')
      .update(updateData)
      .eq('id', referralId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating referral:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Referral updated successfully:', updatedReferral.id);

    return NextResponse.json({
      success: true,
      data: updatedReferral,
      message: \Referral \ successfully\
    });

  } catch (error: any) {
    console.error('❌ Error in PUT /api/referral:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update referral'
    }, { status: 500 });
  }
}

// ============================================================
// DELETE: Delete a Referral
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get('id');

    console.log('🗑️ DELETE /api/referral - ID:', referralId);

    if (!referralId) {
      return NextResponse.json({
        success: false,
        error: 'Referral ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('id', referralId)
      .single();

    if (fetchError || !existing) {
      console.error('❌ Referral not found:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Referral not found'
      }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Only pending referrals can be deleted'
      }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('referrals')
      .delete()
      .eq('id', referralId);

    if (deleteError) {
      console.error('❌ Error deleting referral:', deleteError);
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 });
    }

    console.log('✅ Referral deleted successfully:', referralId);
    return NextResponse.json({
      success: true,
      message: 'Referral deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in DELETE /api/referral:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete referral'
    }, { status: 500 });
  }
}
