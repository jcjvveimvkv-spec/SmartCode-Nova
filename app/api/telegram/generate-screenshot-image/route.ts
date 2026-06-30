// app/api/telegram/generate-screenshot-image/route.ts
import { NextResponse } from 'next/server';
import { generateTelegramHTML } from '@/app/lib/testimonial-image';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const testimonial = body.testimonial;
    
    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial data required' },
        { status: 400 }
      );
    }

    // Generate HTML for the screenshot
    const html = generateTelegramHTML(testimonial);

    // Return HTML for client-side rendering
    return NextResponse.json({
      success: true,
      html: html,
      message: 'HTML generated successfully',
      testimonial: testimonial,
    });
  } catch (error: any) {
    console.error('Error generating screenshot HTML:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate screenshot HTML' },
      { status: 500 }
    );
  }
}