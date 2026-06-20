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

// --- NOTIFY USER: DEPOSIT INITIATED (Sends from info@) ---
export async function notifyUserDepositInitiated(userEmail: string, userName: string, amount: number, network: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #6366f1;">Deposit Request Received</h2>
      <p>Hi ${userName},</p>
      <p>Your deposit request of <strong>${amount} USDT</strong> via ${network} has been received.</p>
      <p>Our admin team is currently verifying the transaction.</p>
    </div>
  `;
  await sendEmail(userEmail, 'Deposit Request Received', html, 'info');
}

// --- NOTIFY USER: DEPOSIT APPROVED (Sends from info@) ---
export async function notifyUserDepositApproved(userEmail: string, userName: string, amount: number, newBalance: number) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #10b981;">Deposit Approved! ✅</h2>
      <p>Hi ${userName},</p>
      <p>Your deposit of <strong>${amount} USDT</strong> has been successfully verified.</p>
      <p><strong>New Funding Balance:</strong> ${newBalance.toFixed(2)} USDT</p>
    </div>
  `;
  await sendEmail(userEmail, 'Deposit Approved & Credited ✅', html, 'info');
}

// --- NOTIFY ADMIN: NEW DEPOSIT (Sends from info@) ---
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

// --- NOTIFY ADMIN: NEW WITHDRAWAL (Sends from info@) ---
export async function notifyAdminNewWithdrawal(userEmail: string, amount: number, fee: number, netAmount: number, walletAddress: string, network: string) {
  const html = `
    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
      <h2 style="color: #f59e0b;">🚨 New Withdrawal Request</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Amount:</strong> ${amount} USDT</p>
      <p><strong>Fee (3%):</strong> ${fee.toFixed(2)} USDT</p>
      <p><strong>Net Amount:</strong> ${netAmount.toFixed(2)} USDT</p>
      <p><strong>Wallet:</strong> ${walletAddress}</p>
      <p><strong>Network:</strong> ${network}</p>
    </div>
  `;
  await sendEmail('smartcodenova@gmail.com', '🚨 New Withdrawal Request', html, 'info');
  const msg = `🚨 <b>New Withdrawal Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}\n🌐 Network: ${network}`;
  await sendAdminTelegram(msg);
}

// --- NOTIFY ADMIN: NEW SIGNUP (Sends from info@) ---
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

// --- NOTIFY ADMIN: NEW BOT PURCHASE (Sends from info@) ---
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