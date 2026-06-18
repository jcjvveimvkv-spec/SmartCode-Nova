import axios from 'axios';
import { 
  depositInitiatedUserEmail, 
  depositApprovedUserEmail, 
  adminDepositAlert 
} from './email-templates';

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = '8593494227:AAEYRi07rcGtCJSA0lALD4HtIPAM-WdZNMU';
const ADMIN_TELEGRAM_CHAT_ID = '8697759538'; // Replace with your Admin Chat ID if different

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
  } catch (err) {
    console.error('Telegram Error:', err);
  }
}

// --- SEND EMAIL VIA RESEND ---
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'SmartCodeNova <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html
    }, {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Resend Error:', err);
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