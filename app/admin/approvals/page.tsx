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
  Mail
} from 'lucide-react';

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

  // ============================================================
  // FETCH USER INFO - FALLBACK FUNCTION
  // ============================================================
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

  // ============================================================
  // FETCH USERS BATCH
  // ============================================================
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

  // ============================================================
  // LOAD REQUESTS
  // ============================================================
  useEffect(() => {
    async function fetchRequests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      setLoading(true);

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

      console.log('📊 Deposits with user data:', depositsWithNames);
      console.log('📊 Withdrawals with user data:', withdrawalsWithNames);

      setDeposits(depositsWithNames);
      setWithdrawals(withdrawalsWithNames);
      setLoading(false);
    }
    fetchRequests();
  }, [supabase, router]);

  // ============================================================
  // REFRESH DEPOSITS
  // ============================================================
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

  // ============================================================
  // REFRESH WITHDRAWALS
  // ============================================================
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

  // ============================================================
  // COPY TO CLIPBOARD
  // ============================================================
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ============================================================
  // REFERRAL ELIGIBILITY CHECK - FIXED
  // ============================================================
  const checkReferralEligibility = async (userId: string, depositAmount: number) => {
    try {
      console.log(`🔍 Checking referral for user: ${userId}, deposit: ${depositAmount} USDT`);
      
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-referral-eligibility',
          referred_user_id: userId
        })
      });

      const result = await response.json();
      console.log('📊 Referral check result:', result);

      if (result.success) {
        setSuccessMessage(`✅ ${result.message}`);
        await refreshDeposits();
        return result;
      } else {
        // Only show error if it's not "No pending referral found"
        if (result.error && !result.error.includes('No pending referral')) {
          setError(`⚠️ Referral: ${result.error}`);
        } else {
          console.log('ℹ️ No pending referral found - this is normal if user was not referred');
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Error checking referral:', error);
      return null;
    }
  };

  // ============================================================
  // APPROVE DEPOSIT - FIXED
  // ============================================================
  const handleApproveDeposit = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    setError('');
    setSuccessMessage('');
    
    try {
      // 1. Approve the deposit
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      if (updateError) throw updateError;

      // 2. Update user's funding balance
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

      // 3. Remove from pending list
      setDeposits(prev => prev.filter(d => d.id !== id));
      
      // 4. ✅ Check referral eligibility with better logging
      console.log(`🔍 Checking referral for user ${userId} with deposit ${amount} USDT`);
      await checkReferralEligibility(userId, amount);
      
      // 5. Refresh deposits
      await refreshDeposits();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // REJECT DEPOSIT
  // ============================================================
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

  // ============================================================
  // APPROVE WITHDRAWAL
  // ============================================================
  const handleApproveWithdrawal = async (id: string, userId: string, amount: number) => {
    setActionLoading(id);
    setError('');
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
      
      await refreshWithdrawals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // REJECT WITHDRAWAL
  // ============================================================
  const handleRejectWithdrawal = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', id);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      await refreshWithdrawals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // STATS
  // ============================================================
  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] text-white gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      <p className="text-[#8e96a3]">Loading approvals...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Approvals
          </h1>
          <p className="text-[#8e96a3] text-sm">Manage pending deposit and withdrawal requests</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition"
        >
          <RefreshCw size={16} className="text-[#8e96a3]" /> 
          <span className="text-[#8e96a3]">Refresh</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8e96a3] text-xs uppercase tracking-wider">Pending Deposits</p>
              <p className="text-2xl font-bold text-white mt-1">{deposits.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <ArrowDownRight size={20} className="text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8e96a3] text-xs uppercase tracking-wider">Deposit Volume</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{totalDeposits.toFixed(2)} USDT</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8e96a3] text-xs uppercase tracking-wider">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-white mt-1">{withdrawals.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8e96a3] text-xs uppercase tracking-wider">Withdrawal Volume</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{totalWithdrawals.toFixed(2)} USDT</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      {/* TABS */}
      <div className="bg-[#141a24] p-1 rounded-xl border border-white/5 w-fit">
        {['deposits', 'withdrawals'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)} 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === tab 
                ? 'bg-[#6366f1] text-white' 
                : 'text-[#8e96a3] hover:text-white'
            }`}
          >
            {tab === 'deposits' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab 
                ? 'bg-white/20 text-white' 
                : 'bg-[#0b0e14] text-[#8e96a3]'
            }`}>
              {tab === 'deposits' ? deposits.length : withdrawals.length}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-[#0b0e14] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">User</th>
                <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Details</th>
                <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium">Date</th>
                <th className="px-6 py-4 text-[#8e96a3] text-xs uppercase tracking-wider font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* DEPOSITS */}
              {activeTab === 'deposits' && (
                deposits.length === 0 ? 
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8e96a3]">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={32} className="text-green-500/30" />
                        <p>No pending deposits</p>
                        <p className="text-xs">All deposit requests have been processed</p>
                      </div>
                    </td>
                  </tr> :
                  deposits.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {d.user_name || `User ${d.user_id.slice(0, 8)}`}
                            </p>
                            <div className="flex items-center gap-1">
                              <Mail size={10} className="text-[#8e96a3]" />
                              <p className="text-[#8e96a3] text-xs">
                                {d.user_email && d.user_email !== 'No email' && d.user_email !== '' 
                                  ? d.user_email 
                                  : `ID: ${d.user_id.slice(0, 8)}...`}
                              </p>
                            </div>
                            <p className="text-[#8e96a3] text-[10px] font-mono">{d.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-green-400">{d.amount.toFixed(2)} USDT</span>
                          <span className="text-[10px] text-[#8e96a3] uppercase tracking-wider">Deposit</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8e96a3] text-xs font-mono">{d.txid?.slice(0, 12)}...</span>
                          <button
                            onClick={() => copyToClipboard(d.txid, `tx-${d.id}`)}
                            className="text-[#8e96a3] hover:text-white transition"
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
                        <div className="flex items-center gap-2 text-[#8e96a3] text-xs">
                          <Clock size={14} />
                          {new Date(d.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button 
                            onClick={() => handleApproveDeposit(d.id, d.user_id, d.amount)} 
                            disabled={!!actionLoading} 
                            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50 w-full sm:w-auto"
                          >
                            {actionLoading === d.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full"></span>
                            ) : (
                              <><CheckCircle size={14} /> Approve</>
                            )}
                          </button>
                          <button 
                            onClick={() => handleRejectDeposit(d.id)} 
                            disabled={!!actionLoading} 
                            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50 w-full sm:w-auto"
                          >
                            {actionLoading === d.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full"></span>
                            ) : (
                              <><XCircle size={14} /> Reject</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}

              {/* WITHDRAWALS */}
              {activeTab === 'withdrawals' && (
                withdrawals.length === 0 ? 
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8e96a3]">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={32} className="text-green-500/30" />
                        <p>No pending withdrawals</p>
                        <p className="text-xs">All withdrawal requests have been processed</p>
                      </div>
                    </td>
                  </tr> :
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {w.user_name || `User ${w.user_id?.slice(0, 8) || 'Unknown'}`}
                            </p>
                            <div className="flex items-center gap-1">
                              <Mail size={10} className="text-[#8e96a3]" />
                              <p className="text-[#8e96a3] text-xs">
                                {w.user_email && w.user_email !== 'No email' && w.user_email !== '' 
                                  ? w.user_email 
                                  : `ID: ${w.user_id?.slice(0, 8) || 'Unknown'}...`}
                              </p>
                            </div>
                            <p className="text-[#8e96a3] text-[10px] font-mono">{w.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-yellow-400">{w.amount.toFixed(2)} USDT</span>
                          <span className="text-[10px] text-[#8e96a3] uppercase tracking-wider">Withdrawal</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8e96a3] text-xs font-mono">{w.wallet_address?.slice(0, 8)}...{w.wallet_address?.slice(-6)}</span>
                          <button
                            onClick={() => copyToClipboard(w.wallet_address, `wallet-${w.id}`)}
                            className="text-[#8e96a3] hover:text-white transition"
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
                        <div className="flex items-center gap-2 text-[#8e96a3] text-xs">
                          <Clock size={14} />
                          {new Date(w.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button 
                            onClick={() => handleApproveWithdrawal(w.id, w.user_id, w.amount)} 
                            disabled={!!actionLoading} 
                            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition text-xs disabled:opacity-50 w-full sm:w-auto"
                          >
                            {actionLoading === w.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full"></span>
                            ) : (
                              <><CheckCircle size={14} /> Approve</>
                            )}
                          </button>
                          <button 
                            onClick={() => handleRejectWithdrawal(w.id)} 
                            disabled={!!actionLoading} 
                            className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition text-xs disabled:opacity-50 w-full sm:w-auto"
                          >
                            {actionLoading === w.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full"></span>
                            ) : (
                              <><XCircle size={14} /> Reject</>
                            )}
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