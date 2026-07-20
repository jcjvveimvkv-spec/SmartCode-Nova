'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, CheckCircle, AlertCircle, ExternalLink, Loader2, X } from 'lucide-react';
// ✅ FIXED: Import from notification-export instead of notifications
import { 
    notifyAdminNewWithdrawal, 
    notifyUserWithdrawalRequested,
    createInAppNotification 
} from '@/app/lib/notification-export';

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
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [currency, setCurrency] = useState('USDT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      }
      
      // Fetch Telegram Chat ID for notifications
      const { data: userData } = await supabase
        .from('user_balances')
        .select('telegram_username')
        .eq('user_id', user.id)
        .single();

      if (userData?.telegram_username) {
        setTelegramChatId(userData.telegram_username);
      }

      setUser(user);
      setLoading(false);
    }
    fetchUserData();
  }, [supabase, router]);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.03;
  const netAmount = amountNum - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (amountNum <= 0) return setError('Please enter a valid amount.');
    if (amountNum > totalBalance) return setError('Insufficient balance.');
    if (!walletAddress.trim()) return setError('Please enter a wallet address.');
    if (walletAddress.length < 10) return setError('Please enter a valid wallet address.');

    setSubmitting(true);

    try {
      const { error: dbError } = await supabase.from('withdrawal_requests').insert({
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
      });

      if (dbError) throw dbError;

      // ✅ 1. CREATE IN-APP NOTIFICATION FOR USER
      await createInAppNotification(
        user.id,
        'withdrawal_pending',
        '📤 Withdrawal Request Submitted',
        `Your withdrawal request of ${amountNum} USDT has been submitted for approval.`,
        {
          amount: amountNum,
          fee: fee,
          net_amount: netAmount,
          wallet_address: walletAddress,
          network: network,
          status: 'pending'
        }
      );
      console.log('✅ In-app notification created for user');

      // ✅ 2. ADMIN NOTIFICATION (Email + Telegram)
      await notifyAdminNewWithdrawal(
        user.email,
        user.user_metadata?.full_name || user.email,
        amountNum,
        fee,
        netAmount,
        walletAddress
      );
      console.log('✅ Admin notified');

      // ✅ 3. USER NOTIFICATION (Email + Telegram)
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
      console.log('✅ User notified via email and Telegram');

      // Clear form and open the Modal
      setAmount('');
      setWalletAddress('');
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Withdraw USDT</h1>
          <p className="text-[#8e96a3] text-sm">Submit a withdrawal request to your external wallet.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5">
          <Wallet size={16} className="text-[#6366f1]" />
          <span className="text-[#8e96a3]">Balance:</span>
          <span className="font-bold text-green-400">{totalBalance.toFixed(2)} USDT</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#141a24] border border-white/5 rounded-2xl p-6 space-y-6">
        <div>
          <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Amount (USDT)</label>
          <div className="relative">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-3 text-white text-lg font-bold focus:outline-none focus:border-[#6366f1]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e96a3] text-sm font-medium">USDT</span>
          </div>
          {amountNum > 0 && (
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-[#8e96a3]">
                <span>Withdrawal Fee (3%)</span>
                <span className="text-red-400">-{fee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between font-bold border-t border-white/5 pt-1 mt-1">
                <span className="text-[#8e96a3]">You will receive</span>
                <span className="text-green-400">{netAmount.toFixed(2)} USDT</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Wallet Address</label>
          <input 
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter your USDT wallet address..."
            className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        <div>
          <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Network</label>
          <select 
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-[#6366f1]"
          >
            <option value="TRC20">TRC20 (Tron)</option>
            <option value="BEP20">BEP20 (BNB Chain)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Cryptocurrency</label>
          <div className="bg-[#0b0e14] border border-white/5 rounded-lg p-3 text-white font-medium">
            USDT (Tether)
          </div>
        </div>

        <button 
          type="submit"
          disabled={submitting || amountNum <= 0 || amountNum > totalBalance}
          className="w-full py-4 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <><ArrowDownToLine size={18} /> Submit Withdrawal Request</>
          )}
        </button>
      </form>

      {/* --- PROCESSING MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 text-center relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
                <div className="w-16 h-16 bg-[#6366f1]/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#6366f1]/30">
                  <Loader2 className="text-[#6366f1] w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-white">Processing Withdrawal</h2>
                <p className="text-[#8e96a3] text-sm">SmartCodeNova is processing your withdrawal request...</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4 text-center">
                  <p className="text-[#8e96a3] text-sm">You will receive a Telegram, Email, and In-App notification once the admin approves this transaction.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition"
                  >
                    Return to Overview
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/transactions')}
                    className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition"
                  >
                    View History
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}