// app/api/telegram/generate-and-send-image/route.ts
import { NextResponse } from 'next/server';
import { generateTelegramHTML } from '@/app/lib/testimonial-image';
import { createCanvas } from 'canvas';

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
    
    // Create a simple image using canvas
    const canvas = createCanvas(420, 650);
    const ctx = canvas.getContext('2d');
    
    // Dark background
    ctx.fillStyle = '#17212b';
    ctx.fillRect(0, 0, 420, 650);
    
    // Header
    ctx.fillStyle = '#1f2a36';
    ctx.fillRect(0, 0, 420, 70);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🗣️ NEW TESTIMONIAL', 20, 40);
    
    // Name
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('👤 ' + testimonial.name, 20, 100);
    
    // Country
    ctx.fillStyle = '#7d8b9b';
    ctx.fillText('🌍 ' + testimonial.country, 20, 130);
    
    // User ID
    ctx.fillText('🆔 ' + testimonial.userId, 20, 160);
    
    // Divider
    ctx.strokeStyle = '#2b3a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 180);
    ctx.lineTo(400, 180);
    ctx.stroke();
    
    // Message
    ctx.fillStyle = '#e8edf3';
    ctx.font = '15px Arial';
    const words = testimonial.message.split(' ');
    let line = '';
    let y = 210;
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 360 && line.length > 0) {
        ctx.fillText('💬 ' + line, 20, y);
        y += 28;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    ctx.fillText('💬 ' + line, 20, y);
    
    // Bot Response
    y += 40;
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '14px Arial';
    const respWords = testimonial.botResponse.split(' ');
    let respLine = '';
    for (const word of respWords) {
      const testLine = respLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 360 && respLine.length > 0) {
        ctx.fillText('🤖 ' + respLine, 20, y);
        y += 28;
        respLine = word + ' ';
      } else {
        respLine = testLine;
      }
    }
    ctx.fillText('🤖 ' + respLine, 20, y);
    
    // Timestamp
    y += 40;
    ctx.fillStyle = '#7d8b9b';
    ctx.font = '12px Arial';
    ctx.fillText('📅 ' + testimonial.timestamp, 20, y);
    
    // Footer
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px Arial';
    ctx.fillText('📝 Share your experience in the group or DM us!', 20, 630);
    
    const imageData = canvas.toDataURL('image/png');
    
    return NextResponse.json({
      success: true,
      imageData: imageData,
      html: html,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}