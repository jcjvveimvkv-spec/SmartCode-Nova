'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

// Generate random payout data
const generatePayout = () => {
  const users = ['***775', '***342', '***124', '***567', '***890', '***234', '***678', '***901'];
  const amounts = [5600, 12450, 3750, 15900, 8200, 3400, 21000, 6700];
  
  return {
    user: users[Math.floor(Math.random() * users.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    time: Math.floor(Math.random() * 60) + ' minutes ago'
  };
};

export default function LivePayouts() {
  const [payouts, setPayouts] = useState([
    { id: '1', user: '***775', amount: 5600, time: '2 minutes ago', isNew: false },
    { id: '2', user: '***342', amount: 12450, time: '15 minutes ago', isNew: false },
    { id: '3', user: '***124', amount: 3750, time: '2 hours ago', isNew: false },
    { id: '4', user: '***567', amount: 15900, time: '3 hours ago', isNew: false },
    { id: '5', user: '***890', amount: 8200, time: '4 hours ago', isNew: false },
    { id: '6', user: '***234', amount: 3400, time: '5 hours ago', isNew: false },
  ]);

  // Update payouts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newPayout = generatePayout();
      const item = {
        id: `${Date.now()}-${Math.random()}`,
        ...newPayout,
        isNew: true,
      };
      setPayouts(prev => {
        // Mark previous "new" as not new, prepend the new one, cap at 8 items
        const cleared = prev.map(p => ({ ...p, isNew: false }));
        return [item, ...cleared].slice(0, 8);
      });

      // Clear the "new" flag after animation completes
      setTimeout(() => {
        setPayouts(prev => prev.map(p => p.id === item.id ? { ...p, isNew: false } : p));
      }, 2000);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 sm:py-20 px-4 bg-[#0a0a2a]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          {/* LIVE badge */}
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="relative flex items-center justify-center w-2 h-2">
              <motion.span
                className="absolute inline-flex w-2 h-2 rounded-full bg-green-400"
                animate={{ scale: [1, 2.6, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-green-400 tracking-wide">LIVE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Recent{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Payouts
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-xl text-gray-400">
            Real-time payouts to our funded traders
          </p>
        </div>

        {/* Payout List */}
        <div className="bg-[#1a1a3e] rounded-2xl border border-blue-500/20 p-3 sm:p-6">
          <div className="space-y-2 sm:space-y-4">
            <AnimatePresence initial={false}>
              {payouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  layout
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className={`relative overflow-hidden rounded-lg border transition-colors ${
                    payout.isNew
                      ? 'bg-green-500/5 border-green-500/30'
                      : 'bg-[#0a0a2a] border-blue-500/10'
                  }`}
                >
                  {/* Flash overlay on new item */}
                  {payout.isNew && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.6, ease: 'easeOut' }}
                      className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent pointer-events-none"
                    />
                  )}

                  <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3">
                    {/* Left: user + action + amount */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 flex-wrap">
                      {/* Green dot */}
                      <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
                        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-green-400" />
                      </span>

                      <span className="text-white font-medium text-sm sm:text-base shrink-0">
                        User{payout.user}
                      </span>

                      {/* "withdrew" — hidden on very narrow screens to save width */}
                      <span className="hidden sm:inline text-gray-400 text-sm shrink-0">
                        withdrew
                      </span>

                      <span className="text-yellow-400 font-bold text-sm sm:text-base tabular-nums shrink-0">
                        {payout.amount.toLocaleString()} USDT
                      </span>
                    </div>

                    {/* Right: time */}
                    <span className="text-gray-400 text-[10px] sm:text-sm shrink-0 text-right whitespace-nowrap">
                      {payout.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer stat */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10">
            <Zap className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <p className="text-sm sm:text-base text-gray-400">
              <span className="text-green-400 font-bold tabular-nums">50+</span> traders funded this week
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
