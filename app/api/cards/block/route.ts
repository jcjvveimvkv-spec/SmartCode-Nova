import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
    createInAppNotification, 
    getUserTelegramChatId, 
    sendTelegram, 
    sendEmail 
} from '@/app/lib/notifications';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cardId, action } = body;

        // Validate required fields
        if (!cardId || !action) {
            return NextResponse.json({
                success: false,
                error: 'Card ID and action are required'
            }, { status: 400 });
        }

        if (!['block', 'unblock'].includes(action)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Must be "block" or "unblock"'
            }, { status: 400 });
        }

        // Get the card details
        const { data: card, error: cardError } = await supabaseAdmin
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (cardError || !card) {
            return NextResponse.json({
                success: false,
                error: 'Card not found'
            }, { status: 404 });
        }

        // Check if card can be blocked/unblocked
        if (action === 'block' && card.status === 'blocked') {
            return NextResponse.json({
                success: false,
                error: 'Card is already blocked'
            }, { status: 400 });
        }

        if (action === 'unblock' && card.status !== 'blocked') {
            return NextResponse.json({
                success: false,
                error: 'Card is not blocked'
            }, { status: 400 });
        }

        // Update card status
        const newStatus = action === 'block' ? 'blocked' : 'active';
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        if (action === 'block') {
            updateData.blocked_date = new Date().toISOString();
        }

        const { data: updatedCard, error: updateError } = await supabaseAdmin
            .from('cards')
            .update(updateData)
            .eq('id', cardId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating card:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to update card'
            }, { status: 500 });
        }

        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
            .from('user_balances')
            .select('email, full_name')
            .eq('user_id', card.user_id)
            .single();

        if (!userError && user) {
            // Send notification
            if (action === 'block') {
                await sendBlockNotification(user.email, user.full_name, card.card_name, card.user_id);
            } else {
                await sendUnblockNotification(user.email, user.full_name, card.card_name, card.user_id);
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedCard,
            message: action === 'block' ? 'Card blocked successfully' : 'Card unblocked successfully'
        });

    } catch (error: any) {
        console.error('Block/Unblock card error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process card'
        }, { status: 500 });
    }
}

// Helper: Send block notification
async function sendBlockNotification(email: string, name: string, cardName: string, userId: string) {
    try {
        // Email
        const subject = `🔒 Your ${cardName} Has Been Blocked`;
        const html = `
            <div style="background-color: #0b0e14; padding: 40px; font-family: Arial; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px;">
                    <h2 style="color: #ef4444;">🔒 Card Blocked</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>Your <strong>${cardName}</strong> has been blocked.</p>
                    <p style="color: #8e96a3; font-size: 14px;">If you did not request this block, please contact support immediately.</p>
                    <a href="https://smartcodenova.com/dashboard/cards" style="display: inline-block; margin-top: 20px; background: linear-gradient(90deg, #ef4444, #3b82f6); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none;">View My Cards</a>
                </div>
            </div>
        `;
        
        await sendEmail(email, subject, html, 'info');

        // In-App
        await createInAppNotification(
            userId,
            'card_blocked',
            '🔒 Card Blocked',
            `Your ${cardName} has been blocked. If you did not request this, please contact support.`,
            { card_name: cardName }
        );

        // Telegram
        const chatId = await getUserTelegramChatId(email);
        if (chatId) {
            await sendTelegram(chatId, `🔒 <b>Card Blocked</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}`);
        }
    } catch (error) {
        console.error('Block notification error:', error);
    }
}

// Helper: Send unblock notification
async function sendUnblockNotification(email: string, name: string, cardName: string, userId: string) {
    try {
        const subject = `✅ Your ${cardName} Has Been Unblocked`;
        const html = `
            <div style="background-color: #0b0e14; padding: 40px; font-family: Arial; color: #f3f4f6; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 40px;">
                    <h2 style="color: #10b981;">✅ Card Unblocked</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>Your <strong>${cardName}</strong> has been unblocked and is now active.</p>
                    <a href="https://smartcodenova.com/dashboard/cards" style="display: inline-block; margin-top: 20px; background: linear-gradient(90deg, #ef4444, #3b82f6); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none;">View My Cards</a>
                </div>
            </div>
        `;
        
        await sendEmail(email, subject, html, 'info');

        // In-App
        await createInAppNotification(
            userId,
            'card_unblocked',
            '✅ Card Unblocked',
            `Your ${cardName} has been unblocked and is now active.`,
            { card_name: cardName }
        );

        // Telegram
        const chatId = await getUserTelegramChatId(email);
        if (chatId) {
            await sendTelegram(chatId, `✅ <b>Card Unblocked</b>\n\n👤 Name: ${name}\n💳 Card: ${cardName}`);
        }
    } catch (error) {
        console.error('Unblock notification error:', error);
    }
}