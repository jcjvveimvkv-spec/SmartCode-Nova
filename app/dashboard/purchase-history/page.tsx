'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import TradeChartWidget from '../TradeChartWidget';

export default function TradePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [deployedBot, setDeployedBot] = useState<any>(null);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentChartPair, setCurrentChartPair] = useState('BITSTAMP:BTCUSD');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // 1. Fetch the deployed bot
      const { data: botData } = await supabase
        .from('active_bots')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deployed', true)
        .maybeSingle();

      setDeployedBot(botData || null);

      // 2. Fetch user balance
      const { data: bal } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
      if (bal) setBalance(bal.funding_balance || 0);

      // 3. Fetch the trade logs
      await fetchTradeLogs();

      setLoading(false);
      setLastUpdated(new Date());
    }
    fetchData();
  }, [supabase, router]);

  // Function to fetch trade logs
  const fetchTradeLogs = async () => {
    const { data: logs } = await supabase
      .from('bot_trade_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(20);

    if (logs && logs.length > 0) {
      setTradeLogs(logs);
      // DYNAMIC PAIR SWAP: Set the chart to the most recent trade's pair
      const lastTrade = logs[0];
      let tradingViewSymbol = 'BITSTAMP:BTCUSD'; // Default fallback
      
      // Map custom pairs to TradingView symbols
      if (lastTrade.pair === 'BTC/USDT') tradingViewSymbol = 'BITSTAMP:BTCUSD';
      else if (lastTrade.pair === 'ETH/USDT') tradingViewSymbol = 'BITSTAMP:ETHUSD';
      else if (lastTrade.pair === 'LTC/USDT') tradingViewSymbol = 'BITSTAMP:LTCUSD';
      else if (lastTrade.pair === 'XRP/USDT') tradingViewSymbol = 'BITSTAMP:XRPUSD';
      else if (lastTrade.pair === 'EUR/USD') tradingViewSymbol = 'FX:EURUSD';
      else if (lastTrade.pair === 'GBP/USD') tradingViewSymbol = 'FX:GBPUSD';
      else if (lastTrade.pair === 'SOL/USDT') tradingViewSymbol = 'COINBASE:SOLUSD';
      
      setCurrentChartPair(tradingViewSymbol);
    }
    setLastUpdated(new Date());
  };

  // Poll for new trades every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchTradeLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading...</div>;

  if (!deployedBot) {
    return (
      <div className="p-6 bg-[#0b0e14] text-white flex flex-col items-center justify-center h-[600px] gap-4">
        <ShieldAlert size={64} className="text-[#8e96a3]" />
        <h2 className="text-2xl font-bold">No Deployed Bot Found</h2>
        <p className="text-[#8e96a3] text-center max-w-md">Please go to the Bot Store, purchase a bot, and deploy it from the "My Bots" page to start trading.</p>
        <button onClick={() => router.push('/dashboard/my-bots')} className="px-6 py-3 bg-[#6366f1] rounded-xl text-white font-bold hover:opacity-90 transition">
          Go to My Bots
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h1 className="text-2xl font-bold">Autonomous Trading Dashboard</h1>
        <div className="flex items-center gap-4 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5">
          <RefreshCw size={16} className="text-[#6366f1] animate-spin" />
          <span className="text-[#8e96a3] text-xs">Updating every 10s</span>
          <div className="w-px h-4 bg-white/10"></div>
          <Wallet size={16} className="text-[#6366f1]" /> Balance: <span className="font-bold text-green-400">{balance.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Bot Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141a24] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="flex items-center gap-4 border-r border-white/5 pr-4 last:border-0">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Bot className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Bot Name</p>
            <p className="text-lg font-bold">{deployedBot.bot_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-r border-white/5 pr-4 last:border-0">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Wallet className="text-green-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Invested</p>
            <p className="text-lg font-bold text-green-400">{deployedBot.invested_usdt} USDT</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-r border-white/5 pr-4 last:border-0">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <TrendingUp className="text-yellow-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Current Value</p>
            <p className="text-lg font-bold text-yellow-400">{deployedBot.current_value_usdt} USDT</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="text-green-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#8e96a3] uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 font-medium text-sm">Active (Cron)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chart Section (1 Minute Default) - DYNAMICALLY SWAPS */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0b0e14]/50">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#8e96a3]" />
            <span className="text-xs text-[#8e96a3]">1m interval</span>
          </div>
          <span className="text-[10px] text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
            {currentChartPair}
          </span>
        </div>
        <div className="h-[500px] w-full p-2">
          {/* Pass the dynamic symbol to the chart widget */}
          <TradeChartWidget symbol={currentChartPair} />
        </div>
      </div>

      {/* Trade Feed Section */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0b0e14]/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-[#6366f1]" /> Settlement Trade History
          </h3>
          <span className="text-xs text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
            {lastUpdated?.toLocaleTimeString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Pair</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {tradeLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#8e96a3]">Waiting for the Cron job to execute trades...</td></tr>
              ) : (
                tradeLogs.map((trade, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{new Date(trade.executed_at).toLocaleString()}</td>
                    <td className="px-6 py-3 font-mono">{trade.pair}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">{trade.amount_usdt} USDT</td>
                    <td className={`px-6 py-3 font-bold ${trade.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit_usdt >= 0 ? '+' : ''}{trade.profit_usdt.toFixed(2)} USDT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}