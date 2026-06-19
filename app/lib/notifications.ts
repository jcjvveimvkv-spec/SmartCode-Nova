import axios from 'axios';
import { 
  depositInitiatedUserEmail, 
  depositApprovedUserEmail, 
  adminDepositAlert 
} from './email-templates';

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = '8593494227:AAEYRi07rcGtCJSA0lALD4HtIPAM-WdZNMU';

// ⚠️ IMPORTANT: This is the Chat ID for the account "Emmmmmm12334"
// If you want to switch accounts, change this number to the other ID found in Telegram.
const ADMIN_TELEGRAM_CHAT_ID = '7565783785'; 

// Resend Configuration
const RESEND_API_KEY = 're_U139y29W_kSm99pk9Z5C57fr8GzVeHR8T';

// --- SEND TELEGRAM ---
export async function sendTelegram(chatId: string, message: string) {
  if (!chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('📱 Telegram sent successfully!');
  } catch (err: any) {
    console.error('❌ Telegram Error:', err.response?.data || err.message);
  }
}

// --- SEND EMAIL VIA RESEND ---
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SmartCodeNova <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend Error: ${errorData.message || response.statusText}`);
    }
    
    console.log('📧 Email sent successfully to', to);
  } catch (err: any) {
    console.error('❌ Resend Error:', err.message || err);
  }
}

// --- NOTIFY USER: DEPOSIT INITIATED ---
export async function notifyUserDepositInitiated(userEmail: string, userName: string, amount: number, network: string) {
  const html = depositInitiatedUserEmail(userName, amount, network);
  await sendEmail(userEmail, 'Deposit Request Received', html);
}

// --- NOTIFY USER: DEPOSIT APPROVED ---
export async function notifyUserDepositApproved(userEmail: string, userName: string, amount: number, newBalance: number) {
  const html = depositApprovedUserEmail(userName, amount, newBalance);
  await sendEmail(userEmail, 'Deposit Approved & Credited ✅', html);
  
  // (Optional: You can add Telegram notification for user here later if you have their Chat ID)
}

// --- NOTIFY ADMIN: NEW PENDING DEPOSIT ---
export async function notifyAdminNewDeposit(userEmail: string, userName: string, amount: number, txid: string, network: string) {
  const html = adminDepositAlert(userEmail, userName, amount, txid, network);
  await sendEmail('smartcodenova@gmail.com', '🚨 New Pending Deposit Request', html);
  
  // Send to Admin Telegram
  const msg = `🚨 <b>New Deposit Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n🌐 Network: ${network}\n🔗 TXID: ${txid}`;
  await sendTelegram(ADMIN_TELEGRAM_CHAT_ID, msg);
}

// --- NOTIFY ADMIN: NEW WITHDRAWAL REQUEST ---
export async function notifyAdminNewWithdrawal(
  userEmail: string, 
  userName: string, 
  amount: number, 
  fee: number,
  netAmount: number,
  walletAddress: string,
  network: string
) {
  // Email
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
  await sendEmail('smartcodenova@gmail.com', '🚨 New Withdrawal Request', html);
  
  // Telegram
  const msg = `🚨 <b>New Withdrawal Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}\n🌐 Network: ${network}`;
  await sendTelegram(ADMIN_TELEGRAM_CHAT_ID, msg);
}