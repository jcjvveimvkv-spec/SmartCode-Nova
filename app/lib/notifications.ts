import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '8593494227:AAEYRi07rcGtCJSA0lALD4HtIPAM-WdZNMU';
const ADMIN_EDGE_FUNCTION_URL = 'https://texuzrwyjecjxkrnemeg.supabase.co/functions/v1/send-admin-email';
const LOGO_URL = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';

// ============================================================
// 1. CORE FUNCTIONS
// ============================================================

// --- SEND TELEGRAM TO BOTH ADMINS ---
export async function sendAdminTelegram(message: string) {
  try {
    const response = await fetch(ADMIN_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'get-telegram-ids' })
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Telegram IDs from Secrets');
      return;
    }

    const { id1, id2 } = await response.json();

    if (id1) {
      try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: id1,
          text: message,
          parse_mode: 'HTML'
        });
        console.log(`📱 Telegram sent to ID 1: ${id1}`);
      } catch (err: any) {
        console.error(`❌ Telegram Error (ID 1):`, err.response?.data || err.message);
      }
    }

    if (id2) {
      try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: id2,
          text: message,
          parse_mode: 'HTML'
        });
        console.log(`📱 Telegram sent to ID 2: ${id2}`);
      } catch (err: any) {
        console.error(`❌ Telegram Error (ID 2):`, err.response?.data || err.message);
      }
    }
  } catch (err: any) {
    console.error('❌ sendAdminTelegram Error:', err.message);
  }
}

// --- SEND TELEGRAM (USER) ---
export async function sendTelegram(chatId: string, message: string) {
  if (!chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    console.log(`📱 Telegram sent to ${chatId}`);
  } catch (err: any) {
    console.error('❌ Telegram Error:', err.response?.data || err.message);
  }
}

// --- SEND EMAIL VIA EDGE FUNCTION (DYNAMIC SENDER) ---
export async function sendEmail(to: string, subject: string, html: string, category: 'info' | 'support' | 'reports' = 'info') {
  const senderMap = {
    info: 'SmartCodeNova <info@smartcodenova.online>',
    support: 'SmartCodeNova Support <support@smartcodenova.online>',
    reports: 'SmartCodeNova Reports <reports@smartcodenova.online>',
  };

  try {
    const response = await fetch(ADMIN_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'send-email',
        to: to,
        from: senderMap[category],
        subject: subject,
        html: html
      })
    });
    if (!response.ok) {
      throw new Error('Edge Function error');
    }
    console.log(`📧 Email sent to ${to} via ${senderMap[category]}`);
  } catch (err: any) {
    console.error('❌ Email Error:', err.message || err);
  }
}

// ============================================================
// 2. ADMIN NOTIFICATIONS
// ============================================================

// --- NOTIFY ADMIN: NEW SIGNUP ---
export async function notifyAdminNewSignup(userEmail: string, fullName: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #3b82f6;">🎉 New User Signup</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
    </div>
  `;
  await sendEmail('smartcodenova@gmail.com', '🎉 New User Registered', html, 'info');
  const msg = `🎉 <b>New User Signup</b>\n\n👤 Name: ${fullName}\n📧 Email: ${userEmail}`;
  await sendAdminTelegram(msg);
}

// --- NOTIFY ADMIN: NEW DEPOSIT ---
export async function notifyAdminNewDeposit(userEmail: string, amount: number, txid: string, network: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #f59e0b;">🚨 New Pending Deposit</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Amount:</strong> ${amount} USDT</p>
      <p><strong>Network:</strong> ${network}</p>
      <p><strong>TXID:</strong> ${txid}</p>
    </div>
  `;
  await sendEmail('smartcodenova@gmail.com', '🚨 New Deposit Request', html, 'info');
  const msg = `🚨 <b>New Deposit Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🔗 TXID: ${txid}`;
  await sendAdminTelegram(msg);
}

