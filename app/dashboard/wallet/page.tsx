'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    CheckCircle,
    Wallet,
    ArrowDownToLine,
    History,
    Loader2,
    Sparkles,
    Banknote,
    TrendingUp,
    Gift,
    AlertCircle,
    X,
    ChevronDown,
    QrCode,
    Info,
    Zap
} from 'lucide-react';
import { notifyUserDepositProcessing, notifyAdminNewDeposit } from '@/app/lib/wallet-notifications';

// ---------- Small helper: animated number counter ----------
function useCountUp(target: number, durationMs = 900) {
    const [value, setValue] = useState(0);
    const fromRef = useRef(0);

    useEffect(() => {
        const start = performance.now();
        const from = fromRef.current;
        const diff = target - from;
        if (diff === 0) { setValue(target); return; }

        let raf = 0;
        const tick = (now: number) => {
            const t = Math.min((now - start) / durationMs, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(from + diff * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
            else fromRef.current = target;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, durationMs]);

    return value;
}

// ---------- Small helper: mini donut (pure SVG) ----------
function MiniDonut({
    segments,
    size = 96,
    thickness = 10,
}: {
    segments: { value: number; color: string }[];
    size?: number;
    thickness?: number;
}) {
    const total = segments.reduce((s, seg) => s + Math.max(seg.value, 0), 0) || 1;
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#1a1a40" strokeWidth={thickness}
            />
            {segments.map((seg, i) => {
                const len = (Math.max(seg.value, 0) / total) * c;
                const dash = `${len} ${c - len}`;
                const el = (
                    <circle
                        key={i}
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={thickness}
                        strokeDasharray={dash}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                    />
                );
                offset += len;
                return el;
            })}
        </svg>
    );
}

export default function WalletPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [balances, setBalances] = useState({ funding: 0, profit: 0, bonus: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [qrModal, setQrModal] = useState<string | null>(null); // 'TRC20' | 'BEP20' | null
    const [depositHistory, setDepositHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const [amount, setAmount] = useState('');
    const [txid, setTxid] = useState('');
    const [network, setNetwork] = useState('TRC20');

    const ADDRESSES: Record<string, string> = {
        TRC20: 'TG6Ean2c7rRSp1tHHPd78R4dZzxo67tyyd',
        BEP20: '0x5F8E1c4C318ef1cDAb776587535Bb55E1f92720c'
    };

    const QR_CODES: Record<string, string> = {
        TRC20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtTRC20.jpeg',
        BEP20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtBEP20.jpeg'
    };

    const NETWORK_ICONS: Record<string, string> = {
        TRC20: '🔷',
        BEP20: '🟡'
    };

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }

            const { data: bal } = await supabase
                .from('user_balances')
                .select('funding_balance, total_profit_usdt, bonus_usdt')
                .eq('user_id', user.id)
                .single();

            if (bal) {
                setBalances({
                    funding: bal.funding_balance || 0,
                    profit: bal.total_profit_usdt || 0,
                    bonus: bal.bonus_usdt || 0,
                    total: (bal.funding_balance || 0) + (bal.total_profit_usdt || 0) + (bal.bonus_usdt || 0)
                });
            }

            const { data: deposits } = await supabase
                .from('deposit_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (deposits) setDepositHistory(deposits);

            setUser(user);
            setLoading(false);
        }
        fetchData();
    }, [supabase, router]);

    const copyAddress = (addr: string, type: string) => {
        navigator.clipboard.writeText(addr);
        setCopied(type);
        setTimeout(() => setCopied(''), 3000);
    };

    // Truncate wallet in the middle for display — TG6Ean...67tyyd
    const shortAddr = (addr: string) =>
        addr.length > 16 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;

    const handleSubmitDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!amount || parseFloat(amount) <= 0) {
            setErrorMsg('Please enter a valid amount.');
            return;
        }
        if (!txid || txid.length < 10) {
            setErrorMsg('Please enter a valid Transaction ID (TXID).');
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.from('deposit_requests').insert({
                user_id: user.id,
                user_email: user.email,
                user_name: user.user_metadata?.full_name || user.email,
                amount: parseFloat(amount),
                network: network,
                txid: txid,
                status: 'pending'
            });
            if (error) throw error;

            const userName = user.user_metadata?.full_name || user.email;
            await notifyUserDepositProcessing(user.email, userName, parseFloat(amount), network, txid);
            await notifyAdminNewDeposit(user.email, parseFloat(amount), txid, network);

            setSuccessMsg(`✅ Deposit of ${amount} USDT submitted successfully! You'll receive a confirmation email shortly.`);
            setAmount('');
            setTxid('');

            const { data: deposits } = await supabase
                .from('deposit_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (deposits) setDepositHistory(deposits);
        } catch (err: any) {
            setErrorMsg('Error submitting deposit: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode; dot: string }> = {
            pending: {
                label: 'Pending',
                color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
                icon: <Loader2 className="w-3 h-3 animate-spin" />,
                dot: 'bg-yellow-400'
            },
            approved: {
                label: 'Approved',
                color: 'bg-green-500/20 text-green-400 border-green-500/20',
                icon: <CheckCircle className="w-3 h-3" />,
                dot: 'bg-green-400'
            },
            rejected: {
                label: 'Rejected',
                color: 'bg-red-500/20 text-red-400 border-red-500/20',
                icon: <X className="w-3 h-3" />,
                dot: 'bg-red-400'
            },
        };
        return statusMap[status] || statusMap.pending;
    };

    // Live-validation state for the form
    const amountNum = parseFloat(amount || '0');
    const txidTooShort = txid.length > 0 && txid.length < 10;
    const amountTooLow = amount !== '' && amountNum > 0 && amountNum < 10;
    const canSubmit = !submitting && amountNum >= 10 && txid.length >= 10;

    // Animated hero number
    const animatedTotal = useCountUp(balances.total, 900);
    const animatedFunding = useCountUp(balances.funding, 700);
    const animatedProfit = useCountUp(balances.profit, 800);
    const animatedBonus = useCountUp(balances.bonus, 800);

    // Donut segments
    const donutSegments = useMemo(() => ([
        { value: balances.funding, color: '#3b82f6' },
        { value: balances.profit, color: '#10b981' },
        { value: balances.bonus, color: '#f97316' }
    ]), [balances]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-12 h-12 text-purple-500" />
                </motion.div>
                <p className="text-gray-400 text-sm">Loading wallet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full bg-[#0b0e14] text-white overflow-x-hidden">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 border-b border-white/5 pb-4"
            >
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        My Wallet
                    </h1>
                    <p className="text-[#8e96a3] text-xs sm:text-sm">Manage your deposits and track your balance.</p>
                </div>
                {/* ✅ Enhanced: live "Funded" pulse next to balance */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 text-xs sm:text-sm bg-[#141a24] px-3 sm:px-4 py-2 rounded-xl border border-white/5"
                >
                    <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
                        {balances.funding > 0 && (
                            <motion.span
                                className="absolute inline-flex w-2 h-2 rounded-full bg-green-400"
                                animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            />
                        )}
                        <span className={`relative inline-flex w-2 h-2 rounded-full ${balances.funding > 0 ? 'bg-green-400' : 'bg-[#8e96a3]'}`} />
                    </span>
                    <Wallet size={16} className="text-[#6366f1] shrink-0" />
                    <span className="text-[#8e96a3]">Balance:</span>
                    <span className="font-bold text-green-400 tabular-nums">{balances.funding.toFixed(2)} USDT</span>
                </motion.div>
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3"
                    >
                        <CheckCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{successMsg}</span>
                        <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400/50 hover:text-green-400 shrink-0">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}

                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
                    >
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{errorMsg}</span>
                        <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400/50 hover:text-red-400 shrink-0">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- HERO BALANCE CARD ---------- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-[#1a1a4e] via-[#141a24] to-[#0b0e14] rounded-2xl border border-white/5 p-4 sm:p-6"
            >
                {/* Ambient sweep */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <motion.div
                        initial={{ x: '-120%' }}
                        animate={{ x: '220%' }}
                        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                        className="absolute top-0 bottom-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
                    />
                </div>

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8e96a3] mb-1">Total Balance</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                                {animatedTotal.toFixed(2)}
                            </span>
                            <span className="text-sm sm:text-base font-medium text-[#8e96a3]">USDT</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] sm:text-xs text-green-400">
                            <Zap size={12} />
                            <span>Live · Updated just now</span>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                        <div className="relative">
                            <MiniDonut segments={donutSegments} size={88} thickness={10} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] text-[#8e96a3] font-medium">Split</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px]">
                            <span className="flex items-center gap-1.5 text-[#8e96a3]"><span className="w-2 h-2 rounded-full bg-blue-400" /> Funding</span>
                            <span className="flex items-center gap-1.5 text-[#8e96a3]"><span className="w-2 h-2 rounded-full bg-green-400" /> Profit</span>
                            <span className="flex items-center gap-1.5 text-[#8e96a3]"><span className="w-2 h-2 rounded-full bg-orange-400" /> Bonus</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ---------- 4 Balance Cards (now animated counters) ---------- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Total Balance', value: animatedTotal, color: 'text-white', icon: Wallet, bg: 'from-blue-500/20 to-purple-500/20' },
                    { label: 'Funding Balance', value: animatedFunding, color: 'text-green-400', icon: Banknote, bg: 'from-green-500/20 to-emerald-500/20' },
                    { label: 'Total Profit', value: animatedProfit, prefix: '+', color: 'text-[#10b981]', icon: TrendingUp, bg: 'from-teal-500/20 to-cyan-500/20' },
                    { label: 'Bonus Balance', value: animatedBonus, prefix: '+', color: 'text-[#f97316]', icon: Gift, bg: 'from-orange-500/20 to-yellow-500/20' },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileTap={{ scale: 0.98 }}
                        className={`bg-gradient-to-br ${item.bg} p-3 sm:p-4 rounded-xl border border-white/5 min-w-0`}
                    >
                        <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider truncate">{item.label}</p>
                        <p className={`text-lg sm:text-2xl font-bold ${item.color} truncate tabular-nums`}>
                            {item.prefix}{item.value.toFixed(2)} <span className="text-xs sm:text-sm font-medium">USDT</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ---------- Deposit Methods ---------- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
                        <ArrowDownToLine size={20} className="text-green-400" />
                        Deposit USDT
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-xs sm:text-sm text-[#8e96a3] hover:text-white transition"
                    >
                        <History size={16} />
                        {showHistory ? 'Hide History' : 'Show History'}
                        <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </motion.button>
                </div>

                <p className="text-[#8e96a3] text-xs sm:text-sm mb-4 sm:mb-6">
                    Send USDT to one of the addresses below.
                    <span className="text-yellow-400 font-medium ml-1">Only send USDT on the selected network.</span>
                </p>

                {/* History */}
                <AnimatePresence>
                    {showHistory && depositHistory.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-[#0b0e14] rounded-xl border border-white/5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5">
                                    <p className="text-sm font-medium text-white">Recent Deposits</p>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {depositHistory.map((deposit) => {
                                        const status = getStatusBadge(deposit.status);
                                        return (
                                            <div key={deposit.id} className="px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex items-center gap-2.5">
                                                    {/* ✅ Enhanced: colored dot indicator */}
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white truncate tabular-nums">{deposit.amount} USDT</p>
                                                        <p className="text-xs text-[#8e96a3] truncate">
                                                            {deposit.network}
                                                            <span className="mx-1">·</span>
                                                            {new Date(deposit.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Network cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {(['TRC20', 'BEP20'] as const).map((net) => (
                        <motion.div
                            key={net}
                            whileTap={{ scale: 0.99 }}
                            className="bg-[#0b0e14] p-4 sm:p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition"
                        >
                            <div className="flex justify-between items-center gap-2 mb-4">
                                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 min-w-0">
                                    {NETWORK_ICONS[net]} {net}
                                    <span className="text-xs bg-[#6366f1]/20 px-2 py-1 rounded text-[#6366f1] shrink-0">Network</span>
                                </h3>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setQrModal(net)}
                                    aria-label={`Show ${net} QR`}
                                    className="text-[#8e96a3] hover:text-white transition shrink-0 p-1"
                                >
                                    <QrCode size={18} />
                                </motion.button>
                            </div>

                            {/* ✅ Enhanced: address now truncates in the middle + explicit Copy label */}
                            <div className="bg-[#141a24] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                                <code className="text-xs text-[#8e96a3] font-mono min-w-0 truncate" title={ADDRESSES[net]}>
                                    {shortAddr(ADDRESSES[net])}
                                </code>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => copyAddress(ADDRESSES[net], net)}
                                    aria-label="Copy address"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[#8e96a3] hover:text-white transition shrink-0 text-xs font-medium"
                                >
                                    {copied === net ? (
                                        <>
                                            <CheckCircle size={14} className="text-green-400" />
                                            <span className="text-green-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* TXID Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/5"
                >
                    <h3 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" />
                        Submit Deposit Request
                    </h3>
                    <p className="text-[#8e96a3] text-xs sm:text-sm mb-4">
                        After sending the USDT, paste your Transaction ID (TXID) below.
                    </p>

                    <form onSubmit={handleSubmitDeposit} className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Network</label>
                            <select
                                value={network}
                                onChange={(e) => setNetwork(e.target.value)}
                                className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-white focus:border-purple-500 focus:outline-none transition"
                            >
                                <option>TRC20</option>
                                <option>BEP20</option>
                            </select>
                            {/* ✅ Enhanced: fee hint */}
                            <p className="text-[10px] text-[#8e96a3] mt-1 flex items-center gap-1">
                                <Info size={10} /> Make sure the network matches your send
                            </p>
                        </div>

                        <div>
                            <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Amount (USDT)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-white focus:border-purple-500 focus:outline-none transition"
                                required
                                min="1"
                                step="0.01"
                            />
                            {/* ✅ Enhanced: live validation */}
                            {amountTooLow && (
                                <p className="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Minimum deposit is 10 USDT
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Transaction ID (TXID)</label>
                            <input
                                type="text"
                                value={txid}
                                onChange={(e) => setTxid(e.target.value)}
                                placeholder="Paste TXID here..."
                                className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-white focus:border-purple-500 focus:outline-none transition"
                                required
                            />
                            {/* ✅ Enhanced: live validation */}
                            {txidTooShort && (
                                <p className="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> TXID looks too short ({txid.length} chars)
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-4">
                            <motion.button
                                type="submit"
                                disabled={!canSubmit}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownToLine size={18} />
                                        Submit Deposit Request
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
            >
                <div className="bg-[#141a24] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider truncate">Total Deposits</p>
                    <p className="text-base sm:text-lg font-bold text-white tabular-nums">{depositHistory.length}</p>
                </div>
                <div className="bg-[#141a24] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider truncate">Pending</p>
                    <p className="text-base sm:text-lg font-bold text-yellow-400 tabular-nums">
                        {depositHistory.filter(d => d.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-[#141a24] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider truncate">Approved</p>
                    <p className="text-base sm:text-lg font-bold text-green-400 tabular-nums">
                        {depositHistory.filter(d => d.status === 'approved').length}
                    </p>
                </div>
                <div className="bg-[#141a24] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
                    <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider truncate">Rejected</p>
                    <p className="text-base sm:text-lg font-bold text-red-400 tabular-nums">
                        {depositHistory.filter(d => d.status === 'rejected').length}
                    </p>
                </div>
            </motion.div>

            {/* ---------- QR MODAL ---------- */}
            <AnimatePresence>
                {qrModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setQrModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#141a24] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setQrModal(null)}
                                aria-label="Close QR"
                                className="absolute top-3 right-3 text
