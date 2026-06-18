'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
    { user: '***775', amount: 5600, time: '2 minutes ago' },
    { user: '***342', amount: 12450, time: '15 minutes ago' },
    { user: '***124', amount: 3750, time: '2 hours ago' },
    { user: '***567', amount: 15900, time: '3 hours ago' },
    { user: '***890', amount: 8200, time: '4 hours ago' },
    { user: '***234', amount: 3400, time: '5 hours ago' }
  ]);

  // Update payouts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newPayout = generatePayout();
      setPayouts(prev => [newPayout, ...prev.slice(0, 9)]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 bg-[#0a0a2a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Recent{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Payouts
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Real-time payouts to our funded traders
          </p>
        </div>

        <div className="bg-[#1a1a3e] rounded-2xl border border-blue-500/20 p-6">
          <div className="space-y-4">
            {payouts.map((payout, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-[#0a0a2a] rounded-lg border border-blue-500/10"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-white font-medium">User{payout.user}</span>
                  <span className="text-gray-400">withdrew</span>
                  <span className="text-yellow-400 font-bold">{payout.amount.toLocaleString()} USDT</span>
                </div>
                <span className="text-gray-400 text-sm">{payout.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            <span className="text-green-400 font-bold">50+</span> traders funded this week
          </p>
        </div>
      </div>
    </section>
  );
}