// /app/api/cards/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

// ============================================================
// CARD UTILITIES
// ============================================================
function generateCardNumber(cardType: string): string {
    let prefix = '';
    switch (cardType) {
        case 'master_credit':
            prefix = '5';
            break;
        case 'visa_debit':
            prefix = '4';
            break;
        case 'verve_debit':
            prefix = '6';
            break;
        default:
            prefix = '5';
    }
    
    let number = prefix;
    for (let i = 1; i < 16; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

function generateCVV(): string {
    return String(Math.floor(100 + Math.random() * 900));
}

function generateExpiryDate(): { month: number; year: number; date: Date } {
    const now = new Date();
    const year = now.getFullYear() + 3;
    const month = now.getMonth() + 1;
    const date = new Date(year, month, 0);
    return { month, year, date };
}

function maskCardNumber(number: string): string {
    return `•••• •••• •••• ${number.slice(-4)}`;
}

function formatExpiry(month: number, year: number): string {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
}

function getCardFee(cardType: string, settings: any): number {
    const feeMap: Record<string, string> = {
        master_credit: 'master_credit_fee',
        visa_debit: 'visa_debit_fee',
        verve_debit: 'verve_debit_fee',
    };
    
    const feeKey = feeMap[cardType];
    const fee = settings?.[feeKey];
    
    if (fee !== undefined && fee !== null) {
        return Number(fee);
    }
    
    const defaults: Record<string, number> = {
        master_credit: 500,
        visa_debit: 300,
        verve_debit: 200,
    };
    return defaults[cardType] || 500;
}

function getCardLimits(cardType: string, settings: any): { dailyLimit: number; monthlyLimit: number } {
    const dailyMap: Record<string, string> = {
        master_credit: 'master_credit_daily_limit',
        visa_debit: 'visa_debit_daily_limit',
        verve_debit: 'verve_debit_daily_limit',
    };
    const monthlyMap: Record<string, string> = {
        master_credit: 'master_credit_monthly_limit',
        visa_debit: 'visa_debit_monthly_limit',
        verve_debit: 'verve_debit_monthly_limit',
    };
    
    const dailyKey = dailyMap[cardType];
    const monthlyKey = monthlyMap[cardType];
    
    const daily = settings?.[dailyKey];
    const monthly = settings?.[monthlyKey];
    
    return {
        dailyLimit: daily !== undefined && daily !== null ? Number(daily) : 10000,
        monthlyLimit: monthly !== undefined && monthly !== null ? Number(monthly) : 50000,
    };
}

function getCardName(cardType: string): string {
    const names: Record<string, string> = {
        master_credit: 'Master Credit Card',
        visa_debit: 'Visa Debit Card',
        verve_debit: 'Verve Debit Card',
    };
    return names[cardType] || 'Card';
}

// ============================================================
// NOTIFICATION FUNCTIONS
// ============================================================
async function sendUserNotifications(
    supabase: any,
    email: string, 
    fullName: string, 
    cardName: string, 
    fee: number, 
    cardId: string, 
    userId: string
) {
    console.log(`📧 Sending user notifications for ${email}...`);
    
    try {
        const emailSubject = `✅ Card Application Received - ${cardName}`;
        const emailHtml = `
            <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
                <h2 style="color: #6366f1;">✅ Card Application Received</h2>
                <p>Dear ${fullName},</p>
                <p>Your application for <strong>${cardName}</strong> has been received.</p>
                <div style="background-color: #1a2332; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Card Type:</strong> ${cardName}</p>
                    <p><strong>Fee Paid:</strong> ${fee} USDT</p>
                    <p><strong>Application ID:</strong> ${cardId}</p>
                    <p><strong>Status:</strong> Under Review</p>
                </div>
                <p>⏳ Your application is now under review. This typically takes <strong>3-5 business days</strong>.</p>
                <p>You will receive a notification once your card is approved.</p>
                <a href="https://smartcodenova.com/dashboard/cards/${cardId}" style="background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0;">
                    View Application Status
                </a>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">SmartCodeNova - The Future of Trading</p>
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
                to: [email],
                subject: emailSubject,
                html: emailHtml,
            }),
        });
        console.log('✅ User email notification sent');
    } catch (error) {
        console.error('Error sending user email:', error);
    }

    try {
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN_NEW;
        if (telegramToken) {
            const { data: userData } = await supabase
                .from('user_balances')
                .select('telegram_chat_id')
                .eq('user_id', userId)
                .single();

            const chatId = userData?.telegram_chat_id;
            if (chatId) {
                const message = `✅ <b>Card Application Received</b>\n\n` +
                    `👤 Dear ${fullName},\n\n` +
                    `Your application for <b>${cardName}</b> has been received.\n` +
                    `💰 Fee Paid: ${fee} USDT\n` +
                    `🆔 Application ID: ${cardId}\n\n` +
                    `⏳ <b>Status: Under Review</b>\n` +
                    `📅 Estimated time: 3-5 business days\n\n` +
                    `You will be notified once your card is approved.\n\n` +
                    `🚀 SmartCodeNova - The Future of Trading`;

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });
                console.log('✅ User Telegram notification sent');
            }
        }
    } catch (error) {
        console.error('Error sending user Telegram:', error);
    }

    try {
        await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title: 'Card Application Received',
                message: `Your ${cardName} application has been received and is under review. Estimated time: 3-5 business days.`,
                type: 'card_application',
                read: false,
                created_at: new Date().toISOString(),
            });
        console.log('✅ In-app notification created');
    } catch (error) {
        console.error('Error creating in-app notification:', error);
    }
}

async function sendAdminNotifications(
    email: string, 
    fullName: string, 
    cardName: string, 
    fee: number, 
    cardId: string
) {
    console.log(`📧 Sending admin notifications...`);
    
    try {
        const adminEmailHtml = `
            <div style="background-color: #0b0e14; padding: 20px; font-family: Arial; color: #f3f4f6;">
                <h2 style="color: #f59e0b;">🆕 New Card Application</h2>
                <p>A new card application requires your review.</p>
                <div style="background-color: #1a2332; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>User:</strong> ${fullName} (${email})</p>
                    <p><strong>Card Type:</strong> ${cardName}</p>
                    <p><strong>Fee Paid:</strong> ${fee} USDT</p>
                    <p><strong>Application ID:</strong> ${cardId}</p>
                </div>
                <a href="https://smartcodenova.com/admin/cards" style="background-color: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0;">
                    Review Application
                </a>
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
                to: ['smartcodenova@gmail.com'],
                subject: `🆕 New Card Application - ${fullName}`,
                html: adminEmailHtml,
            }),
        });
        console.log('✅ Admin email notification sent');
    } catch (error) {
        console.error('Error sending admin email:', error);
    }

    try {
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN_NEW;
        if (telegramToken) {
            const chatIds = process.env.TELEGRAM_GROUP_CHAT_IDS?.split(',').map(id => id.trim()) || [];
            
            for (const chatId of chatIds) {
                const message = `🆕 <b>New Card Application</b>\n\n` +
                    `👤 User: ${fullName}\n` +
                    `📧 Email: ${email}\n` +
                    `💳 Card: ${cardName}\n` +
                    `💰 Fee: ${fee} USDT\n` +
                    `🆔 ID: ${cardId}\n\n` +
                    `📋 <b>Status: Pending Review</b>\n` +
                    `⏳ Action Required: Review and approve\n\n` +
                    `🔗 /admin/cards`;

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });
            }
            console.log('✅ Admin Telegram notification sent');
        }
    } catch (error) {
        console.error('Error sending admin Telegram:', error);
    }
}

