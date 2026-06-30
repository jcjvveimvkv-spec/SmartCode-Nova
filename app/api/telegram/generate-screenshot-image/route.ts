// app/api/telegram/generate-screenshot-image/route.ts
import { NextResponse } from 'next/server';
import { generateTelegramHTML } from '@/app/lib/testimonial-image';
import puppeteer from 'puppeteer-core';

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
    
    // Use Puppeteer (Vercel doesn't support puppeteer well)
    // We'll try to use it, but fallback if it fails
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 420, height: 650 });
      await page.setContent(html, { waitUntil: 'networkidle0' as any });
      
      const screenshot = await (page as any).screenshot({
        type: 'png',
        fullPage: true,
      });
      
      await browser.close();
      
      const base64Image = `data:image/png;base64,${screenshot.toString('base64')}`;
      
      return NextResponse.json({
        success: true,
        imageData: base64Image,
      });
    } catch (puppeteerError) {
      console.error('Puppeteer failed:', puppeteerError);
      
      // Fallback: Return a placeholder
      const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      return NextResponse.json({
        success: true,
        imageData: placeholderImage,
        note: 'Using placeholder image - puppeteer not available',
      });
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}