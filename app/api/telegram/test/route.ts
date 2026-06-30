// app/api/telegram/test/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🔵 Test API called');
    
    const body = await request.json().catch(() => ({}));
    const type = body.type || 'main';
    
    // Generate a test message
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let message = '';
    
    if (type === 'quote') {
      message = `💬 INSPIRATION FOR TODAY 💬\n━━━━━━━━━━━━━━━━━━\n💡 "The best time to invest was yesterday. The next best time is now."\n━━━━━━━━━━━━━━━━━━\n📅 ${timestamp}\n\n🌟 SmartCodeNova - Building wealth together!`;
    } else if (type === 'testimonial') {
      message = `🗣️ NEW TESTIMONIAL SHARED 🗣️\n━━━━━━━━━━━━━━━━━━\n👤 Rahul Sharma\n🌍 🇮🇳 India\n🆔 User ID: RA***MA\n\n💬 "I've been using SmartCodeNova for 3 months and my portfolio has grown 40%! Best investment decision I've ever made. 🚀"\n\n🤖 SmartCodeNova: "Thank you for sharing your experience! We're glad to have you in our community. 🙌"\n━━━━━━━━━━━━━━━━━━\n📅 ${timestamp}\n\n📝 Share your experience in the group or DM us!`;
    } else {
      const amount = (Math.random() * 100 + 10).toFixed(2);
      message = `📥 NEW DEPOSIT DETECTED 🚨\n━━━━━━━━━━━━━━━━━━\n💰 Amount: ${amount} USDT\n🌐 Network: BEP20 (BSC)\n👤 From: 0x8f4e...7a3b\n🔒 Confirmations: 6/6 ✅\n⚡ Status: Completed\n━━━━━━━━━━━━━━━━━━\n🕐 ${timestamp}`;
    }

    console.log('🟡 Message generated:', message.substring(0, 100) + '...');

    // Try to call the Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const cronSecret = process.env.TELEGRAM_CRON_SECRET;

    if (supabaseUrl && cronSecret) {
      try {
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/telegram-bot?secret=${cronSecret}`;
        console.log('🟡 Calling Edge Function:', edgeFunctionUrl);

        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testMessage: message,
            testType: type,
            isTest: true,
          }),
        });

        const data = await response.json();
        console.log('🟡 Edge Function Response:', data);

        if (response.ok && data.success) {
          return NextResponse.json({
            success: true,
            message: 'Test message sent successfully',
            data: {
              type: type,
              formattedMessage: message,
              edgeResponse: data,
            },
          });
        } else if (data.message && data.message.includes('minutes since last message')) {
          return NextResponse.json({
            success: true,
            message: 'Test message generated (Edge Function rate-limited)',
            data: {
              type: type,
              formattedMessage: message,
              note: 'The Edge Function is working but rate-limited. Wait for the interval to pass.',
              edgeResponse: data,
            },
          });
        }
      } catch (edgeError) {
        console.log('⚠️ Edge function call failed:', edgeError);
      }
    }

    // Fallback response
    return NextResponse.json({
      success: true,
      message: 'Test message generated (Edge Function not available)',
      data: {
        type: type,
        formattedMessage: message,
        note: 'Check your Telegram group - message may not have been sent',
      },
    });
  } catch (error: any) {
    console.error('🔴 Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to send test message',
        error: error?.message 
      },
      { status: 500 }
    );
  }
}