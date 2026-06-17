'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function PriceTicker() {
  const [prices, setPrices] = useState({
    btc: '67,234',
    eth: '3,456',
    spx: '5,432'
  });

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices({
        btc: (Math.random() * 1000 + 65000).toFixed(0),
        eth: (Math.random() * 100 + 3400).toFixed(0),
        spx: (Math.random() * 50 + 5400).toFixed(0)
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1a1a3e] border border-blue-500/20 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-gray-400 text-sm">BTC/USD</div>
          <motion.div
            key={prices.btc}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-bold text-green-400"
          >
            ${prices.btc}
          </motion.div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm">ETH/USD</div>
          <motion.div
            key={prices.eth}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-bold text-blue-400"
          >
            ${prices.eth}
          </motion.div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm">S&P 500</div>
          <motion.div
            key={prices.spx}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-bold text-yellow-400"
          >
            {prices.spx}
          </motion.div>
        </div>
      </div>
    </div>
  );
}