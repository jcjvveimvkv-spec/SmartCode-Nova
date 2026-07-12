import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'Only image files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum size is 5MB' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const fileName = `qr-code-${timestamp}.${ext}`;
        const filePath = `qr-codes/${fileName}`;

        // Create admin client lazily inside the handler
        const supabase = getSupabaseAdmin();

        // Upload to Supabase Storage
        const buffer = Buffer.from(await file.arrayBuffer());
        
        const { data, error } = await supabase.storage
            .from('screenshots')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to upload QR code: ' + error.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('screenshots')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: urlData?.publicUrl || '',
            fileName: fileName,
        });

    } catch (error: any) {
        console.error('QR Code upload error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}