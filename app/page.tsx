import React from 'react';
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
import PriceTicker from './components/PriceTicker';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a2a]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <FloatingLogo />
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Trade Smarter with{' '}
                <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                  AI-Powered Bots
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-400">
              Automated trading bots that work 24/7 to grow your portfolio. 
              No coding required. Start earning today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#plans" className="px-8 py-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white font-bold text-lg hover:opacity-90 transition text-center">
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
            
            {/* Price Ticker */}
            <PriceTicker />
          </div>
          
          <div className="relative">
            <AIBotAnimation />
          </div>
        </div>
      </section>

      <LivePayouts />
      <InvestmentPlans />
      <Features />
      <BotShowcase />
      <Testimonials />
      <AboutUs />
      <FAQ />
      <Footer />

      {/* WhatsApp & JivoChat */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        <a 
          href="https://wa.me/447347739643" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition"
        >
          <span className="text-2xl">💬</span>
        </a>
      </div>
      
      {/* JivoChat Script */}
      <script src="//code.jivosite.com/widget/CCCmjzz7Pl" async></script>
    </main>
  );
}