import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET - Extract ID from URL path
// ============================================================
export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        // Method 1: Try to get from context.params
        let cardId = context?.params?.id;
        
        // Method 2: If that fails, extract from the URL
        if (!cardId) {
            const url = request.url;
            // Extract the ID from the URL path
            // /api/cards/123-456 -> 123-456
            const match = url.match(/\/api\/cards\/([^\/\?]+)/);
            if (match) {
                cardId = match[1];
            }
            console.log('📡 Extracted ID from URL:', cardId);
        }
        
        console.log('📡 GET /api/cards/[id] - Card ID:', cardId);
        console.log('📡 GET /api/cards/[id] - Full URL:', request.url);
        console.log('📡 GET /api/cards/[id] - Context params:', context?.params);

        if (!cardId) {
            console.error('❌ No card ID provided');
            return NextResponse.json({
                success: false,
                error: 'Card ID is required'
            }, { status: 400 });
        }

        // Query the database
        console.log('🔍 Querying cards table for ID:', cardId);
        
        const { data: card, error } = await supabaseAdmin
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .maybeSingle();

        if (error) {
            console.error('❌ Database error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        if (!card) {
            console.warn('⚠️ Card not found with ID:', cardId);
            return NextResponse.json({
                success: false,
                error: 'Card not found'
            }, { status: 404 });
        }

        console.log('✅ Card found:', { 
            id: card.id, 
            card_name: card.card_name, 
            status: card.status,
            user_id: card.user_id 
        });

        return NextResponse.json({
            success: true,
            data: card
        });

    } catch (error: any) {
        console.error('❌ Error in GET /api/cards/[id]:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch card'
        }, { status: 500 });
    }
}

// ============================================================
// DELETE - Extract ID from URL path
// ============================================================
export async function DELETE(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        let cardId = context?.params?.id;
        
        if (!cardId) {
            const url = request.url;
            const match = url.match(/\/api\/cards\/([^\/\?]+)/);
            if (match) {
                cardId = match[1];
            }
        }
        
        console.log('🗑️ DELETE /api/cards/[id] - Card ID:', cardId);

        if (!cardId) {
            return NextResponse.json({
                success: false,
                error: 'Card ID is required'
            }, { status: 400 });
        }

        const { data: card, error: findError } = await supabaseAdmin
            .from('cards')
            .select('id, status, user_id')
            .eq('id', cardId)
            .maybeSingle();

        if (findError || !card) {
            console.error('❌ Card not found:', findError);
            return NextResponse.json({
                success: false,
                error: 'Card not found'
            }, { status: 404 });
        }

        if (card.status === 'active' || card.status === 'blocked') {
            return NextResponse.json({
                success: false,
                error: 'Cannot delete an active or blocked card.'
            }, { status: 400 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('cards')
            .delete()
            .eq('id', cardId);

        if (deleteError) {
            console.error('❌ Delete error:', deleteError);
            return NextResponse.json({
                success: false,
                error: deleteError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Card deleted successfully'
        });

    } catch (error: any) {
        console.error('❌ Error in DELETE /api/cards/[id]:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to delete card'
        }, { status: 500 });
    }
}