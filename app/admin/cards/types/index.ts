export interface Card {
    id: string;
    user_id: string;
    card_type: string;
    card_name: string;
    card_number: string;
    card_last4: string;
    expiry_month: number;
    expiry_year: number;
    status: string;
    fee: number;
    payment_method: string;
    payment_status: string;
    payment_txid: string | null;
    payment_screenshot: string | null;
    application_data: any;
    signature: string;
    shipping_address: any;
    daily_limit: number;
    monthly_limit: number;
    application_date: string;
    approved_date: string | null;
    issued_date: string | null;
    shipped_date: string | null;
    activated_date: string | null;
    admin_notes: string | null;
    cvv?: string;
    card_holder_name?: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
}

export type StatusFilter = 'all' | 'pending' | 'awaiting_payment' | 'payment_pending' | 'payment_confirmed' | 'approved' | 'issued' | 'shipped' | 'not_activated' | 'active' | 'blocked' | 'rejected' | 'expired';
export type TypeFilter = 'all' | 'master_credit' | 'visa_debit' | 'verve_debit';