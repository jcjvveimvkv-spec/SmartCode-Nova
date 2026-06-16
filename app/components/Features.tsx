'use client';
import { Zap, Shield, TrendingUp, Clock, Lock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Zap,
    title: 'Automated Trading',
    description: 'Our AI bots execute trades 24/7 without human intervention.'
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Military-grade encryption and secure API integrations.'
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Data',
    description: 'Live market data from top exchanges for accurate trading.'
  },
  {
    icon: Clock,
    title: 'Instant Execution',
    description: 'Trades executed in milliseconds with minimal slippage.'
  },
  {
    icon: Lock,
    title: 'License Protection',
    description: 'Each bot comes with a unique license key for security.'
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Join thousands of traders using SmartCodeNova bots.'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-[#0a0a2a]/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              SmartCodeNova
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Built for traders who want to maximize profits with minimal effort
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-red-500/10 border border-blue-500/20 hover:border-blue-500/40 transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-blue-500 flex items-center justify-center mb-4">
                <feature.icon className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}