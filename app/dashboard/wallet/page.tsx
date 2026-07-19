'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Copy, 
    CheckCircle, 
    Wallet, 
    ArrowDownToLine, 
    History, 
    ExternalLink,
    Loader2,
    Sparkles,
    Banknote,
    TrendingUp,
    Gift,
    AlertCircle,
    X,
    ChevronDown,
    QrCode
} from 'lucide-react';
// ✅ Use standalone wallet-notifications file
import { notifyUserDepositProcessing, notifyAdminNewDeposit } from '@/app/lib/wallet-notifications';

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
    const [showQR, setShowQR] = useState<string | null>(null);
    const [depositHistory, setDepositHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [txid, setTxid] = useState('');
    const [network, setNetwork] = useState('TRC20');

    // Deposit addresses
    const ADDRESSES = {
        TRC20: 'TG6Ean2c7rRSp1tHHPd78R4dZzxo67tyyd',
        BEP20: '0x5F8E1c4C318ef1cDAb776587535Bb55E1f92720c'
    };

    // QR Code URLs
    const QR_CODES = {
        TRC20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtTRC20.jpeg',
        BEP20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtBEP20.jpeg'
    };

    // Network icons
    const NETWORK_ICONS = {
        TRC20: '🔷',
        BEP20: '🟡'
    };

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }

            // Fetch balance
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

            // Fetch deposit history
            const { data: deposits } = await supabase
                .from('deposit_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (deposits) {
                setDepositHistory(deposits);
            }

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
            // 1. Save deposit request to Supabase
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

            // 2. Send Notifications
            const userName = user.user_metadata?.full_name || user.email;
            
            await notifyUserDepositProcessing(
                user.email, 
                userName, 
                parseFloat(amount), 
                network, 
                txid
            );
            
            await notifyAdminNewDeposit(
                user.email, 
                parseFloat(amount), 
                txid, 
                network
            );

            setSuccessMsg(`✅ Deposit of ${amount} USDT submitted successfully! You'll receive a confirmation email shortly.`);
            setAmount('');
            setTxid('');
            
            // Refresh deposit history
            const { data: deposits } = await supabase
                .from('deposit_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (deposits) {
                setDepositHistory(deposits);
            }

        } catch (err: any) {
            setErrorMsg('Error submitting deposit: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            pending: { 
                label: 'Pending', 
                color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
                icon: <Loader2 className="w-3 h-3 animate-spin" />
            },
            approved: { 
                label: 'Approved', 
                color: 'bg-green-500/20 text-green-400 border-green-500/20',
                icon: <CheckCircle className="w-3 h-3" />
            },
            rejected: { 
                label: 'Rejected', 
                color: 'bg-red-500/20 text-red-400 border-red-500/20',
                icon: <X className="w-3 h-3" />
            },
        };
        return statusMap[status] || statusMap.pending;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-12 h-12 text-purple-500" />
                </motion.div>
                <p className="text-gray-400 text-sm">Loading wallet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-full bg-[#0b0e14] text-white p-4 md:p-6">
            
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        My Wallet
                    </h1>
                    <p className="text-[#8e96a3] text-sm">Manage your deposits and track your balance.</p>
                </div>
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-2 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5"
                >
                    <Wallet size={16} className="text-[#6366f1]" /> 
                    <span className="text-[#8e96a3]">Balance:</span>
                    <span className="font-bold text-green-400">{balances.funding.toFixed(2)} USDT</span>
                </motion.div>
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3"
                    >
                        <CheckCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{successMsg}</span>
                        <button 
                            onClick={() => setSuccessMsg('')}
                            className="ml-auto text-green-400/50 hover:text-green-400"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}

                {errorMsg && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
                    >
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <span className="text-sm">{errorMsg}</span>
                        <button 
                            onClick={() => setErrorMsg('')}
                            className="ml-auto text-red-400/50 hover:text-red-400"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Balance', value: balances.total.toFixed(2), color: 'text-white', icon: Wallet, bg: 'from-blue-500/20 to-purple-500/20' },
                    { label: 'Funding Balance', value: balances.funding.toFixed(2), color: 'text-green-400', icon: Banknote, bg: 'from-green-500/20 to-emerald-500/20' },
                    { label: 'Total Profit', value: `+${balances.profit.toFixed(2)}`, color: 'text-[#10b981]', icon: TrendingUp, bg: 'from-teal-500/20 to-cyan-500/20' },
                    { label: 'Bonus Balance', value: `+${balances.bonus.toFixed(2)}`, color: 'text-[#f97316]', icon: Gift, bg: 'from-orange-500/20 to-yellow-500/20' },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className={`bg-gradient-to-br ${item.bg} p-4 rounded-xl border border-white/5`}
                    >
                        <p className="text-xs text-[#8e96a3] uppercase tracking-wider">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.color}`}>{item.value} USDT</p>
                    </motion.div>
                ))}
            </div>

            {/* Deposit Methods */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ArrowDownToLine size={20} className="text-green-400" /> 
                        Deposit USDT
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm text-[#8e96a3] hover:text-white transition"
                    >
                        <History size={16} />
                        {showHistory ? 'Hide History' : 'Show History'}
                        <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </motion.button>
                </div>

                <p className="text-[#8e96a3] text-sm mb-6">
                    Send USDT to one of the addresses below. 
                    <span className="text-yellow-400 font-medium ml-1">Only send USDT on the selected network.</span>
                </p>

                {/* Deposit History */}
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
                                            <div key={deposit.id} className="px-4 py-3 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-white">{deposit.amount} USDT</p>
                                                    <p className="text-xs text-[#8e96a3]">{deposit.network}</p>
                                                </div>
                                                <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* TRC20 */}
                    <motion.div 
                        whileHover={{ y: -2 }}
                        className="bg-[#0b0e14] p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {NETWORK_ICONS.TRC20} TRC20
                                <span className="text-xs bg-[#6366f1]/20 px-2 py-1 rounded text-[#6366f1]">Network</span>
                            </h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowQR(showQR === 'TRC20' ? null : 'TRC20')}
                                className="text-[#8e96a3] hover:text-white transition"
                            >
                                <QrCode size={18} />
                            </motion.button>
                        </div>
                        
                        <AnimatePresence>
                            {showQR === 'TRC20' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="mb-4 flex justify-center"
                                >
                                    <img 
                                        src={QR_CODES.TRC20} 
                                        alt="TRC20 QR" 
                                        className="w-32 h-32 rounded-lg border border-white/5" 
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-[#141a24] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                            <code className="text-xs text-[#8e96a3] break-all font-mono">{ADDRESSES.TRC20}</code>
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => copyAddress(ADDRESSES.TRC20, 'TRC20')} 
                                className="p-2 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition flex-shrink-0"
                            >
                                {copied === 'TRC20' ? 
                                    <CheckCircle size={16} className="text-green-400" /> : 
                                    <Copy size={16} />
                                }
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* BEP20 */}
                    <motion.div 
                        whileHover={{ y: -2 }}
                        className="bg-[#0b0e14] p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {NETWORK_ICONS.BEP20} BEP20
                                <span className="text-xs bg-[#6366f1]/20 px-2 py-1 rounded text-[#6366f1]">Network</span>
                            </h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowQR(showQR === 'BEP20' ? null : 'BEP20')}
                                className="text-[#8e96a3] hover:text-white transition"
                            >
                                <QrCode size={18} />
                            </motion.button>
                        </div>
                        
                        <AnimatePresence>
                            {showQR === 'BEP20' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="mb-4 flex justify-center"
                                >
                                    <img 
                                        src={QR_CODES.BEP20} 
                                        alt="BEP20 QR" 
                                        className="w-32 h-32 rounded-lg border border-white/5" 
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-[#141a24] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                            <code className="text-xs text-[#8e96a3] break-all font-mono">{ADDRESSES.BEP20}</code>
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => copyAddress(ADDRESSES.BEP20, 'BEP20')} 
                                className="p-2 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition flex-shrink-0"
                            >
                                {copied === 'BEP20' ? 
                                    <CheckCircle size={16} className="text-green-400" /> : 
                                    <Copy size={16} />
                                }
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* TXID Form */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 pt-8 border-t border-white/5"
                >
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" />
                        Submit Deposit Request
                    </h3>
                    <p className="text-[#8e96a3] text-sm mb-4">
                        After sending the USDT, paste your Transaction ID (TXID) below.
                    </p>
                    
                    <form onSubmit={handleSubmitDeposit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        </div>
                        <div className="md:col-span-4">
                            <motion.button 
                                type="submit" 
                                disabled={submitting}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Total Deposits</p>
                    <p className="text-lg font-bold text-white">{depositHistory.length}</p>
                </div>
                <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Pending</p>
                    <p className="text-lg font-bold text-yellow-400">
                        {depositHistory.filter(d => d.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Approved</p>
                    <p className="text-lg font-bold text-green-400">
                        {depositHistory.filter(d => d.status === 'approved').length}
                    </p>
                </div>
                <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Rejected</p>
                    <p className="text-lg font-bold text-red-400">
                        {depositHistory.filter(d => d.status === 'rejected').length}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}