// /app/api/admin-notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-admin';
import { 
    sendEmail, 
    sendTelegram, 
    sendAdminTelegram 
} from '@/app/lib/notification-export';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        console.log('📨 Admin notify request:', { type, data });

        const supabase = getSupabaseAdmin();

        // ============================================================
        // GET ADMIN USERS - FIXED: Get from user_balances with role='admin'
        // ============================================================
        let adminUsers: { email: string; telegram_chat_id: string | null }[] = [];

        try {
            // First, try to get admins from user_balances
            const { data: admins, error: adminError } = await supabase
                .from('user_balances')
                .select('user_id, email')
                .eq('role', 'admin');

            if (!adminError && admins && admins.length > 0) {
                // Get telegram_chat_id from user_settings for each admin
                for (const admin of admins) {
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('telegram_chat_id')
                        .eq('user_id', admin.user_id)
                        .maybeSingle();
                    
                    adminUsers.push({
                        email: admin.email,
                        telegram_chat_id: settings?.telegram_chat_id || null
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error fetching admins from user_balances:', err);
        }

        // Fallback: use environment variable admin emails
        if (adminUsers.length === 0) {
            const fallbackAdmins = process.env.ADMIN_EMAILS?.split(',') || ['smartcodenova@gmail.com'];
            adminUsers = fallbackAdmins.map(email => ({ 
                email: email.trim(), 
                telegram_chat_id: null 
            }));
        }

        console.log(`👤 Found ${adminUsers.length} admin(s):`, adminUsers.map(a => a.email));

        // ============================================================
        // SEND NOTIFICATIONS BASED ON TYPE
        // ============================================================
        
        // --- TYPE: withdrawal_request ---
        if (type === 'withdrawal_request') {
            const { 
                userEmail, 
                userName, 
                amount, 
                fee, 
                netAmount, 
                walletAddress, 
                network, 
                withdrawalId 
            } = data;

            console.log(`📨 Processing withdrawal request: ${amount} USDT by ${userEmail}`);

            // Email HTML
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>🚨 New Withdrawal Request</title>
                </head>
                <body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:40px 20px;">
                        <tr><td align="center">
                            <table width="100%" style="max-width:580px;background:#141a24;border-radius:24px;border:1px solid #2a2a50;padding:40px;">
                                <tr><td style="text-align:center;padding-bottom:24px;border-bottom:1px solid #2a2a50;">
                                    <h1 style="color:#f3f4f6;font-size:22px;margin:0;">🚨 New Withdrawal Request</h1>
                                </td></tr>
                                <tr><td style="padding-top:24px;">
                                    <div style="background:#0b0e14;border-radius:16px;padding:20px;border:1px solid #1a1a40;">
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a40;">
                                            <span style="color:#8e96a3;">User</span>
                                            <span style="color:#f3f4f6;font-weight:500;">${userName} (${userEmail})</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a40;">
                                            <span style="color:#8e96a3;">Amount</span>
                                            <span style="color:#f59e0b;font-weight:700;">${amount} USDT</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a40;">
                                            <span style="color:#8e96a3;">Fee (3%)</span>
                                            <span style="color:#ef4444;">-${fee.toFixed(2)} USDT</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a40;">
                                            <span style="color:#8e96a3;">Net Amount</span>
                                            <span style="color:#10b981;font-weight:700;">${netAmount.toFixed(2)} USDT</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a40;">
                                            <span style="color:#8e96a3;">Network</span>
                                            <span style="color:#f3f4f6;">${network}</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;">
                                            <span style="color:#8e96a3;">Wallet Address</span>
                                            <span style="color:#f59e0b;font-size:12px;word-break:break-all;max-width:200px;text-align:right;">${walletAddress}</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #1a1a40;margin-top:8px;padding-top:8px;">
                                            <span style="color:#8e96a3;">Withdrawal ID</span>
                                            <span style="color:#f3f4f6;font-size:12px;">${withdrawalId}</span>
                                        </div>
                                    </div>
                                    <div style="margin-top:20px;text-align:center;">
                                        <a href="https://smartcodenova.com/admin/approvals" style="display:inline-block;background:linear-gradient(90deg,#ef4444,#3b82f6);color:white;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;">Review Withdrawal</a>
                                    </div>
                                </td></tr>
                            </table>
                        </td></tr>
                    </table>
                </body>
                </html>
            `;

            const telegramMsg = `🚨 <b>New Withdrawal Request</b>\n\n👤 User: ${userName}\n📧 Email: ${userEmail}\n💰 Amount: ${amount} USDT\n📦 Net: ${netAmount.toFixed(2)} USDT\n🌐 Network: ${network}\n🔗 Wallet: ${walletAddress}\n🆔 ID: ${withdrawalId}\n\n⚠️ Review in Admin Panel`;

            // Send to all admin emails
            let emailSentCount = 0;
            for (const admin of adminUsers) {
                try {
                    // Email
                    if (admin.email) {
                        await sendEmail(
                            admin.email,
                            `🚨 New Withdrawal Request - ${amount} USDT`,
                            emailHtml
                        );
                        console.log(`✅ Email sent to ${admin.email}`);
                        emailSentCount++;
                    }

                    // Telegram - try individual first, then fallback to group
                    if (admin.telegram_chat_id) {
                        await sendTelegram(admin.telegram_chat_id, telegramMsg);
                        console.log(`✅ Telegram sent to admin chat ${admin.telegram_chat_id}`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to notify admin ${admin.email}:`, err);
                }
            }

            // Always send to group as well
            try {
                await sendAdminTelegram(telegramMsg);
                console.log('✅ Admin group Telegram sent');
            } catch (err) {
                console.error('❌ Failed to send admin group Telegram:', err);
            }

            return NextResponse.json({
                success: true,
                message: `Admin notifications sent to ${emailSentCount} admin(s)`
            });
        }

        // --- TYPE: withdrawal_status_update ---
        if (type === 'withdrawal_status_update') {
            const { userEmail, userName, amount, status, withdrawalId, reason } = data;

            const statusEmoji = status === 'approved' ? '✅' : '❌';
            const statusText = status === 'approved' ? 'Approved' : 'Rejected';

            const userEmailHtml = `
                <div style="background-color: #0b0e14; padding: 40px; font-family: Arial; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px;">
                        <h1 style="color:${status === 'approved' ? '#10b981' : '#ef4444'};font-size:24px;text-align:center;">${statusEmoji} Withdrawal ${statusText}</h1>
                        <p style="color:#8e96a3;text-align:center;">Your withdrawal request has been ${statusText.toLowerCase()}.</p>
                        <div style="background-color: #0b0e14; border-radius: 16px; padding: 20px; border: 1px solid #1a1a40;">
                            <p><strong style="color:#f3f4f6;">Amount:</strong> ${amount} USDT</p>
                            <p><strong style="color:#f3f4f6;">Status:</strong> <span style="color:${status === 'approved' ? '#10b981' : '#ef4444'};">${statusText}</span></p>
                            ${reason ? `<p><strong style="color:#f3f4f6;">Reason:</strong> <span style="color:#ef4444;">${reason}</span></p>` : ''}
                            <p><strong style="color:#f3f4f6;">Withdrawal ID:</strong> ${withdrawalId}</p>
                        </div>
                        <div style="text-align:center;margin-top:20px;">
                            <a href="https://smartcodenova.com/dashboard/transactions" style="display:inline-block;background:linear-gradient(90deg,#ef4444,#3b82f6);color:white;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;">View Transactions</a>
                        </div>
                    </div>
                </div>
            `;

            if (userEmail) {
                await sendEmail(
                    userEmail,
                    `${statusEmoji} Withdrawal ${statusText} - ${amount} USDT`,
                    userEmailHtml
                );
                console.log(`✅ Status update email sent to ${userEmail}`);
            }

            return NextResponse.json({
                success: true,
                message: 'User notified of status update'
            });
        }

        // --- TYPE: withdrawal_reported ---
        if (type === 'withdrawal_reported') {
            const { userEmail, userName, withdrawalId, amount, issue } = data;

            const emailHtml = `
                <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
                    <h2 style="color: #f59e0b;">⚠️ Withdrawal Issue Reported</h2>
                    <p><strong>User:</strong> ${userName} (${userEmail})</p>
                    <p><strong>Amount:</strong> ${amount} USDT</p>
                    <p><strong>Withdrawal ID:</strong> ${withdrawalId}</p>
                    <p><strong>Issue:</strong> ${issue}</p>
                    <p><a href="https://smartcodenova.com/admin/approvals" style="color:#6366f1;">Review in Admin Panel</a></p>
                </div>
            `;

            const telegramMsg = `⚠️ <b>Withdrawal Issue Reported</b>\n\n👤 User: ${userName}\n📧 Email: ${userEmail}\n💰 Amount: ${amount} USDT\n🆔 ID: ${withdrawalId}\n📝 Issue: ${issue}\n\n🔍 Review in Admin Panel`;

            for (const admin of adminUsers) {
                if (admin.email) {
                    await sendEmail(
                        admin.email,
                        `⚠️ Withdrawal Issue Reported - ${amount} USDT`,
                        emailHtml
                    );
                }
            }

            await sendAdminTelegram(telegramMsg);

            return NextResponse.json({
                success: true,
                message: 'Admin notified of issue'
            });
        }

        return NextResponse.json({
            success: false,
            error: `Invalid notification type: ${type}`
        }, { status: 400 });

    } catch (error: any) {
        console.error('❌ Admin notify error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to send notifications'
        }, { status: 500 });
    }
}