import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '8593494227:AAEYRi07rcGtCJSA0lALD4HtIPAM-WdZNMU';
const ADMIN_EDGE_FUNCTION_URL = 'https://texuzrwyjecjxkrnemeg.supabase.co/functions/v1/send-admin-email';

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

// --- NOTIFY USER: DEPOSIT APPROVED (NEW PROFESSIONAL EMAIL) ---
export async function notifyUserDepositApproved(userEmail: string, userName: string, amount: number, newBalance: number, telegramChatId?: string) {
  const emailHtml = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <!-- Logo & Brand -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
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

        <!-- NEW PROFESSIONAL FOOTER -->
        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 20px 0;">The funds have been successfully credited to your account. You may visit the Asset History page to view the details.</p>
        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 0 0 20px 0;">If you need any assistance, please contact Live Chat support or submit a ticket for further help.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; border: 1px solid #1a1a40; margin-bottom: 20px;">
          <p style="color: #f3f4f6; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">For more information, please visit our help center:</p>
          <p style="color: #6366f1; font-size: 13px; margin: 4px 0;">• How to perform an asset exchange?</p>
          <p style="color: #6366f1; font-size: 13px; margin: 4px 0;">• How to add your withdrawal wallet address?</p>
        </div>

        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">Regards,<br/>SmartCodeNova</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Deposit Approved & Credited ✅', emailHtml, 'info');

  if (telegramChatId) {
    const tgMsg = `✅ <b>Deposit Approved!</b>\n\n👤 User: ${userName}\n💰 Amount Credited: ${amount} USDT\n📊 New Balance: ${newBalance.toFixed(2)} USDT\n🟢 Status: Approved`;
    await sendTelegram(telegramChatId, tgMsg);
  }
}

// --- NOTIFY USER: DEPOSIT PROCESSING (UPDATED WITH CHAT ID) ---
export async function notifyUserDepositProcessing(userEmail: string, userName: string, amount: number, network: string, txid: string, telegramChatId?: string) {
  const emailHtml = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
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
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">&copy; 2024 SmartCodeNova. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Deposit Request Received', emailHtml, 'info');

  if (telegramChatId) {
    const tgMsg = `📥 <b>Deposit Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🔗 TXID: ${txid}\n🟡 Status: Pending Verification`;
    await sendTelegram(telegramChatId, tgMsg);
  }
}

// --- NOTIFY USER: WITHDRAWAL REQUEST RECEIVED (NEW) ---
export async function notifyUserWithdrawalRequested(userEmail: string, userName: string, amount: number, fee: number, netAmount: number, walletAddress: string, network: string, telegramChatId?: string) {
  const emailHtml = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
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
        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 0 0 20px 0;">If you need any assistance, please contact Live Chat support or submit a ticket for further help.</p>
        
        <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; border: 1px solid #1a1a40; margin-bottom: 20px;">
          <p style="color: #f3f4f6; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">For more information, please visit our help center:</p>
          <p style="color: #6366f1; font-size: 13px; margin: 4px 0;">• How to perform an asset exchange?</p>
          <p style="color: #6366f1; font-size: 13px; margin: 4px 0;">• How to add your withdrawal wallet address?</p>
        </div>

        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">Regards,<br/>SmartCodeNova</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(userEmail, 'Withdrawal Request Received', emailHtml, 'info');

  if (telegramChatId) {
    const tgMsg = `📤 <b>Withdrawal Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}\n🌐 Network: ${network}\n🟡 Status: Pending Admin Approval`;
    await sendTelegram(telegramChatId, tgMsg);
  }
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