// /app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, type, title, message, data } = body;

        console.log('📝 Creating notification via API:', { userId, type, title });

        // Validate required fields
        if (!userId || !type || !title || !message) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: userId, type, title, message'
            }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        
        // Prepare insert data - only include fields that exist in the table
        const insertData: any = {
            user_id: userId,
            type: type,
            title: title,
            message: message,
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Only add data if it's provided and is an object with keys
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            insertData.data = data;
        }

        console.log('📝 Inserting notification:', insertData);

        const { error } = await supabase
            .from('user_notifications')
            .insert(insertData);

        if (error) {
            console.error('❌ API Notification error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error.details
            }, { status: 500 });
        }

        console.log('✅ Notification created via API successfully');
        return NextResponse.json({
            success: true,
            message: 'Notification created successfully'
        });

    } catch (error: any) {
        console.error('❌ API Notification exception:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to create notification'
        }, { status: 500 });
    }
}