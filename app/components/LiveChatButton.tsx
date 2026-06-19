'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

// Tell TypeScript that JivoChat adds this to the window
declare global {
  interface Window {
    jivo_api?: {
      open: () => void;
    };
  }
}

export default function LiveChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Official WhatsApp SVG Icon (Green)
  const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {/* Main Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-[#6366f1] rounded-full shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center text-white"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>

      {/* Pop-up Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-48 bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* WhatsApp Option */}
            <a 
              href="https://wa.me/447347739643" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 hover:bg-white/5 transition border-b border-white/5"
              onClick={() => setIsOpen(false)}
            >
              <div className="text-green-500">
                <WhatsAppIcon />
              </div>
              <span className="text-sm font-medium text-white">WhatsApp</span>
            </a>

            {/* JivoChat Option */}
            <button 
              onClick={() => {
                // JivoChat script will handle the widget
                if (window.jivo_api) {
                  window.jivo_api.open();
                } else {
                  // Fallback: open Jivo in a new tab if script isn't ready
                  window.open('https://www.jivochat.com', '_blank');
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                J
              </div>
              <span className="text-sm font-medium text-white">Live Chat</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}