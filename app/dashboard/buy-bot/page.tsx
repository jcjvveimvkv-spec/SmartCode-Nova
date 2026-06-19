'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, Calendar, Gift, 
  AlertCircle, CheckCircle, Zap, Award, Crown,
  Download, X, History, ArrowRight
} from 'lucide-react';

// Helper: Generate a unique 16-character License Key
function generateLicenseKey() {
  return 'SCN-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + 
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Helper: Generate Receipt Number
function generateReceiptNumber() {
  return '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const botPlans = [
  { 
    id: 'nova-1', 
    name: 'NOVA-1 BOT', 
    min: 35, max: 500, 
    return: 5, duration: '2 DAYS', 
    bonus: 0, 
    icon: Zap,
    image: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot1.jpeg'
  },
  { 
    id: 'nova-2', 
    name: 'NOVA-2 BOT', 
    min: 120, max: 1500, 
    return: 10, duration: '4 DAYS', 
    bonus: 0, 
    icon: TrendingUp,
    image: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot2.jpeg'
  },
  { 
    id: 'nova-3', 
    name: 'NOVA-3 BOT', 
    min: 500, max: 5000, 
    return: 15, duration: '7 DAYS', 
    bonus: 100, 
    icon: Award,
    image: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot3.jpeg'
  },
  { 
    id: 'nova-4', 
    name: 'NOVA-4 BOT', 
    min: 2000, max: 20000, 
    return: 30, duration: '2 WEEKS', 
    bonus: 200, 
    icon: Crown,
    image: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot4.jpeg'
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
  const [fundingBalance, setFundingBalance] = useState(0);
  const [sliderValues, setSliderValues] = useState<{[key: string]: number}>({});
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Fetch Balance
      const { data: bal } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
      if (bal) setFundingBalance(bal.funding_balance || 0);

      // Fetch ALL Purchase History (We will limit to 5 in the JSX)
      const { data: history } = await supabase
        .from('active_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setPurchaseHistory(history || []);
    }
    fetchUserData();
  }, [supabase, router]);

  const getSliderValue = (bot: typeof botPlans[0]) => sliderValues[bot.id] || bot.min;

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
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      if (fundingBalance < investmentAmount) {
        setError(`Insufficient funds. Need ${investmentAmount} USDT.`);
        setLoading(null); return;
      }

      // 1. Deduct funds
      await supabase.from('user_balances').update({ funding_balance: fundingBalance - investmentAmount }).eq('user_id', user.id);

      // 2. Generate License Key
      const licenseKey = generateLicenseKey();
      
      // 3. Insert bot into database
      const { data: newBot, error: insertError } = await supabase
        .from('active_bots')
        .insert({
          user_id: user.id,
          bot_name: bot.name,
          invested_usdt: investmentAmount,
          current_value_usdt: investmentAmount,
          profit_percent: bot.return,
          status: 'Active',
          license_key: licenseKey,
          is_deployed: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Apply Bonus if applicable
      if (bot.bonus > 0) {
        const { data: currentBonus } = await supabase.from('user_balances').select('bonus_usdt').eq('user_id', user.id).single();
        await supabase.from('user_balances').update({ bonus_usdt: (currentBonus?.bonus_usdt || 0) + bot.bonus }).eq('user_id', user.id);
      }

      // 5. Generate Receipt Data
      const receiptData = {
        receiptNumber: generateReceiptNumber(),
        product: bot.name,
        investmentAmount: investmentAmount,
        licenseKey: licenseKey,
        botImage: bot.image,
        date: new Date().toLocaleString(),
        status: 'Active'
      };

      // 6. Update local state
      setFundingBalance(fundingBalance - investmentAmount);
      setPurchaseHistory(prev => [newBot, ...prev]); // Prepend the real database row

      // 7. Show the Modal
      setReceipt(receiptData);
      setIsReceiptOpen(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const closeModal = () => {
    setIsReceiptOpen(false);
    setReceipt(null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {botPlans.map((bot) => {
          const investment = getSliderValue(bot);
          const expectedReturn = (investment * (bot.return / 100)).toFixed(2);

          return (
            <motion.div key={bot.id} className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
              
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 flex items-center gap-4 border-b border-white/5">
                <img src={bot.image} alt={bot.name} className="w-20 h-20 rounded-xl object-cover border-2 border-blue-500/30" />
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

              <div className="grid grid-cols-3 gap-2 p-6 bg-white/5 border-b border-white/5">
                <div className="text-center"><p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Min</p><p className="font-bold text-lg">{bot.min} <span className="text-xs font-normal text-[#8e96a3]">USDT</span></p></div>
                <div className="text-center"><p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Max</p><p className="font-bold text-lg">{bot.max} <span className="text-xs font-normal text-[#8e96a3]">USDT</span></p></div>
                <div className="text-center"><p className="text-[10px] uppercase text-[#8e96a3] tracking-wider">Return</p><p className="font-bold text-lg text-green-400">{bot.return}%</p></div>
              </div>

              <div className="p-6 bg-[#0b0e14]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-[#8e96a3]">Investment Amount</span>
                  <span className="text-xl font-bold text-blue-400">{investment} USDT</span>
                </div>
                
                <input 
                  type="range" 
                  min={bot.min} max={bot.max} step={1}
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

      {/* --- RECEIPT MODAL --- */}
      <AnimatePresence>
        {isReceiptOpen && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 text-center relative">
                <button onClick={closeModal} className="absolute right-4 top-4 text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/30">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Purchase Successful!</h2>
                <p className="text-[#8e96a3] text-sm">Your bot has been activated successfully.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-6 relative">
                  <div className="flex items-center justify-center gap-2 mb-4 border-b border-white/5 pb-4">
                    <img 
                      src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" 
                      alt="Logo" 
                      className="h-6 w-auto"
                    />
                    <span className="text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                      SmartCodeNova
                    </span>
                  </div>

                  <div className="font-mono text-[#8e96a3] text-xs text-center mb-4">
                    Receipt #{receipt.receiptNumber}
                  </div>

                  <div className="flex gap-4 mb-4">
                    <img src={receipt.botImage} alt="Bot" className="w-16 h-16 rounded-lg object-cover border border-white/5" />
                    <div className="flex-1">
                      <p className="text-lg font-bold text-white">{receipt.product}</p>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3]">
                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                          {receipt.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8e96a3]">Investment Amount</span>
                      <span className="font-bold text-blue-400">{receipt.investmentAmount} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8e96a3]">License Key</span>
                      <span className="font-mono text-[#f59e0b] text-xs">{receipt.licenseKey}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8e96a3]">Date</span>
                      <span className="text-[#8e96a3] text-xs">{receipt.date}</span>
                    </div>
                  </div>

                  <div className="text-center border-t border-white/5 pt-4">
                    <p className="text-[10px] text-[#8e96a3] font-mono tracking-widest">
                      Thank you for choosing SmartCodeNova
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handlePrintReceipt}
                    className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download Receipt
                  </button>
                  <button 
                    onClick={closeModal}
                    className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PURCHASE HISTORY SECTION --- */}
      <div className="mt-12 border-t border-white/5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-[#6366f1]" />
            <h2 className="text-xl font-bold text-white">Recent Purchases</h2>
            <span className="text-xs text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">Last 5</span>
          </div>
          <Link href="/dashboard/purchase-history">
            <button className="flex items-center gap-1 text-sm text-[#6366f1] hover:text-[#3b82f6] transition">
              View More <ArrowRight size={16} />
            </button>
          </Link>
        </div>
        
        {/* Show the FIRST 5 items from purchaseHistory */}
        {purchaseHistory.length === 0 ? (
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-8 text-center text-[#8e96a3]">
            You haven't made any purchases yet.
          </div>
        ) : (
          <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-6 py-3">Bot</th>
                  <th className="px-6 py-3">Investment</th>
                  <th className="px-6 py-3">License Key</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.slice(0, 5).map((item, idx) => {
                  const image = botPlans.find(b => b.name === item.bot_name)?.image || '';
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-3 flex items-center gap-2">
                        {image && <img src={image} alt={item.bot_name} className="w-8 h-8 rounded object-cover" />}
                        <span className="font-medium">{item.bot_name}</span>
                      </td>
                      <td className="px-6 py-3 font-bold text-green-400">{item.invested_usdt} USDT</td>
                      <td className="px-6 py-3 font-mono text-[#f59e0b] text-xs">{item.license_key}</td>
                      <td className="px-6 py-3 text-[#8e96a3] text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}