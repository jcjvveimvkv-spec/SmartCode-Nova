'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Save, Sliders, TrendingUp } from 'lucide-react'; // <--- Added TrendingUp here

export default function RiskControlsPage() {
  const [stopLoss, setStopLoss] = useState(10);
  const [takeProfit, setTakeProfit] = useState(20);
  const [maxTradeSize, setMaxTradeSize] = useState(500);

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Risk Controls</h1>
          <p className="text-[#8e96a3] text-sm">Configure your automated trading limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-[#6366f1]" size={24} />
            <h2 className="text-lg font-bold">Stop Loss Limit</h2>
          </div>
          <p className="text-[#8e96a3] text-sm mb-4">The maximum % loss allowed per trade before auto-closing.</p>
          <div className="flex items-center gap-4">
            <input 
              type="range" min="0" max="50" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))}
              className="flex-1 h-2 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className="text-xl font-bold text-red-400 min-w-[60px] text-right">{stopLoss}%</span>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-[#10b981]" size={24} /> {/* <--- Now works perfectly */}
            <h2 className="text-lg font-bold">Take Profit Target</h2>
          </div>
          <p className="text-[#8e96a3] text-sm mb-4">The target % profit at which the bot automatically closes a trade.</p>
          <div className="flex items-center gap-4">
            <input 
              type="range" min="0" max="100" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="flex-1 h-2 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <span className="text-xl font-bold text-green-400 min-w-[60px] text-right">{takeProfit}%</span>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Sliders className="text-[#f59e0b]" size={24} />
            <h2 className="text-lg font-bold">Max Trade Size</h2>
          </div>
          <p className="text-[#8e96a3] text-sm mb-4">The maximum USDT amount a single trade can execute.</p>
          <div className="flex items-center gap-4">
            <input 
              type="range" min="50" max="5000" step={50} value={maxTradeSize} onChange={(e) => setMaxTradeSize(Number(e.target.value))}
              className="flex-1 h-2 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-xl font-bold text-yellow-400 min-w-[80px] text-right">{maxTradeSize} USDT</span>
          </div>
        </div>
      </div>

      <button className="px-6 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center gap-2">
        <Save size={18} /> Save Risk Settings
      </button>
    </div>
  );
}