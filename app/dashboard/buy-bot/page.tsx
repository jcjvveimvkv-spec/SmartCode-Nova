'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { 
  Wallet, TrendingUp, Calendar, Gift, 
  AlertCircle, CheckCircle, Zap, Award, Crown
} from 'lucide-react';

// Helper: Generate a unique 16-character License Key
function generateLicenseKey() {
  return 'SCN-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// UPDATED BOT PLANS WITH NEW PERCENTAGES
const botPlans = [
  { 
    id: 'nova-1', 
    name: 'NOVA-1 BOT', 
    min: 35, max: 500, 
    return: 5, duration: '2 DAYS', 
    bonus: 0, 
    icon: Zap,
    avatar: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-1.png'
  },
  { 
    id: 'nova-2', 
    name: 'NOVA-2 BOT', 
    min: 120, max: 1500, 
    return: 10, duration: '4 DAYS', 
    bonus: 0, 
    icon: TrendingUp,
    avatar: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-2.png'
  },
  { 
    id: 'nova-3', 
    name: 'NOVA-3 BOT', 
    min: 500, max: 5000, 
    return: 15, duration: '7 DAYS', 
    bonus: 100, 
    icon: Award,
    avatar: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-3.png'
  },
  { 
    id: 'nova-4', 
    name: 'NOVA-4 BOT', 
    min: 2000, max: 20000, 
    return: 30, duration: '2 WEEKS', 
    bonus: 200, 
    icon: Crown,
    avatar: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot-avatars/nova-4.png'
  }
];

export default function BotStorePage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [sliderValues, setSliderValues] = useState<{[key: string]: number}>({});

  useEffect(() => {
    async function fetchUserBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
      if (data) setFundingBalance(data.funding_balance || 0);
    }
    fetchUserBalance();
  }, [supabase, router]);

  // Set default slider to min value
  const getSliderValue = (bot: typeof botPlans[0]) => {
    return sliderValues[bot.id] || bot.min;
  };

  const handleSliderChange = (botId: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [botId]: value }));
  };

  const handleBuyBot = async (bot: typeof botPlans[0]) => {
    const investmentAmount = getSliderValue(bot);
    if (investmentAmount < bot.min || investmentAmount > bot.max) {
      setError(`Investment must be between ${bot.min} and ${bot.max} USDT.`);
      return;
    }

    setLoading(bot.id);
    setError(null); setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      if (fundingBalance < investmentAmount) {
        setError(`Insufficient funds. Need ${investmentAmount} USDT.`);
        setLoading(null); return;
      }

      // Deduct funds
      await supabase.from('user_balances').update({ funding_balance: fundingBalance - investmentAmount }).eq('user_id', user.id);

      // Insert bot with License Key
      const licenseKey = generateLicenseKey();
      await supabase.from('active_bots').insert({
        user_id: user.id,
        bot_name: bot.name,
        invested_usdt: investmentAmount, // Uses the slider value
        current_value_usdt: investmentAmount,
        profit_percent: bot.return,
        status: 'Active',
        license_key: licenseKey,
        is_deployed: false
      });

      // Apply Bonus if applicable
      if (bot.bonus > 0) {
        const { data: currentBonus } = await supabase.from('user_balances').select('bonus_usdt').eq('user_id', user.id).single();
        await supabase.from('user_balances').update({ bonus_usdt: (currentBonus?.bonus_usdt || 0) + bot.bonus }).eq('user_id', user.id);
      }

      setFundingBalance(fundingBalance - investmentAmount);
      setSuccess(`Bot activated! License Key: ${licenseKey}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-full bg-[#0b0e14] text-white p-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SmartCode Nova Investment Plans</h1>
          <p className="text-[#8e96a3] text-sm">Slide to invest, deploy your AI bot instantly.</p>
        </div>
        <div className="px-4 py-2 bg-[#141a24] rounded-xl border border-white/5 text-sm flex items-center gap-2">
          <Wallet size={16} className="text-blue-400" /> Balance: <span className="text-white font-bold">{fundingBalance.toFixed(2)} USDT</span>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3"><CheckCircle size={20} /> {success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {botPlans.map((bot) => {
          const investment = getSliderValue(bot);
          const expectedReturn = (investment * (bot.return / 100)).toFixed(2);

          return (
            <motion.div key={bot.id} className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
              
              {/* Header with Avatar */}
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 flex items-center gap-4 border-b border-white/5">
                <img src={bot.avatar} alt={bot.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{bot.name}</h2>
                  <p className="text-sm text-[#8e96a3]">{bot.return}% Return • {bot.duration}</p>
                </div>
                {bot.bonus > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-[#141a24]">
                    BONUS +{bot.bonus} USDT
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 p-6 bg-white/5 border-b border-white/5">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Min</p>
                  <p className="font-bold text-lg">{bot.min} <span className="text-xs font-normal text-[#8e96a3]">USDT</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Max</p>
                  <p className="font-bold text-lg">{bot.max} <span className="text-xs font-normal text-[#8e96a3]">USDT</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Return</p>
                  <p className="font-bold text-lg text-green-400">{bot.return}%</p>
                </div>
              </div>

              {/* Slider Section */}
              <div className="p-6 bg-[#0b0e14]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-[#8e96a3]">Investment Amount</span>
                  <span className="text-xl font-bold text-blue-400">{investment} USDT</span>
                </div>
                
                <input 
                  type="range" 
                  min={bot.min} 
                  max={bot.max} 
                  step={1}
                  value={investment}
                  onChange={(e) => handleSliderChange(bot.id, Number(e.target.value))}
                  className="w-full h-2 bg-[#141a24] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                
                <div className="flex justify-between text-xs text-[#8e96a3] mt-2">
                  <span>{bot.min} USDT</span>
                  <span className="text-green-400">Expected Profit: +{expectedReturn} USDT</span>
                  <span>{bot.max} USDT</span>
                </div>

                <button 
                  onClick={() => handleBuyBot(bot)} 
                  disabled={loading === bot.id}
                  className="w-full mt-6 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading === bot.id ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto"></span> : `Activate Bot (${investment} USDT)`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}