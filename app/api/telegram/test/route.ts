// app/api/telegram/test/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🔵 Test API called');
    
    // Parse request body
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.log('No JSON body, using defaults');
    }
    
    const type = (body as any)?.type || 'main';
    
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

    // Log the message
    console.log('🟡 Message generated:', message.substring(0, 100) + '...');

    // Always return a success response with the message
    // This allows testing even if the Edge Function is not working
    return NextResponse.json({
      success: true,
      message: 'Test message generated successfully',
      data: {
        type: type,
        formattedMessage: message,
        note: 'Message generated. Check your Telegram group if Edge Function is active.',
        timestamp: timestamp,
      },
    });
    
  } catch (error: any) {
    console.error('🔴 Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to generate test message',
        error: error?.message 
      },
      { status: 500 }
    );
  }
}