'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Features from './components/Features';
import BotShowcase from './components/BotShowcase';
import LivePayouts from './components/LivePayouts';
import AboutUs from './components/AboutUs';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import InvestmentPlans from './components/InvestmentPlans';
import Testimonials from './components/Testimonials';
import FloatingLogo from './components/FloatingLogo';
import AIBotAnimation from './components/AIBotAnimation';
import LiveTradeGrid from './components/LiveTradeGrid';

export default function Home() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    }
    checkUser();
  }, [supabase]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a2a] flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a2a] overflow-x-hidden">
      <Navbar />

      {/* TRADINGVIEW LIVE TICKER TAPE */}
      <div className="w-full bg-[#0a0a2a] pt-20 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <tv-ticker-tape 
                  symbols="FOREXCOM:SPXUSD,FOREXCOM:NSXUSD,FOREXCOM:DJI,FX:EURUSD,BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,CMCMARKETS:GOLD" 
                  symbol-url="https://www.smartcodenova.online/"
                ></tv-ticker-tape>
              `
            }}
          />
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-4 pb-12 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8">
            {/* FloatingLogo + heading — stack on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
              <FloatingLogo />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Trade Smarter with{' '}
                <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                  AI-Powered Bots
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-xl text-gray-400">
              Automated trading bots that work 24/7 to grow your portfolio.
              No coding required. Start earning today.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleGetStarted}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white font-bold text-base sm:text-lg text-center hover:opacity-90 transition"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
              </button>
              <a
                href="#features"
                className="px-6 sm:px-8 py-3 sm:py-4 border border-blue-500/50 rounded-full text-white font-bold text-base sm:text-lg hover:bg-blue-500/10 transition text-center"
              >
                Learn More
              </a>
            </div>

            {/* Stats row — tighter on mobile */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-blue-500/20">
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-bold text-white tabular-nums truncate">$2.4B+</div>
                <div className="text-xs sm:text-base text-gray-400 truncate">Trading Volume</div>
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-bold text-white tabular-nums truncate">50K+</div>
                <div className="text-xs sm:text-base text-gray-400 truncate">Active Traders</div>
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-3xl font-bold text-white tabular-nums truncate">99.9%</div>
                <div className="text-xs sm:text-base text-gray-400 truncate">Uptime</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <AIBotAnimation />
          </div>
        </div>
      </section>

      {/* ✅ NEW: Live Trading Grid — full-width animation */}
      <LiveTradeGrid />

      <LivePayouts />
      <InvestmentPlans />
      <Features />
      <BotShowcase />
      <Testimonials />
      <AboutUs />
      <FAQ />
      <Footer />

      {/* Floating chat cluster — WhatsApp + Live Chat */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col space-y-2 sm:space-y-3 items-end">
        <a
          href="https://wa.me/447347739643"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-3 sm:p-3.5 rounded-full shadow-lg shadow-green-500/30 transition-all duration-200 flex items-center justify-center group"
          aria-label="WhatsApp"
        >
          <span className="text-lg sm:text-xl">💬</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:pl-2 transition-all duration-300 text-sm font-medium whitespace-nowrap">
            WhatsApp
          </span>
        </a>

        <div className="bg-[#1a1a3e] hover:bg-[#2a2a5e] border border-blue-500/20 text-white p-3 sm:p-3.5 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center group cursor-pointer">
          <span className="text-lg sm:text-xl">💻</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:pl-2 transition-all duration-300 text-sm font-medium whitespace-nowrap">
            Live Chat
          </span>
        </div>
      </div>
    </main>
  );
}
