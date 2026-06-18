'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  Bot, TrendingUp, TrendingDown, DollarSign, 
  Calendar, ArrowRight, AlertCircle, CheckCircle2,
  RefreshCw, Wallet, Copy, CheckCircle
} from 'lucide-react';

// Helper to get avatar URL based on bot name
const getBotAvatar = (name: string) => {
  const map: {[key: string]: string} = {
    'NOVA-1 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-1.png',
    'NOVA-2 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-2.png',
    'NOVA-3 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-3.png',
    'NOVA-4 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-4.png',
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

  const handleDeployBot = async (botId: string) => {
    if (!confirm('Deploy this bot to the trading terminal?')) return;
    const { error } = await supabase.from('active_bots').update({ is_deployed: true }).eq('id', botId);
    if (!error) {
      setBots(prev => prev.map(b => b.id === botId ? { ...b, is_deployed: true } : b));
    } else {
      alert('Error deploying bot: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[400px] w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div></div>;
  }

  return (
    <div className="space-y-6 w-full max-w-full bg-[#0b0e14]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Active Bots</h1>
          <p className="text-[#8e96a3] text-sm mt-1">Manage your licenses and deploy your bots.</p>
        </div>
        <Link href="/dashboard/buy-bot">
          <button className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Bot size={16} /> Buy New Bot
          </button>
        </Link>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {!error && bots.length === 0 && (
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-12 w-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-4 border border-[#6366f1]/20">
            <Bot className="w-10 h-10 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active bots found</h3>
          <p className="text-[#8e96a3] text-sm max-w-md mb-6">Visit the Bot Store to invest and activate your first bot.</p>
          <Link href="/dashboard/buy-bot"><button className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20">Browse Bot Store</button></Link>
        </div>
      )}

      {!error && bots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {bots.map((bot, index) => {
            const profitPercent = bot.profit_percent || 0;
            const isProfitable = profitPercent >= 0;
            const daysActive = Math.floor((new Date().getTime() - new Date(bot.created_at).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div key={bot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-[#141a24] border border-white/5 rounded-2xl p-6 w-full hover:border-[#6366f1]/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={getBotAvatar(bot.bot_name)} alt={bot.bot_name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{bot.bot_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3]">
                        <Calendar size={12} /> {daysActive} days active
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${bot.status === 'Active' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-[#8e96a3]/10 text-[#8e96a3] border border-[#8e96a3]/20'}`}>
                      {bot.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>}
                      {bot.status}
                    </span>
                    {bot.is_deployed && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">✅ Deployed</span>
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

                {/* License Key Section */}
                <div className="flex items-center gap-2 bg-[#0b0e14] p-3 rounded-xl border border-white/5 mb-4">
                  <span className="text-xs text-[#8e96a3] uppercase tracking-wider">License Key:</span>
                  <code className="flex-1 text-xs font-mono text-green-400 truncate">{bot.license_key}</code>
                  <button onClick={() => handleCopyKey(bot.license_key)} className="p-1 hover:bg-white/5 rounded text-[#8e96a3] hover:text-white transition">
                    {copiedKey === bot.license_key ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleDeployBot(bot.id)} disabled={bot.is_deployed} className={`flex-1 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 ${bot.is_deployed ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 cursor-default' : 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90'}`}>
                    {bot.is_deployed ? '✅ Deployed' : '🚀 Deploy Bot'}
                  </button>
                  <button className="flex-1 py-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-sm text-[#ef4444] hover:bg-[#ef4444]/20 transition flex items-center justify-center gap-2">
                    Stop Bot
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}