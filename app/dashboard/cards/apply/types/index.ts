export interface CardType {
    id: string;
    name: string;
    type: string;
    fee: number;
    dailyLimit: number;
    monthlyLimit: number;
    description: string;
    icon: string;
    enabled: boolean;
    imageUrl: string;
}

export interface UserData {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    funding_balance: number;
    bonus_usdt: number;
    referral_earned: number;
    promo_earned: number;
    total_balance: number;
}

export interface Settings {
    master_credit_enabled: boolean;
    visa_debit_enabled: boolean;
    verve_debit_enabled: boolean;
    option_a_enabled: boolean;
    option_b_enabled: boolean;
    usdt_network: string;
    wallet_address: string;
    qr_code_url: string;
    master_credit_fee: number;
    visa_debit_fee: number;
    verve_debit_fee: number;
    master_credit_daily_limit: number;
    master_credit_monthly_limit: number;
    visa_debit_daily_limit: number;
    visa_debit_monthly_limit: number;
    verve_debit_daily_limit: number;
    verve_debit_monthly_limit: number;
}

export interface FormData {
    phone: string;
    alternativePhone: string;
    alternativeEmail: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export type PaymentMethod = 'internal' | 'external';
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';