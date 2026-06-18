'use client';
import { useEffect, useRef } from 'react';

export default function TradingViewNewsWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "feedMode": "all_symbols",
        "isTransparent": false,
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "colorTheme": "dark",
        "locale": "en"
      });
      
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="tradingview-widget-container h-full w-full">
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
}