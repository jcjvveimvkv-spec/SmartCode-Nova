// /app/dashboard/withdrawal/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, ArrowDownToLine, CheckCircle, AlertCircle, ExternalLink, Loader2, X,
  ShieldCheck, Clock, Banknote, Info, FileText, ChevronRight, Sparkles,
  Copy, Check, ArrowUpRight, HelpCircle, Lock, History, Timer, Users,
  Flag, MessageCircle, ChevronDown, ChevronUp, RefreshCw, Zap
} from 'lucide-react';
import { 
    notifyAdminNewWithdrawal, 
    notifyUserWithdrawalRequested
} from '@/app/lib/notifications';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-[200] max-w-md p-4 rounded-xl shadow-2xl border ${
                type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
        >
            <div className="flex items-center gap-3">
                {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm">{message}</p>
                <button onClick={onClose} className="ml-auto hover:opacity-70">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default function WithdrawalPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [countdown, setCountdown] = useState(0);
  const [txCreatedAt, setTxCreatedAt] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Store transaction data for modal
  const [txData, setTxData] = useState({
    amount: 0,
    fee: 0,
    netAmount: 0,
    walletAddress: '',
    network: 'TRC20'
  });

  // Form State
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [currency, setCurrency] = useState('USDT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Reporting
  const [isReporting, setIsReporting] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Poll for withdrawal status updates
  useEffect(() => {
    if (isModalOpen && transactionId) {
      const interval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('status')
            .eq('id', transactionId)
            .single();

          if (!error && data) {
            const newStatus = data.status;
            if (newStatus !== txStatus) {
              setTxStatus(newStatus);
              if (newStatus === 'approved') {
                setToast({ message: '✅ Your withdrawal has been approved!', type: 'success' });
              } else if (newStatus === 'rejected') {
                setToast({ message: '❌ Your withdrawal was rejected.', type: 'error' });
              }
            }
          }
        } catch (e) {
          // Silent fail
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isModalOpen, transactionId, txStatus]);

  const fetchWithdrawalStatus = async () => {
    if (!transactionId) return;
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (!error && data) {
        setTxStatus(data.status);
      }
    } catch (e) {
      console.error('Error fetching status:', e);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: bal } = await supabase
        .from('user_balances')
        .select('funding_balance, total_profit_usdt, bonus_usdt')
        .eq('user_id', user.id)
        .single();

      if (bal) {
        const total = (bal.funding_balance || 0) + (bal.total_profit_usdt || 0) + (bal.bonus_usdt || 0);
        setTotalBalance(total);
        setFundingBalance(bal.funding_balance || 0);
      }
      
      const { data: userData } = await supabase
        .from('user_balances')
        .select('telegram_username')
        .eq('user_id', user.id)
        .single();

      if (userData?.telegram_username) {
        setTelegramChatId(userData.telegram_username);
      }

      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (withdrawals) {
        setRecentWithdrawals(withdrawals);
      }

      setUser(user);
      setLoading(false);
    }
    fetchUserData();
  }, [supabase, router]);

  // Countdown timer - calculates remaining time based on creation date
  useEffect(() => {
    if (isModalOpen && txStatus === 'pending' && txCreatedAt) {
      const targetTime = new Date(txCreatedAt.getTime() + 24 * 60 * 60 * 1000);
      const updateCountdown = () => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((targetTime.getTime() - now.getTime()) / 1000));
        setCountdown(diff);
      };
      
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [isModalOpen, txStatus, txCreatedAt]);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.03;
  const netAmount = amountNum - fee;
  const minWithdrawal = 10;
  const maxWithdrawal = totalBalance;

  const canWithdraw = amountNum >= minWithdrawal && amountNum <= totalBalance;

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSetMax = () => setAmount(totalBalance.toString());
  const handleSetHalf = () => setAmount((totalBalance / 2).toString());

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReportIssue = async () => {
    if (!reportIssue.trim() || !transactionId) {
      setToast({ message: 'Please describe the issue before submitting.', type: 'error' });
      return;
    }
    
    setIsReporting(true);
    setReportSuccess(false);
    
    try {
      const response = await fetch('/api/admin-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'withdrawal_reported',
          data: {
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.email,
            withdrawalId: transactionId,
            amount: txData.amount,
            issue: reportIssue
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setReportSuccess(true);
        setToast({ message: '✅ Issue reported to admin. We\'ll get back to you shortly.', type: 'success' });
        
        // Create in-app notification for the user
        try {
          await supabase
            .from('user_notifications')
            .insert({
              user_id: user.id,
              type: 'general',
              title: '📝 Issue Reported',
              message: `Your issue regarding withdrawal ${transactionId} has been reported to admin.`,
              data: {
                withdrawal_id: transactionId,
                issue: reportIssue
              },
              is_read: false,
              created_at: new Date().toISOString()
            });
        } catch (e) {
          console.error('Failed to create notification for report:', e);
        }
        
        setTimeout(() => {
          setReportIssue('');
          setShowReportForm(false);
          setReportSuccess(false);
        }, 3000);
      } else {
        setToast({ message: result.error || 'Failed to report issue. Please try again.', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to report issue. Please try again.', type: 'error' });
    } finally {
      setIsReporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (amountNum < minWithdrawal) {
      return setError(`Minimum withdrawal amount is ${minWithdrawal} USDT.`);
    }
    if (amountNum > totalBalance) {
      return setError('Insufficient balance.');
    }
    if (!walletAddress.trim()) {
      return setError('Please enter a wallet address.');
    }
    if (walletAddress.length < 10) {
      return setError('Please enter a valid wallet address.');
    }

    setSubmitting(true);

    try {
      const { data: withdrawal, error: dbError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          amount: amountNum,
          fee_amount: fee,
          net_amount: netAmount,
          wallet_address: walletAddress,
          network: network,
          currency: currency,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const txId = withdrawal.id;
      setTransactionId(txId);
      setTxCreatedAt(new Date());
      
      // Store transaction data for modal
      setTxData({
        amount: amountNum,
        fee: fee,
        netAmount: netAmount,
        walletAddress: walletAddress,
        network: network
      });

      // ✅ CREATE IN-APP NOTIFICATION - SAFE WITH ERROR HANDLING
      try {
        const { error: notifError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: user.id,
            type: 'withdrawal_pending',
            title: '📤 Withdrawal Request Submitted',
            message: `Your withdrawal request of ${amountNum} USDT has been submitted for approval.`,
            data: {
              amount: amountNum,
              fee: fee,
              net_amount: netAmount,
              wallet_address: walletAddress,
              network: network,
              status: 'pending',
              withdrawal_id: txId
            },
            is_read: false,
            created_at: new Date().toISOString()
          });

        if (notifError) {
          // Silent fail - notification is not critical
          console.log('ℹ️ In-app notification skipped (table may not exist)');
        } else {
          console.log('✅ In-app notification created');
        }
      } catch (notifErr) {
        // Silent fail - notification is not critical
        console.log('ℹ️ In-app notification skipped');
      }

      // ✅ Admin Notification (Email + Telegram)
      await notifyAdminNewWithdrawal(
        user.email,
        user.user_metadata?.full_name || user.email,
        amountNum,
        fee,
        netAmount,
        walletAddress
      );

      // ✅ User Notification (Email + Telegram)
      await notifyUserWithdrawalRequested(
        user.email,
        user.user_metadata?.full_name || user.email,
        amountNum,
        fee,
        netAmount,
        walletAddress,
        network,
        telegramChatId || undefined
      );

      // Refresh recent withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (withdrawals) {
        setRecentWithdrawals(withdrawals);
      }

      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAmount('');
    setWalletAddress('');
    setTxData({
      amount: 0,
      fee: 0,
      netAmount: 0,
      walletAddress: '',
      network: 'TRC20'
    });
    setShowReportForm(false);
    setReportIssue('');
    setReportSuccess(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { 
        label: 'Pending', 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
        icon: <Clock className="w-3 h-3" />
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      <p className="text-gray-400 text-sm">Loading withdrawal page...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#0b0e14] text-white space-y-6 max-w-5xl mx-auto">
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <ArrowDownToLine size={28} className="text-yellow-400" />
            Withdraw USDT
          </h1>
          <p className="text-[#8e96a3] text-sm mt-1">
            Securely withdraw your funds to an external wallet
          </p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 text-sm bg-[#141a24] px-4 py-2.5 rounded-xl border border-white/5"
        >
          <Wallet size={16} className="text-[#6366f1]" />
          <span className="text-[#8e96a3]">Available:</span>
          <span className="font-bold text-green-400">{totalBalance.toFixed(2)} USDT</span>
        </motion.div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-500/20"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#8e96a3]">
              <span className="text-white font-medium">Withdrawal Process:</span> Your request will be reviewed by our admin team within 24 hours. 
              <span className="text-yellow-400 font-medium"> Min: {minWithdrawal} USDT</span> · 
              <span className="text-red-400 font-medium"> Fee: 3%</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2"
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2"
          >
            <CheckCircle size={18} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2 columns */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Amount (USDT) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSetHalf}
                      className="text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1 bg-blue-500/10 rounded"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={handleSetMax}
                      className="text-xs text-green-400 hover:text-green-300 transition px-2 py-1 bg-green-500/10 rounded"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount..."
                    step="0.01"
                    min="1"
                    className="w-full bg-[#0b0e14] border border-white/5 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-[#6366f1] transition pr-24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e96a3] font-medium text-sm">
                    USDT
                  </span>
                </div>
                
                <div className="mt-2 flex justify-between text-xs text-[#8e96a3]">
                  <span>Balance: <span className="text-white font-medium">{totalBalance.toFixed(2)} USDT</span></span>
                  <span>Min: {minWithdrawal} USDT</span>
                </div>

                {amountNum > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 bg-[#0b0e14] rounded-xl p-4 border border-white/5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8e96a3]">Withdrawal Amount</span>
                        <span className="text-white font-medium">{amountNum.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                        <span className="text-[#8e96a3]">Processing Fee (3%)</span>
                        <span className="text-red-400 font-medium">-{fee.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-[#8e96a3] font-medium">You will receive</span>
                        <span className="text-green-400 font-bold text-lg">{netAmount.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Wallet Address */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Wallet Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your USDT wallet address..."
                    className="w-full bg-[#0b0e14] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-[#6366f1] transition pr-12"
                  />
                  {walletAddress && (
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e96a3] hover:text-white transition"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8e96a3] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Make sure you enter the correct address. Transactions are irreversible.
                </p>
              </div>

              {/* Network & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Network</label>
                  <select 
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-[#6366f1] transition"
                  >
                    <option value="TRC20">🔷 TRC20 (Tron)</option>
                    <option value="BEP20">🟡 BEP20 (BNB Chain)</option>
                    <option value="ERC20">🔶 ERC20 (Ethereum)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Currency</label>
                  <div className="w-full bg-[#0b0e14] border border-white/5 rounded-xl p-4 text-white font-medium flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-yellow-400" />
                    USDT (Tether)
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button 
                type="submit"
                disabled={submitting || !canWithdraw}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {submitting ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <><ArrowDownToLine size={20} /> Submit Withdrawal Request</>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-[#8e96a3] uppercase tracking-wider mb-4">
              Quick Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-xl border border-white/5">
                <span className="text-[#8e96a3] text-sm">Funding Balance</span>
                <span className="text-white font-bold">{fundingBalance.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-xl border border-white/5">
                <span className="text-[#8e96a3] text-sm">Withdrawal Fee</span>
                <span className="text-red-400 font-bold">3%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-xl border border-white/5">
                <span className="text-[#8e96a3] text-sm">Min Amount</span>
                <span className="text-yellow-400 font-bold">{minWithdrawal} USDT</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0b0e14] rounded-xl border border-white/5">
                <span className="text-[#8e96a3] text-sm">Processing Time</span>
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <Timer className="w-4 h-4" /> 24h
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-[#8e96a3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Requests
            </h3>
            {recentWithdrawals.length === 0 ? (
              <p className="text-[#8e96a3] text-sm text-center py-4">No withdrawal requests yet</p>
            ) : (
              <div className="space-y-2">
                {recentWithdrawals.slice(0, 3).map((w) => {
                  const status = getStatusBadge(w.status);
                  return (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-xl border border-white/5">
                      <div>
                        <p className="text-white font-medium text-sm">{w.amount} USDT</p>
                        <p className="text-[#8e96a3] text-xs">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-[#8e96a3] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Security Tips
            </h3>
            <ul className="space-y-2 text-xs text-[#8e96a3]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                Always double-check your wallet address
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                Withdrawals are processed within 24 hours
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                You'll receive notifications via email & Telegram
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Withdrawal Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-yellow-400" />
          How to Withdraw - Step by Step
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-3 bg-[#0b0e14] rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-400 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Enter Amount</p>
              <p className="text-[#8e96a3] text-xs">Min: {minWithdrawal} USDT</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0b0e14] rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-400 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Add Wallet Address</p>
              <p className="text-[#8e96a3] text-xs">Double check the address</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0b0e14] rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-400 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Submit Request</p>
              <p className="text-[#8e96a3] text-xs">Admin reviews within 24h</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[#0b0e14] rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 font-bold text-sm">4</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Receive Funds</p>
              <p className="text-[#8e96a3] text-xs">Check email & Telegram</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- PROCESSING MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => closeModal()}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 border-b border-white/5 text-center relative">
                <button onClick={() => closeModal()} className="absolute right-4 top-4 text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
                
                {/* Status Icon */}
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/30">
                    {txStatus === 'pending' && (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping"></div>
                        <Loader2 className="text-yellow-500 w-10 h-10 animate-spin" />
                      </div>
                    )}
                    {txStatus === 'approved' && (
                      <CheckCircle className="text-green-500 w-10 h-10" />
                    )}
                    {txStatus === 'rejected' && (
                      <X className="text-red-500 w-10 h-10" />
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mt-4">
                  {txStatus === 'pending' && 'Processing Withdrawal'}
                  {txStatus === 'approved' && 'Withdrawal Approved!'}
                  {txStatus === 'rejected' && 'Withdrawal Rejected'}
                </h2>
                <p className="text-[#8e96a3] text-sm">
                  {txStatus === 'pending' && 'Your request is being processed...'}
                  {txStatus === 'approved' && 'Funds have been sent to your wallet'}
                  {txStatus === 'rejected' && 'Your request was not approved'}
                </p>

                {/* Transaction ID */}
                <div className="mt-3 bg-[#0b0e14] rounded-lg p-2 inline-block border border-white/5">
                  <code className="text-xs text-[#8e96a3] font-mono">
                    TXID: {transactionId?.slice(0, 8)}...{transactionId?.slice(-6)}
                  </code>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Status Timeline */}
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${txStatus === 'pending' ? 'bg-yellow-400 animate-pulse' : txStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-white">
                      {txStatus === 'pending' && '⏳ Pending Admin Approval'}
                      {txStatus === 'approved' && '✅ Approved'}
                      {txStatus === 'rejected' && '❌ Rejected'}
                    </span>
                    <span className="ml-auto text-xs text-[#8e96a3]">
                      {txCreatedAt?.toLocaleString()}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  {txStatus === 'pending' && countdown > 0 && (
                    <div className="flex items-center justify-center gap-4 py-3 border-t border-white/5 pt-3">
                      <div className="text-center">
                        <div className="text-3xl font-mono font-bold text-yellow-400">
                          {formatCountdown(countdown)}
                        </div>
                        <p className="text-[10px] text-[#8e96a3] uppercase tracking-wider">Estimated Time Remaining</p>
                      </div>
                    </div>
                  )}

                  {/* Expandable Details */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-xs text-[#8e96a3] hover:text-white transition mt-3 w-full justify-center border-t border-white/5 pt-3"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Hide Details' : 'View Transaction Details'}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-white/5 space-y-2 text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3]">Amount</span>
                        <span className="text-white font-medium">{txData.amount.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3]">Fee (3%)</span>
                        <span className="text-red-400">-{txData.fee.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3]">Net Amount</span>
                        <span className="text-green-400 font-bold">{txData.netAmount.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3]">Network</span>
                        <span className="text-white">{txData.network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3]">Wallet Address</span>
                        <span className="text-yellow-400 text-xs font-mono truncate max-w-[200px]">{txData.walletAddress}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Report Issue Button */}
                {txStatus === 'pending' && (
                  <div className="border-t border-white/5 pt-4">
                    <button
                      onClick={() => setShowReportForm(!showReportForm)}
                      className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      <Flag className="w-4 h-4" />
                      {showReportForm ? 'Cancel Report' : 'Report an Issue'}
                    </button>

                    {showReportForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        {reportSuccess ? (
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
                            ✅ Issue reported successfully! We'll get back to you shortly.
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={reportIssue}
                              onChange={(e) => setReportIssue(e.target.value)}
                              placeholder="Describe the issue you're experiencing with this withdrawal..."
                              className="w-full bg-[#0b0e14] border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition resize-none"
                              rows={3}
                              disabled={isReporting}
                            />
                            <button
                              onClick={handleReportIssue}
                              disabled={isReporting || !reportIssue.trim()}
                              className="w-full py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-medium hover:bg-yellow-500/30 transition disabled:opacity-50"
                            >
                              {isReporting ? (
                                <span className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full inline-block" />
                              ) : (
                                'Submit Report'
                              )}
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      closeModal();
                      router.push('/dashboard');
                    }}
                    className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition"
                  >
                    Return to Overview
                  </button>
                  <button 
                    onClick={() => {
                      closeModal();
                      router.push('/dashboard/transactions');
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-white hover:opacity-90 transition"
                  >
                    View History
                  </button>
                </div>

                {/* Status Message */}
                <p className="text-xs text-[#8e96a3] text-center">
                  {txStatus === 'pending' ? (
                    'You will receive a Telegram, Email, and In-App notification once the admin approves this transaction.'
                  ) : txStatus === 'approved' ? (
                    '✅ Funds have been sent to your wallet. Check your transaction history for details.'
                  ) : (
                    '❌ Your withdrawal request was rejected. Please contact support for more information.'
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}