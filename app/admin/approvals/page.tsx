'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, RefreshCw, Search, AlertCircle, Clock } from 'lucide-react';

export default function AdminApprovalsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Fetch Pending Deposits
      const { data: d } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch Pending Withdrawals
      const { data: w } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setDeposits(d || []);
      setWithdrawals(w || []);
      setLoading(false);
    }
    fetchRequests();
  }, [supabase, router]);

  const handleApproveDeposit = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    try {
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      if (updateError) throw updateError;

      const { data: bal } = await supabase
        .from('user_balances')
        .select('funding_balance')
        .eq('user_id', userId)
        .single();

      const newBalance = (bal?.funding_balance || 0) + amount;
      await supabase
        .from('user_balances')
        .update({ funding_balance: newBalance })
        .eq('user_id', userId);

      setDeposits(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    setActionLoading(id);
    try {
      await supabase.from('deposit_requests').update({ status: 'rejected' }).eq('id', id);
      setDeposits(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawal = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    try {
      const { data: bal } = await supabase
        .from('user_balances')
        .select('funding_balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = bal?.funding_balance || 0;
      if (currentBalance < amount) {
        setError('Insufficient user balance.');
        setActionLoading(null);
        return;
      }

      await supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', id);
      await supabase.from('user_balances').update({ funding_balance: currentBalance - amount }).eq('user_id', userId);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    setActionLoading(id);
    try {
      await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', id);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading approvals...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-[#8e96a3] text-sm">Manage pending deposit and withdrawal requests.</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle size={18} /> {error}</div>}

      <div className="bg-[#141a24] p-1 rounded-xl border border-white/5 w-fit">
        {['deposits', 'withdrawals'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-[#6366f1] text-white' : 'text-[#8e96a3] hover:text-white'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
        {/* --- FIX 1: Horizontal scroll for mobile --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'deposits' && (
                deposits.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-[#8e96a3]">No pending deposits.</td></tr> :
                deposits.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{d.user_id}</td>
                    <td className="px-6 py-3 font-bold text-green-400">{d.amount} USDT</td>
                    <td className="px-6 py-3 text-[#8e96a3] text-xs break-all">TXID: {d.txid}</td>
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {/* --- FIX 2: Stack buttons vertically on mobile --- */}
                      <div className="flex flex-col md:flex-row gap-2">
                        <button onClick={() => handleApproveDeposit(d.id, d.user_id, d.amount)} disabled={!!actionLoading} className="flex items-center justify-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50 w-full md:w-auto">
                          {actionLoading === d.id ? <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full"></span> : <><CheckCircle size={14} /> Approve</>}
                        </button>
                        <button onClick={() => handleRejectDeposit(d.id)} disabled={!!actionLoading} className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50 w-full md:w-auto">
                          {actionLoading === d.id ? <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full"></span> : <><XCircle size={14} /> Reject</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {activeTab === 'withdrawals' && (
                withdrawals.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-[#8e96a3]">No pending withdrawals.</td></tr> :
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{w.user_id}</td>
                    <td className="px-6 py-3 font-bold text-yellow-400">{w.amount} USDT</td>
                    <td className="px-6 py-3 text-[#8e96a3] text-xs break-all">Wallet: {w.wallet_address}</td>
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {/* --- FIX 2: Stack buttons vertically on mobile --- */}
                      <div className="flex flex-col md:flex-row gap-2">
                        <button onClick={() => handleApproveWithdrawal(w.id, w.user_id, w.amount)} disabled={!!actionLoading} className="flex items-center justify-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50 w-full md:w-auto">
                          {actionLoading === w.id ? <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full"></span> : <><CheckCircle size={14} /> Approve</>}
                        </button>
                        <button onClick={() => handleRejectWithdrawal(w.id)} disabled={!!actionLoading} className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50 w-full md:w-auto">
                          {actionLoading === w.id ? <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full"></span> : <><XCircle size={14} /> Reject</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}