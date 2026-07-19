import { getSupabaseAdmin } from './supabase-admin';

// ============================================================
// TYPES
// ============================================================

interface UserInfo {
  email: string;
  name: string;
}

interface UserBalance {
  usdt_balance: number;
  bonus_usdt: number;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  amount_usdt: number;
  referred_deposit: number;
  min_deposit_required: number;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

interface ReferralWithUser extends Referral {
  referred_user: {
    id: string;
    email: string;
    full_name: string;
    username: string | null;
  } | null;
}

// ============================================================
// 1. HELPER FUNCTIONS
// ============================================================

async function getUserInfo(userId: string): Promise<UserInfo | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user info:', error);
    return null;
  }

  return { email: data.email || '', name: data.full_name || 'User' };
}

async function getUserBalance(userId: string): Promise<UserBalance | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_balances')
    .select('usdt_balance, bonus_usdt')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user balance:', error);
    return null;
  }

  return data;
}

async function getUserTelegramChatId(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_settings')
    .select('telegram_chat_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.telegram_chat_id;
}

async function sendTelegram(chatId: string, message: string): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN_NEW;
    if (!token || !chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram send error:', error);
  }
}

// ============================================================
// 2. CREATE REFERRAL ON SIGNUP (✅ FOLLOWS GOLDEN RULE)
// ============================================================

export async function createReferralRecord(
  referrerId: string,
  referredUserId: string,
  referralCode: string
): Promise<{ success: boolean; referralId?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // ✅ CREATE REFERRAL WITH STATUS 'pending' - NO BONUS ADDED YET
    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: 'pending',
        amount_usdt: 7,
        referred_deposit: 0,
        min_deposit_required: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral record:', error);
      return { success: false, error: error.message };
    }

    // ✅ Update referrer's total_signups count (but NOT balance!)
    // Get current count first
    const { data: codeData } = await supabase
      .from('user_referral_codes')
      .select('total_signups')
      .eq('user_id', referrerId)
      .single();

    if (codeData) {
      await supabase
        .from('user_referral_codes')
        .update({ total_signups: (codeData.total_signups || 0) + 1 })
        .eq('user_id', referrerId);
    }

    console.log(`✅ Referral record created with status 'pending' for ${referredUserId}`);

    // Send notification to referrer that someone signed up (but no bonus yet)
    await notifyReferrerNewSignup(referrerId, referredUserId, referral.id);

    return { success: true, referralId: referral.id };
  } catch (error) {
    console.error('Error in createReferralRecord:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 3. CHECK REFERRAL ELIGIBILITY ON DEPOSIT
// ============================================================

export async function checkReferralEligibility(
  userId: string
): Promise<{
  eligible: boolean;
  referralId?: string;
  depositAmount?: number;
  minRequired?: number;
  message: string;
}> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if this user was referred and is still pending
    const { data: referral, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (error || !referral) {
      return { eligible: false, message: 'No pending referral found' };
    }

    // Check user's balance
    const balance = await getUserBalance(userId);
    if (!balance) {
      return { eligible: false, message: 'User balance not found' };
    }

    const depositAmount = balance.usdt_balance || 0;

    // ✅ Check if deposit meets minimum requirement
    if (depositAmount >= referral.min_deposit_required) {
      // ✅ Update referral status to 'approved' (still NO bonus added!)
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'approved',
          referred_deposit: depositAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Error updating referral status:', updateError);
        return { eligible: false, message: 'Failed to update referral' };
      }

      // ✅ Notify admin that referral is ready for payout
      await notifyAdminReferralReady(referral.referrer_id, userId, depositAmount, referral.id);

      // ✅ Notify referrer that their referral is now eligible for bonus
      await notifyReferrerEligible(referral.referrer_id, userId, depositAmount, referral.id);

      return {
        eligible: true,
        referralId: referral.id,
        depositAmount: depositAmount,
        minRequired: referral.min_deposit_required,
        message: 'Referral is now eligible for bonus payout. Admin must mark as paid.'
      };
    }

    return {
      eligible: false,
      depositAmount: depositAmount,
      minRequired: referral.min_deposit_required,
      message: `Need ${referral.min_deposit_required} USDT deposit (current: ${depositAmount} USDT)`
    };
  } catch (error) {
    console.error('Error checking referral eligibility:', error);
    return { eligible: false, message: 'Error checking eligibility' };
  }
}

// ============================================================
// 4. PAY REFERRAL BONUS (✅ ONLY CALLED BY ADMIN)
// ============================================================

