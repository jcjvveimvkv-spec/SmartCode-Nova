'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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
    EyeOff,
    Send,
    Truck,
    CreditCard as CreditCardIcon,
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

// ============================================================
// SKELETON LOADER
// ============================================================
function CardDetailSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto overflow-x-hidden">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
                <div className="space-y-1.5">
                    <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
                    <div className="h-3.5 w-32 rounded bg-white/5 animate-pulse" />
                </div>
            </div>

            {/* Status banner skeleton */}
            <div className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />

            {/* Card skeleton */}
            <div className="flex justify-center">
                <div
                    className="w-full max-w-[420px] rounded-2xl bg-white/5 animate-pulse"
                    style={{ aspectRatio: '420 / 260' }}
                />
            </div>

            {/* Info grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[0, 1].map((i) => (
                    <div key={i} className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6 space-y-4">
                        <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4, 5].map((j) => (
                                <div key={j} className="flex justify-between items-center">
                                    <div className="h-3.5 w-24 rounded bg-white/5 animate-pulse" />
                                    <div className="h-3.5 w-32 rounded bg-white/10 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// PROGRESS TIMELINE
// ============================================================
function ProgressTimeline({ card }: { card: Card }) {
    const steps = [
        { key: 'applied', label: 'Application submitted', date: card.application_date, icon: Send },
        { key: 'approved', label: 'Approved', date: card.approved_date, icon: CheckCircle },
        { key: 'issued', label: 'Card issued', date: card.issued_date, icon: CreditCardIcon },
        { key: 'shipped', label: 'Shipped', date: card.shipped_date, icon: Truck },
        { key: 'activated', label: 'Activated', date: card.activated_date, icon: CheckCircle },
    ];

    // Find the last completed step index
    let lastCompletedIdx = -1;
    steps.forEach((s, i) => {
        if (s.date) lastCompletedIdx = i;
    });

    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Card Progress</h2>
            <div className="space-y-0">
                {steps.map((step, idx) => {
                    const isDone = !!step.date;
                    const isCurrent = idx === lastCompletedIdx + 1;
                    const isFuture = !isDone && !isCurrent;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="flex gap-3 sm:gap-4">
                            {/* Indicator column */}
                            <div className="flex flex-col items-center shrink-0">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        isDone
                                            ? 'bg-green-500/20 border-green-500/60 text-green-400'
                                            : isCurrent
                                            ? 'bg-purple-500/20 border-purple-500/60 text-purple-400'
                                            : 'bg-[#0b0e14] border-white/10 text-gray-500'
                                    }`}
                                >
                                    {isDone ? (
                                        <Check className="w-4 h-4" />
                                    ) : isCurrent ? (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                </div>
                                {idx < steps.length - 1 && (
                                    <div
                                        className={`w-0.5 h-8 sm:h-10 ${
                                            isDone ? 'bg-green-500/40' : 'bg-white/5'
                                        }`}
                                    />
                                )}
                            </div>

                            {/* Content column */}
                            <div className={`pb-6 sm:pb-8 min-w-0 flex-1 ${idx === steps.length - 1 ? 'pb-0 sm:pb-0' : ''}`}>
                                <p
                                    className={`text-sm font-medium ${
                                        isDone
                                            ? 'text-white'
                                            : isCurrent
                                            ? 'text-purple-300'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {step.date
                                        ? new Date(step.date).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                        : isCurrent
                                        ? 'In progress'
                                        : 'Pending'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
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
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const autoHideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ============================================================
    // Auto-hide security
    // ============================================================
    useEffect(() => {
        const anyRevealed = showFullNumber || showCvv;

        // Clear previous timer whenever state changes
        if (autoHideTimerRef.current) {
            clearInterval(autoHideTimerRef.current);
            autoHideTimerRef.current = null;
        }

        if (!anyRevealed) {
            setSecondsLeft(null);
            return;
        }

        setSecondsLeft(30);

        autoHideTimerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    setShowFullNumber(false);
                    setShowCvv(false);
                    if (autoHideTimerRef.current) {
                        clearInterval(autoHideTimerRef.current);
                        autoHideTimerRef.current = null;
                    }
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (autoHideTimerRef.current) {
                clearInterval(autoHideTimerRef.current);
                autoHideTimerRef.current = null;
            }
        };
    }, [showFullNumber, showCvv]);

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
            setError('Invalid card ID');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                setError('Authentication error. Please refresh and try again.');
                setLoading(false);
                return;
            }

            if (!user) {
                router.push('/auth/login');
                return;
            }

            const response = await fetch(`/api/cards/${cardId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || `Failed to load card (Status: ${response.status})`);
                setLoading(false);
                return;
            }

            const result = await response.json();

            if (result.success && result.data) {
                if (result.data.user_id !== user.id) {
                    setError('You do not have permission to view this card');
                    setLoading(false);
                    return;
                }
                setCard(result.data);
            } else {
                setError(result.error || 'Card not found');
            }
        } catch (error: any) {
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
                body: JSON.stringify({ cardId: card.id, action }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Card ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
                await loadCardData();
            } else {
                toast.error(data.error || `Failed to ${action} card`);
            }
        } catch (error) {
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
            const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                toast.success('Card deleted successfully');
                router.push('/dashboard/cards');
            } else {
                toast.error(data.error || 'Failed to delete card');
            }
        } catch (error) {
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

    if (loading) return <CardDetailSkeleton />;

    if (error || !card) {
        return (
            <div className="space-y-4 w-full max-w-4xl mx-auto overflow-x-hidden">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                    <p className="flex items-start gap-2 text-sm break-words">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="min-w-0">⚠️ {error || 'Card not found'}</span>
                    </p>
                    {cardId && (
                        <p className="text-xs text-red-400/70 mt-1 break-all">Card ID: {cardId}</p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link href="/dashboard/cards" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition text-sm">
                            ← Back to Cards
                        </button>
                    </Link>
                    {cardId && (
                        <button
                            onClick={loadCardData}
                            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
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
    const isPending =
        card.status === 'pending' ||
        card.status === 'awaiting_payment' ||
        card.status === 'payment_pending';
    const isInProgress =
        isPending ||
        card.status === 'approved' ||
        card.status === 'issued' ||
        card.status === 'shipped' ||
        card.status === 'not_activated';

    const displayNumber = showFullNumber
        ? formatCardNumber(card.card_number)
        : `•••• •••• •••• ${card.card_last4}`;
    const displayCvv = showCvv ? card.cvv : '•••';

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto overflow-x-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Link href="/dashboard/cards" className="shrink-0">
                        <button
                            aria-label="Back to cards"
                            className="text-gray-400 hover:text-white transition p-1 -ml-1"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                            Card Details
                        </h1>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{card.card_name}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={loadCardData}
                        className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        Refresh
                    </button>

                    {!isActive && !isBlocked && (
                        <button
                            onClick={handleDelete}
                            disabled={processing}
                            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            Delete
                        </button>
                    )}

                    {(isActive || isBlocked) && (
                        <button
                            onClick={handleBlockToggle}
                            disabled={processing}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm ${
                                isBlocked
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        >
                            {processing ? (
                                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                            ) : isBlocked ? (
                                <>
                                    <Unlock className="w-4 h-4 shrink-0" />
                                    Unblock
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 shrink-0" />
                                    Block
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div
                className={`p-3 sm:p-4 rounded-lg border ${
                    isPending
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : isActive
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : isBlocked
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}
            >
                <div className="flex items-start gap-2 flex-wrap">
                    <span className="shrink-0 mt-0.5">{statusDisplay.icon}</span>
                    <span className="font-medium text-sm">Status: {statusDisplay.label}</span>
                    {isPending && (
                        <span className="text-xs sm:text-sm text-yellow-400/80 w-full sm:w-auto sm:ml-2">
                            Estimated 3-5 business days
                        </span>
                    )}
                </div>
            </div>

            {/* Card Display */}
            <div className="w-full flex justify-center">
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

            {/* Progress Timeline — for in-progress cards only */}
            {isInProgress && <ProgressTimeline card={card} />}

            {/* Card Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Card Information */}
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Card Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Card Type</span>
                            <span className="text-white text-xs sm:text-sm text-right break-words min-w-0">
                                {card.card_name}
                            </span>
                        </div>

                        {/* Card Number row */}
                        <div className="flex justify-between items-center gap-3 flex-wrap">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Card Number</span>
                            <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
                                <span className="text-white font-mono text-xs sm:text-sm break-all">
                                    {displayNumber}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => setShowFullNumber(!showFullNumber)}
                                        aria-label={showFullNumber ? 'Hide card number' : 'Show card number'}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition"
                                    >
                                        {showFullNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(card.card_number, 'Card Number')}
                                        aria-label="Copy card number"
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition"
                                    >
                                        {copied === 'Card Number' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Auto-hide countdown */}
                        {secondsLeft !== null && (
                            <p className="text-[10px] sm:text-xs text-yellow-400 text-right -mt-1">
                                Hiding in {secondsLeft}s
                            </p>
                        )}

                        {/* CVV row */}
                        <div className="flex justify-between items-center gap-3 flex-wrap">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">CVV</span>
                            <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
                                <span className="text-white font-mono text-xs sm:text-sm">{displayCvv}</span>
                                {card.cvv && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setShowCvv(!showCvv)}
                                            aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition"
                                        >
                                            {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(card.cvv, 'CVV')}
                                            aria-label="Copy CVV"
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition"
                                        >
                                            {copied === 'CVV' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Cardholder Name</span>
                            <span className="text-white text-xs sm:text-sm uppercase text-right break-words min-w-0">
                                {getCardholderDisplayName()}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Expiry Date</span>
                            <span className="text-white text-xs sm:text-sm tabular-nums">
                                {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Fee Paid</span>
                            <span className="text-green-400 text-xs sm:text-sm tabular-nums">${card.fee} USDT</span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-gray-400 text-xs sm:text-sm shrink-0">Applied</span>
                            <span className="text-white text-xs sm:text-sm tabular-nums">
                                {new Date(card.application_date).toLocaleDateString()}
                            </span>
                        </div>

                        {card.approved_date && (
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-400 text-xs sm:text-sm shrink-0">Approved</span>
                                <span className="text-white text-xs sm:text-sm tabular-nums">
                                    {new Date(card.approved_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {card.activated_date && (
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-400 text-xs sm:text-sm shrink-0">Activated</span>
                                <span className="text-white text-xs sm:text-sm tabular-nums">
                                    {new Date(card.activated_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Spending Limits */}
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Spending Limits</h2>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-[#0b0e14] rounded-lg">
                            <div className="min-w-0">
                                <p className="text-gray-400 text-xs">Daily Limit</p>
                                <p className="text-white font-medium text-sm sm:text-base tabular-nums">
                                    ${card.daily_limit.toLocaleString()} USDT
                                </p>
                            </div>
                            <div className="sm:text-right min-w-0">
                                <p className="text-gray-400 text-xs">Used Today</p>
                                <p className="text-white font-medium text-sm sm:text-base tabular-nums">$0 USDT</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-[#0b0e14] rounded-lg">
                            <div className="min-w-0">
                                <p className="text-gray-400 text-xs">Monthly Limit</p>
                                <p className="text-white font-medium text-sm sm:text-base tabular-nums">
                                    ${card.monthly_limit.toLocaleString()} USDT
                                </p>
                            </div>
                            <div className="sm:text-right min-w-0">
                                <p className="text-gray-400 text-xs">Used This Month</p>
                                <p className="text-white font-medium text-sm sm:text-base tabular-nums">$0 USDT</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-[#0b0e14] rounded-lg">
                            <p className="text-gray-400 text-xs sm:text-sm">
                                {isPending
                                    ? '⏳ Limits will be active once your card is approved.'
                                    : isBlocked
                                    ? '🔒 Card is blocked. Limits are temporarily disabled.'
                                    : isActive
                                    ? '✅ Card is active. Limits are in effect.'
                                    : '📋 Card is being processed.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {card.admin_notes && (
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Admin Notes</h2>
                    <p className="text-gray-400 text-xs sm:text-sm break-words whitespace-pre-wrap">
                        {card.admin_notes}
                    </p>
                </div>
            )}

            <div className="flex justify-center">
                <Link href="/dashboard/cards" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition text-sm">
                        ← Back to My Cards
                    </button>
                </Link>
            </div>
        </div>
    );
}
