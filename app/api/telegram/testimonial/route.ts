// app/api/telegram/testimonial/route.ts
import { NextResponse } from 'next/server';
import { generateTestimonial, generateTestimonialMessage } from '@/app/lib/telegram-testimonial';

export async function GET() {
  try {
    const testimonial = generateTestimonial();
    const message = generateTestimonialMessage(testimonial);
    
    return NextResponse.json({
      success: true,
      message: 'Testimonial generated successfully',
      data: {
        testimonial,
        formattedMessage: message,
      },
    });
  } catch (error: any) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate testimonial' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || 'testimonial';
    
    let message: string;
    let data: any;

    if (type === 'quote') {
      const quotes = [
        "💡 \"The best time to invest was yesterday. The next best time is now.\"",
        "💰 \"Wealth is not about having a lot of money; it's about having a lot of options.\"",
        "📈 \"Crypto is not just about money; it's about freedom.\"",
        "🚀 \"The future belongs to those who believe in the beauty of their dreams.\"",
        "💪 \"Success is not final, failure is not fatal: it is the courage to continue that counts.\"",
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      message = `💬 INSPIRATION FOR TODAY 💬\n━━━━━━━━━━━━━━━━━━\n${quote}\n━━━━━━━━━━━━━━━━━━\n📅 ${timestamp}\n\n🌟 SmartCodeNova - Building wealth together!`;
      data = { type: 'quote', quote };
    } else {
      const testimonial = generateTestimonial();
      message = generateTestimonialMessage(testimonial);
      data = { type: 'testimonial', testimonial };
    }

    return NextResponse.json({
      success: true,
      message: `${type} generated successfully`,
      data: {
        ...data,
        formattedMessage: message,
      },
    });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate testimonial' },
      { status: 500 }
    );
  }
}