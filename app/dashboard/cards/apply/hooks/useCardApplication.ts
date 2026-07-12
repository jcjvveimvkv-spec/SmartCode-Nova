'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import type { CardType, UserData, Settings, FormData, PaymentMethod, SubmitStatus } from '../types';

const DEFAULT_WALLET_ADDRESSES = {
    TRC20: 'TG6Ean2c7rRSp1tHHPd78R4dZzxo67tyyd',
    BEP20: '0x5F8E1c4C318ef1cDAb776587535Bb55E1f92720c',
};

const DEFAULT_QR_URLS = {
    TRC20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtTRC20.jpeg',
    BEP20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtBEP20.jpeg',
};

// ============================================================
// BASE CARD TYPES - Without numeric fields
// ============================================================
const baseCardTypes = [
    {
        id: 'master_credit' as const,
        name: 'Master Credit Card',
        type: 'Premium',
        description: 'Premium credit card with global acceptance, higher limits, and exclusive benefits.',
        icon: '🌟',
        imageUrl: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/cards/card1.png',
    },
    {
        id: 'visa_debit' as const,
        name: 'Visa Debit Card',
        type: 'Global',
        description: 'Global debit card accepted at millions of merchants worldwide with competitive fees.',
        icon: '💳',
        imageUrl: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/cards/card2.png',
    },
    {
        id: 'verve_debit' as const,
        name: 'Verve Debit Card',
        type: 'Regular',
        description: 'Affordable debit card with great local and regional acceptance for everyday use.',
        icon: '💳',
        imageUrl: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/cards/card3.png',
    },
];

