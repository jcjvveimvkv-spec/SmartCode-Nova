import React from 'react';
import Navbar from './components/Navbar';
import Features from './components/Features';
import BotShowcase from './components/BotShowcase';
import LivePayouts from './components/LivePayouts';
import AboutUs from './components/AboutUs';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a2a]">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Trade Smarter with{' '}
              <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                AI-Powered Bots
              </span>
            </h1>
            <p className="mt-4 text-xl text-gray-400">
              Automated trading bots that work 24/7 to grow your portfolio. 
              No coding required. Start earning today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white font-bold text-lg hover:opacity-90 transition text-center">
                Start Trading Now
              </a>
              <a href="#features" className="px-8 py-4 border border-blue-500/50 rounded-full text-white font-bold text-lg hover:bg-blue-500/10 transition text-center">
                Learn More
              </a>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-blue-500/20">
              <div>
                <div className="text-3xl font-bold text-white">$2.4B+</div>
                <div className="text-gray-400">Trading Volume</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-gray-400">Active Traders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full aspect-square rounded-full bg-gradient-to-br from-red-500/20 to-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <div className="text-center">
                <div className="text-8xl mb-4">🤖</div>
                <div className="text-white text-2xl font-bold">AI Trading Bot</div>
                <div className="text-green-400 text-lg">● Online</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LivePayouts />
      <AboutUs />
      <Features />
      <BotShowcase />
      <FAQ />
      <Footer />
    </main>
  );
}