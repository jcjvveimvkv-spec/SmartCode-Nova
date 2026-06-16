'use client';
import { motion } from 'framer-motion';

export default function AboutUs() {
  return (
    <section className="py-20 px-4 bg-[#0a0a2a]/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            About{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              SmartCodeNova
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Empowering Traders with AI
            </h3>
            <p className="text-gray-400 mb-4">
              SmartCodeNova is a cutting-edge trading platform that combines advanced AI algorithms with automated trading bots. 
              Our mission is to make professional-grade trading accessible to everyone.
            </p>
            <p className="text-gray-400 mb-4">
              Whether you're a beginner or an experienced trader, our bots are designed to optimize your trading strategy 
              and maximize your returns.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#1a1a3e] rounded-lg border border-blue-500/20">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-gray-400">Active Traders</div>
              </div>
              <div className="p-4 bg-[#1a1a3e] rounded-lg border border-blue-500/20">
                <div className="text-3xl font-bold text-white">$2.4B+</div>
                <div className="text-gray-400">Trading Volume</div>
              </div>
              <div className="p-4 bg-[#1a1a3e] rounded-lg border border-blue-500/20">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-gray-400">Automated Trading</div>
              </div>
              <div className="p-4 bg-[#1a1a3e] rounded-lg border border-blue-500/20">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-red-500/10 to-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🚀</div>
                <h4 className="text-2xl font-bold text-white">AI-Powered Trading</h4>
                <p className="text-gray-400 mt-2">Your personal trading assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}