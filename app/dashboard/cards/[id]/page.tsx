'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { 
    ArrowLeft, 
    Lock, 
    Unlock, 
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    Check,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';
import CardDisplay from '../components/CardDisplay';

interface Card {
    id: string;
    user_id: string;
    card_type: string;
    card_name: string;
    card_number: string;
    card_last4: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
    card_holder_name: string;
    status: string;
    fee: number;
    payment_method: string;
    payment_status: string;
    daily_limit: number;
    monthly_limit: number;
    application_date: string;
    approved_date: string | null;
    issued_date: string | null;
    shipped_date: string | null;
    activated_date: string | null;
    admin_notes: string | null;
}

export default function CardDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const cardId = params?.id as string;
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [card, setCard] = useState<Card | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [showFullNumber, setShowFullNumber] = useState(false);
    const [showCvv, setShowCvv] = useState(false);

    useEffect(() => {
        if (cardId) {
            loadCardData();
        } else {
            console.warn('⚠️ No card ID provided, redirecting...');
            router.push('/dashboard/cards');
        }
    }, [cardId]);

    const loadCardData = async () => {
        if (!cardId) {
            console.error('❌ No card ID available');
            setError('Invalid card ID');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                console.error('Auth error:', authError);
                setError('Authentication error. Please refresh and try again.');
                setLoading(false);
                return;
            }

            if (!user) {
                console.error('❌ No user found, redirecting to login...');
                router.push('/auth/login');
                return;
            }

            console.log('👤 User ID:', user.id);
            console.log('🔍 Fetching card ID:', cardId);

            // Fetch card details - using the admin client approach
            const response = await fetch(`/api/cards/${cardId}`);
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ API Error:', errorData);
                setError(errorData.error || `Failed to load card (Status: ${response.status})`);
                setLoading(false);
                return;
            }
            
            const result = await response.json();
            console.log('📡 API Response data:', result);

            if (result.success && result.data) {
                // Verify the card belongs to the user
                if (result.data.user_id !== user.id) {
                    console.warn('⚠️ Card does not belong to user:', {
                        cardUserId: result.data.user_id,
                        currentUserId: user.id
                    });
                    setError('You do not have permission to view this card');
                    setLoading(false);
                    return;
                }
                setCard(result.data);
            } else {
                setError(result.error || 'Card not found');
                console.error('❌ Error loading card:', result.error);
            }
        } catch (error: any) {
            console.error('❌ Error loading card:', error);
            setError(error.message || 'Failed to load card');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockToggle = async () => {
        if (!card) return;
        
        const action = card.status === 'blocked' ? 'unblock' : 'block';
        setProcessing(true);

        try {
            const response = await fetch('/api/cards/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cardId: card.id, 
                    action 
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Card ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
                await loadCardData();
            } else {
                toast.error(data.error || `Failed to ${action} card`);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Failed to ${action} card`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!card) return;
        
        if (!confirm(`⚠️ Are you sure you want to delete this card?\n\nCard: ${card.card_name}\nThis action cannot be undone.`)) {
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`/api/cards/${card.id}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Card deleted successfully');
                router.push('/dashboard/cards');
            } else {
                toast.error(data.error || 'Failed to delete card');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to delete card');
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(field);
            toast.success(`${field} copied!`);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            pending: { label: 'Under Review', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
            awaiting_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
            payment_pending: { label: 'Payment Pending', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
            payment_confirmed: { label: 'Payment Confirmed', color: 'text-blue-400', icon: <CheckCircle className="w-4 h-4" /> },
            approved: { label: 'Approved', color: 'text-blue-400', icon: <CheckCircle className="w-4 h-4" /> },
            issued: { label: 'Issued', color: 'text-blue-400', icon: <CheckCircle className="w-4 h-4" /> },
            shipped: { label: 'Shipped', color: 'text-blue-400', icon: <CheckCircle className="w-4 h-4" /> },
            not_activated: { label: 'Not Activated', color: 'text-yellow-400', icon: <AlertCircle className="w-4 h-4" /> },
            active: { label: 'Active', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
            blocked: { label: 'Blocked', color: 'text-red-400', icon: <Lock className="w-4 h-4" /> },
            rejected: { label: 'Rejected', color: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> },
            expired: { label: 'Expired', color: 'text-gray-400', icon: <AlertCircle className="w-4 h-4" /> },
        };
        return statusMap[status] || { label: status, color: 'text-gray-400', icon: <AlertCircle className="w-4 h-4" /> };
    };

    const formatCardNumber = (num: string) => {
        const cleaned = num.replace(/\s/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : num;
    };

    const getCardholderDisplayName = () => {
        if (!card) return 'CARDHOLDER NAME';
        return card.card_holder_name && card.card_holder_name !== 'User' && card.card_holder_name !== 'CARDHOLDER NAME'
            ? card.card_holder_name.toUpperCase()
            : 'CARDHOLDER NAME';
    };

    // Show loading while checking for cardId
    if (!cardId && loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 text-sm">Loading card details...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 text-sm">Loading card details...</p>
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                    <p className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ⚠️ {error || 'Card not found'}
                    </p>
                    {cardId && (
                        <p className="text-sm text-red-400/70 mt-1">Card ID: {cardId}</p>
                    )}
                </div>
                <div className="mt-4 flex gap-3">
                    <Link href="/dashboard/cards">
                        <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">
                            ← Back to Cards
                        </button>
                    </Link>
                    {cardId && (
                        <button
                            onClick={loadCardData}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const statusDisplay = getStatusDisplay(card.status);
    const isBlocked = card.status === 'blocked';
    const isActive = card.status === 'active';
    const isPending = card.status === 'pending' || card.status === 'awaiting_payment' || card.status === 'payment_pending';
    const displayNumber = showFullNumber ? formatCardNumber(card.card_number) : `•••• •••• •••• ${card.card_last4}`;
    const displayCvv = showCvv ? card.cvv : '•••';

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/cards">
                        <button className="text-gray-400 hover:text-white transition">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">Card Details</h1>
                        <p className="text-gray-400 text-sm">{card.card_name}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={loadCardData}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    
                    {!isActive && !isBlocked && (
                        <button
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition text-sm disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                    
                    {(isActive || isBlocked) && (
                        <button
                            onClick={handleBlockToggle}
                            disabled={processing}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition text-sm ${
                                isBlocked
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        >
                            {processing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : isBlocked ? (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    Unblock Card
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Block Card
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div className={`p-3 rounded-lg border ${
                isPending ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                isBlocked ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
                <div className="flex items-center gap-2">
                    {statusDisplay.icon}
                    <span className="font-medium">Status: {statusDisplay.label}</span>
                    {isPending && (
                        <span className="text-sm ml-2">- Estimated 3-5 business days</span>
                    )}
                </div>
            </div>

            {/* Card Display */}
            <div className="flex justify-center">
                <CardDisplay
                    cardType={card.card_type}
                    cardNumber={card.card_number}
                    cardHolderName={getCardholderDisplayName()}
                    expiryMonth={card.expiry_month}
                    expiryYear={card.expiry_year}
                    cvv={card.cvv || '***'}
                    status={card.status}
                    showFlip={true}
                />
            </div>

            {/* Card Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Card Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Card Type</span>
                            <span className="text-white text-sm">{card.card_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Card Number</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-mono text-sm">{displayNumber}</span>
                                <button
                                    onClick={() => setShowFullNumber(!showFullNumber)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    {showFullNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => copyToClipboard(card.card_number, 'Card Number')}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    {copied === 'Card Number' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">CVV</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-mono text-sm">{displayCvv}</span>
                                {card.cvv && (
                                    <>
                                        <button
                                            onClick={() => setShowCvv(!showCvv)}
                                            className="text-gray-400 hover:text-white transition"
                                        >
                                            {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(card.cvv, 'CVV')}
                                            className="text-gray-400 hover:text-white transition"
                                        >
                                            {copied === 'CVV' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Cardholder Name</span>
                            <span className="text-white text-sm uppercase">{getCardholderDisplayName()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Expiry Date</span>
                            <span className="text-white text-sm">
                                {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Fee Paid</span>
                            <span className="text-green-400 text-sm">${card.fee} USDT</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Applied</span>
                            <span className="text-white text-sm">
                                {new Date(card.application_date).toLocaleDateString()}
                            </span>
                        </div>
                        {card.approved_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-400 text-sm">Approved</span>
                                <span className="text-white text-sm">
                                    {new Date(card.approved_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {card.activated_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-400 text-sm">Activated</span>
                                <span className="text-white text-sm">
                                    {new Date(card.activated_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Spending Limits</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-lg">
                            <div>
                                <p className="text-gray-400 text-xs">Daily Limit</p>
                                <p className="text-white font-medium">${card.daily_limit.toLocaleString()} USDT</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">Used Today</p>
                                <p className="text-white font-medium">$0 USDT</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-lg">
                            <div>
                                <p className="text-gray-400 text-xs">Monthly Limit</p>
                                <p className="text-white font-medium">${card.monthly_limit.toLocaleString()} USDT</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">Used This Month</p>
                                <p className="text-white font-medium">$0 USDT</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-[#0b0e14] rounded-lg">
                            <p className="text-gray-400 text-sm">
                                {isPending ? '⏳ Limits will be active once your card is approved.' :
                                 isBlocked ? '🔒 Card is blocked. Limits are temporarily disabled.' :
                                 isActive ? '✅ Card is active. Limits are in effect.' :
                                 '📋 Card is being processed.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {card.admin_notes && (
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Admin Notes</h2>
                    <p className="text-gray-400 text-sm">{card.admin_notes}</p>
                </div>
            )}

            <div className="flex justify-center">
                <Link href="/dashboard/cards">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
                        ← Back to My Cards
                    </button>
                </Link>
            </div>
        </div>
    );
}