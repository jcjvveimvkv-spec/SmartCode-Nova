'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const testimonials = [
  {
    name: 'John Doe',
    role: 'Crypto Investor',
    content: 'SmartCodeNova has completely transformed my trading experience. The automated bots are incredibly accurate!',
    avatar: '👨‍💼',
    rating: 5
  },
  {
    name: 'Sarah Smith',
    role: 'Forex Trader',
    content: 'I\'ve been using Nova-3 for 3 months now. The returns are consistent and the platform is very user-friendly.',
    avatar: '👩‍💼',
    rating: 5
  },
  {
    name: 'Mike Johnson',
    role: 'Stock Investor',
    content: 'The AI technology behind these bots is impressive. I\'ve seen steady growth since I started.',
    avatar: '👨‍💻',
    rating: 5
  },
  {
    name: 'Emma Wilson',
    role: 'Beginner Trader',
    content: 'As a beginner, I was nervous about trading. SmartCodeNova made it easy and profitable.',
    avatar: '👩‍💻',
    rating: 5
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-20 px-4 bg-[#0a0a2a]/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            What Our{' '}
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Clients Say
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-400">
            Real testimonials from real investors
          </p>
        </div>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a3e] rounded-2xl border border-blue-500/20 p-8"
        >
          <div className="text-6xl mb-4 text-center">{testimonials[currentIndex].avatar}</div>
          <p className="text-xl text-white text-center mb-6">"{testimonials[currentIndex].content}"</p>
          <div className="text-center">
            <div className="text-white font-bold">{testimonials[currentIndex].name}</div>
            <div className="text-gray-400">{testimonials[currentIndex].role}</div>
            <div className="flex justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center mt-6 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}