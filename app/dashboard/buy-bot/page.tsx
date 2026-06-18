'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { 
  Wallet, TrendingUp, Calendar, Gift, 
  ArrowRight, CheckCircle, AlertCircle,
  Rocket, Zap, Award, Crown
} from 'lucide-react';

// The 4 Official Bots based on your investment plans
const botPlans = [
  {
    id: 'nova-1',
    name: 'NOVA-1 BOT',
    min: 35,
    max: 500,
    return: 3,
    duration: '2 Days',
    price: 35, // Starting price
    bonus: 0,
    color: 'from-red-600 to-red-800',
    icon: Zap,
    description: 'Perfect for beginners. Low risk, steady returns.'
  },
  {
    id: 'nova-2',
    name: 'NOVA-2 BOT',
    min: 120,
    max: 1500,
    return: 5,
    duration: '4 Days',
    price: 120,
    bonus: 0,
    color: 'from-blue-600 to-blue-800',
    icon: TrendingUp,
    description: 'Balanced growth strategy for intermediate traders.'
  },
  {
    id: 'nova-3',
    name: 'NOVA-3 BOT',
    min: 500,
    max: 5000,
    return: 10,
    duration: '7 Days',
    price: 500,
    bonus: 100,
    color: 'from-red-600 to-red-800',
    icon: Award,
    description: 'High yield strategy with a welcome bonus!'
  },
  {
    id: 'nova-4',
    name: 'NOVA-4 BOT',
    min: 2000,
    max: 20000,
    return: 20,
    duration: '2 Weeks',
    price: 2000,
    bonus: 200,
    color: 'from-blue-600 to-blue-800',
    icon: Crown,
    description: 'Premium plan for maximum profit potential.'
  }
];

export default function BotStorePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBuyBot = async (bot: typeof botPlans[0]) => {
    setLoading(bot.id);
    setError(null);
    setSuccess(null);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 2. Check if user already owns this specific bot
      const { data: existingBot, error: checkError } = await supabase
        .from('active_bots')
        .select('id')
        .eq('user_id', user.id)
        .eq('bot_name', bot.name)
        .eq('status', 'Active')
        .maybeSingle();

      if (checkError) throw new Error('Error checking bot ownership.');
      if (existingBot) {
        setError(`You already own the ${bot.name}!`);
        setLoading(null);
        return;
      }

      // 3. Check if user has enough Funding Balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('funding_balance')
        .eq('user_id', user.id)
        .single();

      if (balanceError) throw new Error('Could not fetch your balance.');
      
      const fundingBalance = balanceData?.funding_balance || 0;
      if (fundingBalance < bot.price) {
        setError(`Insufficient funds. You need ${bot.price} USDT.`);
        setLoading(null);
        return;
      }

      // 4. Deduct the price from Funding Balance
      const { error: deductError } = await supabase
        .from('user_balances')
        .update({ funding_balance: fundingBalance - bot.price })
        .eq('user_id', user.id);

      if (deductError) throw new Error('Failed to process payment.');

      // 5. Add the bot to Active Bots table
      const { error: insertError } = await supabase
        .from('active_bots')
        .insert({
          user_id: user.id,
          bot_name: bot.name,
          invested_usdt: bot.price,
          current_value_usdt: bot.price, // Starts at invested amount
          profit_percent: 0, // Starts at 0%
          status: 'Active'
        });

      if (insertError) throw new Error('Failed to activate your bot.');

      // 6. Add Bonus if applicable
      if (bot.bonus > 0) {
        const { data: currentBonus } = await supabase
          .from('user_balances')
          .select('bonus_usdt')
          .eq('user_id', user.id)
          .single();

        const newBonus = (currentBonus?.bonus_usdt || 0) + bot.bonus;
        await supabase
          .from('user_balances')
          .update({ bonus_usdt: newBonus })
          .eq('user_id', user.id);
      }

      setSuccess(`Successfully activated ${bot.name}! Bonus applied: +${bot.bonus} USDT`);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-full bg-[#0b0e14]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">AI Bot Store</h1>
          <p className="text-[#8e96a3] text-sm mt-1">Choose your trading bot and start generating profits automatically.</p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {botPlans.map((bot, index) => (
          <motion.div
            key={bot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-[#141a24] border border-white/5 rounded-2xl p-6 w-full overflow-hidden shadow-sm hover:border-[#6366f1]/40 transition-all duration-300`}
          >
            {/* Bonus Badge */}
            {bot.bonus > 0 && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg shadow-orange-500/20">
                <Gift size={14} /> +{bot.bonus} USDT
              </div>
            )}

            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bot.color} flex items-center justify-center shadow-lg shadow-${bot.color.split('-')[1]}-500/20`}>
                <bot.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{bot.name}</h3>
                <p className="text-[#8e96a3] text-sm">{bot.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Investment</span>
                <span className="text-white font-bold">{bot.min} - {bot.max} USDT</span>
              </div>
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Return</span>
                <span className="text-[#10b981] font-bold">{bot.return}%</span>
              </div>
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Duration</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <Calendar size={14} className="text-[#8e96a3]" /> {bot.duration}
                </span>
              </div>
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase text-[#8e96a3] tracking-wider block mb-1">Price</span>
                <span className="text-[#f59e0b] font-bold">{bot.price} USDT</span>
              </div>
            </div>

            <button
              onClick={() => handleBuyBot(bot)}
              disabled={loading === bot.id}
              className={`
                w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${loading === bot.id 
                  ? 'bg-[#2a2a4a] text-[#8e96a3] cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/20'
                }
              `}
            >
              {loading === bot.id ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Processing...
                </>
              ) : (
                <>
                  Buy Bot <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}