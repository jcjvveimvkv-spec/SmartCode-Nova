// app/api/telegram/generate-screenshot/route.ts
import { NextResponse } from 'next/server';
import { generateTestimonial, generateTelegramHTML } from '@/app/lib/testimonial-image';
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // This is a placeholder - in production, you'd use html2canvas or puppeteer
    // For now, we return the HTML that can be rendered client-side
    
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