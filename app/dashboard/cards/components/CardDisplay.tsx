'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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

// ============================================================
// SKELETON PLACEHOLDER
// ============================================================
function CardSkeleton() {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4">
                <div
                    className="w-full max-w-[420px] mx-auto rounded-2xl bg-white/5 animate-pulse"
                    style={{ aspectRatio: '420 / 260' }}
                />
            </div>
            <div className="p-3 sm:p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-2.5 w-16 rounded bg-white/5 animate-pulse" />
                            <div className="h-3.5 w-24 rounded bg-white/10 animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
                    <div className="h-9 w-32 rounded-lg bg-white/5 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
                </div>
            </div>
        </div>
    );
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

                    // Log sample data to verify cvv and card_holder_name
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
            return (
                <div className="text-yellow-400 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 shrink-0 animate-pulse" />
                    <span className="truncate">Under review</span>
                </div>
            );
        }
        if (status === 'payment_confirmed') {
            return (
                <div className="text-blue-400 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">Awaiting approval</span>
                </div>
            );
        }
        if (status === 'rejected') {
            return (
                <div className="text-red-400 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">Rejected</span>
                </div>
            );
        }
        if (status === 'issued' || status === 'shipped') {
            return (
                <div className="text-blue-400 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span className="truncate">Being processed</span>
                </div>
            );
        }
        if (status === 'not_activated') {
            return (
                <button className="px-4 py-2.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm w-full sm:w-auto">
                    Activate at ATM
                </button>
            );
        }
        if (status === 'active') {
            return (
                <button
                    onClick={() => handleBlock(card.id, 'block')}
                    disabled={isProcessing}
                    className="px-4 py-2.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                    {isProcessing ? <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> : <Lock className="w-4 h-4 shrink-0" />}
                    Block card
                </button>
            );
        }
        if (status === 'blocked') {
            return (
                <button
                    onClick={() => handleBlock(card.id, 'unblock')}
                    disabled={isProcessing}
                    className="px-4 py-2.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                    {isProcessing ? <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> : <Unlock className="w-4 h-4 shrink-0" />}
                    Unblock card
                </button>
            );
        }
        return null;
    };

    const totalCards = cards.length;
    const activeCards = cards.filter(c => c.status === 'active').length;
    const pendingCards = cards.filter(c => c.status === 'pending' || c.status === 'awaiting_payment' || c.status === 'payment_pending' || c.status === 'payment_confirmed').length;
    const blockedCards = cards.filter(c => c.status === 'blocked').length;

    const stats = [
        { label: 'Total cards', value: totalCards, tone: 'text-white' },
        { label: 'Active', value: activeCards, tone: 'text-green-500' },
        { label: 'Under review', value: pendingCards, tone: 'text-yellow-500' },
        { label: 'Blocked', value: blockedCards, tone: 'text-red-500' },
    ];

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
                <div className="h-8 w-40 rounded bg-white/5 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                            <div className="h-6 w-10 rounded bg-white/10 animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4 break-words">
                    ⚠️ {error}
                </div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Cards</h2>
                    <p className="text-gray-400 text-sm break-words">We couldn&apos;t load your cards. Try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg transition"
                    >
                        Refresh page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate">💳 My cards</h1>
                    <p className="text-gray-400 text-xs sm:text-sm">Manage your cards and applications</p>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={loadData}
                        className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm"
                    >
                        <RefreshCw className="w-4 h-4 shrink-0" /> Refresh
                    </button>
                    <Link href="/dashboard/cards/apply" className="flex-1 sm:flex-none">
                        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm whitespace-nowrap">
                            <Plus className="w-4 h-4 shrink-0" /> Apply for card
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                        <p className="text-gray-400 text-[10px] sm:text-sm truncate">{s.label}</p>
                        <p className={`text-lg sm:text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Cards list */}
            {cards.length === 0 ? (
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-8 sm:p-12 text-center">
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                        className="inline-block"
                    >
                        <CreditCard className="w-14 h-14 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4 opacity-30" />
                    </motion.div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No cards yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Apply for your first card to get started.</p>
                    <Link href="/dashboard/cards/apply">
                        <button className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg transition">
                            Apply for a card
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {cards.map((card) => {
                        const statusDisplay = getStatusDisplay(card.status);
                        const isProcessing = processing[card.id] || false;
                        const isPending =
                            card.status === 'pending' ||
                            card.status === 'awaiting_payment' ||
                            card.status === 'payment_pending';

                        return (
                            <motion.div
                                key={card.id}
                                whileHover={{ y: -2 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                className={`bg-[#1a2332] rounded-xl border overflow-hidden transition group ${
                                    isPending
                                        ? 'border-yellow-500/30 hover:border-yellow-500/50'
                                        : card.status === 'active' ? 'border-green-500/30 hover:border-green-500/50'
                                        : card.status === 'blocked' ? 'border-red-500/30 hover:border-red-500/50'
                                        : 'border-white/5 hover:border-purple-500/30'
                                }`}
                            >
                                {/* Status strip — live pulse for active cards */}
                                <div className={`flex items-center gap-2 px-3 sm:px-4 pt-3 text-xs ${statusDisplay.color.split(' ')[0]}`}>
                                    {card.status === 'active' ? (
                                        <motion.span
                                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                                            className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                                        />
                                    ) : (
                                        <span className="shrink-0">{statusDisplay.icon}</span>
                                    )}
                                    <span className="truncate font-medium">{statusDisplay.label}</span>
                                    <span className="ml-auto text-gray-500 truncate">{card.card_name}</span>
                                </div>

                                {/* Card display — unchanged props */}
                                <div className="p-3 sm:p-4">
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

                                {/* Card details */}
                                <div className="p-3 sm:p-4 pt-0 space-y-3">
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs sm:text-sm">
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Daily limit</p>
                                            <p className="text-white font-medium tabular-nums truncate">
                                                ${card.daily_limit.toLocaleString()} USDT
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Monthly limit</p>
                                            <p className="text-white font-medium tabular-nums truncate">
                                                ${card.monthly_limit.toLocaleString()} USDT
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Fee</p>
                                            <p className="text-green-400 font-medium tabular-nums truncate">
                                                ${card.fee} USDT
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-400 text-[10px] sm:text-xs">Applied</p>
                                            <p className="text-white font-medium tabular-nums truncate">
                                                {new Date(card.application_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action row — stacks on mobile */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                                            <div className="min-w-0 flex-1 sm:flex-none">{getCardActionButton(card)}</div>
                                            {card.status !== 'active' && card.status !== 'blocked' && (
                                                <button
                                                    onClick={() => handleDelete(card.id)}
                                                    disabled={isProcessing}
                                                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition disabled:opacity-50 shrink-0"
                                                    title="Delete card"
                                                    aria-label="Delete card"
                                                >
                                                    {isProcessing
                                                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                        : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <Link href={`/dashboard/cards/${card.id}`} className="shrink-0">
                                            <button className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1 text-sm py-1">
                                                View details <ChevronRight className="w-4 h-4 shrink-0" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Activation info */}
            {cards.some(c => c.status === 'not_activated') && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-blue-400">Activation required</h4>
                            <p className="text-xs sm:text-sm text-blue-300 mt-1 break-words">
                                Some of your cards aren&apos;t activated yet. Visit any ATM, insert the card, and follow the on-screen steps to set your PIN.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick apply */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white">Need another card?</h3>
                        <p className="text-gray-400 text-xs sm:text-sm break-words">
                            Apply for a Master Credit, Visa Debit, or Verve Debit card.
                        </p>
                    </div>
                    <Link href="/dashboard/cards/apply" className="w-full md:w-auto">
                        <button className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg transition whitespace-nowrap">
                            Apply now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
