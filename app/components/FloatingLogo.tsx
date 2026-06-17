'use client';
import { motion } from 'framer-motion';

export default function FloatingLogo() {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-24 h-24 mx-auto"
    >
      <img 
        src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png"
        alt="SmartCodeNova Logo"
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
}