// /app/admin/approvals/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  Mail,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  txid: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

// ---------- Skeleton ----------
function ApprovalsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-white/5 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-full sm:w-28 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#141a24] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-12 w-full max-w-md rounded-xl bg-white/5 animate-pulse" />
      <div className="bg-[#141a24] border border-white/5 rounded-xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 sm:h-16 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminApprovalsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const fetchUserInfo = async (userId: string): Promise<{ name: string; email: string }> => {
    try {
      if (!userId) {
        return { name: 'Unknown User', email: 'No email' };
      }

      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('full_name, email')
        .eq('user_id', userId)
        .single();

      if (!balanceError && balanceData) {
        const name = balanceData.full_name || '';
        const email = balanceData.email || '';

        if (email || name) {
          return {
            name: name || `User ${userId.slice(0, 8)}`,
            email: email || 'No email'
          };
        }
      }

      return {
        name: `User ${userId.slice(0, 8)}`,
        email: 'No email'
      };
    } catch (error) {
      console.error(`❌ Error fetching user ${userId}:`, error);
      return {
        name: `User ${userId.slice(0, 8)}`,
        email: 'No email'
      };
    }
  };

  const fetchUsersBatch = async (userIds: string[]): Promise<Record<string, { full_name: string; email: string }>> => {
    try {
      if (userIds.length === 0) return {};

      const { data: users, error } = await supabase
        .from('user_balances')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (error) {
        console.error('❌ Error fetching users batch:', error);
        return {};
      }

      const userMap: Record<string, { full_name: string; email: string }> = {};
      users?.forEach((user: any) => {
        userMap[user.user_id] = {
          full_name: user.full_name || '',
          email: user.email || ''
        };
      });

      return userMap;
    } catch (error) {
      console.error('❌ Error in fetchUsersBatch:', error);
      return {};
    }
  };

  // ---------- LOAD ----------
  const loadRequests = async (showSkeleton = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    if (showSkeleton) setLoading(true);

    const { data: depositsData } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (withdrawalsError) {
      console.error('❌ Error fetching withdrawals:', withdrawalsError);
    }

    const depositUserIds = (depositsData || []).map(d => d.user_id).filter(Boolean);
    const withdrawalUserIds = (withdrawalsData || []).map(w => w.user_id).filter(Boolean);
    const allUserIds = [...new Set([...depositUserIds, ...withdrawalUserIds])];

    const userMap = await fetchUsersBatch(allUserIds);

    const depositsWithNames = (depositsData || []).map((deposit) => {
      const userInfo = userMap[deposit.user_id] || { full_name: '', email: '' };
      return {
        ...deposit,
        user_name: userInfo.full_name || `User ${deposit.user_id?.slice(0, 8) || 'Unknown'}`,
        user_email: userInfo.email || 'No email'
      };
    });

    const withdrawalsWithNames = (withdrawalsData || []).map((withdrawal) => {
      const userInfo = userMap[withdrawal.user_id] || { full_name: '', email: '' };
      return {
        ...withdrawal,
        user_name: userInfo.full_name || `User ${withdrawal.user_id?.slice(0, 8) || 'Unknown'}`,
        user_email: userInfo.email || 'No email'
      };
    });

    setDeposits(depositsWithNames);
    setWithdrawals(withdrawalsWithNames);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setError('');
    setSuccessMessage('');
    await loadRequests(false);
  };

  const refreshDeposits = async () => {
    const { data: depositsData } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const depositUserIds = (depositsData || []).map(d => d.user_id).filter(Boolean);
    const userMap = await fetchUsersBatch(depositUserIds);

    const depositsWithNames = (depositsData || []).map((deposit) => {
      const userInfo = userMap[deposit.user_id] || { full_name: '', email: '' };
      return {
        ...deposit,
        user_name: userInfo.full_name || `User ${deposit.user_id?.slice(0, 8) || 'Unknown'}`,
        user_email: userInfo.email || 'No email'
      };
    });

    setDeposits(depositsWithNames);
  };

  const refreshWithdrawals = async () => {
    const { data: withdrawalsData } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const withdrawalUserIds = (withdrawalsData || []).map(w => w.user_id).filter(Boolean);
    const userMap = await fetchUsersBatch(withdrawalUserIds);

    const withdrawalsWithNames = (withdrawalsData || []).map((withdrawal) => {
      const userInfo = userMap[withdrawal.user_id] || { full_name: '', email: '' };
      return {
        ...withdrawal,
        user_name: userInfo.full_name || `User ${withdrawal.user_id?.slice(0, 8) || 'Unknown'}`,
        user_email: userInfo.email || 'No email'
      };
    });

    setWithdrawals(withdrawalsWithNames);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkReferralEligibility = async (userId: string, depositAmount: number) => {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-referral-eligibility',
          referred_user_id: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(`✅ ${result.message}`);
        await refreshDeposits();
        return result;
      } else {
        if (result.error && !result.error.includes('No pending referral')) {
          setError(`⚠️ Referral: ${result.error}`);
        } else {
          console.log('ℹ️ No pending referral found');
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Error checking referral:', error);
      return null;
    }
  };

  const sendInAppNotification = async (userId: string, type: string, title: string, message: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, title, message })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ In-app notification sent: ${title}`);
        return true;
      } else {
        console.error('❌ API notification error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ In-app notification error:', error);
      return false;
    }
  };

  const handleApproveDeposit = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    setError('');
    setSuccessMessage('');

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
      await checkReferralEligibility(userId, amount);
      await refreshDeposits();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    setActionLoading(id);
    setError('');
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
    setError('');
    setSuccessMessage('');

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

      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved' })
        .eq('id', id);

      if (updateError) throw updateError;

      await supabase
        .from('user_balances')
        .update({ funding_balance: currentBalance - amount })
        .eq('user_id', userId);

      setWithdrawals(prev => prev.filter(w => w.id !== id));

      await sendInAppNotification(
        userId,
        'withdrawal_approved',
        '✅ Withdrawal Approved',
        `Your withdrawal of ${amount} USDT has been approved and processed.`
      );

      setSuccessMessage(`✅ Withdrawal of ${amount} USDT approved successfully! User notified.`);
      await refreshWithdrawals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    setError('');
    setSuccessMessage('');

    try {
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (updateError) throw updateError;

      setWithdrawals(prev => prev.filter(w => w.id !== id));

      await sendInAppNotification(
        userId,
        'withdrawal_rejected',
        '❌ Withdrawal Rejected',
        `Your withdrawal of ${amount} USDT has been rejected.`
      );

      setSuccessMessage(`❌ Withdrawal of ${amount} USDT rejected. User notified.`);
      await refreshWithdrawals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  if (loading) return <ApprovalsSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Approvals
          </h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm">Manage pending deposit and withdrawal requests</p>
        </div>
        <button
          onClick={handleRefresh}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition"
        >
          <RefreshCw size={16} className="text-[#8e96a3] shrink-0" />
          <span className="text-[#8e96a3]">Refresh</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[#8e96a3] text-[10px] sm:text-xs uppercase tracking-wider truncate">Pending Deposits</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 tabular-nums truncate">{deposits.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowDownRight size={16} className="sm:hidden text-green-400" />
              <ArrowDownRight size={20} className="hidden sm:block text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-xl p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[#8e96a3] text-[10px] sm:text-xs uppercase tracking-wider truncate">Deposit Volume</p>
              <p className="text-lg sm:text-2xl font-bold text-green-400 mt-1 tabular-nums truncate">{totalDeposits.toFixed(2)}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Wallet size={16} className="sm:hidden text-green-400" />
              <Wallet size={20} className="hidden sm:block text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-xl p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[#8e96a3] text-[10px] sm:text-xs uppercase tracking-wider truncate">Pending Withdrawals</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 tabular-nums truncate">{withdrawals.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} className="sm:hidden text-yellow-400" />
              <ArrowUpRight size={20} className="hidden sm:block text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-xl p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[#8e96a3] text-[10px] sm:text-xs uppercase tracking-wider truncate">Withdrawal Volume</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-400 mt-1 tabular-nums truncate">{totalWithdrawals.toFixed(2)}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Wallet size={16} className="sm:hidden text-yellow-400" />
              <Wallet size={20} className="hidden sm:block text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words">{error}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400 text-sm"
          >
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="bg-[#141a24] p-1 rounded-xl border border-white/5 flex w-full sm:w-fit">
        {(['deposits', 'withdrawals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === tab
                ? 'bg-[#6366f1] text-white'
                : 'text-[#8e96a3] hover:text-white'
            }`}
          >
            {tab === 'deposits' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full tabular-nums ${
              activeTab === tab
                ? 'bg-white/20 text-white'
                : 'bg-[#0b0e14] text-[#8e96a3]'
            }`}>
              {tab === 'deposits' ? deposits.length : withdrawals.length}
            </span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">

        {/* DEPOSITS */}
        {activeTab === 'deposits' && (
          deposits.length === 0 ? (
            <EmptyState type="deposits" />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {deposits.map((d) => (
                  <div key={d.id} className="p-3 space-y-3">
                    {/* User row */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <User size={14} className="text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{d.user_name || `User ${d.user_id.slice(0, 8)}`}</p>
                        <p className="text-[#8e96a3] text-xs truncate">{d.user_email && d.user_email !== 'No email' ? d.user_email : `ID: ${d.user_id.slice(0, 8)}...`}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-green-400 font-bold text-sm tabular-nums">{d.amount.toFixed(2)}</p>
                        <p className="text-[9px] text-[#8e96a3] uppercase tracking-wider">USDT</p>
                      </div>
                    </div>

                    {/* Detail rows */}
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                      <span className="text-[#8e96a3]">TXID</span>
                      <span className="flex items-center justify-end gap-1.5 min-w-0">
                        <span className="font-mono text-[#8e96a3] truncate">{d.txid?.slice(0, 12)}...</span>
                        <button
                          onClick={() => copyToClipboard(d.txid, `tx-${d.id}`)}
                          aria-label="Copy TXID"
                          className="text-[#8e96a3] hover:text-white transition shrink-0"
                        >
                          {copied === `tx-${d.id}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </span>

                      <span className="text-[#8e96a3]">Date</span>
                      <span className="text-right text-[#8e96a3] tabular-nums">
                        {new Date(d.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApproveDeposit(d.id, d.user_id, d.amount)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                      >
                        {actionLoading === d.id ? (
                          <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full" />
                        ) : (
                          <><CheckCircle size={14} /> Approve</>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(d.id)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#0b0e14] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">User</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Amount</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">TXID</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Date</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">{d.user_name || `User ${d.user_id.slice(0, 8)}`}</p>
                              <div className="flex items-center gap-1">
                                <Mail size={10} className="text-[#8e96a3] shrink-0" />
                                <p className="text-[#8e96a3] text-xs truncate">
                                  {d.user_email && d.user_email !== 'No email' && d.user_email !== ''
                                    ? d.user_email
                                    : `ID: ${d.user_id.slice(0, 8)}...`}
                                </p>
                              </div>
                              <p className="text-[#8e96a3] text-[10px] font-mono truncate">{d.user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-green-400 tabular-nums">{d.amount.toFixed(2)} USDT</span>
                            <span className="text-[10px] text-[#8e96a3] uppercase tracking-wider">Deposit</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#8e96a3] text-xs font-mono">{d.txid?.slice(0, 12)}...</span>
                            <button
                              onClick={() => copyToClipboard(d.txid, `tx-${d.id}`)}
                              className="text-[#8e96a3] hover:text-white transition"
                              aria-label="Copy TXID"
                            >
                              {copied === `tx-${d.id}` ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[#8e96a3] text-xs tabular-nums">
                            <Clock size={14} />
                            {new Date(d.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveDeposit(d.id, d.user_id, d.amount)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50"
                            >
                              {actionLoading === d.id ? (
                                <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full" />
                              ) : (
                                <><CheckCircle size={14} /> Approve</>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(d.id)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50"
                            >
                              {actionLoading === d.id ? (
                                <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full" />
                              ) : (
                                <><XCircle size={14} /> Reject</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          withdrawals.length === 0 ? (
            <EmptyState type="withdrawals" />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <User size={14} className="text-yellow-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{w.user_name || `User ${w.user_id?.slice(0, 8) || 'Unknown'}`}</p>
                        <p className="text-[#8e96a3] text-xs truncate">{w.user_email && w.user_email !== 'No email' ? w.user_email : `ID: ${w.user_id?.slice(0, 8) || 'Unknown'}...`}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-yellow-400 font-bold text-sm tabular-nums">{w.amount.toFixed(2)}</p>
                        <p className="text-[9px] text-[#8e96a3] uppercase tracking-wider">USDT</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                      <span className="text-[#8e96a3]">Wallet</span>
                      <span className="flex items-center justify-end gap-1.5 min-w-0">
                        <span className="font-mono text-[#8e96a3] truncate">{w.wallet_address?.slice(0, 8)}...{w.wallet_address?.slice(-6)}</span>
                        <button
                          onClick={() => copyToClipboard(w.wallet_address, `wallet-${w.id}`)}
                          aria-label="Copy wallet address"
                          className="text-[#8e96a3] hover:text-white transition shrink-0"
                        >
                          {copied === `wallet-${w.id}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      </span>

                      <span className="text-[#8e96a3]">Date</span>
                      <span className="text-right text-[#8e96a3] tabular-nums">
                        {new Date(w.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApproveWithdrawal(w.id, w.user_id, w.amount)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                      >
                        {actionLoading === w.id ? (
                          <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full" />
                        ) : (
                          <><CheckCircle size={14} /> Approve</>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(w.id, w.user_id, w.amount)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#0b0e14] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">User</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Amount</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Wallet</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Date</th>
                      <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">{w.user_name || `User ${w.user_id?.slice(0, 8) || 'Unknown'}`}</p>
                              <div className="flex items-center gap-1">
                                <Mail size={10} className="text-[#8e96a3] shrink-0" />
                                <p className="text-[#8e96a3] text-xs truncate">
                                  {w.user_email && w.user_email !== 'No email' && w.user_email !== ''
                                    ? w.user_email
                                    : `ID: ${w.user_id?.slice(0, 8) || 'Unknown'}...`}
                                </p>
                              </div>
                              <p className="text-[#8e96a3] text-[10px] font-mono truncate">{w.user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-yellow-400 tabular-nums">{w.amount.toFixed(2)} USDT</span>
                            <span className="text-[10px] text-[#8e96a3] uppercase tracking-wider">Withdrawal</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#8e96a3] text-xs font-mono">{w.wallet_address?.slice(0, 8)}...{w.wallet_address?.slice(-6)}</span>
                            <button
                              onClick={() => copyToClipboard(w.wallet_address, `wallet-${w.id}`)}
                              className="text-[#8e96a3] hover:text-white transition"
                              aria-label="Copy wallet address"
                            >
                              {copied === `wallet-${w.id}` ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[#8e96a3] text-xs tabular-nums">
                            <Clock size={14} />
                            {new Date(w.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id, w.user_id, w.amount)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50"
                            >
                              {actionLoading === w.id ? (
                                <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full" />
                              ) : (
                                <><CheckCircle size={14} /> Approve</>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id, w.user_id, w.amount)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50"
                            >
                              {actionLoading === w.id ? (
                                <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full" />
                              ) : (
                                <><XCircle size={14} /> Reject</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

// ---------- Empty state ----------
function EmptyState({ type }: { type: 'deposits' | 'withdrawals' }) {
  return (
    <div className="px-4 py-10 sm:py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-green-500/60" />
      </div>
      <p className="text-white font-medium">
        No pending {type}
      </p>
      <p className="text-[#8e96a3] text-xs sm:text-sm mt-1">
        All {type} requests have been processed
      </p>
    </div>
  );
}