export async function payReferralBonus(
  referralId: string
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    const supabase = getSupabaseAdmin();

    // Get referral details
    const { data: referral, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (error || !referral) {
      return { success: false, message: 'Referral not found' };
    }

    // ✅ Only approved referrals can be paid
    if (referral.status !== 'approved') {
      return { 
        success: false, 
        message: `Referral status is ${referral.status}, expected 'approved'` 
      };
    }

    // ✅ Add bonus to referrer's balance (NOW it gets added!)
    const referrerBalance = await getUserBalance(referral.referrer_id);
    if (!referrerBalance) {
      return { success: false, message: 'Referrer balance not found' };
    }

    const newBonus = (referrerBalance.bonus_usdt || 0) + referral.amount_usdt;

    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({ bonus_usdt: newBonus })
      .eq('user_id', referral.referrer_id);

    if (updateBalanceError) {
      return { success: false, message: 'Failed to update referrer balance' };
    }

    // ✅ Update referral status to 'paid'
    const { error: updateReferralError } = await supabase
      .from('referrals')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', referralId);

    if (updateReferralError) {
      return { success: false, message: 'Failed to update referral status' };
    }

    // ✅ Create payout record
    const { error: payoutError } = await supabase
      .from('referral_payouts')
      .insert({
        user_id: referral.referrer_id,
        referral_id: referral.id,
        amount_usdt: referral.amount_usdt,
        status: 'completed',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
    }

    // ✅ Update total earned in referral codes
    const { data: codeData } = await supabase
      .from('user_referral_codes')
      .select('total_earned_usdt')
      .eq('user_id', referral.referrer_id)
      .single();

    if (codeData) {
      await supabase
        .from('user_referral_codes')
        .update({ 
          total_earned_usdt: (codeData.total_earned_usdt || 0) + referral.amount_usdt 
        })
        .eq('user_id', referral.referrer_id);
    }

    // ✅ Notify referrer about the bonus
    await notifyReferrerBonusPaid(
      referral.referrer_id,
      referral.referred_user_id,
      referral.amount_usdt,
      referralId
    );

    return {
      success: true,
      message: `Bonus of ${referral.amount_usdt} USDT paid to referrer`,
      newBalance: newBonus
    };
  } catch (error) {
    console.error('Error paying referral bonus:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============================================================
// 5. NOTIFICATION FUNCTIONS
// ============================================================

// --- Notify referrer that someone signed up (no bonus yet) ---
async function notifyReferrerNewSignup(
  referrerId: string, 
  referredUserId: string, 
  referralId: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const referrerInfo = await getUserInfo(referrerId);
    const referredInfo = await getUserInfo(referredUserId);

    if (!referrerInfo) return;

    // Get total referrals count
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrerId);

    // ✅ Create in-app notification - NO BONUS ADDED YET
    await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        type: 'referral_pending',
        title: '📝 New Referral Signup',
        message: `${referredInfo?.name || 'Someone'} signed up using your referral link! They need to deposit 50+ USDT for you to earn 7 USDT bonus.`,
        data: {
          referral_id: referralId,
          referred_user_id: referredUserId,
          total_referrals: count || 0,
          status: 'pending'
        },
        is_read: false,
        created_at: new Date().toISOString()
      });

    // Send Telegram - NO BONUS ADDED YET
    const chatId = await getUserTelegramChatId(referrerId);
    if (chatId) {
      await sendTelegram(
        chatId,
        `📝 <b>New Referral Signup</b>\n\n` +
        `👤 ${referredInfo?.name || 'Someone'} signed up using your link!\n` +
        `💰 Bonus: 7 USDT (pending deposit of 50+ USDT)\n` +
        `📊 Total Referrals: ${count || 0}\n\n` +
        `⏳ Waiting for deposit...`
      );
    }
  } catch (error) {
    console.error('Error notifying referrer of new signup:', error);
  }
}

// --- Notify admin that referral is ready for payout ---
async function notifyAdminReferralReady(
  referrerId: string, 
  referredUserId: string, 
  depositAmount: number, 
  referralId: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const referrerInfo = await getUserInfo(referrerId);
    const referredInfo = await getUserInfo(referredUserId);

    // Get all admin users
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins) return;

    // ✅ Send notification to all admins
    for (const admin of admins) {
      await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          type: 'referral_ready',
          title: '💰 Referral Bonus Ready for Payout',
          message: `${referrerInfo?.name || 'User'} has earned 7 USDT from ${referredInfo?.name || 'their referral'} (deposit: ${depositAmount} USDT). Click to pay out.`,
          data: {
            referral_id: referralId,
            referrer_id: referrerId,
            referred_user_id: referredUserId,
            amount: 7
          },
          is_read: false,
          created_at: new Date().toISOString()
        });
    }

    // Send Telegram to admins
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await sendTelegram(
        adminChatId,
        `💰 <b>Referral Bonus Ready for Payout</b>\n\n` +
        `👤 Referrer: ${referrerInfo?.name || 'Unknown'}\n` +
        `📧 Email: ${referrerInfo?.email || 'Unknown'}\n` +
        `👤 Referred: ${referredInfo?.name || 'Unknown'}\n` +
        `💰 Deposit: ${depositAmount} USDT\n` +
        `🎁 Bonus: 7 USDT\n` +
        `🆔 Referral ID: ${referralId}\n\n` +
        `⚠️ Admin action required: Pay out the bonus in admin panel.`
      );
    }
  } catch (error) {
    console.error('Error notifying admin of ready referral:', error);
  }
}

