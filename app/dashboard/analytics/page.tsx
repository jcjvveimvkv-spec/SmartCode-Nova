'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  AreaChart, Area 
} from 'recharts';
import { 
  Wallet, TrendingUp, Gift, ArrowRight, 
  Calendar, Clock, ShieldAlert 
} from 'lucide-react';
import AINewsTicker from '@/app/components/AINewsTicker'; // <-- NEW IMPORT

const COLORS = ['#3b82f6', '#10b981', '#f97316']; // Blue, Green, Orange

export default function AnalyticsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({ funding: 0, profit: 0, bonus: 0, total: 0 });
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [last5Trades, setLast5Trades] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // 1. Fetch Balances
      const { data: bal } = await supabase
        .from('user_balances')
        .select('funding_balance, total_profit_usdt, bonus_usdt')
        .eq('user_id', user.id)
        .single();

      if (bal) {
        setBalanceData({
          funding: bal.funding_balance || 0,
          profit: bal.total_profit_usdt || 0,
          bonus: bal.bonus_usdt || 0,
          total: (bal.funding_balance || 0) + (bal.total_profit_usdt || 0) + (bal.bonus_usdt || 0)
        });
      }

      // 2. Fetch ALL Trade Logs
      const { data: logs } = await supabase
        .from('bot_trade_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false });

      setTradeLogs(logs || []);
      setLast5Trades((logs || []).slice(0, 5));

      setLoading(false);
    }
    fetchAnalytics();
  }, [supabase, router]);

  // Data for the Daily Bar Chart (Last 7 Days)
  const dailyProfitData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      const dayTrades = tradeLogs.filter(t => 
        new Date(t.executed_at).getDay() === dayIndex
      );
      const total = dayTrades.reduce((sum, t) => sum + (t.profit_usdt || 0), 0);
      data.push({ name: days[dayIndex], profit: total });
    }
    return data;
  };

  // Data for the Cumulative Area Chart (P&L over time)
  const cumulativeProfitData = () => {
    const sorted = [...tradeLogs].sort((a, b) => 
      new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
    );
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += t.profit_usdt || 0;
      return { name: new Date(t.executed_at).toLocaleDateString(), profit: cumulative };
    });
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading analytics...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Trading Analytics</h1>
          <p className="text-[#8e96a3] text-sm">Visual insights into your bot's performance and earnings.</p>
        </div>
        <Link href="/dashboard/transactions">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition">
            View Full History <ArrowRight size={16} />
          </button>
        </Link>
      </div>

      {/* --- NEW: AI News Ticker --- */}
      <AINewsTicker />

      {/* 3 Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Donut Chart (Balance Breakdown) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Wallet className="text-blue-400 w-5 h-5" />
            <h3 className="font-bold text-white">Balance Breakdown</h3>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Funding', value: balanceData.funding },
                    { name: 'Profit', value: balanceData.profit },
                    { name: 'Bonus', value: balanceData.bonus }
                  ]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                >
                  {balanceData.funding > 0 && <Cell fill="#3b82f6" />}
                  {balanceData.profit > 0 && <Cell fill="#10b981" />}
                  {balanceData.bonus > 0 && <Cell fill="#f97316" />}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151530', border: '1px solid #2a2a50', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Funding</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Profit</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Bonus</span>
          </div>
        </motion.div>

        {/* 2. Bar Chart (Daily Profit) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Calendar className="text-yellow-400 w-5 h-5" />
            <h3 className="font-bold text-white">Daily Profit (Last 7 Days)</h3>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProfitData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a40" />
                <XAxis dataKey="name" stroke="#4a4a6a" tick={{fill: '#6a6a8a', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#4a4a6a" tick={{fill: '#6a6a8a', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151530', border: '1px solid #2a2a50', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3. Area Chart (Cumulative P&L) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <TrendingUp className="text-green-400 w-5 h-5" />
            <h3 className="font-bold text-white">Cumulative P&L</h3>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeProfitData()}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a40" />
                <XAxis dataKey="name" stroke="#4a4a6a" tick={{fill: '#6a6a8a', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#4a4a6a" tick={{fill: '#6a6a8a', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151530', border: '1px solid #2a2a50', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Last 5 Trades + View More */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
      >
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-[#6366f1]" /> Recent Trades
          </h3>
          <Link href="/dashboard/transactions">
            <button className="text-sm text-[#6366f1] hover:text-[#3b82f6] transition flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Pair</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {last5Trades.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[#8e96a3]">No trades recorded yet.</td></tr>
              ) : (
                last5Trades.map((trade, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-2 text-[#8e96a3] text-xs">{new Date(trade.executed_at).toLocaleTimeString()}</td>
                    <td className="px-4 py-2 font-mono">{trade.pair}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className={`px-4 py-2 font-bold ${trade.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit_usdt >= 0 ? '+' : ''}{trade.profit_usdt.toFixed(2)} USDT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}