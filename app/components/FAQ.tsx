'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'How do SmartCodeNova bots work?',
    answer: 'Our AI bots analyze market data in real-time and execute trades based on predefined strategies. You simply activate a bot and let it work for you.'
  },
  {
    question: 'Is my money safe?',
    answer: 'Yes. We use military-grade encryption and secure API integrations. Your funds are stored in secure wallets with multi-layer protection.'
  },
  {
    question: 'What is the minimum investment?',
    answer: 'You can start with as little as $100. There\'s no minimum balance required to activate a bot.'
  },
  {
    question: 'How do I withdraw my profits?',
    answer: 'Withdrawals are processed within 24 hours. You can withdraw via bank transfer, crypto, or other supported methods.'
  },
  {
    question: 'Do I need trading experience?',
    answer: 'No! SmartCodeNova is designed for both beginners and experts. The bots handle all trading decisions automatically.'
  },
  {
    question: 'Can I use multiple bots at once?',
    answer: 'Yes. You can activate multiple bots with different strategies to diversify your trading portfolio.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-[#0a0a2a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Everything you need to know about SmartCodeNova
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#1a1a3e] rounded-lg border border-blue-500/20 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#2a2a5e] transition"
              >
                <span className="text-white font-medium">{faq.question}</span>
                <ChevronDown className={`text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} size={20} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}