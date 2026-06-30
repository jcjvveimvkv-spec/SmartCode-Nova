// app/api/telegram/generate-screenshot-image/route.ts
import { NextResponse } from 'next/server';
import { generateTelegramHTML } from '@/app/lib/testimonial-image';
import puppeteer from 'puppeteer';

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
    
    // Use puppeteer to render the HTML as an image
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 650 });
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    
    // Take screenshot as PNG
    const screenshotBuffer = await (page as any).screenshot({
      type: 'png',
      fullPage: true,
    });
    
    await browser.close();

    // Convert to base64
    const base64Image = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      imageData: base64Image,
    });
  } catch (error: any) {
    console.error('Error generating screenshot image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate screenshot' },
      { status: 500 }
    );
  }
}