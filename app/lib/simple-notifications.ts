// /app/lib/simple-notifications.ts
// STANDALONE notification functions for the signup page

// ============================================================
// HELPER: Get Supabase Admin Client
// ============================================================
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ✅ Better error handling
  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!key) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set, notifications may fail');
    // Return null instead of throwing error
    return null;
  }

  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

// ============================================================
// HELPER: Safe Supabase Client
// ============================================================
function getSafeSupabase() {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.error('Failed to get Supabase client:', error);
    return null;
  }
}

// ============================================================
// SEND EMAIL VIA RESEND
// ============================================================
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not set, skipping email');
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'SmartCodeNova <noreply@smartcodenova.online>',
        to: to,
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Email error:', error);
    } else {
      console.log(`✅ Email sent to ${to}`);
    }
  } catch (error) {
    console.error('❌ Email error:', error);
  }
}

// ============================================================
// SEND TELEGRAM
// ============================================================
async function sendTelegram(chatId: string, message: string) {
  if (!chatId) return;
  
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN_NEW;
    if (!token) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN_NEW not set');
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      console.log(`✅ Telegram sent to ${chatId}`);
    } else {
      const data = await response.json();
      console.error('❌ Telegram error:', data);
    }
  } catch (error) {
    console.error('❌ Telegram error:', error);
  }
}

// ============================================================
// GET USER TELEGRAM CHAT ID
// ============================================================
async function getUserTelegramChatId(userId: string): Promise<string | null> {
  try {
    const supabase = getSafeSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching telegram chat ID:', error);
      return null;
    }
    return data?.telegram_chat_id || null;
  } catch (error) {
    console.error('Error fetching telegram chat ID:', error);
    return null;
  }
}

// ============================================================
// CREATE IN-APP NOTIFICATION
// ============================================================
async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: any = {}
) {
  try {
    const supabase = getSafeSupabase();
    if (!supabase) {
      console.warn('⚠️ Skipping in-app notification - no Supabase client');
      return;
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        data: data,
        is_read: false,
        created_at: new Date().toISOString()
      });
    console.log(`✅ In-app notification created for ${userId}`);
  } catch (error) {
    console.error('❌ In-app notification error:', error);
  }
}

// ============================================================
// SEND TELEGRAM TO ADMIN
// ============================================================
async function sendAdminTelegram(message: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN_NEW;
    if (!token) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN_NEW not set');
      return;
    }

    const supabase = getSafeSupabase();
    if (!supabase) return;

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      console.warn('⚠️ No admins found');
      return;
    }

    for (const admin of admins) {
      const chatId = await getUserTelegramChatId(admin.id);
      if (chatId) {
        await sendTelegram(chatId, message);
      }
    }
  } catch (error) {
    console.error('❌ Admin Telegram error:', error);
  }
}

