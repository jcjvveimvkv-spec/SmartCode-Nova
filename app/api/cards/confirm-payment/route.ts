import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const applicationId = formData.get('applicationId') as string;
        const txId = formData.get('txId') as string;
        const screenshot = formData.get('screenshot') as File | null;

        console.log('📝 Payment confirmation received:', { applicationId, txId });

        if (!applicationId || !txId) {
            return NextResponse.json({
                success: false,
                error: 'Application ID and Transaction ID are required'
            }, { status: 400 });
        }

        // Get the card application
        const { data: card, error: cardError } = await supabaseAdmin
            .from('cards')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (cardError || !card) {
            console.error('❌ Card not found:', cardError);
            return NextResponse.json({
                success: false,
                error: 'Application not found'
            }, { status: 404 });
        }

        console.log('📋 Card found:', card.id);

        // Upload screenshot if provided
        let screenshotUrl = null;
        if (screenshot) {
            try {
                const buffer = Buffer.from(await screenshot.arrayBuffer());
                const fileName = `payment-${applicationId}-${Date.now()}.${screenshot.name.split('.').pop()}`;
                const filePath = `card-payments/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('screenshots')
                    .upload(filePath, buffer, {
                        contentType: screenshot.type,
                        cacheControl: '3600',
                    });

                if (!uploadError) {
                    const { data: urlData } = supabaseAdmin.storage
                        .from('screenshots')
                        .getPublicUrl(filePath);
                    screenshotUrl = urlData?.publicUrl || null;
                    console.log('📸 Screenshot uploaded');
                }
            } catch (uploadError) {
                console.error('Upload error:', uploadError);
            }
        }

        // Update card with payment information
        const updateData: any = {
            payment_status: 'payment_confirmed',
            payment_txid: txId,
            status: 'pending', // Set to pending for admin review
            updated_at: new Date().toISOString(),
        };
        
        if (screenshotUrl) {
            updateData.payment_screenshot = screenshotUrl;
        }

        const { data: updatedCard, error: updateError } = await supabaseAdmin
            .from('cards')
            .update(updateData)
            .eq('id', applicationId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating card:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to update payment: ' + updateError.message
            }, { status: 500 });
        }

        console.log('✅ Card payment updated:', updatedCard.id);

        // Get user details
        const { data: user } = await supabaseAdmin
            .from('user_balances')
            .select('email, full_name')
            .eq('user_id', card.user_id)
            .single();

        // Send admin notifications
        if (user) {
            try {
                const { sendEmail, sendAdminTelegram } = await import('@/app/lib/notifications');
                
                const subject = `💳 Card Payment Confirmed - ${user.full_name}`;
                const html = `
                    <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
                        <h2 style="color: #10b981;">✅ Payment Confirmed</h2>
                        <p><strong>User:</strong> ${user.full_name} (${user.email})</p>
                        <p><strong>Card:</strong> ${card.card_name}</p>
                        <p><strong>Transaction ID:</strong> ${txId}</p>
                        <p><strong>Application ID:</strong> ${applicationId}</p>
                        <p><a href="https://smartcodenova.com/admin/cards/${applicationId}" style="color: #6366f1;">Review Application</a></p>
                    </div>
                `;

                await sendEmail('smartcodenova@gmail.com', subject, html, 'info');

                const tgMsg = `✅ <b>Card Payment Confirmed</b>\n\n👤 User: ${user.full_name}\n💳 Card: ${card.card_name}\n🆔 TXID: ${txId}\n📋 Review: /admin/cards/${applicationId}`;
                await sendAdminTelegram(tgMsg);
            } catch (notifyError) {
                console.error('Notification error:', notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedCard,
            message: 'Payment confirmed! Application is now under review.'
        });

    } catch (error: any) {
        console.error('❌ Payment confirmation error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to confirm payment'
        }, { status: 500 });
    }
}