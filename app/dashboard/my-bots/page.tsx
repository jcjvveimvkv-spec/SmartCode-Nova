'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  Bot, TrendingUp, TrendingDown, DollarSign, 
  Calendar, ArrowRight, AlertCircle, CheckCircle2,
  RefreshCw, Wallet
} from 'lucide-react';

export default function MyBotsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBots() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch their active bots
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div>
          <p className="text-[#8e96a3] text-sm">Loading your active bots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full bg-[#0b0e14]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Active Bots</h1>
          <p className="text-[#8e96a3] text-sm mt-1">Monitor and manage your automated trading bots.</p>
        </div>
        <Link href="/dashboard/buy-bot">
          <button className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Bot size={16} /> Buy New Bot
          </button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!error && bots.length === 0 && (
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-12 w-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-4 border border-[#6366f1]/20">
            <Bot className="w-10 h-10 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active bots found</h3>
          <p className="text-[#8e96a3] text-sm max-w-md mb-6">
            You haven't purchased any trading bots yet. Visit the Bot Store to choose a plan and start generating profits automatically.
          </p>
          <Link href="/dashboard/buy-bot">
            <button className="px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20">
              Browse Bot Store
            </button>
          </Link>
        </div>
      )}

      {/* Bot Grid */}
      {!error && bots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {bots.map((bot, index) => {
            const profitPercent = bot.profit_percent || 0;
            const isProfitable = profitPercent >= 0;
            const daysActive = Math.floor(
              (new Date().getTime() - new Date(bot.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#141a24] border border-white/5 rounded-2xl p-6 w-full hover:border-[#6366f1]/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isProfitable ? 'from-[#10b981]/20 to-[#10b981]/5' : 'from-[#ef4444]/20 to-[#ef4444]/5'} flex items-center justify-center border ${isProfitable ? 'border-[#10b981]/20' : 'border-[#ef4444]/20'}`}>
                      <Bot className={`w-6 h-6 ${isProfitable ? 'text-[#10b981]' : 'text-[#ef4444]'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{bot.bot_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3]">
                        <Calendar size={12} /> {daysActive} days active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${bot.status === 'Active' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-[#8e96a3]/10 text-[#8e96a3] border border-[#8e96a3]/20'}`}>
                      {bot.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>}
                      {bot.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Invested</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <Wallet size={14} className="text-[#8e96a3]" /> {bot.invested_usdt} USDT
                    </span>
                  </div>
                  <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Current Value</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <DollarSign size={14} className="text-[#8e96a3]" /> {bot.current_value_usdt} USDT
                    </span>
                  </div>
                  <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Profit</span>
                    <span className={`font-bold flex items-center gap-1 ${isProfitable ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {profitPercent > 0 ? '+' : ''}{profitPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-[#8e96a3] hover:text-white hover:border-[#6366f1]/40 transition flex items-center justify-center gap-2">
                    <RefreshCw size={14} /> Refresh Stats
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