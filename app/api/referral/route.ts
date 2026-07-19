import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-server';

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
    const status = searchParams.get('status');

    console.log('📡 GET /api/referral - Params:', { userId, status });

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`referrer_id.eq.${userId},referred_user_id.eq.${userId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: referrals, error } = await query;

    if (error) {
      console.error('❌ Error fetching referrals:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Get user details separately
    const userIds = new Set<string>();
    referrals?.forEach((r: any) => {
      if (r.referrer_id) userIds.add(r.referrer_id);
      if (r.referred_user_id) userIds.add(r.referred_user_id);
    });

    let userMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users, error: userError } = await supabase
        .from('user_balances')
        .select('user_id, email, full_name')
        .in('user_id', Array.from(userIds));

      if (!userError && users) {
        users.forEach((u: any) => {
          userMap[u.user_id] = u;
        });
      }
    }

    const enrichedReferrals = referrals?.map((r: any) => ({
      ...r,
      referrer: userMap[r.referrer_id] || null,
      referred: userMap[r.referred_user_id] || null,
    })) || [];

    console.log(`📊 Found ${enrichedReferrals?.length || 0} referrals`);
    return NextResponse.json({
      success: true,
      data: enrichedReferrals || []
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
// POST: Handle all POST requests
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 POST /api/referral - Action:', body.action);

    const { action } = body;
    const supabaseAdmin = getSupabaseAdmin();

    // ============================================================
    // Action: get-users - Fetch users for admin
    // ============================================================
    if (action === 'get-users') {
      console.log('👤 Fetching users for admin...');
      const { search = '', page = 1, limit = 5 } = body;
      
      let query = supabaseAdmin
        .from('user_balances')
        .select('user_id, email, full_name, funding_balance, bonus_usdt, referral_earned, promo_earned, updated_at', { count: 'exact' });

      if (search && search.length > 1) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const offset = (page - 1) * limit;
      query = query.order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: users, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      const userIds = users?.map((u: any) => u.user_id) || [];
      let referralCodes: any[] = [];
      if (userIds.length > 0) {
        const { data: codes, error: codeError } = await supabaseAdmin
          .from('user_referral_codes')
          .select('user_id, code, total_clicks, total_signups')
          .in('user_id', userIds);
        
        if (!codeError && codes) {
          referralCodes = codes;
        }
      }

      const codeMap: Record<string, any> = {};
      referralCodes.forEach((rc: any) => {
        codeMap[rc.user_id] = rc;
      });

      const usersWithCodes = users?.map((user: any) => ({
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        referral_code: codeMap[user.user_id]?.code || null,
        total_clicks: codeMap[user.user_id]?.total_clicks || 0,
        total_signups: codeMap[user.user_id]?.total_signups || 0,
      })) || [];

      console.log(`✅ Found ${usersWithCodes.length} users`);
      return NextResponse.json({
        success: true,
        data: usersWithCodes,
        total: count || 0,
        page: page,
        limit: limit,
        totalPages: Math.ceil((count || 0) / limit)
      });
    }

    // ============================================================
    // Action: get-all-referrals - Fetch all referrals for admin
    // ============================================================
    if (action === 'get-all-referrals') {
      console.log('📊 Fetching all referrals for admin...');
      
      const { data: referrals, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all referrals:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      const userIds = new Set<string>();
      referrals?.forEach((r: any) => {
        if (r.referrer_id) userIds.add(r.referrer_id);
        if (r.referred_user_id) userIds.add(r.referred_user_id);
      });

      let userMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: users, error: userError } = await supabaseAdmin
          .from('user_balances')
          .select('user_id, email, full_name')
          .in('user_id', Array.from(userIds));

        if (!userError && users) {
          users.forEach((u: any) => {
            userMap[u.user_id] = u;
          });
        }
      }

      const formattedReferrals = referrals?.map((r: any) => {
        const referrer = userMap[r.referrer_id];
        const referred = userMap[r.referred_user_id];
        
        return {
          id: r.id,
          referrer_id: r.referrer_id,
          referred_user_id: r.referred_user_id,
          referral_code: r.referral_code || 'N/A',
          status: r.status,
          amount_usdt: r.amount_usdt || 7,
          created_at: r.created_at,
          paid_at: r.paid_at || null,
          referred_deposit: r.referred_deposit || 0,
          min_deposit_required: r.min_deposit_required || 50,
          referrer_display: referrer?.full_name || referrer?.email || 'Unknown',
          referred_display: referred?.full_name || referred?.email || 'Unknown',
        };
      }) || [];

      console.log(`✅ Found ${formattedReferrals.length} referrals`);
      return NextResponse.json({
        success: true,
        data: formattedReferrals
      });
    }

    // ============================================================
    // Action: admin-generate-link - Generate referral link
    // ============================================================
    if (action === 'admin-generate-link') {
      console.log('🔗 Generating referral link...');
      const { user_id } = body;

      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 });
      }

      const { data: existingCode } = await supabaseAdmin
        .from('user_referral_codes')
        .select('code')
        .eq('user_id', user_id)
        .single();

      let code = existingCode?.code;
      if (!code) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          code = generateCode();
          const { data: check } = await supabaseAdmin
            .from('user_referral_codes')
            .select('code')
            .eq('code', code)
            .single();
          if (!check) isUnique = true;
          attempts++;
        }

        if (!code) {
          return NextResponse.json({
            success: false,
            error: 'Failed to generate unique referral code'
          }, { status: 500 });
        }

        const { error: insertError } = await supabaseAdmin
          .from('user_referral_codes')
          .insert({
            user_id: user_id,
            code: code,
            total_clicks: 0,
            total_signups: 0,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creating referral code:', insertError);
          return NextResponse.json({
            success: false,
            error: insertError.message
          }, { status: 500 });
        }
      }

      const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://smartcodenova.com'}/signup?ref=${code}`;

      return NextResponse.json({
        success: true,
        data: {
          code: code,
          link: link,
        }
      });
    }

    // ============================================================
    // Action: update-status - Update referral status
    // ============================================================
    if (action === 'update-status') {
      console.log('🔄 Updating referral status...');
      const { referral_id, status } = body;

      if (!referral_id || !status) {
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

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data: updated, error } = await supabaseAdmin
        .from('referrals')
        .update(updateData)
        .eq('id', referral_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating referral:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Referral ${status} successfully`
      });
    }

    // ============================================================
    // Action: check-referral-eligibility - Check if referred user qualifies
    // ✅ FIXED: Uses maybeSingle() instead of single()
    // ============================================================
    if (action === 'check-referral-eligibility') {
      console.log('✅ Checking referral eligibility...');
      const { referred_user_id } = body;

      if (!referred_user_id) {
        return NextResponse.json({
          success: false,
          error: 'Referred user ID is required'
        }, { status: 400 });
      }

      // ✅ Use maybeSingle() to avoid errors when no referral exists
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referred_user_id', referred_user_id)
        .eq('status', 'pending')
        .maybeSingle();

      // ✅ Check if referral exists
      if (!referral) {
        console.log('ℹ️ No pending referral found for user:', referred_user_id);
        return NextResponse.json({
          success: false,
          error: 'No pending referral found for this user'
        }, { status: 404 });
      }

      if (referralError) {
        console.error('❌ Error checking referral:', referralError);
        return NextResponse.json({
          success: false,
          error: referralError.message
        }, { status: 500 });
      }

      if (referral.status === 'paid') {
        return NextResponse.json({
          success: false,
          error: 'Referral already paid'
        }, { status: 400 });
      }

      if (referral.status === 'rejected') {
        return NextResponse.json({
          success: false,
          error: 'Referral was rejected'
        }, { status: 400 });
      }

      // Get referral rules
      const { data: rules } = await supabaseAdmin
        .from('referral_rules')
        .select('min_deposit_amount')
        .limit(1)
        .maybeSingle();

      const minDeposit = rules?.min_deposit_amount || 50;

      // Get user's funding balance
      const { data: userBalance } = await supabaseAdmin
        .from('user_balances')
        .select('funding_balance')
        .eq('user_id', referred_user_id)
        .maybeSingle();

      const depositAmount = userBalance?.funding_balance || 0;

      console.log(`💰 Deposit check: ${depositAmount} >= ${minDeposit}`);

      if (depositAmount >= minDeposit) {
        // ✅ Update referral to 'approved'
        const { data: updatedReferral, error: updateError } = await supabaseAdmin
          .from('referrals')
          .update({
            status: 'approved',
            referred_deposit: depositAmount,
            min_deposit_required: minDeposit,
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating referral:', updateError);
          return NextResponse.json({
            success: false,
            error: updateError.message
          }, { status: 500 });
        }

        console.log(`✅ Referral ${referral.id} approved! Deposit: ${depositAmount} USDT`);
        return NextResponse.json({
          success: true,
          data: updatedReferral,
          message: `Referral approved! User has deposited ${depositAmount} USDT`
        });
      }

      return NextResponse.json({
        success: false,
        error: `Referred user must deposit at least ${minDeposit} USDT to qualify (current: ${depositAmount} USDT)`,
        data: {
          current_deposit: depositAmount,
          min_deposit_required: minDeposit
        }
      }, { status: 400 });
    }

    // ============================================================
    // Action: pay-bonus - Pay out referral bonus (Admin only)
    // ✅ FOLLOWS GOLDEN RULE: Bonus only added when admin pays
    // ============================================================
    if (action === 'pay-bonus') {
      console.log('💰 Paying out referral bonus...');
      const { referral_id } = body;

      if (!referral_id) {
        return NextResponse.json({
          success: false,
          error: 'Referral ID is required'
        }, { status: 400 });
      }

      // Get referral details
      const { data: referral, error: fetchError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('id', referral_id)
        .single();

      if (fetchError || !referral) {
        console.error('❌ Referral not found:', fetchError);
        return NextResponse.json({
          success: false,
          error: 'Referral not found'
        }, { status: 404 });
      }

      // ✅ Only approved referrals can be paid
      if (referral.status !== 'approved') {
        return NextResponse.json({
          success: false,
          error: `Referral status is '${referral.status}', expected 'approved'`
        }, { status: 400 });
      }

      // ✅ Add bonus to referrer's balance
      const bonusAmount = referral.amount_usdt || 7;

      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('user_balances')
        .select('bonus_usdt')
        .eq('user_id', referral.referrer_id)
        .single();

      if (balanceError) {
        console.error('❌ Error fetching balance:', balanceError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch referrer balance'
        }, { status: 500 });
      }

      const currentBonus = balance?.bonus_usdt || 0;
      const newBonus = currentBonus + bonusAmount;

      const { error: updateBalanceError } = await supabaseAdmin
        .from('user_balances')
        .update({
          bonus_usdt: newBonus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referral.referrer_id);

      if (updateBalanceError) {
        console.error('❌ Error updating balance:', updateBalanceError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update referrer balance'
        }, { status: 500 });
      }

      // ✅ Update referral status to paid
      const { data: updatedReferral, error: updateError } = await supabaseAdmin
        .from('referrals')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referral_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating referral:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update referral status'
        }, { status: 500 });
      }

      // ✅ Create payout record
      const { error: payoutError } = await supabaseAdmin
        .from('referral_payouts')
        .insert({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          amount_usdt: bonusAmount,
          status: 'completed',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (payoutError) {
        console.error('❌ Error creating payout record:', payoutError);
        // Non-critical, continue
      }

      // ✅ Update total earned in referral codes
      const { data: codeData } = await supabaseAdmin
        .from('user_referral_codes')
        .select('total_earned_usdt')
        .eq('user_id', referral.referrer_id)
        .single();

      if (codeData) {
        await supabaseAdmin
          .from('user_referral_codes')
          .update({
            total_earned_usdt: (codeData.total_earned_usdt || 0) + bonusAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referral.referrer_id);
      }

      // ✅ Send notification to referrer
      try {
        const { data: referrerInfo } = await supabaseAdmin
          .from('user_balances')
          .select('email, full_name')
          .eq('user_id', referral.referrer_id)
          .single();

        const { data: referredInfo } = await supabaseAdmin
          .from('user_balances')
          .select('email, full_name')
          .eq('user_id', referral.referred_user_id)
          .single();

        if (referrerInfo) {
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: referral.referrer_id,
              type: 'referral_paid',
              title: '🎉 Referral Bonus Paid!',
              message: `You earned ${bonusAmount} USDT from ${referredInfo?.full_name || 'your referral'}!`,
              data: {
                referral_id: referral.id,
                referred_user_id: referral.referred_user_id,
                amount: bonusAmount,
                status: 'paid'
              },
              is_read: false,
              created_at: new Date().toISOString()
            });
          console.log('✅ In-app notification created for referrer');
        }
      } catch (notifyError) {
        console.error('❌ Error sending notification:', notifyError);
      }

      console.log(`✅ Bonus of ${bonusAmount} USDT paid to referrer ${referral.referrer_id}`);

      return NextResponse.json({
        success: true,
        data: updatedReferral,
        message: `Bonus of ${bonusAmount} USDT paid to referrer successfully`,
        newBalance: newBonus
      });
    }

    // ============================================================
    // Action: stats - Get referral stats for dashboard
    // ============================================================
    if (action === 'stats' || action === 'get-stats') {
      console.log('📊 Getting stats for user...');
      const { user_id } = body;

      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 });
      }

      // Get or generate referral code
      let codeData = await supabaseAdmin
        .from('user_referral_codes')
        .select('code, total_clicks, total_signups, total_earned_usdt')
        .eq('user_id', user_id)
        .maybeSingle();

      if (!codeData.data) {
        const code = generateCode();
        const { data: newCode } = await supabaseAdmin
          .from('user_referral_codes')
          .insert({
            user_id: user_id,
            code: code,
            total_clicks: 0,
            total_signups: 0,
            total_earned_usdt: 0,
            share_count: 0
          })
          .select()
          .single();
        
        if (newCode) {
          codeData = { data: newCode, error: null };
        }
      }

      // Get all referrals for this user
      const { data: referrals, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referrer_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting referrals:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      console.log(`📊 Found ${referrals?.length || 0} referrals`);

      // Get user details for all referred users
      const referredUserIds = referrals?.map((r: any) => r.referred_user_id).filter(Boolean) || [];
      let userMap: Record<string, { email: string; full_name: string }> = {};

      if (referredUserIds.length > 0) {
        const { data: users, error: userError } = await supabaseAdmin
          .from('user_balances')
          .select('user_id, email, full_name')
          .in('user_id', referredUserIds);

        if (!userError && users) {
          users.forEach((u: any) => {
            userMap[u.user_id] = {
              email: u.email || 'Unknown',
              full_name: u.full_name || 'Unknown User'
            };
          });
        }
      }

      // Format referrals with user data
      const formattedReferrals = referrals?.map((r: any) => {
        const user = userMap[r.referred_user_id] || { email: 'Unknown', full_name: 'Unknown User' };
        return {
          id: r.id,
          referred_user_id: r.referred_user_id,
          referred_email: user.email,
          referred_name: user.full_name,
          status: r.status || 'pending',
          amount_usdt: r.amount_usdt || 7,
          created_at: r.created_at,
          paid_at: r.paid_at || null,
        };
      }) || [];

      // Calculate stats
      const totalReferrals = referrals?.length || 0;
      const pendingReferrals = referrals?.filter((r: any) => r.status === 'pending').length || 0;
      const approvedReferrals = referrals?.filter((r: any) => r.status === 'approved').length || 0;
      const paidReferrals = referrals?.filter((r: any) => r.status === 'paid').length || 0;

      const totalEarned = referrals
        ?.filter((r: any) => r.status === 'paid')
        .reduce((sum: number, r: any) => sum + (r.amount_usdt || 0), 0) || 0;

      // Get payouts
      const { data: payouts } = await supabaseAdmin
        .from('referral_payouts')
        .select('*')
        .eq('user_id', user_id)
        .order('paid_at', { ascending: false });

      // Get user balance
      const { data: balance } = await supabaseAdmin
        .from('user_balances')
        .select('bonus_usdt, referral_earned, promo_earned')
        .eq('user_id', user_id)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          code: codeData?.data || { code: null, total_clicks: 0, total_signups: 0, total_earned_usdt: 0 },
          referrals: formattedReferrals,
          payouts: payouts || [],
          total_referrals: totalReferrals,
          total_earned: totalEarned,
          pending_referrals: pendingReferrals,
          approved_referrals: approvedReferrals,
          paid_referrals: paidReferrals,
          bonus_balance: balance?.bonus_usdt || 0,
          referral_earned: balance?.referral_earned || 0,
          promo_earned: balance?.promo_earned || 0,
        }
      });
    }

    // ============================================================
    // Action: get-promos - Fetch promo codes
    // ============================================================
    if (action === 'get-promos') {
      console.log('🏷️ Fetching promo codes...');
      const { data: promos, error } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching promos:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: promos || []
      });
    }

    // ============================================================
    // Action: create-promo - Create new promo code
    // ============================================================
    if (action === 'create-promo') {
      console.log('🏷️ Creating promo code...');
      const { code, description, bonus_amount, usage_limit, expires_at } = body;

      if (!code || !bonus_amount) {
        return NextResponse.json({
          success: false,
          error: 'Code and bonus amount are required'
        }, { status: 400 });
      }

      const { data: existing } = await supabaseAdmin
        .from('promo_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'Promo code already exists'
        }, { status: 400 });
      }

      const { data: promo, error } = await supabaseAdmin
        .from('promo_codes')
        .insert({
          code: code.toUpperCase(),
          description: description || '',
          bonus_amount: bonus_amount,
          usage_limit: usage_limit || 0,
          expires_at: expires_at || null,
          is_active: true,
          used_count: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating promo:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: promo,
        message: 'Promo code created successfully'
      });
    }

    // ============================================================
    // Action: toggle-promo - Toggle promo active status
    // ============================================================
    if (action === 'toggle-promo') {
      console.log('🏷️ Toggling promo...');
      const { promo_id, is_active } = body;

      if (!promo_id) {
        return NextResponse.json({
          success: false,
          error: 'Promo ID is required'
        }, { status: 400 });
      }

      const { data: promo, error } = await supabaseAdmin
        .from('promo_codes')
        .update({
          is_active: is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', promo_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error toggling promo:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: promo,
        message: `Promo code ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    }

    // ============================================================
    // Action: update-promo - Update promo code
    // ============================================================
    if (action === 'update-promo') {
      console.log('🏷️ Updating promo...');
      const { promo_id, description, bonus_amount, usage_limit, expires_at, is_active } = body;

      if (!promo_id) {
        return NextResponse.json({
          success: false,
          error: 'Promo ID is required'
        }, { status: 400 });
      }

      const { data: promo, error } = await supabaseAdmin
        .from('promo_codes')
        .update({
          description: description || '',
          bonus_amount: bonus_amount,
          usage_limit: usage_limit || 0,
          expires_at: expires_at || null,
          is_active: is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', promo_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating promo:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: promo,
        message: 'Promo code updated successfully'
      });
    }

    // ============================================================
    // Action: delete-promo - Delete promo code
    // ============================================================
    if (action === 'delete-promo') {
      console.log('🏷️ Deleting promo...');
      const { promo_id } = body;

      if (!promo_id) {
        return NextResponse.json({
          success: false,
          error: 'Promo ID is required'
        }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('promo_codes')
        .delete()
        .eq('id', promo_id);

      if (error) {
        console.error('❌ Error deleting promo:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Promo code deleted successfully'
      });
    }

    // ============================================================
    // Action: mark-read - Mark referrals as read
    // ============================================================
    if (action === 'mark-read') {
      console.log('📖 Marking referrals as read...');
      const { user_id } = body;

      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('referrals')
        .update({ is_read: true })
        .eq('referrer_id', user_id)
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('❌ Error marking read:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        marked_count: data?.length || 0
      });
    }

    // ============================================================
    // Action: claim-bonus - Claim pending referral bonuses
    // ============================================================
    if (action === 'claim-bonus') {
      console.log('💰 Claiming bonus...');
      const { user_id } = body;

      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 });
      }

      const { data: referrals, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referrer_id', user_id)
        .eq('status', 'approved');

      if (error) {
        console.error('❌ Error getting referrals:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      if (!referrals || referrals.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No pending bonuses to claim'
        }, { status: 400 });
      }

      let totalAmount = 0;
      const results = [];

      for (const referral of referrals) {
        const amount = referral.amount_usdt || 7;
        totalAmount += amount;

        await supabaseAdmin
          .from('referrals')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        const { data: payout } = await supabaseAdmin
          .from('referral_payouts')
          .insert({
            user_id: user_id,
            referral_id: referral.id,
            amount_usdt: amount,
            status: 'completed',
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (payout) results.push(payout);
      }

      return NextResponse.json({
        success: true,
        data: {
          claimed: results.length,
          total_amount: totalAmount,
          payouts: results
        }
      });
    }

    // ============================================================
    // Action: apply-promo - Apply promo code
    // ============================================================
    if (action === 'apply-promo') {
      console.log('🎯 Applying promo code...');
      const { user_id, promo_code } = body;

      if (!user_id || !promo_code) {
        return NextResponse.json({
          success: false,
          error: 'User ID and promo code are required'
        }, { status: 400 });
      }

      // Get promo code
      const { data: promo, error: promoError } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('code', promo_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promoError || !promo) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or inactive promo code'
        }, { status: 400 });
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Promo code has expired'
        }, { status: 400 });
      }

      // Check usage limit
      if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) {
        return NextResponse.json({
          success: false,
          error: 'Promo code has reached its usage limit'
        }, { status: 400 });
      }

      // Check if user already used this promo
      const { data: existingUsage } = await supabaseAdmin
        .from('promo_code_usage')
        .select('*')
        .eq('promo_code_id', promo.id)
        .eq('user_id', user_id)
        .single();

      if (existingUsage) {
        return NextResponse.json({
          success: false,
          error: 'You have already used this promo code'
        }, { status: 400 });
      }

      // Apply bonus
      const bonusAmount = promo.bonus_amount;

      // Update user balance
      const { data: balance } = await supabaseAdmin
        .from('user_balances')
        .select('bonus_usdt, promo_earned')
        .eq('user_id', user_id)
        .single();

      const newBonus = (balance?.bonus_usdt || 0) + bonusAmount;
      const newPromoEarned = (balance?.promo_earned || 0) + bonusAmount;

      await supabaseAdmin
        .from('user_balances')
        .update({
          bonus_usdt: newBonus,
          promo_earned: newPromoEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      // Record usage
      await supabaseAdmin
        .from('promo_code_usage')
        .insert({
          promo_code_id: promo.id,
          user_id: user_id,
          bonus_amount: bonusAmount,
          claimed_at: new Date().toISOString()
        });

      // Update promo usage count
      const newUsedCount = (promo.used_count || 0) + 1;
      await supabaseAdmin
        .from('promo_codes')
        .update({
          used_count: newUsedCount,
          is_active: promo.usage_limit > 0 && newUsedCount >= promo.usage_limit ? false : true
        })
        .eq('id', promo.id);

      return NextResponse.json({
        success: true,
        data: {
          bonus_amount: bonusAmount,
          promo_code: promo.code,
          new_balance: newBonus,
          message: `✅ Promo code applied! You received ${bonusAmount} USDT bonus!`
        }
      });
    }

    // ============================================================
    // Default: Create a new referral
    // ============================================================
    console.log('📝 Creating new referral (default)...');
    const { referrerId, referredId, bonusAmount, referrerCode } = body;

    if (!referrerId || !referredId) {
      console.error('❌ Missing referrerId or referredId');
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

    // Check if referral already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', referrerId)
      .eq('referred_user_id', referredId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Referral already exists',
        data: existing
      }, { status: 400 });
    }

    // Get referral rules for min deposit
    const { data: rules } = await supabaseAdmin
      .from('referral_rules')
      .select('min_deposit_amount')
      .limit(1)
      .maybeSingle();

    const minDeposit = rules?.min_deposit_amount || 50;

    let referralCode = referrerCode;
    if (!referralCode) {
      const { data: codeData } = await supabaseAdmin
        .from('user_referral_codes')
        .select('code')
        .eq('user_id', referrerId)
        .maybeSingle();
      
      referralCode = codeData?.code || null;
    }

    const bonusAmountValue = bonusAmount || 7;
    const { data: referral, error } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: referredId,
        amount_usdt: bonusAmountValue,
        referral_code: referralCode,
        status: 'pending',
        referred_deposit: 0,
        min_deposit_required: minDeposit,
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
      const { data: currentData } = await supabaseAdmin
        .from('user_referral_codes')
        .select('total_signups')
        .eq('code', referralCode)
        .maybeSingle();
      
      const currentSignups = currentData?.total_signups || 0;
      
      const { error: updateError } = await supabaseAdmin
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
      error: error.message || 'Failed to process request'
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

    console.log('📝 PUT /api/referral - Updating:', { referralId, status, adminNote });

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
      .select('*')
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
      
      const bonusAmount = referral.amount_usdt || 7;
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
      message: `Referral ${status} successfully`
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