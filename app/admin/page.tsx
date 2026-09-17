'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Bot, Receipt, ShieldCheck, RefreshCw, LayoutDashboard,
  AlertCircle
} from 'lucide-react';

// ---------- Animated counter ----------
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) { setValue(target); return; }

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(from + diff * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

// ---------- Stat card ----------
function StatCard({
  href,
  icon: Icon,
  iconColor,
  label,
  value,
  valueColor,
  delay = 0,
}: {
  href: string;
  icon: any;
  iconColor: string;
  label: string;
  value: number | string;
  valueColor?: string;
  delay?: number;
}) {
  const isNumber = typeof value === 'number';
  const animatedValue = useCountUp(isNumber ? value : 0, 900);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} className="block">
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4 sm:p-6 hover:border-[#6366f1]/30 transition cursor-pointer h-full">
          <Icon className={`${iconColor} w-5 h-5 sm:w-6 sm:h-6 mb-2`} />
          <p className="text-[#8e96a3] text-xs sm:text-sm truncate">{label}</p>
          <p className={`text-xl sm:text-2xl font-bold tabular-nums truncate ${valueColor || 'text-white'}`}>
            {isNumber ? animatedValue : value}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------- Skeleton ----------
function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="h-10 flex-1 sm:w-28 sm:flex-none rounded-lg bg-white/5 animate-pulse" />
          <div className="h-10 flex-1 sm:w-32 sm:flex-none rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#141a24] border border-white/5 rounded-xl p-4 sm:p-6 space-y-3">
            <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-12 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [stats, setStats] = useState({ users: 0, bots: 0, deposits: 0, withdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersRes, botsRes, depositsRes, withdrawalsRes] = await Promise.all([
        supabase.from('user_balances').select('*', { count: 'exact', head: true }),
        supabase.from('active_bots').select('*', { count: 'exact', head: true }),
        supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      // Surface the first error we hit, but don't block the whole page
      const firstError =
        usersRes.error || botsRes.error || depositsRes.error || withdrawalsRes.error;

      if (firstError) {
        setError(firstError.message);
      }

      setStats({
        users: usersRes.count || 0,
        bots: botsRes.count || 0,
        deposits: depositsRes.count || 0,
        withdrawals: withdrawalsRes.count || 0,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <AdminDashboardSkeleton />;

  const pendingTotal = stats.deposits + stats.withdrawals;

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Admin Dashboard</h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm">Manage users, bots, and platform approvals.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={fetchStats}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition"
          >
            <RefreshCw size={16} className="shrink-0" />
            Refresh
          </button>
          <Link href="/dashboard" className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#0b0e14] border border-[#6366f1]/30 rounded-lg text-xs sm:text-sm text-[#6366f1] hover:bg-[#6366f1]/10 transition whitespace-nowrap">
              <LayoutDashboard size={16} className="shrink-0" />
              Switch to User
            </button>
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 text-xs sm:text-sm"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">
            Couldn't load some stats: {error}
          </span>
        </motion.div>
      )}

      {/* Stats grid — 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          href="/admin/users"
          icon={Users}
          iconColor="text-blue-400"
          label="Total Users"
          value={stats.users}
          delay={0}
        />
        <StatCard
          href="/admin/bots"
          icon={Bot}
          iconColor="text-purple-400"
          label="Active Bots"
          value={stats.bots}
          delay={0.05}
        />
        <StatCard
          href="/admin/approvals"
          icon={ShieldCheck}
          iconColor="text-orange-400"
          label="Pending"
          value={pendingTotal}
          valueColor="text-orange-400"
          delay={0.1}
        />
        <StatCard
          href="/admin/receipts"
          icon={Receipt}
          iconColor="text-yellow-400"
          label="Receipts"
          value="Generator"
          delay={0.15}
        />
      </div>

      {/* Quick actions row (visible on mobile, subtle on desktop) */}
      {pendingTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-3 sm:p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <ShieldCheck size={18} className="text-orange-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {pendingTotal} item{pendingTotal === 1 ? '' : 's'} awaiting your review
                </p>
                <p className="text-xs text-[#8e96a3] mt-0.5">
                  {stats.deposits} deposit{stats.deposits === 1 ? '' : 's'} · {stats.withdrawals} withdrawal{stats.withdrawals === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Link href="/admin/approvals" className="w-full sm:w-auto shrink-0">
              <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap">
                Review now
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
