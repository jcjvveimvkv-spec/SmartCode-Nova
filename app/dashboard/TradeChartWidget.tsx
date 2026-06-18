'use client';
import { useEffect, useRef } from 'react';

export default function TradeChartWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      // Clear the container first
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "100%",
        "symbol": "BITSTAMP:BTCUSD",
        "interval": "60",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      });
      
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    // KEY FIX: Added min-h-[260px] to guarantee the chart has space!
    <div className="w-full h-full min-h-[260px]">
      <div ref={containerRef} className="tradingview-widget-container w-full h-full min-h-[260px]">
        <div className="tradingview-widget-container__widget w-full h-full min-h-[260px]"></div>
      </div>
    </div>
  );
}