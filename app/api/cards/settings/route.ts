import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('card_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // First, get the existing settings to get the ID
        const { data: existingSettings, error: fetchError } = await supabaseAdmin
            .from('card_settings')
            .select('id')
            .limit(1)
            .single();

        if (fetchError || !existingSettings) {
            return NextResponse.json({ 
                success: false, 
                error: 'Card settings not found' 
            }, { status: 404 });
        }

        const {
            master_credit_enabled,
            visa_debit_enabled,
            verve_debit_enabled,
            option_a_enabled,
            option_b_enabled,
            usdt_network,
            wallet_address,
            qr_code_url,
            master_credit_fee,
            visa_debit_fee,
            verve_debit_fee,
            master_credit_daily_limit,
            master_credit_monthly_limit,
            visa_debit_daily_limit,
            visa_debit_monthly_limit,
            verve_debit_daily_limit,
            verve_debit_monthly_limit,
        } = body;

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        // Only add fields that are provided
        if (master_credit_enabled !== undefined) updateData.master_credit_enabled = master_credit_enabled;
        if (visa_debit_enabled !== undefined) updateData.visa_debit_enabled = visa_debit_enabled;
        if (verve_debit_enabled !== undefined) updateData.verve_debit_enabled = verve_debit_enabled;
        if (option_a_enabled !== undefined) updateData.option_a_enabled = option_a_enabled;
        if (option_b_enabled !== undefined) updateData.option_b_enabled = option_b_enabled;
        if (usdt_network !== undefined) updateData.usdt_network = usdt_network;
        if (wallet_address !== undefined) updateData.wallet_address = wallet_address;
        if (qr_code_url !== undefined) updateData.qr_code_url = qr_code_url;
        if (master_credit_fee !== undefined) updateData.master_credit_fee = master_credit_fee;
        if (visa_debit_fee !== undefined) updateData.visa_debit_fee = visa_debit_fee;
        if (verve_debit_fee !== undefined) updateData.verve_debit_fee = verve_debit_fee;
        if (master_credit_daily_limit !== undefined) updateData.master_credit_daily_limit = master_credit_daily_limit;
        if (master_credit_monthly_limit !== undefined) updateData.master_credit_monthly_limit = master_credit_monthly_limit;
        if (visa_debit_daily_limit !== undefined) updateData.visa_debit_daily_limit = visa_debit_daily_limit;
        if (visa_debit_monthly_limit !== undefined) updateData.visa_debit_monthly_limit = visa_debit_monthly_limit;
        if (verve_debit_daily_limit !== undefined) updateData.verve_debit_daily_limit = verve_debit_daily_limit;
        if (verve_debit_monthly_limit !== undefined) updateData.verve_debit_monthly_limit = verve_debit_monthly_limit;

        const { data, error } = await supabaseAdmin
            .from('card_settings')
            .update(updateData)
            .eq('id', existingSettings.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}