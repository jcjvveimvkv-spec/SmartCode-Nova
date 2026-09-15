'use client';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft, Wallet, TrendingUp, Gift,
  CheckCircle, AlertCircle, Loader2, History,
  ArrowDown, Zap
} from 'lucide-react';

export default function TransferPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flashFunding, setFlashFunding] = useState(false);

  const [funding, setFunding] = useState(0);
  const [profit, setProfit] = useState(0);
  const [bonus, setBonus] = useState(0);

  const [source, setSource] = useState<'profit' | 'bonus'>('profit');
  const [amount, setAmount] = useState<number | ''>('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: bal } = await supabase
        .from('user_balances')
        .select('funding_balance, total_profit_usdt, bonus_usdt')
        .eq('user_id', user.id)
        .maybeSingle();

      if (bal) {
        setFunding(bal.funding_balance || 0);
        setProfit(bal.total_profit_usdt || 0);
        setBonus(bal.bonus_usdt || 0);
      }

      const { data: hist } = await supabase
        .from('transfer_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setHistory(hist || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  const sourceBalance = source === 'profit' ? profit : bonus;
  const sourceLabel = source === 'profit' ? 'Profit' : 'Bonus';

  // ✅ Enhancement: live validation
  const numAmount = typeof amount === 'number' ? amount : 0;
  const amountExceeds = numAmount > sourceBalance;
  const amountInvalid = numAmount <= 0;
  const canTransfer = !transferring && !amountInvalid && !amountExceeds && sourceBalance > 0;

  // ✅ Enhancement: live preview
  const preview = useMemo(() => {
    if (amountInvalid || amountExceeds) return null;
    return {
      sourceBefore: sourceBalance,
      sourceAfter: sourceBalance - numAmount,
      fundingBefore: funding,
      fundingAfter: funding + numAmount,
    };
  }, [amount, sourceBalance, funding, amountInvalid, amountExceeds]);

  const setQuickAmount = (pct: number) => {
    if (sourceBalance <= 0) return;
    const v = Math.floor((sourceBalance * pct) / 100 * 100) / 100; // 2 dp floor
    setAmount(v);
  };

  const handleTransfer = async () => {
    setError('');
    setSuccess('');

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (amount > sourceBalance) {
      setError(`Insufficient balance in ${sourceLabel}.`);
      return;
    }

    setTransferring(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sourceField = source === 'profit' ? 'total_profit_usdt' : 'bonus_usdt';

      const { error: deductError } = await supabase
        .from('user_balances')
        .update({ [sourceField]: sourceBalance - Number(amount) })
        .eq('user_id', user.id);

      if (deductError) throw deductError;

      const { error: addError } = await supabase
        .from('user_balances')
        .update({ funding_balance: funding + Number(amount) })
        .eq('user_id', user.id);

      if (addError) throw addError;

      await supabase
        .from('transfer_history')
        .insert({
          user_id: user.id,
          source: source === 'profit' ? 'Total Profit' : 'Bonus Balance',
          destination: 'Funding Balance',
          amount: Number(amount)
        });

      setFunding(prev => prev + Number(amount));
      if (source === 'profit') setProfit(prev => prev - Number(amount));
      else setBonus(prev => prev - Number(amount));
      setAmount('');

      setSuccess(`Successfully transferred ${Number(amount).toFixed(2)} USDT to Funding Balance.`);

      // ✅ Enhancement: trigger funding card flash
      setFlashFunding(true);
      setTimeout(() => setFlashFunding(false), 1200);

      const { data: hist } = await supabase
        .from('transfer_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(hist || []);

    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="text-[#6366f1] shrink-0" size={22} />
          Transfer Funds
        </h1>
        <p className="text-[#8e96a3] text-xs sm:text-sm mt-1">Move funds between your Profit, Bonus, and Funding balances.</p>
      </div>

      {/* ---------- Balance Row (enhanced) ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Funding */}
        <motion.div
          animate={flashFunding ? { borderColor: ['#6366f1', '#10b981', '#6366f1'] } : {}}
          transition={{ duration: 1.2 }}
          className="relative bg-gradient-to-br from-green-500/10 to-transparent border border-white/5 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-[#8e96a3] text-xs mb-1">
            <Wallet size={14} className="text-green-400" /> Funding Balance
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-400 tabular-nums">
            {funding.toFixed(2)} <span className="text-xs font-medium">USDT</span>
          </p>
        </motion.div>

        {/* Profit */}
        <motion.div
          className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-[#8e96a3] text-xs mb-1">
            <TrendingUp size={14} className="text-[#6366f1]" /> Total Profit
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#6366f1] tabular-nums">
            {profit.toFixed(2)} <span className="text-xs font-medium">USDT</span>
          </p>
        </motion.div>

        {/* Bonus */}
        <motion.div
          className="bg-gradient-to-br from-orange-500/10 to-transparent border border-white/5 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-[#8e96a3] text-xs mb-1">
            <Gift size={14} className="text-[#f59e0b]" /> Bonus Balance
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#f59e0b] tabular-nums">
            {bonus.toFixed(2)} <span className="text-xs font-medium">USDT</span>
          </p>
        </motion.div>
      </div>

      {/* ---------- Transfer Form ---------- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
          <Zap size={18} className="text-[#6366f1]" /> Make a Transfer
        </h2>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-2 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-start gap-2 text-sm"
            >
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {/* Source picker — ✅ Enhancement: card-style with icon, label, balance */}
          <div>
            <label className="block text-xs text-[#8e96a3] uppercase tracking-wider mb-2">Source</label>
            <div className="grid grid-cols-2 gap-3">
              {(['profit', 'bonus'] as const).map((s) => {
                const balance = s === 'profit' ? profit : bonus;
                const isActive = source === s;
                const isDisabled = balance === 0;
                const Icon = s === 'profit' ? TrendingUp : Gift;
                const color = s === 'profit' ? 'text-[#6366f1]' : 'text-[#f59e0b]';
                const bgActive = s === 'profit' ? 'bg-[#6366f1]/15 border-[#6366f1]/40' : 'bg-[#f59e0b]/15 border-[#f59e0b]/40';
                return (
                  <button
                    key={s}
                    onClick={() => { setSource(s); setAmount(''); setError(''); setSuccess(''); }}
                    disabled={isDisabled}
                    className={`flex flex-col items-start p-3 rounded-xl border transition text-left ${
                      isActive ? bgActive : 'bg-[#0b0e14] border-white/5 hover:border-white/10'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${isActive ? color : 'text-[#8e96a3]'}`}>
                      <Icon size={14} />
                      <span className="capitalize">{s}</span>
                    </div>
                    <p className={`text-sm sm:text-base font-bold tabular-nums truncate w-full ${isActive ? 'text-white' : 'text-[#8e96a3]'}`}>
                      {balance.toFixed(2)} <span className="text-xs font-medium">USDT</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs text-[#8e96a3] uppercase tracking-wider mb-2">Amount (USDT)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                inputMode="decimal"
                className={`w-full bg-[#0b0e14] border rounded-lg px-3 py-3 pr-16 text-white text-base focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums ${
                  amountExceeds ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-[#6366f1]'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8e96a3] pointer-events-none">
                USDT
              </span>
            </div>
            {amountExceeds && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Exceeds available {sourceLabel} balance
              </p>
            )}

            {/* ✅ Enhancement: percentage quick-select */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setQuickAmount(pct)}
                  disabled={sourceBalance <= 0}
                  className="flex-1 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg bg-[#0b0e14] border border-white/5 text-[#8e96a3] hover:text-white hover:border-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pct === 100 ? 'Max' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Enhancement: live preview */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-2 text-xs overflow-hidden"
              >
                <p className="text-[#8e96a3] uppercase tracking-wider text-[10px] font-medium mb-1">Preview</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#8e96a3] truncate">{sourceLabel}</span>
                  <span className="tabular-nums shrink-0">
                    <span className="text-white">{preview.sourceBefore.toFixed(2)}</span>
                    <span className="text-[#8e96a3] mx-1.5">→</span>
                    <span className="text-white font-bold">{preview.sourceAfter.toFixed(2)}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#8e96a3] truncate">Funding</span>
                  <span className="tabular-nums shrink-0">
                    <span className="text-white">{preview.fundingBefore.toFixed(2)}</span>
                    <span className="text-[#8e96a3] mx-1.5">→</span>
                    <span className="text-green-400 font-bold">{preview.fundingAfter.toFixed(2)}</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Destination */}
          <div className="flex items-center justify-between bg-[#0b0e14] border border-white/5 rounded-xl p-3 gap-2">
            <span className="text-xs sm:text-sm text-[#8e96a3] shrink-0">Destination</span>
            <span className="text-xs sm:text-sm font-medium text-green-400 flex items-center gap-1.5 min-w-0">
              <ArrowDown size={14} className="shrink-0" />
              <span className="truncate">Funding Balance</span>
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleTransfer}
            disabled={!canTransfer}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#6366f1]/90 transition rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {transferring ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft size={18} />
                Transfer Funds
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------- Transfer History ---------- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-[#6366f1] shrink-0" />
          <h2 className="text-base sm:text-lg font-bold">Recent Transfers</h2>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-[#8e96a3] text-sm">
            No transfers yet. Your transfer history will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white truncate">
                    {item.source} <span className="text-[#8e96a3]">→</span> {item.destination}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#8e96a3] truncate">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-400 tabular-nums shrink-0">
                  +{item.amount.toFixed(2)} <span className="text-xs font-medium">USDT</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
