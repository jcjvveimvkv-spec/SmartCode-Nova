'use client';
import { motion } from 'framer-motion';

export default function WithdrawalPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <h1 className="text-2xl font-bold text-white mb-4">Withdraw USDT</h1>
      <p className="text-[#8e96a3]">Request a withdrawal of your available USDT balance.</p>
    </motion.div>
  );
}