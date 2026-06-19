'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Bot, Receipt, TrendingUp, RefreshCw, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, bots: 0, deposits: 0, withdrawals: 0 });

  useEffect(() => {
    async function fetchStats() {
      const { count: users } = await supabase.from('user_balances').select('*', { count: 'exact', head: true });
      const { count: bots } = await supabase.from('active_bots').select('*', { count: 'exact', head: true });
      const { count: deposits } = await supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: withdrawals } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setStats({ users: users || 0, bots: bots || 0, deposits: deposits || 0, withdrawals: withdrawals || 0 });
    }
    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-[#8e96a3] text-sm">Manage users, bots, and platform approvals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition">
            <RefreshCw size={16} /> Refresh
          </button>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0b0e14] border border-[#6366f1]/30 rounded-lg text-sm text-[#6366f1] hover:bg-[#6366f1]/10 transition">
              <LayoutDashboard size={16} /> Switch to User
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users">
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 hover:border-[#6366f1]/30 transition cursor-pointer">
            <Users className="text-blue-400 w-6 h-6 mb-2" />
            <p className="text-[#8e96a3] text-sm">Total Users</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
        </Link>
        <Link href="/admin/bots">
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 hover:border-[#6366f1]/30 transition cursor-pointer">
            <Bot className="text-purple-400 w-6 h-6 mb-2" />
            <p className="text-[#8e96a3] text-sm">Active Bots</p>
            <p className="text-2xl font-bold">{stats.bots}</p>
          </div>
        </Link>
        <Link href="/admin/approvals">
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 hover:border-[#6366f1]/30 transition cursor-pointer">
            <ShieldCheck className="text-orange-400 w-6 h-6 mb-2" />
            <p className="text-[#8e96a3] text-sm">Pending Approvals</p>
            <p className="text-2xl font-bold text-orange-400">{stats.deposits + stats.withdrawals}</p>
          </div>
        </Link>
        <Link href="/admin/receipts">
          <div className="bg-[#141a24] border border-white/5 rounded-xl p-6 hover:border-[#6366f1]/30 transition cursor-pointer">
            <Receipt className="text-yellow-400 w-6 h-6 mb-2" />
            <p className="text-[#8e96a3] text-sm">Receipts</p>
            <p className="text-2xl font-bold">Generator</p>
          </div>
        </Link>
      </div>
    </div>
  );
}