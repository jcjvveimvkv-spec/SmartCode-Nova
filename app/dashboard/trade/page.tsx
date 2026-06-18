'use client';
import { motion } from 'framer-motion';

export default function TradePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-6 h-full"
    >
      <h1 className="text-2xl font-bold text-white mb-6">Trade</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TradingView Chart Widget - 2/3rds width */}
        <div className="lg:col-span-2 bg-[#1a1a3e] rounded-xl border border-blue-500/20 p-2 h-[500px]">
          <div className="w-full h-full">
            {/* TradingView Advanced Chart Widget Code */}
            <div className="tradingview-widget-container h-full">
              <div className="tradingview-widget-container__widget h-full"></div>
              <script 
                type="text/javascript" 
                src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" 
                dangerouslySetInnerHTML={{
                  __html: `
                    {
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
                    }
                  `
                }}
              />
            </div>
          </div>
        </div>

        {/* TradingView News Widget - 1/3rd width */}
        <div className="bg-[#1a1a3e] rounded-xl border border-blue-500/20 p-4 h-[500px] overflow-hidden">
          <h3 className="text-white font-bold mb-4">Market News</h3>
          <div className="tradingview-widget-container h-[calc(100%-2rem)]">
            <div className="tradingview-widget-container__widget h-full"></div>
            <script 
              type="text/javascript" 
              src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" 
              dangerouslySetInnerHTML={{
                __html: `
                  {
                    "feedMode": "all_symbols",
                    "isTransparent": false,
                    "displayMode": "regular",
                    "width": "100%",
                    "height": "100%",
                    "colorTheme": "dark",
                    "locale": "en"
                  }
                `
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}