import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET - With proper async params handling for Next.js 16
// ============================================================
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // In Next.js 16, params is a Promise, so we need to await it
        const { id: cardId } = await context.params;
        
        console.log('📡 GET /api/cards/[id] - Card ID:', cardId);
        console.log('📡 GET /api/cards/[id] - Full URL:', request.url);

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
// DELETE - With proper async params handling for Next.js 16
// ============================================================
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // In Next.js 16, params is a Promise, so we need to await it
        const { id: cardId } = await context.params;
        
        console.log('🗑️ DELETE /api/cards/[id] - Card ID:', cardId);

        if (!cardId) {
            return NextResponse.json({
                success: false,
                error: 'Card ID is required'
            }, { status: 400 });
        }

        // Check if the card exists
        const { data: card, error: findError } = await supabaseAdmin
            .from('cards')
            .select('id, status, user_id')
            .eq('id', cardId)
            .maybeSingle();

        if (findError) {
            console.error('❌ Error finding card:', findError);
            return NextResponse.json({
                success: false,
                error: findError.message
            }, { status: 500 });
        }

        if (!card) {
            console.warn('⚠️ Card not found for deletion:', cardId);
            return NextResponse.json({
                success: false,
                error: 'Card not found'
            }, { status: 404 });
        }

        // Only allow deletion of non-active, non-blocked cards
        if (card.status === 'active' || card.status === 'blocked') {
            console.warn('⚠️ Cannot delete active or blocked card:', card.status);
            return NextResponse.json({
                success: false,
                error: 'Cannot delete an active or blocked card. Please block or deactivate it first.'
            }, { status: 400 });
        }

        console.log('🗑️ Deleting card:', cardId, 'Current status:', card.status);

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

        console.log('✅ Card deleted successfully:', cardId);

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