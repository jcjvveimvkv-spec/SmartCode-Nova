'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Wallet, Bot, ShieldAlert } from 'lucide-react';
import TradeChartWidget from '../TradeChartWidget';

export default function TradePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [hasDeployedBot, setHasDeployedBot] = useState(false);
  const [pair, setPair] = useState('BTC/USDT');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(67000);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      
      // Check for deployed bots
      const { data: bots } = await supabase.from('active_bots').select('id').eq('user_id', user.id).eq('is_deployed', true);
      setHasDeployedBot((bots?.length || 0) > 0);

      const { data } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
      if (data) setBalance(data.funding_balance || 0);
    }
    checkAccess();

    const interval = setInterval(() => {
      setPrice(prev => prev + (Math.random() - 0.5) * 100);
    }, 3000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    const tradeAmount = parseFloat(amount);
    if (!tradeAmount || tradeAmount <= 0) return alert('Enter a valid amount');
    if (tradeAmount > balance) return alert('Insufficient balance');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_balances').update({ funding_balance: balance - tradeAmount }).eq('user_id', user.id);
    await supabase.from('trade_history').insert({
      user_id: user.id,
      pair: pair,
      trade_type: type,
      amount_usdt: tradeAmount,
      price_usdt: price,
      profit_percent: 0
    });

    setBalance(balance - tradeAmount);
    setAmount('');
    setLoading(false);
    alert(`✅ ${type} order executed for ${tradeAmount} USDT on ${pair}`);
  };

  if (!hasDeployedBot) {
    return (
      <div className="p-6 bg-[#0b0e14] text-white flex flex-col items-center justify-center h-[600px] gap-4">
        <ShieldAlert size={64} className="text-[#8e96a3]" />
        <h2 className="text-2xl font-bold">No Bot Deployed</h2>
        <p className="text-[#8e96a3] text-center max-w-md">You must purchase and deploy a bot from the Bot Store before you can start trading.</p>
        <button onClick={() => router.push('/dashboard/my-bots')} className="px-6 py-3 bg-[#6366f1] rounded-xl text-white font-bold hover:opacity-90 transition">
          Go to My Bots
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0b0e14] text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Live Market & Trade</h1>
        <div className="flex items-center gap-4 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5">
          <Bot size={16} className="text-green-400" /> Bot Deployed
          <div className="w-px h-4 bg-white/10"></div>
          <Wallet size={16} className="text-[#6366f1]" /> Balance: <span className="font-bold text-green-400">{balance.toFixed(2)} USDT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#141a24] border border-white/5 rounded-xl p-4 h-[600px]">
          <TradeChartWidget />
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-bold text-lg border-b border-white/5 pb-4">Place Order</h2>
          
          <div>
            <label className="text-xs text-[#8e96a3] uppercase tracking-wider">Pair</label>
            <select className="w-full bg-[#0b0e14] border border-white/5 rounded p-2 text-white mt-1" value={pair} onChange={e => setPair(e.target.value)}>
              <option>BTC/USDT</option>
              <option>ETH/USDT</option>
              <option>LTC/USDT</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[#8e96a3] uppercase tracking-wider">Amount (USDT)</label>
            <div className="relative mt-1">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount..." className="w-full bg-[#0b0e14] border border-white/5 rounded p-2 text-white" />
              <span className="absolute right-3 top-2 text-[#8e96a3] text-sm">USDT</span>
            </div>
          </div>

          <div className="text-xs bg-[#0b0e14] p-2 rounded border border-white/5 flex justify-between">
            <span className="text-[#8e96a3]">Current Price</span>
            <span className="font-mono text-green-400">{price.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <button onClick={() => handleTrade('BUY')} disabled={loading} className="py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold hover:bg-green-500/30 transition flex items-center justify-center gap-2">
              <ArrowUp size={16} /> BUY
            </button>
            <button onClick={() => handleTrade('SELL')} disabled={loading} className="py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 transition flex items-center justify-center gap-2">
              <ArrowDown size={16} /> SELL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}