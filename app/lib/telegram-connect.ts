import { sendEmail, sendTelegram } from './notifications';

// --- TELEGRAM CONNECTION SUCCESS EMAIL ---
export async function notifyTelegramConnected(userEmail: string, userName: string) {
  const emailHtml = `
    <div style="background-color: #0b0e14; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a50; margin-bottom: 24px;">
          <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" alt="SmartCodeNova" style="height: 40px; width: auto; display: inline-block; vertical-align: middle; margin-right: 10px;" />
          <span style="font-size: 20px; font-weight: 700; color: #f3f4f6; vertical-align: middle; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
        </div>

        <h1 style="color: #f3f4f6; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">✅ Telegram Connected!</h1>
        <p style="color: #8e96a3; font-size: 16px; text-align: center; margin: 0 0 24px 0;">Hi ${userName}, your SmartCodeNova account has been successfully linked to Telegram.</p>

        <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40; margin-bottom: 24px;">
          <p style="color: #f3f4f6; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">What you will receive:</p>
          <p style="color: #8e96a3; font-size: 14px; margin: 4px 0;">• 📊 Trade Summaries: Daily reports of your bot's activity.</p>
          <p style="color: #8e96a3; font-size: 14px; margin: 4px 0;">• 📥 Deposit & Withdrawal Updates: Real-time status alerts.</p>
          <p style="color: #8e96a3; font-size: 14px; margin: 4px 0;">• 🤖 Bot Alerts: Deployment, expiry, and cycle completion updates.</p>
        </div>

        <p style="color: #8e96a3; font-size: 14px; text-align: center; margin: 0;">Need support? Reach out via Live Chat or Email.</p>
        <div style="text-align: center; border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 16px;">
          <p style="color: #4a4a6a; font-size: 12px; margin: 0;">Regards,<br/>SmartCodeNova</p>
        </div>
      </div>
    </div>
  `;
  await sendEmail(userEmail, '✅ Telegram Connected!', emailHtml, 'info');
}

// --- TELEGRAM CONNECTION SUCCESS TELEGRAM MESSAGE ---
export async function notifyTelegramConnectedTelegram(chatId: string, userName: string) {
  const message = `
    ✅ <b>Welcome to SmartCodeNova!</b>\n
    Hi ${userName}, your account has been successfully linked to Telegram.\n
    <b>You will now receive real-time notifications for:</b>\n
    📊 Trade Summaries\n
    📥 Deposit & Withdrawal Updates\n
    🤖 Bot Alerts\n\n
    To manage your notification preferences, please visit your SmartCodeNova Dashboard Settings.\n
    Thank you for choosing SmartCodeNova.
  `;
  await sendTelegram(chatId, message);
}