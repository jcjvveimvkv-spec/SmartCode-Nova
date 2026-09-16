'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Copy,
    RefreshCw,
    Share2,
    Users,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Gift,
    Tag,
    MessageCircle,
    Send,
    Mail,
    Wallet
} from 'lucide-react';

interface ReferralData {
    id: string;
    referred_id: string;
    referred_email?: string;
    referred_name?: string;
    status: string;
    bonus_amount: number;
    created_at: string;
    paid_at?: string;
    referred_deposit?: number;
    min_deposit_required?: number;
}

interface ReferralPayout {
    id: number;
    amount_usdt: number;
    status: string;
    created_at: string;
    type: 'referral' | 'promo';
    description: string;
}

export default function DashboardReferralPage() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [referrals, setReferrals] = useState<ReferralData[]>([]);
    const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
    const [referralCode, setReferralCode] = useState<string>('');
    const [stats, setStats] = useState({
        totalReferrals: 0,
        pendingReferrals: 0,
        approvedReferrals: 0,
        paidReferrals: 0,
        totalEarned: 0,
        pendingBonus: 0,
        totalClicks: 0,
        bonusBalance: 0,
        promoEarned: 0,
        referralEarned: 0,
    });
    const [copied, setCopied] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [promoInput, setPromoInput] = useState('');
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadReferralData();
    }, []);

    const loadReferralData = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('Auth error:', authError);
                router.push('/auth/login');
                return;
            }

            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'stats',
                    user_id: user.id
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', response.status, errorText);
                setLoading(false);
                return;
            }

            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;

                if (data.code?.code) {
                    setReferralCode(data.code.code);
                } else {
                    const { data: codeData } = await supabase
                        .from('user_referral_codes')
                        .select('code')
                        .eq('user_id', user.id)
                        .single();

                    if (codeData?.code) {
                        setReferralCode(codeData.code);
                    }
                }

                const allReferrals = data.referrals || [];
                const pendingReferrals = allReferrals.filter((r: any) => r.status === 'pending').length;
                const approvedReferrals = allReferrals.filter((r: any) => r.status === 'approved').length;
                const paidReferrals = allReferrals.filter((r: any) => r.status === 'paid').length;

                const pendingBonusAmount = allReferrals
                    .filter((r: any) => r.status === 'approved')
                    .reduce((sum: number, r: any) => sum + (r.amount_usdt || 7), 0);

                setStats({
                    totalReferrals: data.total_referrals || 0,
                    pendingReferrals: pendingReferrals,
                    approvedReferrals: approvedReferrals,
                    paidReferrals: paidReferrals,
                    totalEarned: data.total_earned || 0,
                    pendingBonus: pendingBonusAmount,
                    totalClicks: data.code?.total_clicks || 0,
                    bonusBalance: data.bonus_balance || 0,
                    promoEarned: data.promo_earned || 0,
                    referralEarned: data.referral_earned || 0,
                });

                if (allReferrals.length > 0) {
                    const formattedReferrals = allReferrals.map((r: any) => ({
                        id: r.id || '',
                        referred_id: r.referred_user_id || '',
                        referred_email: r.referred_email || 'Unknown',
                        referred_name: r.referred_name || 'Unknown User',
                        status: r.status || 'pending',
                        bonus_amount: r.amount_usdt || 7,
                        created_at: r.created_at || new Date().toISOString(),
                        paid_at: r.paid_at || null,
                        referred_deposit: r.referred_deposit || 0,
                        min_deposit_required: r.min_deposit_required || 50,
                    }));
                    setReferrals(formattedReferrals);
                } else {
                    setReferrals([]);
                }

                if (data.payouts && Array.isArray(data.payouts) && data.payouts.length > 0) {
                    const formattedPayouts = data.payouts.map((p: any) => ({
                        id: p.id || 0,
                        amount_usdt: p.amount_usdt || 7,
                        status: p.status || 'completed',
                        created_at: p.paid_at || p.created_at || new Date().toISOString(),
                        type: 'referral' as 'referral',
                        description: p.description || 'Referral bonus'
                    }));
                    setPayouts(formattedPayouts);
                } else {
                    const { data: promoUsage } = await supabase
                        .from('promo_code_usage')
                        .select('*, promo_codes(code, description)')
                        .eq('user_id', user.id)
                        .order('claimed_at', { ascending: false });

                    if (promoUsage && promoUsage.length > 0) {
                        const formattedPayouts = promoUsage.map((p: any) => ({
                            id: p.id || 0,
                            amount_usdt: p.bonus_amount || 0,
                            status: 'completed',
                            created_at: p.claimed_at || new Date().toISOString(),
                            type: 'promo' as 'promo',
                            description: `Promo: ${p.promo_codes?.code || 'Unknown'}`
                        }));
                        setPayouts(formattedPayouts);
                    } else {
                        setPayouts([]);
                    }
                }
            } else {
                setError(result.error || 'Failed to load referral data');
            }

        } catch (error: any) {
            console.error('❌ Error loading referral data:', error);
            setError(error.message || 'Failed to load referral data');
        } finally {
            setLoading(false);
        }
    };

    const generateReferralCode = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'admin-generate-link',
                    user_id: user.id
                }),
            });

            const result = await response.json();
            if (result.success && result.data?.code) {
                setReferralCode(result.data.code);
                toast.success('Referral code generated!');
                loadReferralData();
            }
        } catch (error) {
            console.error('Error generating code:', error);
        }
    };

    const getReferralLink = () => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        if (referralCode) {
            return `${baseUrl}/auth/signup?ref=${referralCode}`;
        }
        return `${baseUrl}/auth/signup`;
    };

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(getReferralLink());
            setCopied(true);
            toast.success('Referral link copied!');
            setTimeout(() => setCopied(false), 3000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const shareOnSocial = (platform: string) => {
        const link = getReferralLink();
        const text = `🚀 Join SmartCodeNova and earn rewards! Use my referral link: ${referralCode}`;

        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
            email: `mailto:?subject=${encodeURIComponent('Join SmartCodeNova!')}&body=${encodeURIComponent(text + '\n\n' + link)}`,
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank');
        }
        setShowShareMenu(false);
    };

    const applyPromoCode = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please log in');
            return;
        }

        if (!promoInput.trim()) {
            setPromoMessage({ type: 'error', text: 'Please enter a promo code' });
            return;
        }

        setApplyingPromo(true);
        setPromoMessage(null);

        try {
            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'apply-promo',
                    user_id: user.id,
                    promo_code: promoInput.trim().toUpperCase(),
                }),
            });

            const result = await response.json();

            if (result.success) {
                setPromoMessage({
                    type: 'success',
                    text: result.data.message || `✅ ${result.data.bonus_amount} USDT added!`
                });
                setPromoInput('');
                loadReferralData();
            } else {
                setPromoMessage({ type: 'error', text: result.error || 'Invalid promo code' });
            }
        } catch (error) {
            console.error('Error applying promo:', error);
            setPromoMessage({ type: 'error', text: 'Error applying promo code' });
        } finally {
            setApplyingPromo(false);
        }
    };

    const claimBonus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please log in');
            return;
        }

        setClaiming(true);
        try {
            const response = await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'claim-bonus',
                    user_id: user.id
                }),
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`🎉 Successfully claimed ${result.data.total_amount} USDT!`);
                loadReferralData();
            } else {
                toast.error(result.error || 'No pending bonuses to claim.');
            }
        } catch (error) {
            console.error('Error claiming bonus:', error);
            toast.error('Error claiming bonus');
        } finally {
            setClaiming(false);
        }
    };

    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            pending: {
                label: 'Waiting for Deposit',
                color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                icon: <Clock className="w-3.5 h-3.5" />
            },
            approved: {
                label: 'Ready for Payout',
                color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                icon: <CheckCircle className="w-3.5 h-3.5" />
            },
            paid: {
                label: 'Paid',
                color: 'text-green-500 bg-green-500/10 border-green-500/20',
                icon: <CheckCircle className="w-3.5 h-3.5" />
            },
            rejected: {
                label: 'Rejected',
                color: 'text-red-500 bg-red-500/10 border-red-500/20',
                icon: <XCircle className="w-3.5 h-3.5" />
            },
        };
        return statusMap[status] || {
            label: status,
            color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
            icon: <AlertCircle className="w-3.5 h-3.5" />
        };
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPayouts = payouts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(payouts.length / itemsPerPage);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 text-sm">Loading referral data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">📊 Referral Program</h1>
                    <p className="text-gray-400 text-xs sm:text-sm">Refer friends and earn rewards</p>
                </div>
                <button
                    onClick={loadReferralData}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm w-full sm:w-auto shrink-0"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{error}</span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <Users className="w-3 h-3 shrink-0" />
                        Total
                    </p>
                    <p className="text-base sm:text-xl font-bold text-white tabular-nums truncate">{stats.totalReferrals}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-yellow-500/20 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 shrink-0" />
                        Pending
                    </p>
                    <p className="text-base sm:text-xl font-bold text-yellow-500 tabular-nums truncate">{stats.pendingReferrals}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-blue-500/20 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        Ready
                    </p>
                    <p className="text-base sm:text-xl font-bold text-blue-500 tabular-nums truncate">{stats.approvedReferrals}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-green-500/20 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <Wallet className="w-3 h-3 shrink-0" />
                        Paid
                    </p>
                    <p className="text-base sm:text-xl font-bold text-green-500 tabular-nums truncate">{stats.paidReferrals}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-purple-500/20 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <DollarSign className="w-3 h-3 shrink-0" />
                        Earned
                    </p>
                    <p className="text-base sm:text-xl font-bold text-purple-400 tabular-nums truncate">${stats.totalEarned.toFixed(2)}</p>
                </div>
                <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 min-w-0">
                    <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <Gift className="w-3 h-3 shrink-0" />
                        Pending Bonus
                    </p>
                    <p className="text-base sm:text-xl font-bold text-yellow-400 tabular-nums truncate">${stats.pendingBonus.toFixed(2)}</p>
                </div>
            </div>

            {/* Referral Link Card */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Your Referral Link</h2>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 bg-[#0b0e14] rounded-lg border border-white/10 px-3 sm:px-4 py-3 flex items-center min-w-0">
                        {referralCode ? (
                            <code className="text-white text-xs sm:text-sm break-all font-mono">
                                {getReferralLink()}
                            </code>
                        ) : (
                            <span className="text-gray-500 text-xs sm:text-sm">No referral code found.</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 md:flex-nowrap">
                        {referralCode && (
                            <>
                                <button
                                    onClick={copyReferralLink}
                                    className="flex-1 md:flex-none bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </>
                        )}
                        {!referralCode && (
                            <button
                                onClick={generateReferralCode}
                                className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Generate Code
                            </button>
                        )}
                    </div>
                </div>

                {showShareMenu && referralCode && (
                    <div className="mt-4 p-3 sm:p-4 bg-[#0b0e14] rounded-lg border border-white/10">
                        <p className="text-xs sm:text-sm text-gray-400 mb-3">Share via:</p>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                            <button
                                onClick={() => shareOnSocial('whatsapp')}
                                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button
                                onClick={() => shareOnSocial('telegram')}
                                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <Send size={16} /> Telegram
                            </button>
                            <button
                                onClick={() => shareOnSocial('twitter')}
                                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
                                </svg>
                                Twitter
                            </button>
                            <button
                                onClick={() => shareOnSocial('facebook')}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </button>
                            <button
                                onClick={() => shareOnSocial('linkedin')}
                                className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                                </svg>
                                LinkedIn
                            </button>
                            <button
                                onClick={() => shareOnSocial('email')}
                                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition text-xs sm:text-sm"
                            >
                                <Mail size={16} /> Email
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-gray-400 text-xs sm:text-sm mt-3">
                    Share this link with friends. You earn <span className="text-green-400 font-bold">7 USDT</span> for each friend who signs up and deposits <span className="text-yellow-400 font-bold">50+ USDT</span>!
                </p>
            </div>

            {/* Apply Promo Code */}
            <div className="bg-[#1a2332] p-4 sm:p-6 rounded-xl border border-white/5">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-yellow-400 shrink-0" />
                    Apply Promo Code
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Enter promo code..."
                        className="flex-1 bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-yellow-500 focus:outline-none transition text-sm min-w-0"
                    />
                    <button
                        onClick={applyPromoCode}
                        disabled={applyingPromo || !promoInput.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 text-sm w-full sm:w-auto shrink-0"
                    >
                        {applyingPromo ? '⏳ Applying...' : 'Apply Code'}
                    </button>
                </div>
                {promoMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm break-words ${
                        promoMessage.type === 'success'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                            : 'bg-red-500/20 text-red-400 border border-red-500/20'
                    }`}>
                        {promoMessage.text}
                    </div>
                )}
            </div>

            {/* Claim Bonus */}
            {stats.approvedReferrals > 0 && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 sm:p-6 rounded-xl border border-blue-500/30">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-white">💰 Referrals Ready for Payout!</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                You have <span className="text-blue-400 font-bold">{stats.approvedReferrals}</span> referrals ready for payout
                                (total <span className="text-yellow-400 font-bold">{stats.pendingBonus} USDT</span>)
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                ⏳ Admin will review and approve your bonuses
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium text-center">
                                {stats.approvedReferrals} Ready
                            </span>
                            <button
                                onClick={claimBonus}
                                disabled={claiming}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-5 py-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm whitespace-nowrap"
                            >
                                {claiming ? '⏳ Processing...' : `💰 Claim ${stats.pendingBonus} USDT`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Referrals List */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h2 className="text-base sm:text-lg font-semibold text-white">Your Referrals</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">People you've referred to SmartCodeNova</p>
                </div>

                {referrals.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        No referrals yet. Share your referral link to start earning!
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {referrals.map((referral) => {
                                const statusDisplay = getStatusDisplay(referral.status);
                                return (
                                    <div key={referral.id} className="p-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white text-sm font-medium truncate">{referral.referred_name || 'Unknown User'}</p>
                                                <p className="text-gray-400 text-[11px] truncate">{referral.referred_email || 'No email'}</p>
                                            </div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${statusDisplay.color}`}>
                                                {statusDisplay.icon}
                                                {statusDisplay.label}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-2 border-t border-white/5">
                                            <span className="text-gray-400">Date</span>
                                            <span className="text-right text-gray-300">{new Date(referral.created_at).toLocaleDateString()}</span>
                                            <span className="text-gray-400">Deposit</span>
                                            <span className="text-right">
                                                {referral.referred_deposit && referral.referred_deposit > 0 ? (
                                                    <span className="text-green-400 font-medium">${referral.referred_deposit} USDT</span>
                                                ) : (
                                                    <span className="text-gray-500 text-[11px]">Need ${referral.min_deposit_required || 50}</span>
                                                )}
                                            </span>
                                            <span className="text-gray-400">Bonus</span>
                                            <span className="text-right text-green-400 font-medium">${referral.bonus_amount} USDT</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0b0e14]">
                                    <tr className="text-left text-gray-400 text-sm">
                                        <th className="px-6 py-3">Referred User</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Deposit</th>
                                        <th className="px-6 py-3">Bonus</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {referrals.map((referral) => {
                                        const statusDisplay = getStatusDisplay(referral.status);
                                        return (
                                            <tr key={referral.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                <td className="px-6 py-3">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">
                                                            {referral.referred_name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            {referral.referred_email || 'No email'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-gray-400 text-sm">
                                                    {new Date(referral.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {referral.referred_deposit && referral.referred_deposit > 0 ? (
                                                        <span className="text-green-400 text-sm font-medium">
                                                            ${referral.referred_deposit} USDT
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">
                                                            Need ${referral.min_deposit_required || 50} USDT
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-green-400 font-medium">
                                                    ${referral.bonus_amount} USDT
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${statusDisplay.color}`}>
                                                        {statusDisplay.icon}
                                                        {statusDisplay.label}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Bonus History */}
            <div className="bg-[#1a2332] p-4 sm:p-6 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4 gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-white">Bonus History</h2>
                    <button
                        onClick={loadReferralData}
                        className="text-gray-400 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm shrink-0"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>

                {payouts.length > 0 ? (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {currentPayouts.map((payout) => (
                                <div key={payout.id} className="py-3 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                            payout.type === 'referral'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {payout.type === 'referral' ? 'Referral' : 'Promo'}
                                        </span>
                                        <span className="text-green-400 font-medium text-sm tabular-nums">+${payout.amount_usdt} USDT</span>
                                    </div>
                                    <p className="text-gray-300 text-xs break-words">{payout.description}</p>
                                    <div className="flex items-center justify-between gap-2 text-[11px]">
                                        <span className="text-gray-400">{new Date(payout.created_at).toLocaleDateString()}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{payout.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3">Type</th>
                                        <th className="pb-3">Description</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPayouts.map((payout) => (
                                        <tr key={payout.id} className="border-b border-white/5">
                                            <td className="py-3 text-gray-400 text-sm">
                                                {new Date(payout.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    payout.type === 'referral'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {payout.type === 'referral' ? 'Referral' : 'Promo'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-300 text-sm">{payout.description}</td>
                                            <td className="py-3 text-green-400 font-medium">+${payout.amount_usdt} USDT</td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                                    {payout.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-white/5 pt-4">
                                <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, payouts.length)} of {payouts.length}
                                </span>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition text-xs sm:text-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs sm:text-sm">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition text-xs sm:text-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-400 text-center py-8 text-sm">
                        No rewards yet. Start referring friends and earn bonuses!
                    </p>
                )}
            </div>

            {/* How It Works */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">📖 How It Works</h3>
                <ul className="text-gray-400 space-y-2 text-xs sm:text-sm">
                    <li>1️⃣ Share your unique referral link with friends</li>
                    <li>2️⃣ When they sign up, you earn <span className="text-green-400 font-bold">7 USDT</span></li>
                    <li>3️⃣ Referred user must deposit <span className="text-yellow-400 font-bold">50+ USDT</span> to activate the bonus</li>
                    <li>4️⃣ Admin approves the referral and pays out the bonus</li>
                    <li>5️⃣ Track all your referrals and earnings in real-time</li>
                    <li>6️⃣ Enter promo codes for extra bonuses 🎁</li>
                    <li>💰 Unlimited referrals - the more you share, the more you earn!</li>
                </ul>
            </div>
        </div>
    );
}