// ============================================================
// HELPER: Convert settings value to number
// ============================================================
const toNumber = (value: any, defaultValue: number): number => {
    if (value === undefined || value === null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
};

export function useCardApplication() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // ============================================================
    // STATE
    // ============================================================
    const [user, setUser] = useState<UserData | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [cardTypes, setCardTypes] = useState<CardType[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('master_credit');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('internal');
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        phone: '',
        alternativePhone: '',
        alternativeEmail: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
    });

    // ============================================================
    // COMPUTED VALUES
    // ============================================================
    const selectedCardData = cardTypes.find(c => c.id === selectedCard);
    const internalAvailable = settings?.option_a_enabled !== false;
    const externalAvailable = settings?.option_b_enabled !== false;
    const totalBalance = user?.total_balance || 0;
    const fee = selectedCardData?.fee || 0;
    const hasSufficientBalance = totalBalance >= fee;

    const network = settings?.usdt_network || 'TRC20';
    const walletAddress = settings?.wallet_address || DEFAULT_WALLET_ADDRESSES[network as keyof typeof DEFAULT_WALLET_ADDRESSES] || '';
    const qrCodeUrl = settings?.qr_code_url || DEFAULT_QR_URLS[network as keyof typeof DEFAULT_QR_URLS] || '';

    // ============================================================
    // BUILD CARD TYPES FROM SETTINGS
    // ============================================================
    const buildCardTypes = (settingsData: Settings | null): CardType[] => {
        if (!settingsData) {
            // Return default card types
            return baseCardTypes.map((card) => ({
                ...card,
                fee: 500,
                dailyLimit: 10000,
                monthlyLimit: 50000,
                enabled: true,
            }));
        }

        return baseCardTypes.map((card) => {
            const feeKey = `${card.id}_fee` as keyof Settings;
            const dailyLimitKey = `${card.id}_daily_limit` as keyof Settings;
            const monthlyLimitKey = `${card.id}_monthly_limit` as keyof Settings;
            const enabledKey = `${card.id}_enabled` as keyof Settings;

            return {
                ...card,
                fee: toNumber(settingsData[feeKey], 500),
                dailyLimit: toNumber(settingsData[dailyLimitKey], 10000),
                monthlyLimit: toNumber(settingsData[monthlyLimitKey], 50000),
                enabled: settingsData[enabledKey] !== false,
            };
        });
    };

    // ============================================================
    // LOAD DATA - WITH TIMEOUT AND ERROR HANDLING
    // ============================================================
    const loadData = async () => {
        setPageLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Starting loadData...');
            
            // ============================================================
            // STEP 1: AUTHENTICATION - WITH TIMEOUT
            // ============================================================
            console.log('🔐 Checking authentication...');
            
            let user;
            try {
                const authResult = await Promise.race([
                    supabase.auth.getUser(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Auth timeout after 10 seconds')), 10000)
                    )
                ]) as any;
                
                if (authResult.error) {
                    console.error('Auth error:', authResult.error);
                    setError('Authentication error. Please refresh and try again.');
                    setPageLoading(false);
                    return;
                }
                
                user = authResult.data?.user;
                
                if (!user) {
                    console.log('🔐 No user found, redirecting to login...');
                    router.push('/auth/login');
                    return;
                }
            } catch (authError: any) {
                console.error('Auth timeout or error:', authError);
                setError('Authentication timeout. Please refresh and try again.');
                setPageLoading(false);
                return;
            }

            console.log('👤 User authenticated:', user.id);

            // ============================================================
            // STEP 2: GET USER DATA - WITH TIMEOUT
            // ============================================================
            console.log('📊 Fetching user data...');
            
            try {
                const userDataPromise = supabase
                    .from('user_balances')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                const userResult = await Promise.race([
                    userDataPromise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('User data fetch timeout after 10 seconds')), 10000)
                    )
                ]) as any;

                if (userResult.error) {
                    console.warn('User not found in user_balances:', userResult.error);
                    
                    // Create user_balances if it doesn't exist
                    console.log('📝 Creating user_balances record...');
                    const { data: newUser, error: insertError } = await supabase
                        .from('user_balances')
                        .insert({
                            user_id: user.id,
                            email: user.email || '',
                            full_name: user.user_metadata?.full_name || '',
                            funding_balance: 0,
                            bonus_usdt: 0,
                            referral_earned: 0,
                            promo_earned: 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (!insertError && newUser) {
                        console.log('✅ Created new user_balances record');
                        const totalBalance = (newUser.funding_balance || 0) + 
                                           (newUser.bonus_usdt || 0) + 
                                           (newUser.referral_earned || 0) + 
                                           (newUser.promo_earned || 0);
                        setUser({
                            id: newUser.user_id,
                            email: newUser.email || user.email || '',
                            full_name: newUser.full_name || user.user_metadata?.full_name || '',
                            phone: newUser.phone || '',
                            funding_balance: newUser.funding_balance || 0,
                            bonus_usdt: newUser.bonus_usdt || 0,
                            referral_earned: newUser.referral_earned || 0,
                            promo_earned: newUser.promo_earned || 0,
                            total_balance: totalBalance,
                        });
                    } else {
                        // Use fallback user data
                        console.log('⚠️ Using fallback user data');
                        setUser({
                            id: user.id,
                            email: user.email || '',
                            full_name: user.user_metadata?.full_name || '',
                            phone: '',
                            funding_balance: 0,
                            bonus_usdt: 0,
                            referral_earned: 0,
                            promo_earned: 0,
                            total_balance: 0,
                        });
                    }
                } else if (userResult.data) {
                    console.log('💰 User balance loaded:', userResult.data.funding_balance);
                    const totalBalance = (userResult.data.funding_balance || 0) + 
                                       (userResult.data.bonus_usdt || 0) + 
                                       (userResult.data.referral_earned || 0) + 
                                       (userResult.data.promo_earned || 0);
                    
                    setUser({
                        id: userResult.data.user_id,
                        email: userResult.data.email || user.email || '',
                        full_name: userResult.data.full_name || user.user_metadata?.full_name || '',
                        phone: userResult.data.phone || '',
                        funding_balance: userResult.data.funding_balance || 0,
                        bonus_usdt: userResult.data.bonus_usdt || 0,
                        referral_earned: userResult.data.referral_earned || 0,
                        promo_earned: userResult.data.promo_earned || 0,
                        total_balance: totalBalance,
                    });
                    
                    if (userResult.data.phone) {
                        setFormData(prev => ({ ...prev, phone: userResult.data.phone }));
                    }
                }
            } catch (userError) {
                console.error('Error fetching user data:', userError);
                // Set fallback user data
                setUser({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    phone: '',
                    funding_balance: 0,
                    bonus_usdt: 0,
                    referral_earned: 0,
                    promo_earned: 0,
                    total_balance: 0,
                });
            }

            // ============================================================
            // STEP 3: GET CARD SETTINGS - WITH TIMEOUT
            // ============================================================
            console.log('⚙️ Fetching card settings...');
            
            let settingsData: Settings | null = null;
            
            try {
                const settingsPromise = fetch('/api/cards/settings');
                const settingsResponse = await Promise.race([
                    settingsPromise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Settings fetch timeout after 10 seconds')), 10000)
                    )
                ]) as Response;
                
                if (settingsResponse.ok) {
                    const result = await settingsResponse.json();
                    if (result.success) {
                        const data = result.data;
                        const network = data.usdt_network || 'TRC20';
                        
                        if (!data.wallet_address) {
                            data.wallet_address = DEFAULT_WALLET_ADDRESSES[network as keyof typeof DEFAULT_WALLET_ADDRESSES] || '';
                        }
                        if (!data.qr_code_url) {
                            data.qr_code_url = DEFAULT_QR_URLS[network as keyof typeof DEFAULT_QR_URLS] || '';
                        }
                        
                        settingsData = data;
                        setSettings(data);
                        console.log('✅ Settings loaded successfully');
                    }
                } else {
                    console.warn('⚠️ Settings API returned:', settingsResponse.status);
                }
            } catch (settingsError) {
                console.error('Error fetching settings:', settingsError);
            }

            // ============================================================
            // STEP 4: BUILD CARD TYPES
            // ============================================================
            const builtCardTypes = buildCardTypes(settingsData);
            setCardTypes(builtCardTypes);
            
            const firstAvailable = builtCardTypes.find(c => c.enabled);
            if (firstAvailable) {
                setSelectedCard(firstAvailable.id);
            }
            
            console.log('✅ loadData complete!');
        } catch (error: any) {
            console.error('❌ Error loading data:', error);
            setError(error.message || 'Failed to load data');
            // Set default card types even on error
            const defaultCardTypes: CardType[] = baseCardTypes.map((card) => ({
                ...card,
                fee: 500,
                dailyLimit: 10000,
                monthlyLimit: 50000,
                enabled: true,
            }));
            setCardTypes(defaultCardTypes);
        } finally {
            setPageLoading(false);
        }
    };

    // ============================================================
    // LOAD DATA ON MOUNT
    // ============================================================
    useEffect(() => {
        loadData();
    }, []);

    // ============================================================
    // HANDLE SUBMIT
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('🔘 Submit button clicked!');
        console.log('📋 Current state:', {
            paymentMethod,
            selectedCard,
            hasSignature: !!signatureData,
            hasAcceptedTerms: acceptedTerms,
            userId: user?.id,
            phone: formData.phone,
            address: formData.address,
        });

        setSubmitStatus('idle');
        setError(null);
        setLoading(true);
        setSubmitStatus('submitting');

        // ============================================================
        // VALIDATION
        // ============================================================
        if (!user?.id) {
            toast.error('Please log in to apply for a card');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!selectedCard) {
            toast.error('Please select a card type');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        const selectedCardData = cardTypes.find(c => c.id === selectedCard);
        if (selectedCardData && !selectedCardData.enabled) {
            toast.error('This card type is currently unavailable');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.phone || formData.phone.trim() === '') {
            toast.error('Phone number is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.address || formData.address.trim() === '') {
            toast.error('Street address is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.city || formData.city.trim() === '') {
            toast.error('City is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.state || formData.state.trim() === '') {
            toast.error('State/Province is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.zip || formData.zip.trim() === '') {
            toast.error('ZIP/Postal code is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!formData.country || formData.country.trim() === '') {
            toast.error('Country is required');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!signatureData) {
            toast.error('Please provide your signature');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        if (!acceptedTerms) {
            toast.error('Please accept the Terms & Conditions');
            setLoading(false);
            setSubmitStatus('idle');
            return;
        }

        // Check balance for internal payment
        if (paymentMethod === 'internal') {
            const totalBalance = user?.total_balance || 0;
            const fee = selectedCardData?.fee || 0;
            
            console.log('💰 Balance check:', { totalBalance, fee, hasBalance: totalBalance >= fee });
            
            if (totalBalance < fee) {
                toast.error(`Insufficient balance. Required: ${fee} USDT, Available: ${totalBalance} USDT`);
                setLoading(false);
                setSubmitStatus('idle');
                return;
            }
        }

        // ============================================================
        // SEND API REQUEST
        // ============================================================
        try {
            const requestBody = {
                userId: user.id,
                cardType: selectedCard,
                phone: formData.phone.trim(),
                alternativePhone: formData.alternativePhone?.trim() || null,
                alternativeEmail: formData.alternativeEmail?.trim() || null,
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zip: formData.zip.trim(),
                country: formData.country.trim(),
                signature: signatureData,
                acceptedTerms: acceptedTerms,
                paymentMethod: paymentMethod,
            };

            console.log('📤 Sending API request...');

            const response = await fetch('/api/cards/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('📡 API Response:', data);

            if (data.success) {
                setApplicationId(data.data?.card?.id || null);
                
                if (paymentMethod === 'external') {
                    setShowPaymentModal(true);
                    setSubmitStatus('idle');
                    setLoading(false);
                    toast.info('Please complete your external payment');
                } else {
                    setSubmitStatus('success');
                    toast.success('🎉 Card application submitted successfully!');
                    setTimeout(() => {
                        router.push('/dashboard/cards');
                    }, 2000);
                }
            } else {
                console.error('❌ API Error:', data.error);
                toast.error(data.error || 'Failed to submit application');
                setSubmitStatus('error');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Submission error:', error);
            toast.error(error.message || 'Failed to submit application');
            setSubmitStatus('error');
            setLoading(false);
        }
    };

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignatureChange = (data: string | null) => {
        setSignatureData(data);
    };

    const handleTermsChange = (accepted: boolean) => {
        setAcceptedTerms(accepted);
    };

    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setPaymentMethod(method);
    };

    const handleCardSelect = (cardId: string) => {
        setSelectedCard(cardId);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setApplicationId(null);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        toast.success('Payment confirmed! Redirecting to your cards...');
        router.push('/dashboard/cards');
    };

    // ============================================================
    // RETURN
    // ============================================================
    return {
        // State
        user,
        settings,
        cardTypes,
        selectedCard,
        selectedCardData,
        paymentMethod,
        submitStatus,
        loading,
        pageLoading,
        error,
        showPaymentModal,
        applicationId,
        signatureData,
        acceptedTerms,
        showTerms,
        formData,
        
        // Computed
        internalAvailable,
        externalAvailable,
        totalBalance,
        fee,
        hasSufficientBalance,
        network,
        walletAddress,
        qrCodeUrl,
        
        // Actions
        loadData,
        handleSubmit,
        handleInputChange,
        handleSignatureChange,
        handleTermsChange,
        handlePaymentMethodChange,
        handleCardSelect,
        closePaymentModal,
        handlePaymentSuccess,
        setShowTerms,
        setFormData,
    };
}