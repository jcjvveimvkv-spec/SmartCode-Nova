// /app/lib/notification-export.ts
// STANDALONE version - Does NOT import from problematic notifications.ts
// This file re-exports everything from the working notification files

// ============================================================
// EXPORT FROM SIMPLE-NOTIFICATIONS.TS (Working)
// ============================================================
export {
    notifyAdminNewSignup,
    notifyUserWelcome,
    notifyUserReferralBonus,
} from './simple-notifications';

// ============================================================
// EXPORT FROM NOTIFICATION-HELPER.TS (Working)
// ============================================================
export {
    createInAppNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUserNotifications,
    getUnreadNotificationCount,
    deleteNotification,
} from './notification-helper';

// ============================================================
// EXPORT FROM WALLET-NOTIFICATIONS.TS (Working - for deposits)
// ============================================================
export {
    notifyUserDepositProcessing,
    notifyAdminNewDeposit,
} from './wallet-notifications';

// ============================================================
// EXPORT FROM REFERRAL-NOTIFICATIONS.TS (Working)
// ============================================================
export {
    createReferralRecord,
    checkReferralEligibility,
    payReferralBonus,
    getReferralStatus,
} from './referral-notifications';

// ============================================================
// FALLBACK: Direct implementations for missing functions
// These are the functions that were originally in notifications.ts
// but we implement them here directly to avoid the import issue
// ============================================================

// ============================================================
// EMAIL FUNCTION - Direct implementation
// ============================================================
export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ RESEND_API_KEY not set, skipping email');
            return { success: false, error: 'RESEND_API_KEY not configured' };
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
            return { success: false, error };
        }

        console.log(`✅ Email sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============================================================
// TELEGRAM FUNCTION - Direct implementation
// ============================================================
export async function sendTelegram(chatId: string, message: string) {
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

        const data = await response.json();
        if (data.ok) {
            console.log(`✅ Telegram sent to ${chatId}`);
        } else {
            console.error('❌ Telegram error:', data);
        }
    } catch (error) {
        console.error('❌ Telegram error:', error);
    }
}

// ============================================================
// ADMIN TELEGRAM FUNCTION - Direct implementation
// ============================================================
export async function sendAdminTelegram(message: string) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN_NEW;
        if (!token) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN_NEW not set');
            return;
        }

        // Simple implementation - send to admin chat IDs from env
        const adminChatIds = process.env.TELEGRAM_GROUP_CHAT_IDS?.split(',') || [];
        for (const chatId of adminChatIds) {
            if (chatId.trim()) {
                await sendTelegram(chatId.trim(), message);
            }
        }
    } catch (error) {
        console.error('❌ Admin Telegram error:', error);
    }
}

// ============================================================
// GET USER TELEGRAM CHAT ID - Direct implementation
// ============================================================
export async function getUserTelegramChatId(email: string): Promise<string | null> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const response = await fetch(`${supabaseUrl}/rest/v1/user_balances?select=telegram_username&email=eq.${encodeURIComponent(email)}`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
        });

        const data = await response.json();
        if (data && data.length > 0 && data[0].telegram_username) {
            return data[0].telegram_username;
        }
        return null;
    } catch (error) {
        console.error('Error fetching telegram chat ID:', error);
        return null;
    }
}

// ============================================================
// ADMIN WITHDRAWAL NOTIFICATION - Direct implementation
// ============================================================
export async function notifyAdminNewWithdrawal(
    userEmail: string,
    userName: string,
    amount: number,
    fee: number,
    netAmount: number,
    walletAddress: string
) {
    try {
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

        await sendEmail('smartcodenova@gmail.com', '🚨 New Withdrawal Request', html);
        await sendAdminTelegram(`🚨 <b>New Withdrawal Request</b>\n\n👤 User: ${userEmail}\n💰 Amount: ${amount} USDT\n💸 Fee: ${fee.toFixed(2)} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🔗 Wallet: ${walletAddress}`);
        console.log('✅ Admin notified of new withdrawal');
    } catch (error) {
        console.error('❌ Admin withdrawal notification error:', error);
    }
}

// ============================================================
// USER WITHDRAWAL NOTIFICATION - Direct implementation
// ============================================================
export async function notifyUserWithdrawalRequested(
    userEmail: string,
    userName: string,
    amount: number,
    fee: number,
    netAmount: number,
    walletAddress: string,
    network: string,
    telegramChatId?: string
) {
    try {
        const html = `
            <div style="background-color: #0b0e14; padding: 40px; font-family: Arial; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px;">
                    <h1 style="color: #f3f4f6; font-size: 24px; text-align: center;">Withdrawal Request Received 📤</h1>
                    <p style="color: #8e96a3; text-align: center;">Your withdrawal is being processed.</p>
                    <div style="background-color: #0b0e14; border-radius: 16px; padding: 24px; border: 1px solid #1a1a40;">
                        <p><strong style="color: #f3f4f6;">Amount:</strong> <span style="color: #f3f4f6;">${amount} USDT</span></p>
                        <p><strong style="color: #f3f4f6;">Fee (3%):</strong> <span style="color: #ef4444;">-${fee.toFixed(2)} USDT</span></p>
                        <p><strong style="color: #f3f4f6;">Net Amount:</strong> <span style="color: #10b981;">${netAmount.toFixed(2)} USDT</span></p>
                        <p><strong style="color: #f3f4f6;">Wallet:</strong> <span style="color: #f59e0b;">${walletAddress}</span></p>
                        <p><strong style="color: #f3f4f6;">Network:</strong> <span style="color: #8e96a3;">${network}</span></p>
                        <p><strong style="color: #f3f4f6;">Status:</strong> <span style="color: #f59e0b;">Pending Admin Approval</span></p>
                    </div>
                </div>
            </div>
        `;

        await sendEmail(userEmail, 'Withdrawal Request Received', html);

        if (telegramChatId) {
            await sendTelegram(telegramChatId, `📤 <b>Withdrawal Request Received</b>\n\n👤 User: ${userName}\n💰 Amount: ${amount} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🟡 Status: Pending Admin Approval`);
        }
        console.log('✅ User notified of withdrawal');
    } catch (error) {
        console.error('❌ User withdrawal notification error:', error);
    }
}