// app/api/telegram/generate-and-send-image/route.ts
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
    
    // For now, return the HTML
    // The Edge Function will use this to generate the image
    return NextResponse.json({
      success: true,
      html: html,
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