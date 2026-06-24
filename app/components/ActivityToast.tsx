'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastData {
  id: string;
  message: string;
  type: 'deposit' | 'withdrawal' | 'trade';
}

interface ActivityToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export default function ActivityToast({ toast, onClose }: ActivityToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, 15000); // 15 seconds
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const typeColors = {
    deposit: 'border-green-500/30 bg-green-500/10',
    withdrawal: 'border-orange-500/30 bg-orange-500/10',
    trade: 'border-blue-500/30 bg-blue-500/10',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`fixed top-20 right-4 z-[999] w-full max-w-sm p-4 rounded-xl border ${typeColors[toast.type]} bg-[#141a24] shadow-2xl flex items-start gap-3 backdrop-blur-md`}
        >
          <div className="flex-1">
            <div 
              className="text-sm text-white leading-relaxed"
              dangerouslySetInnerHTML={{ __html: toast.message }}
            />
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 400);
            }}
            className="text-[#8e96a3] hover:text-white transition p-1"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}