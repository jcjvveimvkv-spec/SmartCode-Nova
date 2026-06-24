'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ActivityToast from '@/app/components/ActivityToast';

interface ToastData {
  id: string;
  message: string; // Now accepts HTML
  type: 'deposit' | 'withdrawal' | 'trade';
}

interface ToastContextType {
  triggerToast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  const [lastShown, setLastShown] = useState<number>(0);
  const [queue, setQueue] = useState<Omit<ToastData, 'id'>[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Helper: generate random account ending from user ID
  const getAccountEnding = (userId: string) => {
    return userId.slice(-4).toUpperCase();
  };

  // Helper: format time ago
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Trigger a toast (10-minute cooldown)
  const triggerToast = (data: Omit<ToastData, 'id'>) => {
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (now - lastShown >= TEN_MINUTES) {
      setCurrentToast({ ...data, id: crypto.randomUUID() });
      setLastShown(now);
    } else {
      setQueue((prev) => [...prev, data]);
    }
  };

  // Process the queue when the current toast closes
  const handleToastClose = () => {
    setCurrentToast(null);
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (queue.length > 0 && now - lastShown >= TEN_MINUTES) {
      const next = queue[0];
      setCurrentToast({ ...next, id: crypto.randomUUID() });
      setLastShown(now);
      setQueue((prev) => prev.slice(1));
    }
  };

  // Fetch latest platform activity every 60 seconds
  useEffect(() => {
    const fetchActivity = async () => {
      const { data: deposits } = await supabase
        .from('deposit_requests')
        .select('amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: trades } = await supabase
        .from('bot_trade_logs')
        .select('profit_usdt, pair, executed_at, user_id')
        .order('executed_at', { ascending: false })
        .limit(1);

      // Build rich HTML messages
      const events = [
        ...(deposits || []).map(d => ({
          type: 'deposit' as const,
          message: `📥 Account <strong>****${getAccountEnding(d.user_id)}</strong> deposited <strong style="color:#10b981;">${Number(d.amount).toFixed(2)} USDT</strong> • ${timeAgo(d.created_at)}`
        })),
        ...(withdrawals || []).map(w => ({
          type: 'withdrawal' as const,
          message: `📤 Account <strong>****${getAccountEnding(w.user_id)}</strong> withdrew <strong style="color:#f59e0b;">${Number(w.amount).toFixed(2)} USDT</strong> • ${timeAgo(w.created_at)}`
        })),
        ...(trades || []).map(t => ({
          type: 'trade' as const,
          message: `📈 Account <strong>****${getAccountEnding(t.user_id)}</strong> settled <strong style="color:#3b82f6;">${t.pair}</strong> • <strong style="color:#10b981;">+${Number(t.profit_usdt).toFixed(2)} USDT</strong> • ${timeAgo(t.executed_at)}`
        })),
      ];

      if (events.length > 0) {
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        triggerToast(randomEvent);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      {children}
      <ActivityToast toast={currentToast} onClose={handleToastClose} />
    </ToastContext.Provider>
  );
}