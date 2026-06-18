'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Users, Bot, Wallet, TrendingUp, Calendar, 
  PlusCircle, Trash2, XCircle, RefreshCw
} from 'lucide-react';

// !! CHANGE THIS TO YOUR ADMIN EMAIL !!
const ADMIN_EMAIL = 'admin@smartcodenova.com'; 

export default function AdminPanel() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  // Form States
  const [newBot, setNewBot] = useState({
    userId: '',
    botName: '',
    invested: '',
    duration: '2 Days',
    profitPercent: '3'
  });

  // 1. Check Admin Access & Fetch Data
  useEffect(() => {
    async function checkAdminAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Security Check: Is this the admin?
      if (user.email !== ADMIN_EMAIL) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
      setLoading(false);
    }
    checkAdminAndFetch();
  }, [supabase, router]);

  async function fetchAllData() {
    // 1. Fetch Users from user_balances (using your exact column names)
    console.log('🔄 Fetching users...');
    const { data: usersData, error: usersError } = await supabase
      .from('user_balances')
      .select('*, user:user_id(*)');

    if (usersError) {
      console.error('❌ User Fetch Error:', usersError);
    } else {
      console.log('✅ Users Data Found:', usersData);
      setUsers(usersData || []);
    }

    // 2. Fetch Active Bots
    console.log('🔄 Fetching bots...');
    const { data: botsData, error: botsError } = await supabase
      .from('active_bots')
      .select('*, user:user_id(*)');
    
    if (botsError) {
      console.error('❌ Bot Fetch Error:', botsError);
    } else {
      console.log('✅ Bots Data Found:', botsData);
      setBots(botsData || []);
    }

    // 3. Fetch Recent Trade Logs
    console.log('🔄 Fetching trades...');
    const { data: tradesData, error: tradesError } = await supabase
      .from('bot_trade_logs')
      .select('*, user:user_id(*)')
      .order('executed_at', { ascending: false })
      .limit(20);
      
    if (tradesError) {
      console.error('❌ Trades Fetch Error:', tradesError);
    } else {
      console.log('✅ Trades Data Found:', tradesData);
      setTrades(tradesData || []);
    }
  }

  // 2. Handle Creating a Manual Bot
  async function handleCreateBot(e: React.FormEvent) {
    e.preventDefault();
    if (!newBot.userId || !newBot.botName || !newBot.invested) return;

    const invested = parseFloat(newBot.invested);
    const profit = parseFloat(newBot.profitPercent);

    const { error } = await supabase.from('active_bots').insert({
      user_id: newBot.userId,
      bot_name: newBot.botName,
      invested_usdt: invested,
      current_value_usdt: invested,
      profit_percent: profit,
      status: 'Active'
    });

    if (!error) {
      alert('✅ Bot created successfully!');
      setNewBot({ userId: '', botName: '', invested: '', duration: '2 Days', profitPercent: '3' });
      fetchAllData();
    } else {
      alert('❌ Error: ' + error.message);
    }
  }

  // 3. Handle Deleting a Bot
  async function handleDeleteBot(botId: string) {
    if (!confirm('Are you sure you want to delete this bot?')) return;
    const { error } = await supabase.from('active_bots').delete().eq('id', botId);
    if (!error) {
      fetchAllData();
    } else {
      alert('Error deleting bot: ' + error.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white">Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white flex-col gap-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-[#8e96a3]">You are not authorized to view this page.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-[#6366f1] rounded-lg text-white font-medium">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-[#8e96a3] text-sm">Manage users, bots, and monitor the platform.</p>
          </div>
          <button 
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-[#141a24] p-1 rounded-xl border border-white/5 w-fit">
          {['users', 'bots', 'trades'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-[#6366f1] text-white' : 'text-[#8e96a3] hover:text-white'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Funding Balance</th>
                  <th className="px-6 py-3">Total Profit</th>
                  <th className="px-6 py-3">Bonus</th>
                  <th className="px-6 py-3">Total (Sum)</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                        {u.user?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{u.user?.email || 'Unknown User'}</p>
                        <p className="text-xs text-[#8e96a3]">ID: {u.user_id?.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono">{u.funding_balance?.toFixed(2) || '0.00'} USDT</td>
                    <td className="px-6 py-3 font-mono text-green-400">+{u.total_profit_usdt?.toFixed(2) || '0.00'} USDT</td>
                    <td className="px-6 py-3 font-mono text-orange-400">+{u.bonus_usdt?.toFixed(2) || '0.00'} USDT</td>
                    <td className="px-6 py-3 font-mono text-white font-bold">
                      {( (u.funding_balance || 0) + (u.total_profit_usdt || 0) + (u.bonus_usdt || 0) ).toFixed(2)} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- BOTS TAB --- */}
        {activeTab === 'bots' && (
          <div className="space-y-6">
            
            {/* Create Bot Form */}
            <div className="bg-[#141a24] border border-white/5 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} /> Manually Add Bot</h2>
              <form onSubmit={handleCreateBot} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select 
                  value={newBot.userId} 
                  onChange={(e) => setNewBot({...newBot, userId: e.target.value})}
                  className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => <option key={u.id} value={u.user_id}>{u.user?.email}</option>)}
                </select>
                <input 
                  placeholder="Bot Name (e.g. Nova-1)" 
                  value={newBot.botName} 
                  onChange={(e) => setNewBot({...newBot, botName: e.target.value})}
                  className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Invested USDT" 
                  value={newBot.invested} 
                  onChange={(e) => setNewBot({...newBot, invested: e.target.value})}
                  className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Profit %" 
                  value={newBot.profitPercent} 
                  onChange={(e) => setNewBot({...newBot, profitPercent: e.target.value})}
                  className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white"
                  required
                />
                <button type="submit" className="bg-[#6366f1] text-white rounded-lg px-4 py-2 font-medium hover:opacity-90 transition">
                  Create Bot
                </button>
              </form>
            </div>

            {/* Active Bots List */}
            <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                  <tr>
                    <th className="px-6 py-3">Bot Name</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3">Invested</th>
                    <th className="px-6 py-3">Current Value</th>
                    <th className="px-6 py-3">Profit %</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((b) => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-3 font-medium">{b.bot_name}</td>
                      <td className="px-6 py-3 text-[#8e96a3]">{b.user?.email?.slice(0, 20)}...</td>
                      <td className="px-6 py-3 font-mono">{b.invested_usdt?.toFixed(2)} USDT</td>
                      <td className="px-6 py-3 font-mono">{b.current_value_usdt?.toFixed(2)} USDT</td>
                      <td className={`px-6 py-3 font-mono ${b.profit_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {b.profit_percent >= 0 ? '+' : ''}{b.profit_percent}%
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => handleDeleteBot(b.id)} className="text-red-400 hover:text-red-300 transition">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TRADES TAB --- */}
        {activeTab === 'trades' && (
          <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Bot</th>
                  <th className="px-6 py-3">Pair</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Profit %</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3">{t.user?.email?.slice(0, 15)}...</td>
                    <td className="px-6 py-3 font-medium">{t.bot_id?.slice(0, 8)}</td>
                    <td className="px-6 py-3 font-mono">{t.pair}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${t.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.action}
                      </span>
                    </td>
                    <td className={`px-6 py-3 font-mono ${t.profit_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.profit_percent >= 0 ? '+' : ''}{t.profit_percent}%
                    </td>
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">
                      {new Date(t.executed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}