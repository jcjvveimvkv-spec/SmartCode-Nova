'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AINewsTicker() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [newsItems, setNewsItems] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch platform-wide activity
  const fetchPlatformActivity = async () => {
    try {
      // 1. Fetch latest deposits
      const { data: deposits } = await supabase
        .from('deposit_requests')
        .select('amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(3);

      // 2. Fetch latest withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(3);

      // 3. Fetch latest trades
      const { data: trades } = await supabase
        .from('bot_trade_logs')
        .select('profit_usdt, pair, executed_at, user_id')
        .order('executed_at', { ascending: false })
        .limit(3);

      const items: string[] = [];

      // Format deposits
      deposits?.forEach((d) => {
        const userId = d.user_id.slice(0, 8);
        items.push(
          `🔹 Account ****${userId} deposited ${Number(d.amount).toFixed(2)} USDT • ${timeAgo(d.created_at)}`
        );
      });

      // Format withdrawals
      withdrawals?.forEach((w) => {
        const userId = w.user_id.slice(0, 8);
        items.push(
          `🔸 Account ****${userId} withdrew ${Number(w.amount).toFixed(2)} USDT • ${timeAgo(w.created_at)}`
        );
      });

      // Format trades
      trades?.forEach((t) => {
        const userId = t.user_id.slice(0, 8);
        items.push(
          `📈 Account ****${userId} settled trade on ${t.pair} • +${Number(t.profit_usdt).toFixed(2)} USDT • ${timeAgo(t.executed_at)}`
        );
      });

      // Shuffle and limit to 10 items for the ticker
      setNewsItems(items.sort(() => Math.random() - 0.5).slice(0, 10));
    } catch (error) {
      console.error('Error fetching platform activity:', error);
    }
  };

  // Helper: format time ago
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  useEffect(() => {
    fetchPlatformActivity();

    // Refresh every 60 seconds
    const interval = setInterval(fetchPlatformActivity, 60000);
    return () => clearInterval(interval);
  }, []);

  if (newsItems.length === 0) return null;

  return (
    <div
      className="relative w-full h-[48px] flex items-center bg-[#000000] border-b border-white/5 overflow-hidden z-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* LIVE Badge */}
      <div className="absolute left-0 z-20 flex items-center gap-2 px-4 h-full bg-[#000000] border-r border-white/10">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
      </div>

      {/* Scrolling Track */}
      <div className="flex-1 ml-[80px] overflow-hidden whitespace-nowrap">
        <div
          className={`inline-block animate-scroll whitespace-nowrap ${isPaused ? 'animation-paused' : ''}`}
          style={{
            animationDuration: `${newsItems.length * 8}s`,
          }}
        >
          {newsItems.map((item, idx) => (
            <span key={idx} className="inline-block px-6 text-sm text-[#b0b0b0] font-medium">
              {item}
              <span className="ml-6 text-white/20">|</span>
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {newsItems.map((item, idx) => (
            <span key={`dup-${idx}`} className="inline-block px-6 text-sm text-[#b0b0b0] font-medium">
              {item}
              <span className="ml-6 text-white/20">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* CSS animation definition */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: inline-block;
          animation: scroll linear infinite;
          will-change: transform;
        }
        .animation-paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}