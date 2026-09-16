'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import {
    CreditCard,
    Plus,
    RefreshCw,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Lock,
    Unlock,
    Trash2
} from 'lucide-react';
import CardDisplay from './components/CardDisplay';

// ============================================================
// CARD INTERFACE - INCLUDES cvv AND card_holder_name
// ============================================================
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
}

export default function DashboardCardsPage() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('Auth error:', authError);
                setError('Authentication error. Please refresh and try again.');
                setLoading(false);
                return;
            }

            if (!user) {
                router.push('/auth/login');
                return;
            }

            console.log('👤 User authenticated:', user.id);

            const cardsResponse = await fetch(`/api/cards?userId=${user.id}`);
            console.log('📡 Cards API response status:', cardsResponse.status);

            if (cardsResponse.ok) {
                const cardsResult = await cardsResponse.json();
                console.log('📊 User cards response:', cardsResult);

                if (cardsResult.success && Array.isArray(cardsResult.data)) {
                    const userCards = cardsResult.data;
                    console.log(`📊 Found ${userCards.length} cards for user`);

                    if (userCards.length > 0) {
                        console.log('📊 Sample card:', {
                            card_holder_name: userCards[0].card_holder_name || 'MISSING',
                            cvv: userCards[0].cvv || 'MISSING',
                        });
                    }

                    setCards(userCards);
                } else {
                    setCards([]);
                }
            } else {
                console.log('No cards found or API error');
                setCards([]);
            }
        } catch (error: any) {
            console.error('Error loading cards:', error);
            setError(error.message || 'Failed to load cards');
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            pending: { label: 'Under Review', color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock className="w-4 h-4" /> },
            awaiting_payment: { label: 'Awaiting Payment', color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock className="w-4 h-4" /> },
            payment_pending: { label: 'Payment Pending', color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock className="w-4 h-4" /> },
            payment_confirmed: { label: 'Payment Confirmed', color: 'text-blue-500 bg-blue-500/10', icon: <CheckCircle className="w-4 h-4" /> },
            approved: { label: 'Approved', color: 'text-blue-500 bg-blue-500/10', icon: <CheckCircle className="w-4 h-4" /> },
            issued: { label: 'Issued', color: 'text-blue-500 bg-blue-500/10', icon: <CreditCard className="w-4 h-4" /> },
            shipped: { label: 'Shipped', color: 'text-blue-500 bg-blue-500/10', icon: <CreditCard className="w-4 h-4" /> },
            not_activated: { label: 'Not Activated', color: 'text-yellow-500 bg-yellow-500/10', icon: <AlertCircle className="w-4 h-4" /> },
            active: { label: 'Active', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle className="w-4 h-4" /> },
            blocked: { label: 'Blocked', color: 'text-red-500 bg-red-500/10', icon: <Lock className="w-4 h-4" /> },
            rejected: { label: 'Rejected', color: 'text-red-500 bg-red-500/10', icon: <XCircle className="w-4 h-4" /> },
            expired: { label: 'Expired', color: 'text-gray-500 bg-gray-500/10', icon: <AlertCircle className="w-4 h-4" /> },
        };
        return statusMap[status] || { label: status, color: 'text-gray-500 bg-gray-500/10', icon: <AlertCircle className="w-4 h-4" /> };
    };

    const handleBlock = async (cardId: string, action: 'block' | 'unblock') => {
        setProcessing(prev => ({ ...prev, [cardId]: true }));
        try {
            const response = await fetch('/api/cards/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, action }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Card ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
                await loadData();
            } else {
                toast.error(data.error || `Failed to ${action} card`);
            }
        } catch (error) {
            toast.error(`Failed to ${action} card`);
        } finally {
            setProcessing(prev => ({ ...prev, [cardId]: false }));
        }
    };

    const handleDelete = async (cardId: string) => {
        if (!confirm('⚠️ Are you sure you want to delete this card? This action cannot be undone.')) return;
        setProcessing(prev => ({ ...prev, [cardId]: true }));
        try {
            const response = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                toast.success('Card deleted successfully');
                await loadData();
            } else {
                toast.error(data.error || 'Failed to delete card');
            }
        } catch (error) {
            toast.error('Failed to delete card');
        } finally {
            setProcessing(prev => ({ ...prev, [cardId]: false }));
        }
    };

    const getCardActionButton = (card: Card) => {
        const status = card.status;
        const isProcessing = processing[card.id] || false;

        if (status === 'pending' || status === 'awaiting_payment' || status === 'payment_pending') {
            return <div className="text-yellow-400 text-xs sm:text-sm flex items-center gap-2"><Clock className="w-4 h-4 animate-pulse shrink-0" /> Under Review</div>;
        }
        if (status === 'payment_confirmed') {
            return <div className="text-blue-400 text-xs sm:text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" /> Payment Confirmed</div>;
        }
        if (status === 'rejected') {
            return <div className="text-red-400 text-xs sm:text-sm flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" /> Application Rejected</div>;
        }
        if (status === 'issued' || status === 'shipped') {
            return <div className="text-blue-400 text-xs sm:text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 shrink-0" /> Being Processed</div>;
        }
        if (status === 'not_activated') {
            return <button className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-xs sm:text-sm">Activate at ATM</button>;
        }
        if (status === 'active') {
            return (
                <button
                    onClick={() => handleBlock(card.id, 'block')}
                    disabled={isProcessing}
                    className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50"
                >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Block Card</span>
                </button>
            );
        }
        if (status === 'blocked') {
            return (
                <button
                    onClick={() => handleBlock(card.id, 'unblock')}
                    disabled={isProcessing}
                    className="px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50"
                >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    <span>Unblock Card</span>
                </button>
            );
        }
        return null;
    };

    const totalCards = cards.length;
    const activeCards = cards.filter(c => c.status === 'active').length;
    const pendingCards = cards.filter(c => c.status === 'pending' || c.status === 'awaiting_payment' || c.status === 'payment_pending' || c.status === 'payment_confirmed').length;
    const blockedCards = cards.filter(c => c.status === 'blocked').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 text-sm">Loading your cards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm break-words">⚠️ {error}</div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Cards</h2>
                    <p className="text-gray-400 text-sm">Unable to load cards. Please try again later.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm">
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">💳 My Cards</h1>
                    <p className="text-gray-400 text-xs sm:text-sm">Manage your cards and applications</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={loadData}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <Link href="/dashboard/cards/apply" className="w-full sm:w-auto">
                        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm">
                            <Plus className="w-4 h-4" /> Apply for Card
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-sm truncate">Total Cards</p>
                    <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">{totalCards}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-sm truncate">Active</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-500 tabular-nums">{activeCards}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-sm truncate">Under Review</p>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-500 tabular-nums">{pendingCards}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-sm truncate">Blocked</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-500 tabular-nums">{blockedCards}</p>
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6 sm:p-12 text-center">
                    <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Cards Yet</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4">You haven't applied for any cards yet.</p>
                    <Link href="/dashboard/cards/apply">
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-5 sm:px-6 py-2 rounded-lg transition text-sm">
                            Apply for Your First Card
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {cards.map((card) => {
                        const statusDisplay = getStatusDisplay(card.status);
                        const isProcessing = processing[card.id] || false;

                        return (
                            <div
                                key={card.id}
                                className={`bg-[#1a2332] rounded-xl border overflow-hidden transition group ${
                                    card.status === 'pending' || card.status === 'awaiting_payment' || card.status === 'payment_pending'
                                        ? 'border-yellow-500/30 hover:border-yellow-500/50'
                                        : card.status === 'active' ? 'border-green-500/30 hover:border-green-500/50'
                                        : card.status === 'blocked' ? 'border-red-500/30 hover:border-red-500/50'
                                        : 'border-white/5 hover:border-purple-500/30'
                                }`}
                            >
                                {/* ============================================ */}
                                {/* ⚠️ CARD DISPLAY AREA — DO NOT MODIFY         */}
                                {/* This is the card image with all details on it */}
                                {/* ============================================ */}
                                <div className="p-4">
                                    <CardDisplay
                                        cardType={card.card_type}
                                        cardNumber={card.card_number}
                                        cardHolderName={card.card_holder_name || 'CARDHOLDER NAME'}
                                        expiryMonth={card.expiry_month}
                                        expiryYear={card.expiry_year}
                                        cvv={card.cvv || '***'}
                                        status={card.status}
                                        showFlip={true}
                                    />
                                </div>
                                {/* ============================================ */}
                                {/* ⚠️ END CARD DISPLAY AREA                      */}
                                {/* ============================================ */}

                                {/* Card Details */}
                                <div className="p-3 sm:p-4 pt-0 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Daily Limit</p>
                                            <p className="text-white font-medium tabular-nums truncate">${card.daily_limit.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">USDT</span></p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Monthly Limit</p>
                                            <p className="text-white font-medium tabular-nums truncate">${card.monthly_limit.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">USDT</span></p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Fee</p>
                                            <p className="text-green-400 font-medium tabular-nums">${card.fee} <span className="text-[10px] font-normal text-gray-400">USDT</span></p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Applied</p>
                                            <p className="text-white font-medium truncate">{new Date(card.application_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Action row — stacks on mobile */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                            {getCardActionButton(card)}
                                            {card.status !== 'active' && card.status !== 'blocked' && (
                                                <button
                                                    onClick={() => handleDelete(card.id)}
                                                    disabled={isProcessing}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50 shrink-0"
                                                    title="Delete Card"
                                                    aria-label="Delete Card"
                                                >
                                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <Link href={`/dashboard/cards/${card.id}`} className="shrink-0">
                                            <button className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1 text-xs sm:text-sm">
                                                View Details <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Activation Info */}
            {cards.some(c => c.status === 'not_activated') && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-blue-400">Card Activation Required</h4>
                            <p className="text-xs sm:text-sm text-blue-300 mt-1">
                                Some of your cards are not activated yet. To activate your card, visit any ATM, insert your card, and follow the on-screen instructions to set your PIN.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Apply */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white">Need a New Card?</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Apply for a Master Credit, Visa Debit, or Verve Debit card.</p>
                    </div>
                    <Link href="/dashboard/cards/apply" className="w-full md:w-auto shrink-0">
                        <button className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white px-5 sm:px-6 py-2.5 rounded-lg transition whitespace-nowrap text-sm">
                            Apply Now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