// ============================================================
// WELCOME EMAIL TEMPLATE
// ============================================================
function welcomeEmailTemplate(name: string, referralCode: string) {
  return `<!DOCTYPE html>
<html>
<head><title>Welcome to SmartCodeNova</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#141a24;border-radius:24px;border:1px solid #2a2a50;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:32px;border-bottom:1px solid #2a2a50;">
          <h1 style="color:#f3f4f6;font-size:24px;margin:0;">SmartCodeNova</h1>
        </td></tr>
        <tr><td style="padding-top:32px;text-align:center;">
          <h1 style="color:#f3f4f6;font-size:24px;margin:0 0 8px 0;">🚀 Welcome Aboard, ${name}!</h1>
          <p style="color:#8e96a3;font-size:16px;margin:0 0 24px 0;">Your journey to automated crypto trading starts now.</p>
          <div style="background:#0b0e14;border-radius:12px;padding:20px;border:1px solid #2a2a50;margin-bottom:24px;">
            <p style="color:#8e96a3;font-size:12px;margin:0 0 8px 0;">Your Referral Code</p>
            <p style="color:#6366f1;font-size:28px;font-weight:700;font-family:monospace;letter-spacing:2px;margin:0;">${referralCode}</p>
            <p style="color:#8e96a3;font-size:12px;margin:8px 0 0 0;">Share this code to earn 7 USDT per referral</p>
          </div>
        </td></tr>
        <tr><td style="padding-top:32px;border-top:1px solid #2a2a50;text-align:center;">
          <p style="color:#8e96a3;font-size:12px;margin:0;">SmartCodeNova – Automated AI Trading Bots</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================
// REFERRAL BONUS EMAIL TEMPLATE
// ============================================================
function referralBonusEmailTemplate(name: string, referredEmail: string, bonusAmount: number, totalReferrals: number) {
  return `<!DOCTYPE html>
<html>
<head><title>You Earned a Referral Bonus!</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#141a24;border-radius:24px;border:1px solid #2a2a50;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:32px;border-bottom:1px solid #2a2a50;">
          <h1 style="color:#f3f4f6;font-size:24px;margin:0;">SmartCodeNova</h1>
        </td></tr>
        <tr><td style="padding-top:32px;text-align:center;">
          <div style="display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:6px 16px;margin-bottom:16px;">
            <span style="color:#10b981;font-size:14px;font-weight:600;">🎉 NEW REFERRAL BONUS</span>
          </div>
          <h1 style="color:#f3f4f6;font-size:24px;font-weight:700;margin:0 0 8px 0;">You Earned ${bonusAmount} USDT! 💰</h1>
          <p style="color:#8e96a3;font-size:16px;margin:0 0 24px 0;"><strong style="color:#f3f4f6;">${referredEmail}</strong> signed up using your referral link.</p>
          <div style="background:#0b0e14;border-radius:12px;padding:24px;border:1px solid rgba(16,185,129,0.2);margin-bottom:24px;">
            <p style="color:#8e96a3;font-size:12px;margin:0 0 8px 0;">Bonus Credited</p>
            <p style="color:#10b981;font-size:36px;font-weight:700;margin:0;">+${bonusAmount} USDT</p>
            <p style="color:#8e96a3;font-size:12px;margin:8px 0 0 0;">Total Referrals: <strong style="color:#f3f4f6;">${totalReferrals}</strong></p>
          </div>
        </td></tr>
        <tr><td style="padding-top:32px;border-top:1px solid #2a2a50;text-align:center;">
          <p style="color:#8e96a3;font-size:12px;margin:0;">SmartCodeNova – Automated AI Trading Bots</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================
// EXPORTED FUNCTIONS
// ============================================================

// 1. NOTIFY ADMIN NEW SIGNUP
export async function notifyAdminNewSignup(userEmail: string, fullName: string) {
  try {
    const html = `
      <div style="background:#0b0e14;padding:20px;font-family:Arial;color:#f3f4f6;">
        <h2 style="color:#3b82f6;">🎉 New User Signup</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;
    await sendEmail('smartcodenova@gmail.com', '🎉 New User Registered', html);
    await sendAdminTelegram(`🎉 <b>New User Signup</b>\n\n👤 Name: ${fullName}\n📧 Email: ${userEmail}`);
    console.log('✅ Admin notified of new signup');
  } catch (error) {
    console.error('❌ Error notifying admin:', error);
  }
}

// 2. NOTIFY USER WELCOME
export async function notifyUserWelcome(
  email: string,
  name: string,
  referralCode: string,
  userId: string
) {
  try {
    const html = welcomeEmailTemplate(name, referralCode);
    await sendEmail(email, '🚀 Welcome to SmartCodeNova!', html);
    console.log('✅ Welcome email sent');

    await createInAppNotification(
      userId,
      'welcome',
      '🎉 Welcome to SmartCodeNova!',
      `Welcome aboard ${name}! Your referral code is ${referralCode}. Share it to earn 7 USDT per referral!`,
      { referral_code: referralCode }
    );
    console.log('✅ Welcome in-app notification created');

    const chatId = await getUserTelegramChatId(userId);
    if (chatId) {
      await sendTelegram(chatId, `🚀 <b>Welcome to SmartCodeNova!</b>\n\n👤 Name: ${name}\n🔑 Referral Code: <code>${referralCode}</code>\n\nShare your code to earn 7 USDT per referral!`);
      console.log('✅ Welcome Telegram sent');
    }
  } catch (error) {
    console.error('❌ Welcome notification error:', error);
  }
}

// 3. NOTIFY USER REFERRAL BONUS
export async function notifyUserReferralBonus(
  email: string,
  name: string,
  referredEmail: string,
  bonusAmount: number,
  totalReferrals: number,
  userId: string
) {
  try {
    const html = referralBonusEmailTemplate(name, referredEmail, bonusAmount, totalReferrals);
    await sendEmail(email, '🎉 You Earned a Referral Bonus!', html);
    console.log('✅ Referral bonus email sent');

    await createInAppNotification(
      userId,
      'referral_bonus',
      '🎉 New Referral Bonus!',
      `${referredEmail} signed up using your referral link! You earned ${bonusAmount} USDT. Total referrals: ${totalReferrals}`,
      {
        referred_email: referredEmail,
        bonus_amount: bonusAmount,
        total_referrals: totalReferrals
      }
    );
    console.log('✅ Referral bonus in-app notification created');

    const chatId = await getUserTelegramChatId(userId);
    if (chatId) {
      await sendTelegram(chatId, `🎉 <b>New Referral Bonus!</b>\n\n👤 Name: ${name}\n📧 Referred: ${referredEmail}\n💰 Bonus: ${bonusAmount} USDT\n📊 Total Referrals: ${totalReferrals}`);
      console.log('✅ Referral bonus Telegram sent');
    }
  } catch (error) {
    console.error('❌ Referral bonus notification error:', error);
  }
}