'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link'; // <--- ADDED THIS IMPORT
import { 
  Wallet, TrendingUp, Bot, Activity, 
  Wallet2, ExternalLink, PlusCircle, Gift,
  Newspaper, Clock, Banknote
} from 'lucide-react';

// Safe TradingView News Widget
function TradingViewNewsWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "feedMode": "all_symbols",
      "isTransparent": false,
      "displayMode": "regular",
      "width": "100%",
      "height": "100%",
      "colorTheme": "dark",
      "locale": "en"
    });

    const container = document.getElementById('news-widget-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) container.innerHTML = '';
    };
  }, []);

  return <div id="news-widget-container" className="tradingview-widget-container w-full h-full min-h-[150px]" />;
}

export default function DashboardOverview() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [stats, setStats] = useState({
    funding: 0,
    profit: 0,
    bonus: 0,
    total: 0,
    activeBots: 0,
    totalTrades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('funding_balance, total_profit_usdt, bonus_usdt')
        .eq('user_id', user.id)
        .single();

      const { count: botCount } = await supabase
        .from('active_bots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Active');

      const { count: tradeCount } = await supabase
        .from('trade_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (balanceData) {
        const funding = balanceData.funding_balance || 0;
        const profit = balanceData.total_profit_usdt || 0;
        const bonus = balanceData.bonus_usdt || 0;
        
        setStats({
          funding: funding,
          profit: profit,
          bonus: bonus,
          total: funding + profit + bonus,
          activeBots: botCount || 0,
          totalTrades: tradeCount || 0
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-[400px] w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6 w-full max-w-full bg-[#0b0e14]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Portfolio Overview</h1>
          <p className="text-[#8e96a3] text-sm mt-1">Your current trading performance and stats.</p>
        </div>
        <div className="flex bg-[#141a24] p-1 rounded-xl border border-white/5 shadow-sm">
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0b0e14] border border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 24h
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#8e96a3] hover:text-white transition">7d</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#8e96a3] hover:text-white transition">1m</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-blue-500 text-white hover:opacity-90 transition ml-1 shadow-lg shadow-blue-500/20">View All</button>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        
        {/* 1. Total Balance */}
        <div className="relative bg-[#141a24] border border-white/5 rounded-xl p-6 w-full bg-gradient-to-br from-[#3b82f6]/5 to-transparent shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[#8e96a3] text-xs font-medium uppercase tracking-wider">Total Balance</span>
              <div className="text-2xl md:text-3xl font-bold flex items-baseline gap-1">
                <span className="text-white">{stats.total.toFixed(2)}</span>
                <span className="text-sm font-medium text-[#8e96a3]">USDT</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Wallet className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-white/5">
            <div className="flex justify-between items-center text-xs text-[#8e96a3]">
              <span>Available Funds:</span>
              <span className="text-white font-medium">{stats.funding.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center text-xs text-[#f97316]">
              <span className="flex items-center gap-1"><Gift size={12} /> Bonus Balance:</span>
              <span className="text-[#f97316] font-medium">+{stats.bonus.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* 2. Funding Balance */}
        <div className="relative bg-[#141a24] border border-white/5 rounded-xl p-6 w-full bg-gradient-to-br from-[#10b981]/5 to-transparent shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[#8e96a3] text-xs font-medium uppercase tracking-wider">Funding Balance</span>
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Banknote className="w-5 h-5 text-[#10b981]" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold flex items-baseline gap-1">
            <span className="text-white">{stats.funding.toFixed(2)}</span>
            <span className="text-sm font-medium text-[#8e96a3]">USDT</span>
          </div>
        </div>

        {/* 3. Total Profit */}
        <div className="relative bg-[#141a24] border border-white/5 rounded-xl p-6 w-full bg-gradient-to-br from-[#6366f1]/5 to-transparent shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[#8e96a3] text-xs font-medium uppercase tracking-wider">Total Profit</span>
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <TrendingUp className="w-5 h-5 text-[#6366f1]" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold flex items-baseline gap-1">
            <span className="text-[#10b981]">+{stats.profit.toFixed(2)}</span>
            <span className="text-sm font-medium text-[#8e96a3]">USDT</span>
          </div>
        </div>

        {/* 4. Active Bots */}
        <div className="relative bg-[#141a24] border border-white/5 rounded-xl p-6 w-full bg-gradient-to-br from-[#a855f7]/5 to-transparent shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[#8e96a3] text-xs font-medium uppercase tracking-wider">Active Bots</span>
            <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Bot className="w-5 h-5 text-[#a855f7]" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold flex items-baseline gap-1">
            <span className="text-white">{stats.activeBots}</span>
            <span className="text-sm font-medium text-[#8e96a3]">{stats.activeBots === 1 ? 'Bot' : 'Bots'}</span>
          </div>
        </div>

        {/* 5. Total Trades */}
        <div className="relative bg-[#141a24] border border-white/5 rounded-xl p-6 w-full bg-gradient-to-br from-[#f59e0b]/5 to-transparent shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[#8e96a3] text-xs font-medium uppercase tracking-wider">Total Trades</span>
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Activity className="w-5 h-5 text-[#f59e0b]" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold flex items-baseline gap-1">
            <span className="text-white">{stats.totalTrades}</span>
            <span className="text-sm font-medium text-[#8e96a3]">Executed</span>
          </div>
        </div>
      </div>

      {/* Middle Section (P&L + Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-[#141a24] border border-white/5 rounded-xl p-6 w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-white">Profit & Loss</h2>
              <p className="text-xs text-[#8e96a3]">Track your trading performance over time</p>
            </div>
            <div className="px-3 py-1 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg text-[#10b981] text-xs font-medium">
              {stats.profit.toFixed(2)} USDT
            </div>
          </div>
          <div className="h-[260px] w-full rounded-lg bg-[#0b0e14]/50 border border-white/5 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={stats.profit === 0 
                ? "M0,150 L1000,150" 
                : "M0,250 Q100,150 200,200 T400,100 T600,180 T800,50 L1000,100"
              } 
              fill={stats.profit === 0 ? "none" : "url(#blueGradient)"} 
              stroke="#3b82f6" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 text-[10px] text-[#8e96a3]">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 w-full flex flex-col shadow-sm">
          <h2 className="text-lg font-bold text-white mb-5">Quick Actions</h2>
          <div className="flex-1 space-y-3 w-full">
            
            {/* Deposit */}
            <button className="flex justify-between items-center w-full p-4 rounded-xl border transition-all duration-200 bg-[#0b0e14] border-white/5 hover:bg-white/5 hover:border-white/10">
              <div className="flex items-center gap-3">
                <Wallet2 className="w-5 h-5 text-[#8e96a3]" />
                <span className="text-sm font-medium text-white">Deposit USDT</span>
              </div>
              <span className="text-[#8e96a3] text-lg">↗</span>
            </button>
            
            {/* Withdraw */}
            <button className="flex justify-between items-center w-full p-4 rounded-xl border transition-all duration-200 bg-[#0b0e14] border-white/5 hover:bg-white/5 hover:border-white/10">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-[#8e96a3]" />
                <span className="text-sm font-medium text-white">Withdraw USDT</span>
              </div>
              <span className="text-[#8e96a3] text-lg">↗</span>
            </button>

            {/* Buy New Bot - LINKED TO BOT STORE */}
            <Link href="/dashboard/buy-bot">
              <button className="flex justify-between items-center w-full p-4 rounded-xl border transition-all duration-200 bg-[#0b0e14] border-white/5 hover:bg-white/5 hover:border-white/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-5 h-5 text-[#8e96a3]" />
                  <span className="text-sm font-medium text-white">Buy New Bot</span>
                </div>
                <span className="text-[#8e96a3] text-lg hover:translate-x-1 hover:-translate-y-1 transition-transform">↗</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Market Intelligence Footer */}
      <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 w-full shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <Newspaper className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-lg font-bold text-white">Market Intelligence</h2>
        </div>
        <div className="w-full h-[150px]">
          <TradingViewNewsWidget />
        </div>
      </div>
    </div>
  );
}