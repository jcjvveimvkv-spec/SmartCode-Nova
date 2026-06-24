'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowRightLeft, Wallet, TrendingUp, Gift, 
  CheckCircle, AlertCircle, Loader2, History
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

  // Balances
  const [funding, setFunding] = useState(0);
  const [profit, setProfit] = useState(0);
  const [bonus, setBonus] = useState(0);

  // Transfer state
  const [source, setSource] = useState<'profit' | 'bonus'>('profit');
  const [amount, setAmount] = useState<number | ''>('');
  const [history, setHistory] = useState<any[]>([]);

  // Fetch balances & history
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Balances
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

      // Transfer history
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

  const handleTransfer = async () => {
    setError('');
    setSuccess('');

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const sourceBalance = source === 'profit' ? profit : bonus;
    if (amount > sourceBalance) {
      setError(`Insufficient balance in ${source === 'profit' ? 'Profit' : 'Bonus'}.`);
      return;
    }

    setTransferring(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Perform the transfer using a stored procedure or two-step update
      // We'll do a two-step update with a retry-safe approach
      const sourceField = source === 'profit' ? 'total_profit_usdt' : 'bonus_usdt';
      
      // Deduct from source
      const { error: deductError } = await supabase
        .from('user_balances')
        .update({ [sourceField]: sourceBalance - Number(amount) })
        .eq('user_id', user.id);

      if (deductError) throw deductError;

      // Add to funding
      const { error: addError } = await supabase
        .from('user_balances')
        .update({ funding_balance: funding + Number(amount) })
        .eq('user_id', user.id);

      if (addError) throw addError;

      // 2. Log the transfer
      await supabase
        .from('transfer_history')
        .insert({
          user_id: user.id,
          source: source === 'profit' ? 'Total Profit' : 'Bonus Balance',
          destination: 'Funding Balance',
          amount: Number(amount)
        });

      // 3. Update local state
      setFunding(prev => prev + Number(amount));
      if (source === 'profit') setProfit(prev => prev - Number(amount));
      else setBonus(prev => prev - Number(amount));
      setAmount('');

      setSuccess(`Successfully transferred ${Number(amount).toFixed(2)} USDT to Funding Balance.`);
      
      // Refresh history
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

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="text-[#6366f1]" size={24} />
            Transfer Funds
          </h1>
          <p className="text-[#8e96a3] text-sm">Move funds between your Profit, Bonus, and Funding balances.</p>
        </div>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8e96a3] text-sm">
            <Wallet size={16} /> Funding Balance
          </div>
          <p className="text-2xl font-bold text-green-400">{funding.toFixed(2)} USDT</p>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8e96a3] text-sm">
            <TrendingUp size={16} /> Total Profit
          </div>
          <p className="text-2xl font-bold text-[#6366f1]">{profit.toFixed(2)} USDT</p>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8e96a3] text-sm">
            <Gift size={16} /> Bonus Balance
          </div>
          <p className="text-2xl font-bold text-[#f59e0b]">{bonus.toFixed(2)} USDT</p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-[#141a24] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Make a Transfer</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8e96a3] mb-1">Source</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSource('profit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${source === 'profit' ? 'bg-[#6366f1] text-white' : 'bg-[#0b0e14] border border-white/5 text-[#8e96a3]'}`}
                disabled={profit === 0}
              >
                Profit ({profit.toFixed(2)} USDT)
              </button>
              <button
                onClick={() => setSource('bonus')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${source === 'bonus' ? 'bg-[#6366f1] text-white' : 'bg-[#0b0e14] border border-white/5 text-[#8e96a3]'}`}
                disabled={bonus === 0}
              >
                Bonus ({bonus.toFixed(2)} USDT)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8e96a3] mb-1">Amount (USDT)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="flex-1 bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#6366f1]"
              />
              <button
                onClick={() => setAmount(source === 'profit' ? profit : bonus)}
                className="px-4 py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-sm hover:bg-[#6366f1]/20 transition"
              >
                Max
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#0b0e14] border border-white/5 rounded-xl p-3">
            <span className="text-sm text-[#8e96a3]">Destination</span>
            <span className="text-sm font-medium text-green-400">Funding Balance</span>
          </div>

          <button
            onClick={handleTransfer}
            disabled={transferring || !amount}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#6366f1]/90 transition rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {transferring ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <><ArrowRightLeft size={18} /> Transfer Funds</>
            )}
          </button>
        </div>
      </div>

      {/* Transfer History */}
      {history.length > 0 && (
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-[#6366f1]" />
            <h2 className="text-lg font-bold">Recent Transfers</h2>
          </div>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm text-white">{item.source} → {item.destination}</p>
                  <p className="text-xs text-[#8e96a3]">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-green-400">{item.amount.toFixed(2)} USDT</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}