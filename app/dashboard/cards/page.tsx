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
            return <div className="text-yellow-400 text-sm flex items-center gap-2"><Clock className="w-4 h-4 animate-pulse" /> Under Review - 3-5 business days</div>;
        }
        if (status === 'payment_confirmed') {
            return <div className="text-blue-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Payment Confirmed - Awaiting Approval</div>;
        }
        if (status === 'rejected') {
            return <div className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> Application Rejected</div>;
        }
        if (status === 'issued' || status === 'shipped') {
            return <div className="text-blue-400 text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Being Processed</div>;
        }
        if (status === 'not_activated') {
            return <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm">Activate at ATM</button>;
        }
        if (status === 'active') {
            return <button onClick={() => handleBlock(card.id, 'block')} disabled={isProcessing} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm flex items-center gap-2 disabled:opacity-50">
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Block Card
            </button>;
        }
        if (status === 'blocked') {
            return <button onClick={() => handleBlock(card.id, 'unblock')} disabled={isProcessing} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm flex items-center gap-2 disabled:opacity-50">
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />} Unblock Card
            </button>;
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
            <div className="p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4">⚠️ {error}</div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Cards</h2>
                    <p className="text-gray-400 text-sm">Unable to load cards. Please try again later.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">Refresh Page</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">💳 My Cards</h1>
                    <p className="text-gray-400 text-sm">Manage your cards and applications</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadData} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <Link href="/dashboard/cards/apply">
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                            <Plus className="w-4 h-4" /> Apply for Card
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                    <p className="text-gray-400 text-sm">Total Cards</p>
                    <p className="text-2xl font-bold text-white">{totalCards}</p>
                </div>
                <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                    <p className="text-gray-400 text-sm">Active Cards</p>
                    <p className="text-2xl font-bold text-green-500">{activeCards}</p>
                </div>
                <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                    <p className="text-gray-400 text-sm">Under Review</p>
                    <p className="text-2xl font-bold text-yellow-500">{pendingCards}</p>
                </div>
                <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                    <p className="text-gray-400 text-sm">Blocked</p>
                    <p className="text-2xl font-bold text-red-500">{blockedCards}</p>
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Cards Yet</h3>
                    <p className="text-gray-400 mb-4">You haven't applied for any cards yet.</p>
                    <Link href="/dashboard/cards/apply">
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition">Apply for Your First Card</button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cards.map((card) => {
                        const statusDisplay = getStatusDisplay(card.status);
                        const isProcessing = processing[card.id] || false;
                        
                        return (
                            <div key={card.id} className={`bg-[#1a2332] rounded-xl border overflow-hidden transition group ${
                                card.status === 'pending' || card.status === 'awaiting_payment' || card.status === 'payment_pending'
                                    ? 'border-yellow-500/30 hover:border-yellow-500/50' 
                                    : card.status === 'active' ? 'border-green-500/30 hover:border-green-500/50' 
                                    : card.status === 'blocked' ? 'border-red-500/30 hover:border-red-500/50'
                                    : 'border-white/5 hover:border-purple-500/30'
                            }`}>
                                {/* Card Display - NOW PASSING cvv AND card_holder_name */}
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

                                {/* Card Details */}
                                <div className="p-4 pt-0 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs">Daily Limit</p>
                                            <p className="text-white font-medium">${card.daily_limit.toLocaleString()} USDT</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Monthly Limit</p>
                                            <p className="text-white font-medium">${card.monthly_limit.toLocaleString()} USDT</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Fee</p>
                                            <p className="text-green-400 font-medium">${card.fee} USDT</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Applied</p>
                                            <p className="text-white font-medium">{new Date(card.application_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            {getCardActionButton(card)}
                                            {card.status !== 'active' && card.status !== 'blocked' && (
                                                <button onClick={() => handleDelete(card.id)} disabled={isProcessing} className="text-red-400 hover:text-red-300 transition disabled:opacity-50" title="Delete Card">
                                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <Link href={`/dashboard/cards/${card.id}`}>
                                            <button className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1 text-sm">View Details <ChevronRight className="w-4 h-4" /></button>
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
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-400">Card Activation Required</h4>
                            <p className="text-sm text-blue-300 mt-1">Some of your cards are not activated yet. To activate your card, visit any ATM, insert your card, and follow the on-screen instructions to set your PIN.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Apply */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Need a New Card?</h3>
                        <p className="text-gray-400 text-sm">Apply for a Master Credit, Visa Debit, or Verve Debit card.</p>
                    </div>
                    <Link href="/dashboard/cards/apply">
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition whitespace-nowrap">Apply Now</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}