// --- NOTIFY ADMIN: NEW WITHDRAWAL ---
export async function notifyAdminNewWithdrawal(userEmail: string, userName: string, amount: number, fee: number, netAmount: number, walletAddress: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #f59e0b;">🚨 New Withdrawal Request</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Amount:</strong> ${amount} USDT</p>
      <p><strong>Fee (3%):</strong> ${fee.toFixed(2)} USDT</p>
      <p><strong>Net Amount:</strong> ${netAmount.toFixed(2)} USDT</p>
      <p><strong>Wallet:</strong> ${walletAddress}</p>
    </div>
  `;
  await sendEmail('smartcodenova@gmail.com', '🚨 New Withdrawal Request', html, 'info');
  const msg = `🚨 <b>New Withdrawal Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}`;
  await sendAdminTelegram(msg);
}

// --- NOTIFY ADMIN: NEW BOT PURCHASE ---
export async function notifyAdminNewBotPurchase(userEmail: string, botName: string, amount: number) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #10b981;">🤖 New Bot Purchase</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Bot:</strong> ${botName}</p>
      <p><strong>Amount:</strong> ${amount} USDT</p>
    </div>
  `;
  await sendEmail('smartcodenova@gmail.com', '🤖 New Bot Activated', html, 'info');
  const msg = `🤖 <b>New Bot Activated</b>\n\n👤 User: ${userEmail}\n🤖 Bot: ${botName}\n💰 Amount: ${amount} USDT`;
  await sendAdminTelegram(msg);
}

// ============================================================
// 3. USER NOTIFICATIONS (Existing)
// ============================================================

