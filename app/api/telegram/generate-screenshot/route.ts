// app/api/telegram/generate-screenshot/route.ts
import { NextResponse } from 'next/server';
import { generateTestimonial, generateTelegramHTML } from '@/app/lib/testimonial-image';

export async function GET() {
  try {
    const testimonial = generateTestimonial();
    const html = generateTelegramHTML(testimonial);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error generating screenshot:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}