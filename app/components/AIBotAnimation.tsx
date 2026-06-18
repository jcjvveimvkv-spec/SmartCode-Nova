'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function AIBotAnimation() {
  const [mounted, setMounted] = useState(false);
  const [glowColor, setGlowColor] = useState('#ff0000');

  useEffect(() => {
    setMounted(true); // Only run on the browser
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowColor(prev => prev === '#ff0000' ? '#0066ff' : '#ff0000');
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Show a static placeholder during Server-Side Rendering
  if (!mounted) {
    return (
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-red-500/20 to-blue-500/20 border border-blue-500/30 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Glowing background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${glowColor}33, transparent 70%)` }}
      />
      
      {/* Floating robot */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <div className="text-8xl animate-pulse">🤖</div>
      </motion.div>

      {/* Floating particles (Only runs on Client) */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? '#ff0000' : '#0066ff',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}