// --- NOTIFY USER: DEPOSIT PROCESSING ---
export async function notifyUserDepositProcessing(userEmail: string, userName: string, amount: number, network: string, txid: string, telegramChatId?: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
          <span style="font-size: 20px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
        </div>

        <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">Deposit Request Received 📥</h1>
        <p style="color: #8e96a3; font-size: 16px; text-align: center; margin: 0 0 24px 0;">We have received your deposit request and are processing it.</p>

        <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">User</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 500;">${userName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Amount</span>
            <span style="color: #10b981; font-size: 14px; font-weight: 600;">${amount} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Network</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 500;">${network}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">TXID</span>
            <span style="color: #f59e0b; font-size: 12px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${txid}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #8e96a3; font-size: 14px;">Status</span>
            <span style="color: #f59e0b; font-size: 14px; font-weight: 600;">Pending Verification</span>
          </div>
        </div>

        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 0;">Our admin team is currently verifying your transaction. You will receive a confirmation email once the deposit is approved.</p>
        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Deposit Request Received', html, 'info');

  if (telegramChatId) {
    const tgMsg = `📥 <b>Deposit Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🔗 TXID: ${txid}\n🟡 Status: Pending Verification`;
    await sendTelegram(telegramChatId, tgMsg);
  }
}

// --- NOTIFY USER: DEPOSIT APPROVED ---
export async function notifyUserDepositApproved(userEmail: string, userName: string, amount: number, newBalance: number, telegramChatId?: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
          <span style="font-size: 20px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
        </div>

        <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">Deposit Approved! ✅</h1>
        <p style="color: #8e96a3; font-size: 16px; text-align: center; margin: 0 0 24px 0;">Your deposit has been successfully verified and credited to your wallet.</p>

        <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">User</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 500;">${userName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Amount Credited</span>
            <span style="color: #10b981; font-size: 14px; font-weight: 600;">${amount} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">New Funding Balance</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 600;">${newBalance.toFixed(2)} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #8e96a3; font-size: 14px;">Status</span>
            <span style="color: #10b981; font-size: 14px; font-weight: 600;">Approved</span>
          </div>
        </div>

        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 20px 0;">The funds have been successfully credited to your account. You may visit the Asset History page to view the details.</p>
        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 0 0 20px 0;">If you need any assistance, please contact Live Chat support or submit a ticket for further help.</p>

        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Deposit Approved & Credited ✅', html, 'info');

  if (telegramChatId) {
    const tgMsg = `✅ <b>Deposit Approved!</b>\n\n👤 User: ${userName}\n💰 Amount Credited: ${amount} USDT\n📊 New Balance: ${newBalance.toFixed(2)} USDT\n🟢 Status: Approved`;
    await sendTelegram(telegramChatId, tgMsg);
  }
}

// --- NOTIFY USER: WITHDRAWAL REQUESTED ---
export async function notifyUserWithdrawalRequested(userEmail: string, userName: string, amount: number, fee: number, netAmount: number, walletAddress: string, network: string, telegramChatId?: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
          <span style="font-size: 20px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
        </div>

        <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">Withdrawal Request Received 📤</h1>
        <p style="color: #8e96a3; font-size: 16px; text-align: center; margin: 0 0 24px 0;">Your withdrawal request is being processed.</p>

        <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">User</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 500;">${userName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Amount Requested</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 600;">${amount} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Fee (3%)</span>
            <span style="color: #ef4444; font-size: 14px; font-weight: 600;">-${fee.toFixed(2)} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Net Amount</span>
            <span style="color: #10b981; font-size: 14px; font-weight: 600;">${netAmount.toFixed(2)} USDT</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Destination Wallet</span>
            <span style="color: #f59e0b; font-size: 12px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${walletAddress}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a40;">
            <span style="color: #8e96a3; font-size: 14px;">Network</span>
            <span style="color: #f3f4f6; font-size: 14px; font-weight: 500;">${network}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #8e96a3; font-size: 14px;">Status</span>
            <span style="color: #f59e0b; font-size: 14px; font-weight: 600;">Pending Admin Approval</span>
          </div>
        </div>

        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 20px 0;">Your funds will be sent to the provided wallet address once the admin approves this request.</p>

        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Withdrawal Request Received', html, 'info');

  if (telegramChatId) {
    const tgMsg = `📤 <b>Withdrawal Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}\n🌐 Network: ${network}\n🟡 Status: Pending Admin Approval`;
    await sendTelegram(telegramChatId, tgMsg);
  }
}

// ============================================================
// 4. EMAIL TEMPLATES (Existing)
// ============================================================

export function depositInitiatedUserEmail(name: string, amount: number, network: string) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <h2 style="color: #6366f1; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">Deposit Request Received</h2>
        <p style="color: #8e96a3; font-size: 16px; margin: 0 0 20px 0;">We have received your deposit request.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${name}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 18px;">${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #f59e0b; background-color: rgba(245,158,11,0.1); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Pending Verification</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 14px; margin-top: 20px;">Our admin team is currently verifying your transaction on the blockchain. You will receive a confirmation email once your deposit is approved and credited to your wallet.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
        <p style="color: #8e96a3; font-size: 12px; text-align: center;">SmartCodeNova Support Team</p>
      </div>
    </div>
  `;
}

export function depositApprovedUserEmail(name: string, amount: number, newBalance: number) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #10b981; color: white; font-size: 24px; padding: 12px; border-radius: 50%; display: inline-block;">✅</span>
        </div>
        <h2 style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">Deposit Approved!</h2>
        <p style="color: #8e96a3; font-size: 16px; margin: 0 0 20px 0;">Your deposit has been successfully verified and credited.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${name}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Credited Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 20px;">+${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">New Funding Balance:</strong> <span style="color: #f3f4f6; font-weight: 700;">${newBalance.toFixed(2)} USDT</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 14px; margin-top: 20px;">You can now activate a trading bot or start trading directly from your dashboard.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
        <p style="color: #8e96a3; font-size: 12px; text-align: center;">SmartCodeNova Support Team</p>
      </div>
    </div>
  `;
}

export function adminDepositAlert(email: string, name: string, amount: number, txid: string, network: string) {
  return `
    <div style="background-color: #0b0e14; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif; color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141a24; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 48px; width: auto;" />
        </div>
        <div style="text-align: center; margin-bottom: 10px;">
          <span style="background-color: #ef4444; color: white; font-size: 16px; padding: 10px 16px; border-radius: 20px; font-weight: 700;">🚨 ADMIN ALERT</span>
        </div>
        <h2 style="color: #f3f4f6; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">New Pending Deposit</h2>
        <p style="color: #8e96a3; font-size: 14px; margin: 0 0 20px 0;">A user has submitted a new deposit request. Please verify the TXID and approve it.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">User:</strong> <span style="color: #8e96a3;">${email}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #10b981; font-weight: 700; font-size: 18px;">${amount} USDT</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">TXID:</strong> <span style="color: #f59e0b; word-break: break-all; font-size: 12px;">${txid}</span></p>
          <p style="margin: 5px 0;"><strong style="color: #f3f4f6;">Date/Time:</strong> <span style="color: #8e96a3;">${new Date().toLocaleString()}</span></p>
        </div>

        <p style="color: #8e96a3; font-size: 12px; margin-top: 20px;">Verify the TXID on the blockchain, then approve this deposit in the Admin Panel.</p>
      </div>
    </div>
  `;
}

// ============================================================
// 5. NEW NOTIFICATIONS - WELCOME, REFERRAL BONUS, PROMO CLAIM
// ============================================================

// --- HELPER: Get User Telegram Chat ID ---
export async function getUserTelegramChatId(email: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(`${supabaseUrl}/rest/v1/user_balances?select=telegram_chat_id&email=eq.${encodeURIComponent(email)}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const data = await response.json();
    if (data && data.length > 0 && data[0].telegram_chat_id) {
      return data[0].telegram_chat_id;
    }
    return null;
  } catch (error) {
    console.error('Error fetching telegram chat ID:', error);
    return null;
  }
}

// --- HELPER: Create In-App Notification ---
export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: any = {}
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(`${supabaseUrl}/rest/v1/user_notifications`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        data: data,
        is_read: false,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to create in-app notification:', await response.text());
    } else {
      console.log(`✅ In-app notification created for ${userId}`);
    }
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }
}

// --- 1. WELCOME EMAIL TEMPLATE ---
export function welcomeEmailTemplate(name: string, referralCode: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SmartCodeNova</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">🚀 Welcome Aboard, ${name}!</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;">Your journey to automated crypto trading starts now.</p>
                            <p style="color: #8e96a3; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5;">We're excited to have you on board. Here's your personal referral code to share with friends and earn rewards.</p>
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px;">
                                <p style="color: #8e96a3; font-size: 12px; margin: 0 0 8px 0;">Your Referral Code</p>
                                <p style="color: #6366f1; font-size: 28px; font-weight: 700; font-family: monospace; letter-spacing: 2px; margin: 0;">${referralCode}</p>
                                <p style="color: #8e96a3; font-size: 12px; margin: 8px 0 0 0;">Share this code to earn 7 USDT per referral</p>
                            </div>
                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">Go to Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// --- 2. REFERRAL BONUS EMAIL TEMPLATE ---
export function referralBonusEmailTemplate(name: string, referredEmail: string, bonusAmount: number, totalReferrals: number) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You Earned a Referral Bonus!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 6px 16px; margin-bottom: 16px;">
                                <span style="color: #10b981; font-size: 14px; font-weight: 600;">🎉 NEW REFERRAL BONUS</span>
                            </div>
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">You Earned ${bonusAmount} USDT! 💰</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;"><strong style="color: #f3f4f6;">${referredEmail}</strong> signed up using your referral link.</p>
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 24px; border: 1px solid rgba(16, 185, 129, 0.2); margin-bottom: 24px;">
                                <p style="color: #8e96a3; font-size: 12px; margin: 0 0 8px 0;">Bonus Credited</p>
                                <p style="color: #10b981; font-size: 36px; font-weight: 700; margin: 0;">+${bonusAmount} USDT</p>
                                <p style="color: #8e96a3; font-size: 12px; margin: 8px 0 0 0;">Total Referrals: <strong style="color: #f3f4f6;">${totalReferrals}</strong></p>
                            </div>
                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard/referral" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">View Your Referrals</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// --- 3. PROMO CLAIM EMAIL TEMPLATE ---
export function promoClaimEmailTemplate(name: string, promoCode: string, bonusAmount: number, newBalance: number) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promo Code Applied!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px; padding: 6px 16px; margin-bottom: 16px;">
                                <span style="color: #6366f1; font-size: 14px; font-weight: 600;">🎉 PROMO CODE APPLIED</span>
                            </div>
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Promo Code Applied! 🎉</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;">You successfully applied <strong style="color: #6366f1; font-family: monospace; font-size: 18px;">${promoCode}</strong></p>
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 24px; border: 1px solid rgba(99, 102, 241, 0.2); margin-bottom: 24px;">
                                <p style="color: #8e96a3; font-size: 12px; margin: 0 0 8px 0;">Bonus Credited</p>
                                <p style="color: #6366f1; font-size: 36px; font-weight: 700; margin: 0;">+${bonusAmount} USDT</p>
                                <p style="color: #8e96a3; font-size: 12px; margin: 8px 0 0 0;">New Balance: <strong style="color: #f3f4f6;">${newBalance} USDT</strong></p>
                            </div>
                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard/wallet" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">View Your Wallet</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// --- 4. WELCOME NOTIFICATION (Email + Telegram + In-App) ---
export async function notifyUserWelcome(
  email: string,
  name: string,
  referralCode: string,
  userId: string
) {
  try {
    const html = welcomeEmailTemplate(name, referralCode);
    await sendEmail(email, '🚀 Welcome to SmartCodeNova!', html, 'info');
    console.log('✅ Welcome email sent');

    await createInAppNotification(
      userId,
      'welcome',
      '🎉 Welcome to SmartCodeNova!',
      `Welcome aboard ${name}! Your referral code is ${referralCode}. Share it to earn 7 USDT per referral!`,
      { referral_code: referralCode }
    );
    console.log('✅ Welcome in-app notification created');

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `🚀 <b>Welcome to SmartCodeNova!</b>\n\n👤 Name: ${name}\n🔑 Referral Code: <code>${referralCode}</code>\n\nShare your code to earn 7 USDT per referral!`;
      await sendTelegram(chatId, tgMsg);
      console.log('✅ Welcome Telegram sent');
    }
  } catch (error) {
    console.error('❌ Welcome notification error:', error);
  }
}

// --- 5. REFERRAL BONUS NOTIFICATION (Email + Telegram + In-App) ---
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
    await sendEmail(email, '🎉 You Earned a Referral Bonus!', html, 'info');
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

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `🎉 <b>New Referral Bonus!</b>\n\n👤 Name: ${name}\n📧 Referred: ${referredEmail}\n💰 Bonus: ${bonusAmount} USDT\n📊 Total Referrals: ${totalReferrals}`;
      await sendTelegram(chatId, tgMsg);
      console.log('✅ Referral bonus Telegram sent');
    }
  } catch (error) {
    console.error('❌ Referral bonus notification error:', error);
  }
}

// --- 6. PROMO CLAIM NOTIFICATION (Email + Telegram + In-App) ---
export async function notifyUserPromoClaim(
  email: string,
  name: string,
  promoCode: string,
  bonusAmount: number,
  newBalance: number,
  userId: string
) {
  try {
    const html = promoClaimEmailTemplate(name, promoCode, bonusAmount, newBalance);
    await sendEmail(email, '🎉 Promo Code Applied Successfully!', html, 'info');
    console.log('✅ Promo claim email sent');

    await createInAppNotification(
      userId,
      'promo_claim',
      '🎉 Promo Code Applied!',
      `You received ${bonusAmount} USDT bonus from promo code ${promoCode}! New balance: ${newBalance} USDT`,
      {
        promo_code: promoCode,
        bonus_amount: bonusAmount,
        new_balance: newBalance
      }
    );
    console.log('✅ Promo claim in-app notification created');

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `🎉 <b>Promo Code Applied!</b>\n\n👤 Name: ${name}\n🔑 Code: <code>${promoCode}</code>\n💰 Bonus: +${bonusAmount} USDT\n📊 New Balance: ${newBalance} USDT`;
      await sendTelegram(chatId, tgMsg);
      console.log('✅ Promo claim Telegram sent');
    }
  } catch (error) {
    console.error('❌ Promo claim notification error:', error);
  }
}

// ============================================================
// 6. CARD NOTIFICATIONS (NEW - Professional Email Templates)
// ============================================================

// --- CARD EMAIL TEMPLATES ---

export function cardApplicationSubmittedEmailTemplate(name: string, cardName: string, fee: number, paymentMethod: string, applicationId: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Application Submitted</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 6px 16px; margin-bottom: 16px;">
                                <span style="color: #10b981; font-size: 14px; font-weight: 600;">✅ APPLICATION SUBMITTED</span>
                            </div>
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Card Application Received!</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;">Your request is being processed by our team.</p>
                            
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px; text-align: left;">
                                <h4 style="color: #f3f4f6; margin: 0 0 12px 0;">Application Details</h4>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Card Type:</strong> ${cardName}</p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Application Fee:</strong> ${fee} USDT</p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Payment Method:</strong> ${paymentMethod === 'internal' ? '💳 Internal (Funding Balance)' : '🌐 External (Crypto Wallet)'}</p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Application ID:</strong> <span style="color: #6366f1; font-family: monospace;">${applicationId}</span></p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #f59e0b;">Under Review</span></p>
                            </div>

                            <p style="color: #8e96a3; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">Our team will review your application within 24-48 hours. You will receive a notification once a decision has been made.</p>

                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard/cards" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">Track Application</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function cardApprovedEmailTemplate(name: string, cardName: string, cardNumber: string, expiryDate: string, shippingAddress: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 6px 16px; margin-bottom: 16px;">
                                <span style="color: #10b981; font-size: 14px; font-weight: 600;">🎉 CARD APPROVED</span>
                            </div>
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Your Card Has Been Approved!</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;">Your ${cardName} is being issued and will be shipped to you.</p>
                            
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px; text-align: left;">
                                <h4 style="color: #f3f4f6; margin: 0 0 12px 0;">Card Details</h4>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Card Type:</strong> ${cardName}</p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Card Number:</strong> <span style="color: #6366f1; font-family: monospace;">•••• •••• •••• ${cardNumber.slice(-4)}</span></p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Expiry Date:</strong> ${expiryDate}</p>
                            </div>

                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px; text-align: left;">
                                <h4 style="color: #f3f4f6; margin: 0 0 12px 0;">📬 Shipping Address</h4>
                                <p style="color: #8e96a3; margin: 2px 0;">${shippingAddress.address}</p>
                                <p style="color: #8e96a3; margin: 2px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
                                <p style="color: #8e96a3; margin: 2px 0;">${shippingAddress.country}</p>
                            </div>

                            <p style="color: #8e96a3; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">Your card will be shipped within 2-3 business days. You will receive a tracking number once it's dispatched.</p>

                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard/cards" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">View My Cards</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function cardShippedEmailTemplate(name: string, cardName: string, trackingNumber: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Shipped</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0e14; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 480px; width: 100%;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #2a2a50;">
                            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
                            <span style="font-size: 24px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 6px 16px; margin-bottom: 16px;">
                                <span style="color: #3b82f6; font-size: 14px; font-weight: 600;">📬 CARD SHIPPED</span>
                            </div>
                            <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Your Card Is On The Way!</h1>
                            <p style="color: #8e96a3; font-size: 16px; margin: 0 0 24px 0;">Your ${cardName} has been dispatched.</p>
                            
                            <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px; text-align: left;">
                                <h4 style="color: #f3f4f6; margin: 0 0 12px 0;">Tracking Information</h4>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Tracking Number:</strong> <span style="color: #6366f1; font-family: monospace;">${trackingNumber}</span></p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Carrier:</strong> Standard Shipping</p>
                                <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Estimated Delivery:</strong> 5-7 Business Days</p>
                            </div>

                            <p style="color: #8e96a3; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">Once you receive your card, you will need to activate it at any ATM by setting your PIN. Follow the on-screen instructions to complete activation.</p>

                            <table cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 12px; background: linear-gradient(90deg, #ef4444, #3b82f6); padding: 16px 32px;">
                                        <a href="https://smartcodenova.com/dashboard/cards" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block;">Track Your Card</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #2a2a50; text-align: center;">
                            <p style="color: #8e96a3; font-size: 12px; margin: 0;">SmartCodeNova – Automated AI Trading Bots<br />Need help? Contact us at <a href="mailto:info@smartcodenova.online" style="color: #6366f1; text-decoration: none;">info@smartcodenova.online</a></p>
                            <p style="color: #4a4a6a; font-size: 11px; margin: 8px 0 0 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// --- CARD NOTIFICATION FUNCTIONS ---

// --- NOTIFY USER: CARD APPLICATION SUBMITTED ---
export async function notifyUserCardApplication(
  email: string,
  name: string,
  cardName: string,
  fee: number,
  paymentMethod: string,
  applicationId: string,
  userId: string
) {
  try {
    const html = cardApplicationSubmittedEmailTemplate(name, cardName, fee, paymentMethod, applicationId);
    await sendEmail(email, `💳 Card Application Submitted - ${cardName}`, html, 'info');
    console.log('✅ Card application email sent');

    await createInAppNotification(
      userId,
      'card_application',
      '💳 Card Application Submitted',
      `Your application for ${cardName} has been submitted and is under review.`,
      { card_name: cardName, application_id: applicationId }
    );

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `💳 <b>Card Application Submitted</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}\n💰 Fee: ${fee} USDT\n🆔 ID: ${applicationId}\n\n🟡 Status: Under Review`;
      await sendTelegram(chatId, tgMsg);
    }
  } catch (error) {
    console.error('❌ Card application notification error:', error);
  }
}

// --- NOTIFY ADMIN: NEW CARD APPLICATION ---
export async function notifyAdminNewCardApplication(
  userEmail: string,
  userName: string,
  cardName: string,
  fee: number,
  paymentMethod: string,
  applicationId: string
) {
  try {
    const subject = `💳 New Card Application - ${userName}`;
    const html = `
      <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
        <h2 style="color: #f59e0b;">💳 New Card Application</h2>
        <p><strong>User:</strong> ${userName} (${userEmail})</p>
        <p><strong>Card Type:</strong> ${cardName}</p>
        <p><strong>Fee:</strong> ${fee} USDT</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === 'internal' ? '💳 Internal (Funding Balance)' : '🌐 External (Crypto Wallet)'}</p>
        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><a href="https://smartcodenova.com/admin/cards/${applicationId}" style="color: #6366f1;">Review Application</a></p>
      </div>
    `;
    
    await sendEmail('smartcodenova@gmail.com', subject, html, 'info');

    const tgMsg = `💳 <b>New Card Application</b>\n\n👤 User: ${userName}\n📧 Email: ${userEmail}\n💳 Card: ${cardName}\n💰 Fee: ${fee} USDT\n💵 Payment: ${paymentMethod === 'internal' ? 'Internal' : 'External'}\n🆔 ID: ${applicationId}`;
    await sendAdminTelegram(tgMsg);
  } catch (error) {
    console.error('❌ Admin card application notification error:', error);
  }
}

// --- NOTIFY USER: CARD APPROVED ---
export async function notifyUserCardApproved(
  email: string,
  name: string,
  cardName: string,
  cardNumber: string,
  expiryDate: string,
  shippingAddress: any,
  userId: string
) {
  try {
    const html = cardApprovedEmailTemplate(name, cardName, cardNumber, expiryDate, shippingAddress);
    await sendEmail(email, `✅ Your ${cardName} Has Been Approved!`, html, 'info');
    console.log('✅ Card approved email sent');

    await createInAppNotification(
      userId,
      'card_approved',
      '✅ Card Approved!',
      `Your ${cardName} has been approved and is being issued.`,
      { card_name: cardName, card_number: cardNumber.slice(-4) }
    );

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `✅ <b>Card Approved!</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}\n📦 Status: Being Issued\n📬 Shipping to: ${shippingAddress.address}`;
      await sendTelegram(chatId, tgMsg);
    }
  } catch (error) {
    console.error('❌ Card approval notification error:', error);
  }
}

// --- NOTIFY USER: CARD SHIPPED ---
export async function notifyUserCardShipped(
  email: string,
  name: string,
  cardName: string,
  trackingNumber: string,
  userId: string
) {
  try {
    const html = cardShippedEmailTemplate(name, cardName, trackingNumber);
    await sendEmail(email, `📬 Your ${cardName} Has Been Shipped!`, html, 'info');
    console.log('✅ Card shipped email sent');

    await createInAppNotification(
      userId,
      'card_shipped',
      '📬 Card Shipped!',
      `Your ${cardName} has been shipped. Tracking: ${trackingNumber}`,
      { card_name: cardName, tracking_number: trackingNumber }
    );

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `📬 <b>Card Shipped!</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}\n🔢 Tracking: ${trackingNumber}\n\n📦 Estimated Delivery: 5-7 Business Days`;
      await sendTelegram(chatId, tgMsg);
    }
  } catch (error) {
    console.error('❌ Card shipped notification error:', error);
  }
}

// --- NOTIFY USER: CARD ACTIVATED ---
export async function notifyUserCardActivated(
  email: string,
  name: string,
  cardName: string,
  userId: string
) {
  try {
    const html = `
      <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
          <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
            <img src="${LOGO_URL}" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
            <span style="font-size: 20px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: #10b981; color: white; font-size: 32px; padding: 16px; border-radius: 50%; display: inline-block;">✅</span>
          </div>

          <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">Card Activated! 🎉</h1>
          <p style="color: #8e96a3; font-size: 16px; text-align: center; margin: 0 0 24px 0;">Your ${cardName} is now active and ready to use.</p>

          <div style="background-color: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid #2a2a50; margin-bottom: 24px; text-align: left;">
            <h4 style="color: #f3f4f6; margin: 0 0 12px 0;">Card Status</h4>
            <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #10b981;">✅ Active</span></p>
            <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Card Type:</strong> ${cardName}</p>
            <p style="color: #8e96a3; margin: 4px 0;"><strong style="color: #f3f4f6;">Activated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 20px 0;">You can now use your card for purchases and transactions worldwide.</p>

          <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
            <p style="color: #4a4a6a; font-size: 12px; margin: 0;">&copy; 2025 SmartCodeNova. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail(email, `✅ Your ${cardName} Is Now Active!`, html, 'info');
    console.log('✅ Card activated email sent');

    await createInAppNotification(
      userId,
      'card_activated',
      '✅ Card Activated!',
      `Your ${cardName} is now active and ready to use.`,
      { card_name: cardName }
    );

    const chatId = await getUserTelegramChatId(email);
    if (chatId) {
      const tgMsg = `✅ <b>Card Activated!</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}\n\nYour card is now ready to use.`;
      await sendTelegram(chatId, tgMsg);
    }
  } catch (error) {
    console.error('❌ Card activation notification error:', error);
  }
}