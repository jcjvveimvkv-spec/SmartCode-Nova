'use client';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Calendar, Gift } from 'lucide-react';

const plans = [
  {
    name: 'NOVA-1 BOT',
    min: '35',
    max: '500',
    return: '5%',
    duration: '48 HOURS INVESTMENT',
    bonus: 0,
    color: 'from-red-600 to-red-800'
  },
  {
    name: 'NOVA-2 BOT',
    min: '120',
    max: '1500',
    return: '10%',
    duration: '96 HOURS INVESTMENT',
    bonus: 0,
    color: 'from-blue-600 to-blue-800'
  },
  {
    name: 'NOVA-3 BOT',
    min: '500',
    max: '5000',
    return: '15%',
    duration: '168 HOURS INVESTMENT',
    bonus: 100,
    color: 'from-red-600 to-red-800'
  },
  {
    name: 'NOVA-4 BOT',
    min: '2000',
    max: '20000',
    return: '30%',
    duration: '336 HOURS INVESTMENT',
    bonus: 200,
    color: 'from-blue-600 to-blue-800'
  }
];

export default function InvestmentPlans() {
  return (
    <section id="plans" className="py-20 px-4 bg-[#0a0a2a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Investment{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Plans
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Choose the perfect plan for your investment goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 bg-gradient-to-br ${plan.color} border border-white/10 shadow-2xl overflow-hidden`}
            >
              {/* BONUS RIBBON (for NOVA-3 and NOVA-4) */}
              {plan.bonus > 0 && (
                <div className="absolute -right-12 top-4 transform rotate-45 bg-red-600 text-white font-bold px-12 py-1 text-sm shadow-lg z-10">
                  BONUS {plan.bonus} USDT
                </div>
              )}
              
              <div className="text-3xl font-bold text-white mb-6">{plan.name}</div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Wallet className="w-8 h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-sm text-white/80">Minimum</div>
                  <div className="text-2xl font-bold text-white">{plan.min} USDT</div>
                </div>
                <div className="text-center">
                  <Wallet className="w-8 h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-sm text-white/80">Maximum</div>
                  <div className="text-2xl font-bold text-white">{plan.max} USDT</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-sm text-white/80">Return</div>
                  <div className="text-2xl font-bold text-white">{plan.return}</div>
                </div>
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-sm text-white/80">Duration</div>
                  <div className="text-lg font-bold text-white leading-tight">{plan.duration}</div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition">
                Invest Now
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-[#1a1a3e] rounded-xl border border-blue-500/20">
          <h3 className="text-xl font-bold text-white mb-4">SmartCodeNova Vision</h3>
          <p className="text-gray-400">
            "Empowering investors through innovative technology, intelligent trading solutions, 
            and a commitment to creating opportunities for financial growth in the digital economy."
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p className="font-bold text-yellow-400">⚠️ Risk Disclaimer:</p>
            <p>All investments carry risk, and profits are never guaranteed. Investors should only invest funds they can afford to risk.</p>
          </div>
        </div>
      </div>
    </section>
  );
}