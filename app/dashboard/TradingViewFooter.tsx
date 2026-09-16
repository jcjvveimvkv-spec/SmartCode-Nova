'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Loader2 } from 'lucide-react';

export default function TradingViewNewsWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols',
      isTransparent: false,
      displayMode: 'regular',
      width: '100%',
      height: '100%',
      colorTheme: 'dark',
      locale: 'en',
    });

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    // Best-effort "loaded" signal — widget renders inside an iframe that
    // isn't directly observable, so we use a timeout as a visual hint.
    const t = setTimeout(() => setLoaded(true), 1200);

    return () => {
      clearTimeout(t);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="bg-[#141a24] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full shadow-sm">

      {/* Header — matches your other card headers, keeps mobile context */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-white truncate">
            Market Intelligence
          </h2>
        </div>
        <span className="hidden sm:inline text-[10px] text-[#8e96a3] bg-[#0b0e14] px-2 py-1 rounded-full border border-white/5 shrink-0">
          Live feed
        </span>
      </div>

      {/* Widget container — fixed mobile height, taller desktop height */}
      <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden bg-[#0b0e14] border border-white/5">

        {/* Loading overlay — visible until script loads */}
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: loaded ? 0 : 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b0e14] pointer-events-none"
          >
            <Loader2 className="w-6 h-6 text-[#3b82f6] animate-spin" />
            <p className="text-xs text-[#8e96a3]">Loading news feed…</p>
          </motion.div>
        )}

        {/* Actual TradingView widget mount point */}
        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full [&_.tradingview-widget-container__widget]:h-full [&_iframe]:h-full [&_iframe]:w-full"
        >
          <div className="tradingview-widget-container__widget h-full w-full" />
        </div>
      </div>
    </div>
  );
}
