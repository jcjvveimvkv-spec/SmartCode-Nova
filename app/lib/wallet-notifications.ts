// /app/lib/wallet-notifications.ts
// STANDALONE notification functions for wallet/deposit pages
// Does NOT import from the complex notifications.ts file

import { createClient } from '@supabase/supabase-js';

// ============================================================
// HELPER: Get Supabase Admin Client
// ============================================================
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('⚠️ Supabase credentials missing, notifications may fail');
    return null;
  }

  return createClient(url, key);
}

// ============================================================
// SEND EMAIL VIA RESEND
// ============================================================
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not set');
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
      console.error('❌ Email error:', await response.text());
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
    if (!token) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    console.log(`✅ Telegram sent to ${chatId}`);
  } catch (error) {
    console.error('❌ Telegram error:', error);
  }
}

// ============================================================
// GET USER TELEGRAM CHAT ID
// ============================================================
async function getUserTelegramChatId(email: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_balances')
      .select('telegram_chat_id')
      .eq('email', email)
      .single();

    if (error) return null;
    return data?.telegram_chat_id || null;
  } catch {
    return null;
  }
}

// ============================================================
// SEND TELEGRAM TO ADMIN
// ============================================================
async function sendAdminTelegram(message: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN_NEW;
    if (!token) return;

    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins) return;

    // Get admin emails first
    for (const admin of admins) {
      const { data: user } = await supabase
        .from('user_balances')
        .select('email')
        .eq('user_id', admin.id)
        .single();

      if (user?.email) {
        const chatId = await getUserTelegramChatId(user.email);
        if (chatId) {
          await sendTelegram(chatId, message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Admin Telegram error:', error);
  }
}

// ============================================================
// NOTIFY USER: DEPOSIT PROCESSING
// ============================================================
export async function notifyUserDepositProcessing(
  userEmail: string,
  userName: string,
  amount: number,
  network: string,
  txid: string
) {
  try {
    const html = `
      <div style="background-color: #0b0e14; padding: 40px; font-family: Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px;">
          <h1 style="color: #f3f4f6; font-size: 24px; text-align: center;">Deposit Request Received 📥</h1>
          <p style="color: #8e96a3; text-align: center;">We are processing your deposit.</p>
          <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40;">
            <p><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${userName}</span></p>
            <p><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #10b981;">${amount} USDT</span></p>
            <p><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
            <p><strong style="color: #f3f4f6;">TXID:</strong> <span style="color: #f59e0b;">${txid}</span></p>
            <p><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #f59e0b;">Pending Verification</span></p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(userEmail, 'Deposit Request Received', html);

    const chatId = await getUserTelegramChatId(userEmail);
    if (chatId) {
      await sendTelegram(chatId, `📥 <b>Deposit Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🟡 Status: Pending Verification`);
    }
  } catch (error) {
    console.error('❌ Deposit processing notification error:', error);
  }
}

// ============================================================
// NOTIFY ADMIN: NEW DEPOSIT
// ============================================================
export async function notifyAdminNewDeposit(
  userEmail: string,
  amount: number,
  txid: string,
  network: string
) {
  try {
    const html = `
      <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
        <h2 style="color: #f59e0b;">🚨 New Pending Deposit</h2>
        <p><strong>User:</strong> ${userEmail}</p>
        <p><strong>Amount:</strong> ${amount} USDT</p>
        <p><strong>Network:</strong> ${network}</p>
        <p><strong>TXID:</strong> ${txid}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;

    await sendEmail('smartcodenova@gmail.com', '🚨 New Deposit Request', html);
    await sendAdminTelegram(`🚨 <b>New Deposit Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🔗 TXID: ${txid}`);
    console.log('✅ Admin notified of new deposit');
  } catch (error) {
    console.error('❌ Admin deposit notification error:', error);
  }
}