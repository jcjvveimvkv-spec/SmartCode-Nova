'use client';
import { motion } from 'framer-motion';

const bots = [
  {
    name: 'Nova Pro',
    price: '$299',
    profit: '12-15%',
    risk: 'Low',
    color: 'from-green-500 to-blue-500'
  },
  {
    name: 'Smart Grid',
    price: '$199',
    profit: '8-10%',
    risk: 'Medium',
    color: 'from-yellow-500 to-red-500'
  },
  {
    name: 'Scalper AI',
    price: '$399',
    profit: '15-20%',
    risk: 'High',
    color: 'from-red-500 to-purple-500'
  }
];

export default function BotShowcase() {
  return (
    <section id="bots" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Trading Bot
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Select a bot that matches your trading style and risk tolerance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {bots.map((bot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-[#1a1a3e] border border-blue-500/20 hover:border-blue-500/40 transition group"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{bot.name}</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-400">
                  <span>Price</span>
                  <span className="text-white font-bold">{bot.price}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Expected Profit</span>
                  <span className="text-green-400 font-bold">{bot.profit}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Risk Level</span>
                  <span className="text-white font-bold">{bot.risk}</span>
                </div>
                <button className="w-full py-3 mt-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-lg text-white font-bold hover:opacity-90 transition">
                  Activate Bot
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}