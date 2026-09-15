'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, Calendar, Gift,
  AlertCircle, CheckCircle, Zap, Award, Crown,
  Download, X, ChevronLeft, ChevronRight, History, ArrowRight,
  Minus, Plus
} from 'lucide-react';

// ---------- Helpers ----------
function generateLicenseKey(prefix: string = 'SCN') {
  return prefix + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
         '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}
function generateReceiptNumber() {
  return '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Adaptive step size for the +/- buttons and slider
function getStep(bot: any) {
  const range = (bot.max_deposit || 0) - (bot.min_deposit || 0);
  if (range >= 1000) return 50;
  if (range >= 100) return 10;
  return 1;
}

// ---------- Ambient: Trade Beam (sweeps across a card) ----------
function TradeBeam() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        initial={{ x: '-120%' }}
        animate={{ x: '220%' }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4.5, ease: 'easeInOut' }}
        className="absolute top-0 bottom-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
      />
    </div>
  );
}

// ---------- Ambient: Signal Pulse (expanding ring) ----------
function SignalPulse({ color = '#10b981' }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2">
      <motion.span
        className="absolute inline-flex w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2.6, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <span className="relative inline-flex w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

// ---------- Hero: Formation Pitch ----------
// 6 dots that morph between formations — Premier-League-style preview.
const FORMATIONS = [
  // Formation 1 — "scanning"
  [ { x: 40, y: 30 }, { x: 100, y: 55 }, { x: 160, y: 30 },
    { x: 40, y: 90 }, { x: 100, y: 65 }, { x: 160, y: 90 } ],
  // Formation 2 — "buying"
  [ { x: 50, y: 45 }, { x: 100, y: 30 }, { x: 150, y: 45 },
    { x: 60, y: 90 }, { x: 100, y: 75 }, { x: 140, y: 90 } ],
  // Formation 3 — "selling"
  [ { x: 60, y: 30 }, { x: 100, y: 45 }, { x: 140, y: 30 },
    { x: 50, y: 90 }, { x: 100, y: 75 }, { x: 150, y: 90 } ],
];
const DOT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444'];
const FORMATION_LABELS = ['Scanning markets', 'Executing buys', 'Locking profits'];

function FormationPitch() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % FORMATIONS.length), 3800);
    return () => clearInterval(t);
  }, []);

  const dots = FORMATIONS[phase];

  return (
    <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-gradient-to-br from-[#0a1a12] to-[#0b0e14] border border-emerald-500/20">
      {/* Pitch lines */}
      <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
        <rect x="4" y="4" width="192" height="112" fill="none" stroke="#10b981" strokeOpacity="0.15" strokeWidth="1" />
        <line x1="100" y1="4" x2="100" y2="116" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" />
        <circle cx="100" cy="60" r="18" fill="none" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" />
        <circle cx="100" cy="60" r="1.5" fill="#10b981" fillOpacity="0.4" />
        {/* Goals */}
        <rect x="4" y="45" width="6" height="30" fill="none" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" />
        <rect x="190" y="45" width="6" height="30" fill="none" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" />
      </svg>

      {/* Dots */}
      <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
        {dots.map((d, i) => (
          <g key={i}>
            {/* motion trail */}
            <motion.circle
              r="6"
              fill={DOT_COLORS[i]}
              opacity="0.15"
              animate={{ cx: d.x, cy: d.y }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* main dot */}
            <motion.circle
              r="3"
              fill={DOT_COLORS[i]}
              animate={{ cx: d.x, cy: d.y }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* glow */}
            <motion.circle
              r="6"
              fill="none"
              stroke={DOT_COLORS[i]}
              strokeOpacity="0.5"
              animate={{ cx: d.x, cy: d.y }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </g>
        ))}
      </svg>

      {/* Status caption */}
      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <SignalPulse color="#10b981" /> LIVE
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-[#8e96a3]"
          >
            {FORMATION_LABELS[phase]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function BotStorePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingBalance, setFundingBalance] = useState(0);
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({});
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [quickDeploy, setQuickDeploy] = useState<{ [key: string]: boolean }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const botsPerPage = 10;
  const totalPages = Math.ceil(bots.length / botsPerPage);
  const currentBots = bots.slice((currentPage - 1) * botsPerPage, currentPage * botsPerPage);

  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: bal } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
      if (bal) setFundingBalance(bal.funding_balance || 0);

      const { data: botData, error: botError } = await supabase
        .from('admin_bots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (botError) setError('Failed to load bots: ' + botError.message);
      else setBots(botData || []);

      const { data: history } = await supabase
        .from('active_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const filteredHistory = (history || []).filter(bot => bot.status !== 'Expired');
      setPurchaseHistory(filteredHistory.slice(0, 5));

      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  const getSliderValue = (bot: any) => sliderValues[bot.id] ?? bot.min_deposit;

  const handleSliderChange = (botId: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [botId]: value }));
  };

  const toggleQuickDeploy = (botId: string) => {
    setQuickDeploy(prev => ({ ...prev, [botId]: !prev[botId] }));
  };

  const handleBuyBot = async (bot: any) => {
    const investmentAmount = getSliderValue(bot);
    if (investmentAmount < bot.min_deposit || investmentAmount > bot.max_deposit) {
      setError(`Investment must be between ${bot.min_deposit} and ${bot.max_deposit} USDT.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      if (fundingBalance < investmentAmount) {
        setError(`Insufficient funds. Need ${investmentAmount} USDT.`);
        setLoading(false); return;
      }

      const licenseKey = generateLicenseKey(bot.license_key_prefix || 'SCN');
      const receiptNumber = generateReceiptNumber();
      const isQuickDeploy = quickDeploy[bot.id] || false;

      const receiptData = {
        receiptNumber,
        product: bot.name,
        investmentAmount,
        licenseKey,
        botImage: bot.image_url,
        date: new Date().toLocaleString(),
        status: 'Active',
        deployedImmediately: isQuickDeploy
      };

      await supabase.from('user_balances').update({ funding_balance: fundingBalance - investmentAmount }).eq('user_id', user.id);

      const { data: newBot, error: insertError } = await supabase
        .from('active_bots')
        .insert({
          user_id: user.id,
          bot_name: bot.name,
          invested_usdt: investmentAmount,
          current_value_usdt: investmentAmount,
          profit_percent: bot.profit_percent,
          duration: bot.duration,
          status: 'Active',
          license_key: licenseKey,
          is_deployed: isQuickDeploy,
          trading_pairs: bot.trading_pairs,
          receipt_data: receiptData
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (bot.bonus_usdt > 0) {
        const { data: currentBonus } = await supabase.from('user_balances').select('bonus_usdt').eq('user_id', user.id).single();
        await supabase.from('user_balances').update({ bonus_usdt: (currentBonus?.bonus_usdt || 0) + bot.bonus_usdt }).eq('user_id', user.id);
      }

      setFundingBalance(fundingBalance - investmentAmount);
      setPurchaseHistory(prev => [newBot, ...prev.slice(0, 4)]);
      setReceipt(receiptData);
      setIsReceiptOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => window.print();
  const closeModal = () => { setIsReceiptOpen(false); setReceipt(null); };

  const handleViewReceipt = (bot: any) => {
    if (bot.receipt_data && typeof bot.receipt_data === 'object') {
      setReceipt(bot.receipt_data);
      setIsReceiptOpen(true);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading bot store...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">SmartCode Nova Bot Store</h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm">Browse and invest in our AI-powered trading bots.</p>
        </div>
        <div className="px-3 sm:px-4 py-2 bg-[#141a24] rounded-xl border border-white/5 text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto">
          <Wallet size={16} className="text-blue-400 shrink-0" />
          <span className="text-[#8e96a3]">Balance:</span>
          <span className="text-white font-bold truncate">{fundingBalance.toFixed(2)} USDT</span>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {currentBots.map((bot, idx) => {
          const investment = getSliderValue(bot);
          const expectedReturn = (investment * (bot.profit_percent / 100)).toFixed(2);
          const isQuickDeploy = quickDeploy[bot.id] || false;
          const step = getStep(bot);
          const isHero = idx === 0 && currentPage === 1;

          return (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`relative bg-[#141a24] border rounded-2xl overflow-hidden shadow-sm ${
                isHero ? 'border-emerald-500/30 shadow-emerald-500/10 shadow-lg' : 'border-white/5'
              }`}
            >
              {/* Ambient: beam on non-hero cards */}
              {!isHero && <TradeBeam />}

              {/* Header strip */}
              <div className={`relative p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border-b border-white/5 ${
                isHero ? 'bg-gradient-to-r from-[#0a1a12] via-[#0d1a2e] to-[#0b0e14]' : 'bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14]'
              }`}>
                <img
                  src={bot.image_url}
                  alt={bot.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-blue-500/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{bot.name}</h2>
                  <p className="text-xs sm:text-sm text-[#8e96a3] flex items-center gap-2 flex-wrap">
                    <span>{bot.profit_percent}% Return</span>
                    <span className="text-white/20">•</span>
                    <span>{bot.duration}</span>
                    {isHero && <SignalPulse color="#10b981" />}
                  </p>
                </div>
                {bot.bonus_usdt > 0 && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 border-[#141a24]">
                    +{bot.bonus_usdt} USDT
                  </div>
                )}
              </div>

              {/* Hero: Formation pitch */}
              {isHero && (
                <div className="p-3 sm:p-4 bg-[#0b0e14] border-b border-white/5">
                  <FormationPitch />
                </div>
              )}

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 p-3 sm:p-6 bg-white/5 border-b border-white/5">
                <div className="text-center min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase text-[#8e96a3] tracking-wider">Min</p>
                  <p className="font-bold text-sm sm:text-lg truncate">{bot.min_deposit} <span className="text-[10px] sm:text-xs font-normal text-[#8e96a3]">USDT</span></p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase text-[#8e96a3] tracking-wider">Max</p>
                  <p className="font-bold text-sm sm:text-lg truncate">{bot.max_deposit} <span className="text-[10px] sm:text-xs font-normal text-[#8e96a3]">USDT</span></p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase text-[#8e96a3] tracking-wider">Return</p>
                  <p className="font-bold text-sm sm:text-lg text-green-400">{bot.profit_percent}%</p>
                </div>
              </div>

              {/* Investment area */}
              <div className="p-4 sm:p-6 bg-[#0b0e14]">
                <div className="flex justify-between items-center mb-3 gap-2">
                  <span className="text-xs sm:text-sm text-[#8e96a3]">Investment Amount</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-400 tabular-nums">
                    {investment} <span className="text-xs sm:text-sm font-medium">USDT</span>
                  </span>
                </div>

                {/* Input + / - */}
                <div className="flex items-stretch gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleSliderChange(bot.id, Math.max(bot.min_deposit, investment - step))}
                    disabled={investment <= bot.min_deposit}
                    aria-label="Decrease amount"
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#141a24] border border-white/5 text-white font-bold flex items-center justify-center hover:bg-white/5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>

                  <div className="relative flex-1 min-w-0">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={investment}
                      min={bot.min_deposit}
                      max={bot.max_deposit}
                      step={step}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') { handleSliderChange(bot.id, bot.min_deposit); return; }
                        const n = Number(raw);
                        if (!Number.isFinite(n)) return;
                        const clamped = Math.max(bot.min_deposit, Math.min(bot.max_deposit, n));
                        handleSliderChange(bot.id, clamped);
                      }}
                      className="w-full h-11 bg-[#141a24] border border-white/5 rounded-xl px-3 pr-14 text-white font-bold text-center focus:border-blue-500 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-[#8e96a3] pointer-events-none">
                      USDT
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSliderChange(bot.id, Math.min(bot.max_deposit, investment + step))}
                    disabled={investment >= bot.max_deposit}
                    aria-label="Increase amount"
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#141a24] border border-white/5 text-white font-bold flex items-center justify-center hover:bg-white/5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={bot.min_deposit}
                  max={bot.max_deposit}
                  step={step}
                  value={investment}
                  onChange={(e) => handleSliderChange(bot.id, Number(e.target.value))}
                  className="w-full h-2 bg-[#141a24] rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10px] sm:text-xs text-[#8e96a3] mt-2 gap-2">
                  <span className="truncate">{bot.min_deposit}</span>
                  <span className="text-green-400 font-medium truncate">Expected: +{expectedReturn} USDT</span>
                  <span className="truncate">{bot.max_deposit}</span>
                </div>

                {/* Quick Deploy */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 gap-3">
                  <span className="text-xs sm:text-sm text-[#8e96a3] flex items-center gap-2 min-w-0">
                    <Zap size={14} className="text-yellow-400 shrink-0" />
                    <span className="truncate">Deploy Immediately?</span>
                  </span>
                  <button
                    onClick={() => toggleQuickDeploy(bot.id)}
                    aria-label="Toggle quick deploy"
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isQuickDeploy ? 'bg-blue-600' : 'bg-[#2a2a4a]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isQuickDeploy ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <button
                  onClick={() => handleBuyBot(bot)}
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto inline-block"></span>
                  ) : (
                    `Activate Bot (${investment} USDT)`
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {bots.length > botsPerPage && (
        <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 sm:px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition disabled:opacity-50 flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-xs sm:text-sm text-[#8e96a3]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 sm:px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition disabled:opacity-50 flex items-center gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptOpen && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-4 sm:p-6 border-b border-white/5 text-center relative shrink-0">
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute right-3 top-3 sm:right-4 sm:top-4 text-[#8e96a3] hover:text-white transition p-1"
                >
                  <X size={22} />
                </button>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-green-500/30">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Purchase Successful!</h2>
                <p className="text-[#8e96a3] text-xs sm:text-sm">Your bot has been activated successfully.</p>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4 sm:p-6 relative">
                  <div className="flex items-center justify-center gap-2 mb-4 border-b border-white/5 pb-4">
                    <img
                      src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png"
                      alt="Logo"
                      className="h-6 w-auto"
                    />
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                      SmartCodeNova
                    </span>
                  </div>

                  <div className="font-mono text-[#8e96a3] text-xs text-center mb-4 break-all">
                    Receipt {receipt.receiptNumber}
                  </div>

                  <div className="flex gap-3 sm:gap-4 mb-4">
                    <img src={receipt.botImage} alt="Bot" className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-white/5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-white truncate">{receipt.product}</p>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3] flex-wrap">
                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                          {receipt.status}
                        </span>
                        {receipt.deployedImmediately && (
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                            Deployed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3]">Investment Amount</span>
                      <span className="font-bold text-blue-400 truncate">{receipt.investmentAmount} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3] shrink-0">License Key</span>
                      <span className="font-mono text-[#f59e0b] text-xs break-all text-right">{receipt.licenseKey}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3] shrink-0">Date</span>
                      <span className="text-[#8e96a3] text-xs text-right">{receipt.date}</span>
                    </div>
                  </div>

                  <div className="text-center border-t border-white/5 pt-4">
                    <p className="text-[10px] text-[#8e96a3] font-mono tracking-widest">
                      Thank you for choosing SmartCodeNova
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-6 pt-0 flex gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 sm:py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 sm:py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition text-xs sm:text-sm"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase History */}
      <div className="mt-8 sm:mt-12 border-t border-white/5 pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <History size={20} className="text-[#6366f1] shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Purchases</h2>
            <span className="text-xs text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5 shrink-0">Last 5</span>
          </div>
          <Link href="/dashboard/purchase-history">
            <button className="flex items-center gap-1 text-xs sm:text-sm text-[#6366f1] hover:text-[#3b82f6] transition">
              View More <ArrowRight size={16} />
            </button>
          </Link>
        </div>

        {purchaseHistory.length === 0 ? (
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 sm:p-8 text-center text-[#8e96a3] text-sm">
            You haven't made any purchases yet.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {purchaseHistory.map((bot) => (
                <div key={bot.id} className="bg-[#141a24] border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    {bot.receipt_data?.botImage && (
                      <img src={bot.receipt_data.botImage} alt={bot.bot_name} className="w-10 h-10 rounded-lg object-cover border border-white/5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm truncate">{bot.bot_name}</p>
                      <p className="text-xs text-[#8e96a3]">{new Date(bot.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${
                      bot.status === 'Active'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {bot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-2 border-t border-white/5">
                    <span className="text-[#8e96a3]">Invested</span>
                    <span className="text-right text-blue-400 font-bold">{bot.invested_usdt} USDT</span>
                  </div>

                  {bot.receipt_data && (
                    <button
                      onClick={() => handleViewReceipt(bot)}
                      className="w-full py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs font-medium hover:bg-[#6366f1]/20 transition"
                    >
                      View Receipt
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                  <tr>
                    <th className="px-6 py-3">Bot</th>
                    <th className="px-6 py-3">Invested</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseHistory.map((bot) => (
                    <tr key={bot.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {bot.receipt_data?.botImage && (
                            <img src={bot.receipt_data.botImage} alt={bot.bot_name} className="w-9 h-9 rounded-lg object-cover border border-white/5" />
                          )}
                          <span className="font-medium text-white">{bot.bot_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-blue-400 font-bold">{bot.invested_usdt} USDT</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          bot.status === 'Active'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {bot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#8e96a3] text-xs">
                        {new Date(bot.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {bot.receipt_data && (
                          <button
                            onClick={() => handleViewReceipt(bot)}
                            className="text-[#6366f1] hover:text-[#3b82f6] text-xs font-medium transition"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
