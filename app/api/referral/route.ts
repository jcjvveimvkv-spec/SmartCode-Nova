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
// MAIN POST HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, user_id, referral_code, promo_code, bonus_amount, search, promo_id } = body;

    console.log('📨 API Called:', { action, user_id });

    // ✅ Create admin client INSIDE the handler
    const supabaseAdmin = getSupabaseAdmin();

    // ============================================================
    // 1. GET or CREATE user referral code (for users)
    // ============================================================
    if (action === 'get-code' && user_id) {
      try {
        const { data, error } = await supabaseAdmin
          .from('user_referral_codes')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error getting code:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (data) {
          return NextResponse.json({ success: true, data });
        }

        const code = generateCode();
        const { data: newData, error: insertError } = await supabaseAdmin
          .from('user_referral_codes')
          .insert({ 
            user_id, 
            code,
            total_clicks: 0,
            total_signups: 0,
            total_earned_usdt: 0,
            share_count: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating code:', insertError);
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: newData });
      } catch (error: any) {
        console.error('❌ Error in get-code:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 2. GENERATE new referral code for user
    // ============================================================
    if (action === 'generate-code' && user_id) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('user_referral_codes')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ 
            success: true, 
            data: existing,
            message: `You already have a referral code: ${existing.code}`
          });
        }

        const code = generateCode();
        const { data, error } = await supabaseAdmin
          .from('user_referral_codes')
          .insert({ 
            user_id, 
            code,
            total_clicks: 0,
            total_signups: 0,
            total_earned_usdt: 0,
            share_count: 0
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error generating code:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          data,
          message: '✅ Referral code generated successfully!'
        });
      } catch (error: any) {
        console.error('❌ Error in generate-code:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 3. ADMIN: Generate referral link for user
    // ============================================================
    if (action === 'admin-generate-link') {
      const { user_id: targetUserId } = body;
      
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      try {
        const { data: existing } = await supabaseAdmin
          .from('user_referral_codes')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existing) {
          const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup?ref=${existing.code}`;
          return NextResponse.json({
            success: true,
            data: { ...existing, link },
            message: 'User already has a referral code'
          });
        }

        const code = generateCode();
        
        const { data, error } = await supabaseAdmin
          .from('user_referral_codes')
          .insert({ 
            user_id: targetUserId, 
            code,
            total_clicks: 0,
            total_signups: 0,
            total_earned_usdt: 0,
            share_count: 0
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create referral code: ' + error.message
          }, { status: 500 });
        }

        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup?ref=${code}`;

        return NextResponse.json({
          success: true,
          data: { ...data, link },
          message: '✅ Referral link created successfully!'
        });

      } catch (error: any) {
        console.error('❌ Admin generate link error:', error);
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to generate link'
        }, { status: 500 });
      }
    }

    // ============================================================
    // 4. GET all users (from user_balances) WITH PAGINATION
    // ============================================================
    if (action === 'get-users') {
      try {
        const search = body.search || '';
        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 20;
        const offset = (page - 1) * limit;

        console.log('🔍 Fetching users...', { search, page, limit, offset });

        let query = supabaseAdmin
          .from('user_balances')
          .select('user_id, email, full_name', { count: 'exact' })
          .not('email', 'is', null);

        if (search && search.length > 0) {
          query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { count: total, error: countError } = await query;

        if (countError) {
          console.error('❌ Error counting users:', countError);
          return NextResponse.json({
            success: false,
            error: 'Failed to count users',
            data: []
          });
        }

        console.log(`📊 Total users found: ${total}`);

        const { data: users, error: usersError } = await query
          .order('email', { ascending: true })
          .range(offset, offset + limit - 1);

        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch users',
            data: []
          });
        }

        if (!users || users.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            total: 0,
            page: page,
            totalPages: 0,
            warning: 'No users found'
          });
        }

        const userIds = users.map((u: any) => u.user_id);
        
        const { data: codes, error: codesError } = await supabaseAdmin
          .from('user_referral_codes')
          .select('user_id, code, total_clicks, total_signups, total_earned_usdt')
          .in('user_id', userIds);

        const codeMap: Record<string, any> = {};
        if (codes) {
          codes.forEach((c: any) => {
            codeMap[c.user_id] = {
              code: c.code,
              total_clicks: c.total_clicks || 0,
              total_signups: c.total_signups || 0,
              total_earned_usdt: c.total_earned_usdt || 0,
            };
          });
        }

        const mappedUsers = users.map((user: any) => ({
          id: user.user_id,
          email: user.email || 'No email',
          full_name: user.full_name || user.email?.split('@')[0] || 'User',
          referral_code: codeMap[user.user_id]?.code || null,
          total_clicks: codeMap[user.user_id]?.total_clicks || 0,
          total_signups: codeMap[user.user_id]?.total_signups || 0,
          total_earned_usdt: codeMap[user.user_id]?.total_earned_usdt || 0,
        }));

        const totalPages = Math.ceil((total || 0) / limit);

        console.log(`✅ Found ${mappedUsers.length} users (total: ${total || 0})`);
        
        return NextResponse.json({
          success: true,
          data: mappedUsers,
          total: total || 0,
          page: page,
          totalPages: totalPages,
          limit: limit
        });

      } catch (error) {
        console.error('❌ Error in get-users:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch users',
          data: []
        });
      }
    }

    // ============================================================
    // 5. GET all referrals (admin) - WITH USER DATA
    // ============================================================
    if (action === 'get-all-referrals') {
      try {
        console.log('📊 Fetching all referrals...');
        
        const { data: referrals, error: referralsError } = await supabaseAdmin
          .from('referrals')
          .select('*')
          .order('created_at', { ascending: false });

        if (referralsError) {
          console.error('❌ Error fetching referrals:', referralsError);
          return NextResponse.json({ success: false, error: referralsError.message }, { status: 500 });
        }

        if (!referrals || referrals.length === 0) {
          return NextResponse.json({
            success: true,
            data: []
          });
        }

        console.log(`📊 Found ${referrals.length} referrals`);

        const userIds = new Set<string>();
        referrals.forEach((r: any) => {
          if (r.referrer_id) userIds.add(r.referrer_id);
          if (r.referred_user_id) userIds.add(r.referred_user_id);
        });

        console.log(`🔍 Fetching data for ${userIds.size} users...`);

        const { data: userBalances } = await supabaseAdmin
          .from('user_balances')
          .select('user_id, email, full_name')
          .in('user_id', Array.from(userIds));

        const userMap: Record<string, { email: string; full_name: string | null }> = {};

        if (userBalances) {
          userBalances.forEach((u: any) => {
            const email = u.email || 'Unknown';
            const fullName = u.full_name || email.split('@')[0] || 'Unknown';
            userMap[u.user_id] = {
              email: email,
              full_name: fullName,
            };
          });
        }

        const missingUserIds = Array.from(userIds).filter(id => !userMap[id]);
        
        if (missingUserIds.length > 0) {
          console.log(`🔍 Fetching ${missingUserIds.length} users from auth.users...`);
          
          const { data: authUsersDirect } = await supabaseAdmin
            .from('auth.users')
            .select('id, email')
            .in('id', missingUserIds);

          if (authUsersDirect) {
            authUsersDirect.forEach((u: any) => {
              if (!userMap[u.id]) {
                const email = u.email || 'Unknown';
                userMap[u.id] = {
                  email: email,
                  full_name: email.split('@')[0] || 'Unknown',
                };
              }
            });
          }
        }

        Array.from(userIds).forEach(id => {
          if (!userMap[id]) {
            userMap[id] = {
              email: 'Unknown',
              full_name: 'Unknown User',
            };
          }
        });

        const mappedData = referrals.map((r: any) => {
          const referrer = userMap[r.referrer_id];
          const referred = userMap[r.referred_user_id];
          
          return {
            ...r,
            referrer_email: referrer?.email || 'Unknown',
            referrer_name: referrer?.full_name || 'Unknown',
            referred_email: referred?.email || 'Unknown',
            referred_name: referred?.full_name || 'Unknown',
            referrer_display: referrer?.full_name && referrer.full_name !== 'Unknown' 
              ? referrer.full_name 
              : referrer?.email || 'Unknown',
            referred_display: referred?.full_name && referred.full_name !== 'Unknown'
              ? referred.full_name
              : referred?.email || 'Unknown',
          };
        });

        console.log(`✅ Mapped ${mappedData.length} referrals`);

        return NextResponse.json({
          success: true,
          data: mappedData
        });

      } catch (error) {
        console.error('❌ Error in get-all-referrals:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch referrals'
        }, { status: 500 });
      }
    }

    // ============================================================
    // 6. UPDATE referral status (admin)
    // ============================================================
    if (action === 'update-status') {
      try {
        const { referral_id, status } = body;

        if (!referral_id || !status) {
          return NextResponse.json(
            { success: false, error: 'Referral ID and status are required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabaseAdmin
          .from('referrals')
          .update({ 
            status,
            paid_at: status === 'paid' ? new Date().toISOString() : null
          })
          .eq('id', referral_id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating status:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data
        });
      } catch (error: any) {
        console.error('❌ Error in update-status:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 7. CLAIM referral bonus
    // ============================================================
    if (action === 'claim-bonus' && user_id) {
      try {
        const { data: referrals } = await supabaseAdmin
          .from('referrals')
          .select('*')
          .eq('referrer_id', user_id)
          .eq('status', 'pending');

        if (!referrals || referrals.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No pending referrals found'
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
              paid_at: new Date().toISOString(),
              amount_usdt: amount
            })
            .eq('id', referral.id);

          const { data: payout } = await supabaseAdmin
            .from('referral_payouts')
            .insert({
              user_id: user_id,
              referral_id: referral.id,
              amount_usdt: amount,
              status: 'approved',
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
      } catch (error: any) {
        console.error('❌ Error in claim-bonus:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 8. GET referral stats
    // ============================================================
    if (action === 'stats' && user_id) {
      try {
        console.log('📊 Fetching stats for user:', user_id);
        
        const { data: codeData } = await supabaseAdmin
          .from('user_referral_codes')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();

        const { data: referrals } = await supabaseAdmin
          .from('referrals')
          .select('*')
          .eq('referrer_id', user_id)
          .order('created_at', { ascending: false });

        const { data: payouts } = await supabaseAdmin
          .from('referral_payouts')
          .select('*')
          .eq('user_id', user_id)
          .order('paid_at', { ascending: false });

        const totalReferrals = referrals?.length || 0;
        const totalEarned = payouts?.reduce((sum: number, p: any) => sum + (p.amount_usdt || 0), 0) || 0;
        const pendingPayouts = referrals?.filter((r: any) => r.status === 'pending').length || 0;
        const unreadCount = referrals?.filter((r: any) => r.is_read === false).length || 0;

        const { data: balance } = await supabaseAdmin
          .from('user_balances')
          .select('bonus_usdt, referral_earned, promo_earned')
          .eq('user_id', user_id)
          .single();

        return NextResponse.json({
          success: true,
          data: {
            code: codeData || { code: null, total_clicks: 0, total_signups: 0, total_earned_usdt: 0 },
            referrals: referrals || [],
            payouts: payouts || [],
            total_referrals: totalReferrals,
            total_earned: totalEarned,
            pending_payouts: pendingPayouts,
            bonus_balance: balance?.bonus_usdt || 0,
            referral_earned: balance?.referral_earned || 0,
            promo_earned: balance?.promo_earned || 0,
            promo_balance: balance?.promo_earned || 0,
            unread_count: unreadCount,
          }
        });
      } catch (error: any) {
        console.error('❌ Error in stats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 9. VALIDATE and APPLY promo code
    // ============================================================
    if (action === 'apply-promo' && user_id && promo_code) {
      try {
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

        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          return NextResponse.json({
            success: false,
            error: 'Promo code has expired'
          }, { status: 400 });
        }

        if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) {
          await supabaseAdmin
            .from('promo_codes')
            .update({ is_active: false })
            .eq('id', promo.id);
          
          return NextResponse.json({
            success: false,
            error: 'Promo code has reached its usage limit'
          }, { status: 400 });
        }

        const { data: existingUsage } = await supabaseAdmin
          .from('promo_code_usage')
          .select('*')
          .eq('promo_code_id', promo.id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingUsage) {
          return NextResponse.json({
            success: false,
            error: 'You have already used this promo code'
          }, { status: 400 });
        }

        const bonusAmount = promo.bonus_amount;

        const { data: balance } = await supabaseAdmin
          .from('user_balances')
          .select('bonus_usdt, promo_earned, referral_earned, email')
          .eq('user_id', user_id)
          .single();

        const currentBonus = balance?.bonus_usdt || 0;
        const currentPromoEarned = balance?.promo_earned || 0;
        const newBonus = currentBonus + bonusAmount;
        const newPromoEarned = currentPromoEarned + bonusAmount;

        await supabaseAdmin
          .from('user_balances')
          .update({ 
            bonus_usdt: newBonus,
            promo_earned: newPromoEarned,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);

        await supabaseAdmin
          .from('promo_code_usage')
          .insert({
            promo_code_id: promo.id,
            user_id: user_id,
            bonus_amount: bonusAmount,
          });

        const newUsedCount = (promo.used_count || 0) + 1;
        const shouldDeactivate = promo.usage_limit > 0 && newUsedCount >= promo.usage_limit;

        await supabaseAdmin
          .from('promo_codes')
          .update({ 
            used_count: newUsedCount,
            is_active: shouldDeactivate ? false : true,
          })
          .eq('id', promo.id);

        await supabaseAdmin
          .from('referral_payouts')
          .insert({
            user_id: user_id,
            referral_id: null,
            amount_usdt: bonusAmount,
            status: 'approved',
            paid_at: new Date().toISOString(),
            balance_after: newPromoEarned,
            description: `Promo: ${promo.code}`,
          });

        try {
          await supabaseAdmin
            .from('user_notifications')
            .insert({
              user_id: user_id,
              type: 'promo_code',
              title: '🎉 Promo Code Applied!',
              message: `You received ${bonusAmount} USDT bonus from promo code ${promo.code}!`,
              data: {
                promo_code: promo.code,
                bonus_amount: bonusAmount,
                new_balance: newBonus,
                limit_reached: shouldDeactivate,
              },
              is_read: false,
            });
        } catch (notifError) {
          console.error('Error saving notification:', notifError);
        }

        return NextResponse.json({
          success: true,
          data: {
            bonus_amount: bonusAmount,
            promo_code: promo.code,
            new_balance: newBonus,
            limit_reached: shouldDeactivate,
            used_count: newUsedCount,
            message: shouldDeactivate 
              ? `✅ Promo code applied! The promo code has reached its limit and is now deactivated.`
              : `✅ Promo code applied! You received ${bonusAmount} USDT bonus!`
          }
        });
      } catch (error: any) {
        console.error('❌ Error in apply-promo:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 10. ADMIN: Create promo code
    // ============================================================
    if (action === 'create-promo') {
      try {
        const { code, description, bonus_amount, usage_limit, expires_at } = body;

        if (!code || !bonus_amount) {
          return NextResponse.json({
            success: false,
            error: 'Code and bonus amount are required'
          }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('promo_codes')
          .insert({
            code: code.toUpperCase(),
            description: description || '',
            bonus_amount: bonus_amount,
            bonus_type: 'usdt',
            usage_limit: usage_limit || 0,
            expires_at: expires_at || null,
            is_active: true,
            used_count: 0,
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating promo:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: `✅ Promo code ${code} created successfully!`
        });
      } catch (error: any) {
        console.error('❌ Error in create-promo:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 11. ADMIN: Get all promo codes
    // ============================================================
    if (action === 'get-promos') {
      try {
        const { data, error } = await supabaseAdmin
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching promos:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: data || []
        });
      } catch (error: any) {
        console.error('❌ Error in get-promos:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 12. ADMIN: Toggle promo code status
    // ============================================================
    if (action === 'toggle-promo') {
      try {
        const { promo_id, is_active } = body;

        if (!promo_id) {
          return NextResponse.json({
            success: false,
            error: 'Promo ID is required'
          }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
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
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: `✅ Promo code ${is_active ? 'activated' : 'deactivated'} successfully!`
        });
      } catch (error: any) {
        console.error('❌ Error in toggle-promo:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 13. ADMIN: Delete promo code
    // ============================================================
    if (action === 'delete-promo') {
      try {
        const { promo_id } = body;

        if (!promo_id) {
          return NextResponse.json({
            success: false,
            error: 'Promo ID is required'
          }, { status: 400 });
        }

        await supabaseAdmin
          .from('promo_code_usage')
          .delete()
          .eq('promo_code_id', promo_id);

        const { error } = await supabaseAdmin
          .from('promo_codes')
          .delete()
          .eq('id', promo_id);

        if (error) {
          console.error('❌ Error deleting promo:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: '✅ Promo code deleted successfully!'
        });
      } catch (error: any) {
        console.error('❌ Error in delete-promo:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 14. ADMIN: Update promo code
    // ============================================================
    if (action === 'update-promo') {
      try {
        const { promo_id, description, bonus_amount, usage_limit, expires_at, is_active } = body;

        if (!promo_id) {
          return NextResponse.json({
            success: false,
            error: 'Promo ID is required'
          }, { status: 400 });
        }

        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (description !== undefined) updateData.description = description;
        if (bonus_amount !== undefined) updateData.bonus_amount = bonus_amount;
        if (usage_limit !== undefined) updateData.usage_limit = usage_limit;
        if (expires_at !== undefined) updateData.expires_at = expires_at || null;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabaseAdmin
          .from('promo_codes')
          .update(updateData)
          .eq('id', promo_id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating promo:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: '✅ Promo code updated successfully!'
        });
      } catch (error: any) {
        console.error('❌ Error in update-promo:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 15. MARK REFERRALS AS READ
    // ============================================================
    if (action === 'mark-read' && user_id) {
      try {
        const { data, error } = await supabaseAdmin
          .from('referrals')
          .update({ is_read: true })
          .eq('referrer_id', user_id)
          .eq('is_read', false)
          .select();

        if (error) {
          console.error('❌ Error marking read:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          marked_count: data?.length || 0
        });
      } catch (error: any) {
        console.error('❌ Error in mark-read:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // 16. TRACK REFERRAL CLICK
    // ============================================================
    if (action === 'track-click' && referral_code) {
      try {
        const { data: codeData } = await supabaseAdmin
          .from('user_referral_codes')
          .select('*')
          .eq('code', referral_code)
          .single();

        if (codeData) {
          await supabaseAdmin
            .from('user_referral_codes')
            .update({ 
              total_clicks: (codeData.total_clicks || 0) + 1,
              share_count: (codeData.share_count || 0) + 1
            })
            .eq('code', referral_code);
        }

        await supabaseAdmin
          .from('referral_tracking')
          .insert({
            referral_code,
            action: 'click',
            visitor_ip: request.headers.get('x-forwarded-for') || 'unknown',
            visitor_agent: request.headers.get('user-agent') || 'unknown',
          });

        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('❌ Error in track-click:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================================
    // Invalid action
    // ============================================================
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Referral API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}