// ============================================================
// MAIN API HANDLER
// ============================================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            userId, 
            cardType, 
            phone, 
            alternativePhone, 
            alternativeEmail,
            address,
            city,
            state,
            zip,
            country,
            signature,
            acceptedTerms,
            paymentMethod
        } = body;

        console.log('📝 Card Application Received:', { userId, cardType, paymentMethod });

        // Validate required fields
        if (!userId || !cardType || !phone || !address || !city || !state || !zip || !country || !signature || !acceptedTerms) {
            console.log('❌ Missing required fields');
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // ============================================================
        // CREATE SUPABASE CLIENT - AWAIT THE ASYNC FUNCTION
        // ============================================================
        console.log('🔐 Creating Supabase client...');
        const supabase = await createClient(); // ✅ This is the fix - await the async function
        console.log('✅ Supabase client created');

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('user_balances')
            .select('email, full_name, funding_balance, bonus_usdt, referral_earned, promo_earned, telegram_chat_id')
            .eq('user_id', userId)
            .single();

        if (userError || !user) {
            console.error('❌ User not found:', userError);
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        console.log('👤 User found:', user.email);

        // Get card settings
        const { data: settings, error: settingsError } = await supabase
            .from('card_settings')
            .select('*')
            .limit(1)
            .single();

        if (settingsError || !settings) {
            console.error('❌ Settings not found:', settingsError);
            return NextResponse.json({
                success: false,
                error: 'Card settings not found'
            }, { status: 500 });
        }

        console.log('⚙️ Settings loaded');

        // Check if card type is enabled
        const cardTypeMap: Record<string, string> = {
            master_credit: 'master_credit_enabled',
            visa_debit: 'visa_debit_enabled',
            verve_debit: 'verve_debit_enabled'
        };

        const enabledKey = cardTypeMap[cardType];
        if (!settings[enabledKey]) {
            return NextResponse.json({
                success: false,
                error: 'This card type is currently unavailable'
            }, { status: 400 });
        }

        // Get card details from settings
        const fee = getCardFee(cardType, settings);
        const limits = getCardLimits(cardType, settings);
        const cardName = getCardName(cardType);

        console.log('💳 Card details:', { cardName, fee, ...limits });

        // Generate card details
        const cardNumber = generateCardNumber(cardType);
        const cvv = generateCVV();
        const expiry = generateExpiryDate();

        let paymentMethodUsed = paymentMethod;

        // Internal payment - deduct balance
        if (paymentMethod === 'internal') {
            if (!settings.option_a_enabled) {
                return NextResponse.json({
                    success: false,
                    error: 'Internal payment is currently disabled'
                }, { status: 400 });
            }

            const totalBalance = (user.funding_balance || 0) + 
                               (user.bonus_usdt || 0) + 
                               (user.referral_earned || 0) + 
                               (user.promo_earned || 0);

            console.log('💰 Balance check:', { totalBalance, fee, hasBalance: totalBalance >= fee });

            if (totalBalance < fee) {
                return NextResponse.json({
                    success: false,
                    error: `Insufficient balance. Required: ${fee} USDT, Available: ${totalBalance} USDT`
                }, { status: 400 });
            }

            // Deduct fee
            let remainingFee = fee;
            let newFundingBalance = user.funding_balance || 0;
            let newBonusBalance = user.bonus_usdt || 0;
            let newReferralBalance = user.referral_earned || 0;
            let newPromoBalance = user.promo_earned || 0;

            if (newFundingBalance >= remainingFee) {
                newFundingBalance -= remainingFee;
                remainingFee = 0;
            } else {
                remainingFee -= newFundingBalance;
                newFundingBalance = 0;
            }

            if (remainingFee > 0 && newBonusBalance >= remainingFee) {
                newBonusBalance -= remainingFee;
                remainingFee = 0;
            } else if (remainingFee > 0) {
                remainingFee -= newBonusBalance;
                newBonusBalance = 0;
            }

            if (remainingFee > 0 && newReferralBalance >= remainingFee) {
                newReferralBalance -= remainingFee;
                remainingFee = 0;
            } else if (remainingFee > 0) {
                remainingFee -= newReferralBalance;
                newReferralBalance = 0;
            }

            if (remainingFee > 0 && newPromoBalance >= remainingFee) {
                newPromoBalance -= remainingFee;
                remainingFee = 0;
            } else if (remainingFee > 0) {
                newPromoBalance -= remainingFee;
                remainingFee = 0;
            }

            const { error: updateError } = await supabase
                .from('user_balances')
                .update({
                    funding_balance: newFundingBalance,
                    bonus_usdt: newBonusBalance,
                    referral_earned: newReferralBalance,
                    promo_earned: newPromoBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) {
                console.error('❌ Balance update error:', updateError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to deduct fee: ' + updateError.message
                }, { status: 500 });
            }

            console.log('💰 Fee deducted successfully');
            paymentMethodUsed = 'internal';
        } else {
            if (!settings.option_b_enabled) {
                return NextResponse.json({
                    success: false,
                    error: 'External payment is currently disabled'
                }, { status: 400 });
            }
            paymentMethodUsed = 'external';
        }

        // Create card record
        let cardStatus: string;
        let paymentStatus: string;
        
        if (paymentMethodUsed === 'internal') {
            cardStatus = 'pending';
            paymentStatus = 'payment_confirmed';
        } else {
            cardStatus = 'awaiting_payment';
            paymentStatus = 'awaiting_payment';
        }

        const cardData = {
            user_id: userId,
            card_type: cardType,
            card_name: cardName,
            card_number: cardNumber,
            card_last4: cardNumber.slice(-4),
            expiry_month: expiry.month,
            expiry_year: expiry.year,
            cvv: cvv,
            card_holder_name: user.full_name || 'User',
            status: cardStatus,
            fee: fee,
            payment_method: paymentMethodUsed,
            payment_status: paymentStatus,
            application_data: {
                phone,
                alternative_phone: alternativePhone || null,
                alternative_email: alternativeEmail || null,
                address,
                city,
                state,
                zip,
                country,
                accepted_terms: acceptedTerms,
                payment_method: paymentMethodUsed,
            },
            signature: signature,
            shipping_address: {
                address,
                city,
                state,
                zip,
                country,
            },
            daily_limit: limits.dailyLimit,
            monthly_limit: limits.monthlyLimit,
            expiry_date: expiry.date.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        console.log('💳 Creating card');

        const { data: card, error: cardError } = await supabase
            .from('cards')
            .insert(cardData)
            .select()
            .single();

        if (cardError) {
            console.error('❌ Card creation error:', cardError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create card application: ' + cardError.message
            }, { status: 500 });
        }

        console.log('✅ Card created successfully:', card.id);

        // Send notifications
        await sendUserNotifications(
            supabase,
            user.email,
            user.full_name || 'User',
            cardName,
            fee,
            card.id,
            userId
        );

        await sendAdminNotifications(
            user.email,
            user.full_name || 'User',
            cardName,
            fee,
            card.id
        );

        return NextResponse.json({
            success: true,
            data: {
                card,
                paymentMethod: paymentMethodUsed,
                fee: fee,
                cardNumber: maskCardNumber(cardNumber),
                expiry: formatExpiry(expiry.month, expiry.year),
                status: cardStatus,
                message: 'Your card application has been submitted and is under review. Estimated time: 3-5 business days.'
            }
        });

    } catch (error: any) {
        console.error('❌ Apply card error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to apply for card'
        }, { status: 500 });
    }
}