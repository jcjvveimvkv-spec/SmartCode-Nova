// app/api/telegram/testimonial/route.ts
import { NextResponse } from 'next/server';
import { 
  generateTestimonial, 
  generateTestimonialMessage,
  generateInspirationQuote,
  generateQuoteMessage
} from '@/app/lib/telegram-testimonial';

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
      const quote = generateInspirationQuote();
      message = generateQuoteMessage(quote);
      data = { 
        type: 'quote', 
        quote,
        formattedMessage: message,
        timestamp: new Date().toISOString(),
      };
    } else {
      const testimonial = generateTestimonial();
      message = generateTestimonialMessage(testimonial);
      data = { 
        type: 'testimonial', 
        testimonial,
        formattedMessage: message,
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: `${type} generated successfully`,
      data: data,
    });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate testimonial' 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}