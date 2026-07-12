import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cardId, action, note } = body;

        console.log('📝 Admin action received:', { cardId, action, note });

        if (!cardId || !action) {
            return NextResponse.json({
                success: false,
                error: 'Card ID and action are required'
            }, { status: 400 });
        }

        // Get card details with user info
        const { data: card, error: cardError } = await supabaseAdmin
            .from('cards')
            .select('*, user_balances!inner(email, full_name, telegram_chat_id)')
            .eq('id', cardId)
            .single();

        if (cardError || !card) {
            console.error('❌ Card not found:', cardError);
            return NextResponse.json({
                success: false,
                error: 'Card not found'
            }, { status: 404 });
        }

        console.log('📋 Card found:', card.id, 'Current status:', card.status);

        let newStatus: string;
        let message: string;
        let notificationTitle: string;
        let notificationMessage: string;

        if (action === 'approve') {
            newStatus = 'approved';
            message = 'Card application approved!';
            notificationTitle = '✅ Card Application Approved';
            notificationMessage = `Your ${card.card_name} application has been approved! Our team will now process your card for shipping.`;
        } else if (action === 'activate') {
            newStatus = 'active';
            message = 'Card activated successfully!';
            notificationTitle = '✅ Card Activated';
            notificationMessage = `Your ${card.card_name} has been activated and is now ready to use.`;
        } else if (action === 'reject') {
            newStatus = 'rejected';
            message = 'Card application rejected';
            notificationTitle = '❌ Card Application Rejected';
            notificationMessage = `Your ${card.card_name} application has been rejected. Reason: ${note || 'No reason provided.'}`;
        } else {
            return NextResponse.json({
                success: false,
                error: 'Invalid action'
            }, { status: 400 });
        }

        // Update card status
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        if (note) {
            updateData.admin_notes = note;
        }

        if (action === 'approve') {
            updateData.approved_date = new Date().toISOString();
        }

        if (action === 'activate') {
            updateData.activated_date = new Date().toISOString();
        }

        const { data: updatedCard, error: updateError } = await supabaseAdmin
            .from('cards')
            .update(updateData)
            .eq('id', cardId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Update error:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to update card: ' + updateError.message
            }, { status: 500 });
        }

        console.log('✅ Card updated:', updatedCard.id, 'New status:', updatedCard.status);

        // Send notification to user
        try {
            const userEmail = card.user_balances?.email;
            const userName = card.user_balances?.full_name || 'User';
            const chatId = card.user_balances?.telegram_chat_id;

            // Email notification
            if (userEmail) {
                const emailHtml = `
                    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
                        <h2 style="color: #6366f1;">${notificationTitle}</h2>
                        <p>Dear ${userName},</p>
                        <p>${notificationMessage}</p>
                        <div style="background-color: #1a2332; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p><strong>Card:</strong> ${card.card_name}</p>
                            <p><strong>Status:</strong> ${newStatus.toUpperCase()}</p>
                            <p><strong>Application ID:</strong> ${card.id}</p>
                        </div>
                        <a href="https://smartcodenova.com/dashboard/cards/${card.id}" style="background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0;">
                            View Card Details
                        </a>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">SmartCodeNova</p>
                    </div>
                `;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: process.env.EMAIL_FROM || 'SmartCodeNova <noreply@smartcodenova.com>',
                        to: [userEmail],
                        subject: notificationTitle,
                        html: emailHtml,
                    }),
                });
                console.log('✅ User email notification sent');
            }

            // In-app notification
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: card.user_id,
                    title: notificationTitle,
                    message: notificationMessage,
                    type: 'card_status_update',
                    read: false,
                    created_at: new Date().toISOString(),
                });
            console.log('✅ In-app notification created');

            // Telegram notification
            if (chatId) {
                const telegramToken = process.env.TELEGRAM_BOT_TOKEN_NEW;
                if (telegramToken) {
                    const tgMessage = `${notificationTitle}\n\n` +
                        `👤 Dear ${userName},\n` +
                        `${notificationMessage}\n\n` +
                        `💳 Card: ${card.card_name}\n` +
                        `📋 Status: ${newStatus.toUpperCase()}\n\n` +
                        `🚀 SmartCodeNova`;

                    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: tgMessage,
                            parse_mode: 'HTML',
                        }),
                    });
                    console.log('✅ Telegram notification sent');
                }
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        return NextResponse.json({
            success: true,
            data: updatedCard,
            message: message
        });

    } catch (error: any) {
        console.error('❌ Error in POST /api/cards/approve:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process request'
        }, { status: 500 });
    }
}