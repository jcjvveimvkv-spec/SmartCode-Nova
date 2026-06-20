'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Wallet, ArrowDownToLine, History, ExternalLink } from 'lucide-react';
import { notifyUserDepositInitiated, notifyAdminNewDeposit } from '@/app/lib/notifications';

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

  // Form state
  const [amount, setAmount] = useState('');
  const [txid, setTxid] = useState('');
  const [network, setNetwork] = useState('TRC20');

  // Deposit addresses
  const ADDRESSES = {
    TRC20: 'TG6Ean2c7rRSp1tHHPd78R4dZzxo67tyyd',
    BEP20: '0x5F8E1c4C318ef1cDAb776587535Bb55E1f92720c'
  };

  // QR Code URLs (Restored from your Supabase Storage)
  const QR_CODES = {
    TRC20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtTRC20.jpeg',
    BEP20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtBEP20.jpeg'
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
    if (!amount || !txid) return alert('Please enter amount and TXID.');
    setSubmitting(true);
    setSuccessMsg('');

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
      await notifyUserDepositInitiated(user.email, userName, parseFloat(amount), network);
      await notifyAdminNewDeposit(user.email, parseFloat(amount), txid, network);

      setSuccessMsg('Deposit submitted successfully! You will receive a confirmation email shortly.');
      setAmount(''); setTxid('');
    } catch (err: any) {
      alert('Error submitting deposit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading wallet...</div>;

  return (
    <div className="space-y-8 w-full max-w-full bg-[#0b0e14] text-white p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>
          <p className="text-[#8e96a3] text-sm">Manage your deposits and track your balance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5">
          <Wallet size={16} className="text-[#6366f1]" /> 
          <span className="text-[#8e96a3]">Balance:</span>
          <span className="font-bold text-green-400">{balances.funding.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
          <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Total Balance</p>
          <p className="text-2xl font-bold">{balances.total.toFixed(2)} USDT</p>
        </div>
        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
          <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Funding Balance</p>
          <p className="text-2xl font-bold text-green-400">{balances.funding.toFixed(2)} USDT</p>
        </div>
        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
          <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Total Profit</p>
          <p className="text-2xl font-bold text-[#10b981]">+{balances.profit.toFixed(2)} USDT</p>
        </div>
        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
          <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Bonus Balance</p>
          <p className="text-2xl font-bold text-[#f97316]">+{balances.bonus.toFixed(2)} USDT</p>
        </div>
      </div>

      {/* Deposit Methods */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ArrowDownToLine size={20} /> Deposit USDT</h2>
        <p className="text-[#8e96a3] text-sm mb-6">Send USDT to one of the addresses below. <strong className="text-yellow-400">Only send USDT.</strong></p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TRC20 */}
          <div className="bg-[#0b0e14] p-6 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">TRC20 <span className="text-xs bg-[#6366f1]/20 px-2 py-1 rounded text-[#6366f1]">Network</span></h3>
            </div>
            <img src={QR_CODES.TRC20} alt="TRC20 QR" className="w-40 h-40 mx-auto mb-4 rounded-lg border border-white/5" />
            <div className="bg-[#141a24] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <code className="text-xs text-[#8e96a3] break-all font-mono">{ADDRESSES.TRC20}</code>
              <button onClick={() => copyAddress(ADDRESSES.TRC20, 'TRC20')} className="p-2 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition">
                {copied === 'TRC20' ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* BEP20 */}
          <div className="bg-[#0b0e14] p-6 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">BEP20 <span className="text-xs bg-[#6366f1]/20 px-2 py-1 rounded text-[#6366f1]">Network</span></h3>
            </div>
            <img src={QR_CODES.BEP20} alt="BEP20 QR" className="w-40 h-40 mx-auto mb-4 rounded-lg border border-white/5" />
            <div className="bg-[#141a24] p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <code className="text-xs text-[#8e96a3] break-all font-mono">{ADDRESSES.BEP20}</code>
              <button onClick={() => copyAddress(ADDRESSES.BEP20, 'BEP20')} className="p-2 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition">
                {copied === 'BEP20' ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* TXID Form */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <h3 className="font-bold text-lg mb-4">Submit Deposit Request</h3>
          <p className="text-[#8e96a3] text-sm mb-4">After sending the USDT, paste your Transaction ID (TXID) below.</p>
          <form onSubmit={handleSubmitDeposit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Network</label>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white">
                <option>TRC20</option>
                <option>BEP20</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Amount (USDT)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Transaction ID (TXID)</label>
              <input type="text" value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Paste TXID here..." className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
            </div>
            <div className="md:col-span-4">
              <button type="submit" disabled={submitting} className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}