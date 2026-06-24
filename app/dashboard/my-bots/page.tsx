'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  Bot, TrendingUp, TrendingDown, DollarSign, 
  Calendar, AlertCircle, CheckCircle2,
  RefreshCw, Wallet, Copy, CheckCircle, Search, Trash2, Filter, ArrowUpDown
} from 'lucide-react';
import { sendTelegram, sendEmail } from '@/app/lib/notifications';

// Helper to get image based on bot name
const getBotImage = (name: string) => {
  const map: {[key: string]: string} = {
    'NOVA-1 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot1.jpeg',
    'NOVA-2 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot2.jpeg',
    'NOVA-3 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot3.jpeg',
    'NOVA-4 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot4.jpeg',
  };
  return map[name] || '/placeholder.png';
};

export default function MyBotsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const botsPerPage = 10;

  // Filters
  const [showExpired, setShowExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'profit_high' | 'profit_low'>('newest');

  useEffect(() => {
    async function fetchBots() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }

        const { data, error: fetchError } = await supabase
          .from('active_bots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setBots(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load your bots.');
      } finally {
        setLoading(false);
      }
    }
    fetchBots();
  }, [supabase, router]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleDeployBot = async (botId: string, botName: string, invested: number, licenseKey: string) => {
    if (!confirm(`Deploy ${botName} to the trading terminal?`)) return;
    
    setDeployingId(botId);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('active_bots')
        .update({ is_deployed: true })
        .eq('id', botId);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: userData } = await supabase
        .from('user_balances')
        .select('telegram_chat_id, email')
        .eq('user_id', user.id)
        .single();

      if (userData?.telegram_chat_id) {
        const tgMsg = `🚀 <b>BOT DEPLOYED</b>\n\n🤖 Bot: ${botName}\n💰 Investment: ${invested} USDT\n🔗 License Key: ${licenseKey}\n🟢 Status: Live Trading`;
        await sendTelegram(userData.telegram_chat_id, tgMsg);
      }

      if (userData?.email) {
        const emailHtml = `
          <div style="background-color: #0b0e14; padding: 40px; font-family: Arial, sans-serif; color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background: #141a24; border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.06);">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" style="height: 40px;" />
              </div>
              <h2 style="color: #6366f1; text-align: center;">🚀 Bot Deployed Successfully!</h2>
              <p style="color: #8e96a3; text-align: center;">Your AI bot is now live and ready to trade.</p>
              <div style="background: #0b0e14; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
                <p><strong>Bot:</strong> ${botName}</p>
                <p><strong>Investment:</strong> ${invested} USDT</p>
                <p><strong>License Key:</strong> ${licenseKey}</p>
                <p><strong>Status:</strong> <span style="color: #10b981;">Active</span></p>
              </div>
              <p style="color: #8e96a3; font-size: 12px; text-align: center;">SmartCodeNova Support</p>
            </div>
          </div>
        `;
        await sendEmail(userData.email, '🚀 Bot Deployed Successfully', emailHtml);
      }

      setBots(prev => prev.map(b => b.id === botId ? { ...b, is_deployed: true } : b));
      setDeployingId(null);
      alert('Bot deployed successfully! Check your Telegram/Email for confirmation.');
    } catch (err: any) {
      setError('Deployment failed: ' + err.message);
      setDeployingId(null);
    }
  };

  const handleDeleteExpired = async () => {
    if (!confirm('Are you sure you want to delete ALL expired bots? This action cannot be undone.')) return;
    
    const expiredBots = bots.filter(b => b.status === 'Expired');
    for (const bot of expiredBots) {
      await supabase.from('active_bots').delete().eq('id', bot.id);
    }
    setBots(prev => prev.filter(b => b.status !== 'Expired'));
    alert(`Deleted ${expiredBots.length} expired bot(s).`);
  };

  // Filter and sort bots
  const filteredBots = bots
    .filter(b => showExpired ? true : b.status !== 'Expired')
    .filter(b => b.bot_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch(sortBy) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'profit_high': return (b.profit_percent || 0) - (a.profit_percent || 0);
        case 'profit_low': return (a.profit_percent || 0) - (b.profit_percent || 0);
        default: return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredBots.length / botsPerPage);
  const currentBots = filteredBots.slice(
    (currentPage - 1) * botsPerPage,
    currentPage * botsPerPage
  );

  if (loading) return <div className="flex items-center justify-center h-[400px] w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div></div>;

  return (
    <div className="space-y-8 w-full max-w-full bg-[#0b0e14]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Bots</h1>
          <p className="text-[#8e96a3] text-sm mt-1">Manage your licenses and deploy your bots.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/buy-bot">
            <button className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <Bot size={16} /> Buy New Bot
            </button>
          </Link>
          {bots.filter(b => b.status === 'Expired').length > 0 && (
            <button 
              onClick={handleDeleteExpired}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete Expired
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-[#141a24] border border-white/5 rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search bots..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${showExpired ? 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/30' : 'bg-[#0b0e14] border border-white/5 text-[#8e96a3]'}`}
          >
            <Filter size={14} /> {showExpired ? 'Showing All' : 'Hide Expired'}
          </button>

          <div className="flex items-center gap-2 bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2">
            <ArrowUpDown size={14} className="text-[#8e96a3]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-sm text-white focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="profit_high">Highest Profit %</option>
              <option value="profit_low">Lowest Profit %</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {filteredBots.length === 0 && (
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-12 w-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-4 border border-[#6366f1]/20">
            <Bot className="w-10 h-10 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No bots found</h3>
          <p className="text-[#8e96a3] text-sm max-w-md mb-6">Visit the Bot Store to invest and activate your first bot.</p>
          <Link href="/dashboard/buy-bot"><button className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20">Browse Bot Store</button></Link>
        </div>
      )}

      {filteredBots.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {currentBots.map((bot, index) => {
              const profitPercent = bot.profit_percent || 0;
              const isProfitable = profitPercent >= 0;
              const daysActive = Math.floor((new Date().getTime() - new Date(bot.created_at).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <motion.div key={bot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-[#141a24] border border-white/5 rounded-2xl p-6 w-full hover:border-[#6366f1]/30 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={getBotImage(bot.bot_name)} alt={bot.bot_name} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{bot.bot_name}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#8e96a3]">
                          <Calendar size={12} /> {daysActive} days active
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${bot.status === 'Active' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {bot.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>}
                        {bot.status}
                      </span>
                      {bot.is_deployed && (
                        <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">✅ Deployed</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Invested</span>
                      <span className="text-white font-bold flex items-center gap-1"><Wallet size={14} className="text-[#8e96a3]" /> {bot.invested_usdt} USDT</span>
                    </div>
                    <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Current Value</span>
                      <span className="text-white font-bold flex items-center gap-1"><DollarSign size={14} className="text-[#8e96a3]" /> {bot.current_value_usdt} USDT</span>
                    </div>
                    <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Profit</span>
                      <span className={`font-bold flex items-center gap-1 ${isProfitable ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {profitPercent > 0 ? '+' : ''}{profitPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#0b0e14] p-3 rounded-xl border border-white/5 mb-4">
                    <span className="text-xs text-[#8e96a3] uppercase tracking-wider">License Key:</span>
                    <code className="flex-1 text-xs font-mono text-green-400 truncate">{bot.license_key}</code>
                    <button onClick={() => handleCopyKey(bot.license_key)} className="p-1 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition">
                      {copiedKey === bot.license_key ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDeployBot(bot.id, bot.bot_name, bot.invested_usdt, bot.license_key)}
                      disabled={bot.is_deployed || deployingId === bot.id}
                      className={`flex-1 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 ${bot.is_deployed ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 cursor-default' : deployingId === bot.id ? 'bg-[#6366f1]/50 text-white cursor-wait' : 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90'}`}
                    >
                      {deployingId === bot.id ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : bot.is_deployed ? (
                        '✅ Deployed'
                      ) : (
                        '🚀 Deploy Bot'
                      )}
                    </button>
                    <button className="flex-1 py-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-sm text-[#ef4444] hover:bg-[#ef4444]/20 transition flex items-center justify-center gap-2">
                      Stop Bot
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#141a24] rounded-lg border border-white/5 text-[#8e96a3] hover:text-white hover:bg-white/5 transition disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-[#8e96a3]">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#141a24] rounded-lg border border-white/5 text-[#8e96a3] hover:text-white hover:bg-white/5 transition disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}