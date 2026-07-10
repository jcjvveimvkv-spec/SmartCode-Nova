'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

declare global {
  interface Window {
    jivo_api?: {
      open: () => void;
    };
  }
}

interface LiveChatButtonProps {
  whatsappNumber?: string;
}

export default function LiveChatButton({ 
  whatsappNumber = '447347739643'
}: LiveChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ 
    isDragging: false,
    startX: 0, 
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    hasMoved: false
  });

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem('liveChatPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch (e) {}
    }
    setIsInitialized(true);
  }, []);

  // Save position
  useEffect(() => {
    if (isInitialized && (position.x !== 0 || position.y !== 0)) {
      localStorage.setItem('liveChatPosition', JSON.stringify(position));
    }
  }, [position, isInitialized]);

  // Drag handlers using pointer events (works for both mouse and touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      hasMoved: false
    };

    setIsDragging(true);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;

    const newX = e.clientX - dragRef.current.offsetX;
    const newY = e.clientY - dragRef.current.offsetY;

    // Check if moved significantly
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasMoved = true;
    }

    // Keep within viewport
    const padding = 20;
    const maxX = window.innerWidth - 80 - padding;
    const maxY = window.innerHeight - 80 - padding;

    setPosition({
      x: Math.max(padding, Math.min(newX, maxX)),
      y: Math.max(padding, Math.min(newY, maxY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.releasePointerCapture(e.pointerId);

    setIsDragging(false);
    
    // If it wasn't a drag, toggle menu
    if (!dragRef.current.hasMoved) {
      setIsOpen(!isOpen);
    }
    
    dragRef.current = {
      ...dragRef.current,
      isDragging: false,
      hasMoved: false
    };
  };

  // WhatsApp Icon
  const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  // Get position styles
  const getPositionStyles = () => {
    if (position.x !== 0 || position.y !== 0) {
      return {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
      };
    }
    return {
      position: 'fixed' as const,
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
    };
  };

  return (
    <div 
      ref={buttonRef}
      style={getPositionStyles()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="select-none touch-none group"
      role="button"
      aria-label="Live chat button"
    >
      {/* Drag indicator */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/60 text-xs whitespace-nowrap bg-black/70 px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm">
        {isDragging ? '📍 Drop here' : '↕ Drag to move'}
      </div>

      {/* Main Button */}
      <div
        className={`relative w-14 h-14 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-full shadow-lg shadow-purple-500/30 transition-all duration-200 flex items-center justify-center text-white ${
          isDragging ? 'scale-110 shadow-2xl shadow-purple-500/50' : 'hover:scale-105'
        }`}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} className="fill-white/20" />
        )}
        
        {/* Pulse ring */}
        {!isDragging && (
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping opacity-75"></div>
        )}
        
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] blur-xl opacity-50 -z-10"></div>
      </div>

      {/* Popup Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute bottom-16 right-0 w-52 bg-[#141a24]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20">
              <span className="text-sm font-semibold text-white">Connect with us</span>
            </div>

            {/* WhatsApp */}
            <a 
              href={`https://wa.me/${whatsappNumber.replace(/\s/g, '')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 hover:bg-white/5 transition border-b border-white/5"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <WhatsAppIcon />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">WhatsApp</div>
                <div className="text-xs text-gray-400">Chat with us instantly</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </a>

            {/* Jivo */}
            <button 
              onClick={() => {
                if (window.jivo_api) {
                  window.jivo_api.open();
                } else {
                  // Load Jivo if not loaded
                  if (!document.querySelector('#jivo-script')) {
                    const script = document.createElement('script');
                    script.id = 'jivo-script';
                    script.src = '//code.jivosite.com/widget/CCCmjzz7Pl';
                    script.async = true;
                    document.body.appendChild(script);
                    
                    setTimeout(() => {
                      if (window.jivo_api) {
                        window.jivo_api.open();
                      } else {
                        window.open('https://www.jivochat.com', '_blank');
                      }
                    }, 2000);
                  } else {
                    window.open('https://www.jivochat.com', '_blank');
                  }
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.52 3.5 1.44 4.94L2 21l4.06-1.44C7.5 20.48 9.18 21 11 21c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.66 0-3.22-.53-4.48-1.44L5.4 19.6l1.04-3.12C5.53 15.22 5 13.66 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">Live Chat</div>
                <div className="text-xs text-gray-400">Talk to support team</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </button>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/5">
              <span className="text-xs text-gray-500">🟢 Online • 24/7 Support</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}