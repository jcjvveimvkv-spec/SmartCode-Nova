// app/api/telegram/screenshot-to-image/route.ts
import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
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

    // Generate HTML
    const html = generateTelegramHTML(testimonial);
    
    // For now, return a placeholder image
    // In production, you'd use html2canvas or a similar tool
    
    // Create a simple image with the testimonial text
    const canvas = createCanvas(400, 500);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#17212b';
    ctx.fillRect(0, 0, 400, 500);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('🗣️ ' + testimonial.name, 20, 50);
    ctx.fillText('🌍 ' + testimonial.country, 20, 90);
    ctx.fillText('🆔 ' + testimonial.userId, 20, 130);
    
    // Message
    ctx.font = '16px Arial';
    const words = testimonial.message.split(' ');
    let line = '';
    let y = 180;
    for (const word of words) {
      if (line.length + word.length > 40) {
        ctx.fillText(line, 20, y);
        y += 30;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    ctx.fillText(line, 20, y);
    
    const imageData = canvas.toDataURL('image/png');
    
    return NextResponse.json({
      success: true,
      imageData: imageData,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}