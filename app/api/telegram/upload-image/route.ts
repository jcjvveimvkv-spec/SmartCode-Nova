// app/api/telegram/upload-image/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageData, testimonial } = body;
    
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Image data required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename
    const fileName = `testimonials/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('screenshots')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}