// --- Notify referrer that their referral is now eligible ---
async function notifyReferrerEligible(
  referrerId: string, 
  referredUserId: string, 
  depositAmount: number, 
  referralId: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const referrerInfo = await getUserInfo(referrerId);
    const referredInfo = await getUserInfo(referredUserId);

    if (!referrerInfo) return;

    // ✅ Create in-app notification - STILL NO BONUS ADDED
    await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        type: 'referral_eligible',
        title: '✅ Referral Bonus Ready',
        message: `${referredInfo?.name || 'Your referral'} deposited ${depositAmount} USDT! You are now eligible for 7 USDT bonus. Admin will approve it soon.`,
        data: {
          referral_id: referralId,
          referred_user_id: referredUserId,
          deposit_amount: depositAmount,
          status: 'approved'
        },
        is_read: false,
        created_at: new Date().toISOString()
      });

    // Send Telegram
    const chatId = await getUserTelegramChatId(referrerId);
    if (chatId) {
      await sendTelegram(
        chatId,
        `✅ <b>Referral Bonus Ready!</b>\n\n` +
        `👤 ${referredInfo?.name || 'Your referral'} deposited ${depositAmount} USDT!\n` +
        `💰 You're eligible for 7 USDT bonus\n` +
        `⏳ Waiting for admin approval...`
      );
    }
  } catch (error) {
    console.error('Error notifying referrer of eligibility:', error);
  }
}

// --- Notify referrer that bonus has been paid ---
async function notifyReferrerBonusPaid(
  referrerId: string, 
  referredUserId: string, 
  bonusAmount: number, 
  referralId: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const referrerInfo = await getUserInfo(referrerId);
    const referredInfo = await getUserInfo(referredUserId);

    if (!referrerInfo) return;

    // Get total referrals count
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrerId)
      .eq('status', 'paid');

    // ✅ Create in-app notification - BONUS ADDED!
    await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        type: 'referral_paid',
        title: '🎉 Referral Bonus Paid!',
        message: `You earned ${bonusAmount} USDT from ${referredInfo?.name || 'your referral'}! Total paid referrals: ${count || 0}`,
        data: {
          referral_id: referralId,
          referred_user_id: referredUserId,
          amount: bonusAmount,
          total_paid: count || 0,
          status: 'paid'
        },
        is_read: false,
        created_at: new Date().toISOString()
      });

    // Send Telegram
    const chatId = await getUserTelegramChatId(referrerId);
    if (chatId) {
      await sendTelegram(
        chatId,
        `🎉 <b>Referral Bonus Paid!</b>\n\n` +
        `💰 You earned ${bonusAmount} USDT from ${referredInfo?.name || 'your referral'}!\n` +
        `📊 Total Paid Referrals: ${count || 0}\n\n` +
        `✅ Bonus has been added to your bonus balance.`
      );
    }
  } catch (error) {
    console.error('Error notifying referrer of bonus payment:', error);
  }
}

// ============================================================
// 6. GET REFERRAL STATUS (FOR DASHBOARD)
// ============================================================

export async function getReferralStatus(
  referrerId: string
): Promise<{
  success: boolean;
  data?: {
    referrals: ReferralWithUser[];
    stats: {
      total: number;
      pending: number;
      approved: number;
      paid: number;
      rejected: number;
      pending_payout: number;
    };
  };
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:referred_user_id (
          id,
          email,
          full_name,
          username
        )
      `)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });

    if (error || !referrals) {
      return { success: false, error: error?.message || 'No referrals found' };
    }

    // ✅ Calculate correct counts with proper typing
    const typedReferrals = referrals as unknown as ReferralWithUser[];
    
    const total = typedReferrals.length;
    const pending = typedReferrals.filter((r: ReferralWithUser) => r.status === 'pending').length;
    const approved = typedReferrals.filter((r: ReferralWithUser) => r.status === 'approved').length;
    const paid = typedReferrals.filter((r: ReferralWithUser) => r.status === 'paid').length;
    const rejected = typedReferrals.filter((r: ReferralWithUser) => r.status === 'rejected').length;

    // ✅ Get pending payout amount (only approved)
    const pendingPayoutAmount = typedReferrals
      .filter((r: ReferralWithUser) => r.status === 'approved')
      .reduce((sum: number, r: ReferralWithUser) => sum + Number(r.amount_usdt), 0);

    return {
      success: true,
      data: {
        referrals: typedReferrals,
        stats: {
          total,
          pending, // Waiting for deposit
          approved, // Ready for payout (admin action needed)
          paid, // Already paid
          rejected,
          pending_payout: pendingPayoutAmount
        }
      }
    };
  } catch (error) {
    console.error('Error getting referral status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}