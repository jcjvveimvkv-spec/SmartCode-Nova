'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Copy, RefreshCw, Plus, Users, DollarSign, Gift, Search, X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Referral {
  id: number;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: string;
  amount_usdt: number;
  referred_deposit: number;
  min_deposit_required: number;
  created_at: string;
  paid_at: string | null;
  referrer_email?: string | null;
  referrer_name?: string | null;
  referrer_display?: string;
  referred_email?: string | null;
  referred_name?: string | null;
  referred_display?: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  referral_code?: string | null;
  total_clicks?: number;
  total_signups?: number;
  total_earned_usdt?: number;
}

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function AdminReferralPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReferral, setNewReferral] = useState({
    userId: '',
    userEmail: '',
    bonusAmount: 7,
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [userPagination, setUserPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalPaid: 0,
    totalPending: 0,
    totalApproved: 0, // NEW: Approved but not yet paid
    totalAmount: 0,
    pendingPayoutAmount: 0, // NEW: Total amount ready for payout
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadReferralData(),
      loadAllUsers('', 1)
    ]);
  };

  const loadAllUsers = async (search: string = '', page: number = 1) => {
    try {
      console.log('🔍 Loading users...', { search, page });
      setLoading(true);
      
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get-users',
          search: search,
          page: page,
          limit: 10
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUsers(result.data);
        setUserPagination({
          page: result.page || 1,
          totalPages: result.totalPages || 1,
          totalItems: result.total || 0,
          itemsPerPage: result.limit || 10,
        });
        setWarning(null);
      } else {
        setUsers([]);
        setWarning(result.warning || 'No users found');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= userPagination.totalPages) {
      setUserPagination({ ...userPagination, page: newPage });
      loadAllUsers(userSearch, newPage);
    }
  };

  const loadReferralData = async () => {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all-referrals' }),
      });

      const result = await response.json();

      if (result.success) {
        const referralsData = result.data || [];
        setReferrals(referralsData);
        setFilteredReferrals(referralsData);

        const total = referralsData.length;
        const paid = referralsData.filter((r: any) => r.status === 'paid').length;
        const pending = referralsData.filter((r: any) => r.status === 'pending').length;
        const approved = referralsData.filter((r: any) => r.status === 'approved').length;
        const amount = referralsData.reduce((sum: number, r: any) => sum + (r.amount_usdt || 7), 0);
        
        // Calculate pending payout amount (approved referrals waiting for payment)
        const pendingPayoutAmount = referralsData
          .filter((r: any) => r.status === 'approved')
          .reduce((sum: number, r: any) => sum + (r.amount_usdt || 7), 0);

        setStats({
          totalReferrals: total,
          totalPaid: paid,
          totalPending: pending,
          totalApproved: approved,
          totalAmount: amount,
          pendingPayoutAmount: pendingPayoutAmount,
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

  // ============================================================
  // UPDATE REFERRAL STATUS - MARK AS APPROVED (Ready for payout)
  // ============================================================
  const updateReferralStatus = async (id: number, status: string) => {
    setActionLoading(`status-${id}`);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          referral_id: id,
          status: status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(`✅ Referral status updated to ${status}`);
        await loadReferralData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error updating referral');
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      setErrorMessage('Error updating referral');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // PAY REFERRAL BONUS - NEW FUNCTION (GOLDEN RULE)
  // ============================================================
  const handlePayBonus = async (referralId: number) => {
    setActionLoading(`pay-${referralId}`);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay-bonus',
          referral_id: referralId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(`✅ ${result.message}`);
        await loadReferralData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(result.error || 'Error paying bonus');
      }
    } catch (error) {
      console.error('Error paying bonus:', error);
      setErrorMessage('Error paying bonus');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // GENERATE REFERRAL LINK
  // ============================================================
  const generateReferralLink = async () => {
    if (!newReferral.userId) {
      setErrorMessage('Please select a user');
      return;
    }

    setActionLoading('generate');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-generate-link',
          user_id: newReferral.userId,
          bonus_amount: newReferral.bonusAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const link = result.data.link || `${window.location.origin}/signup?ref=${result.data.code}`;
        setGeneratedLink(link);
        await loadAllData();
        setSuccessMessage('✅ Referral link created successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error generating referral link');
      }
    } catch (error) {
      console.error('Error generating referral link:', error);
      setErrorMessage('Error generating referral link');
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFilteredUsers = () => {
    if (!userSearch) return users;
    return users.filter(u => 
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
    );
  };

  const selectUser = (user: UserData) => {
    setNewReferral({
      ...newReferral,
      userId: user.id,
      userEmail: user.email,
    });
    setUserSearch(user.email);
    setShowDropdown(false);
  };

  const handleUserSearch = async (value: string) => {
    setUserSearch(value);
    if (value.length > 1) {
      setShowDropdown(true);
      await loadAllUsers(value, 1);
    } else if (value.length === 0) {
      setShowDropdown(false);
      await loadAllUsers('', 1);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReferrals(referrals);
    } else {
      const filtered = referrals.filter(r => 
        (r.referrer_display && r.referrer_display.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.referred_display && r.referred_display.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.referral_code && r.referral_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredReferrals(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, referrals]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReferrals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  // ============================================================
  // GET STATUS COLOR AND LABEL
  // ============================================================
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'pending':
        return { 
          bg: 'bg-yellow-500/20', 
          text: 'text-yellow-400',
          label: '⏳ Pending (Waiting for Deposit)',
          icon: <Clock size={14} className="text-yellow-400" />
        };
      case 'approved':
        return { 
          bg: 'bg-blue-500/20', 
          text: 'text-blue-400',
          label: '✅ Approved (Ready to Pay)',
          icon: <CheckCircle size={14} className="text-blue-400" />
        };
      case 'paid':
        return { 
          bg: 'bg-green-500/20', 
          text: 'text-green-400',
          label: '💰 Paid',
          icon: <CheckCircle size={14} className="text-green-400" />
        };
      case 'rejected':
        return { 
          bg: 'bg-red-500/20', 
          text: 'text-red-400',
          label: '❌ Rejected',
          icon: <AlertCircle size={14} className="text-red-400" />
        };
      default:
        return { 
          bg: 'bg-gray-500/20', 
          text: 'text-gray-400',
          label: status,
          icon: null
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">📊 Referral System Management</h1>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setGeneratedLink('');
              setNewReferral({ userId: '', userEmail: '', bonusAmount: 7 });
              setUserSearch('');
              setWarning(null);
              setErrorMessage('');
              setSuccessMessage('');
              loadAllUsers('', 1);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Create Referral Link
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle size={18} />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {warning && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-6">
            ⚠️ {warning}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">Total Referrals</p>
            <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
          </div>
          <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">Pending (Deposit)</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.totalPending}</p>
          </div>
          <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">Approved (Ready)</p>
            <p className="text-2xl font-bold text-blue-500">{stats.totalApproved}</p>
          </div>
          <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">Paid</p>
            <p className="text-2xl font-bold text-green-500">{stats.totalPaid}</p>
          </div>
          <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">Total USDT</p>
            <p className="text-2xl font-bold text-purple-400">{stats.totalAmount} USDT</p>
          </div>
          <div className="bg-[#1a2332] p-6 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <p className="text-gray-400 text-sm">Ready to Pay Out</p>
            <p className="text-2xl font-bold text-blue-400">{stats.pendingPayoutAmount} USDT</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 mb-6">
          <input
            type="text"
            placeholder="Search by email, name, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
          />
        </div>

        {/* All Referrals Table */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">All Referrals</h2>
            <button
              onClick={loadAllData}
              className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0b0e14]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-3">Referrer</th>
                  <th className="px-6 py-3">Referred User</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Deposit</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No referrals found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((referral) => {
                    const referrerDisplay = referral.referrer_display || 'Unknown';
                    const referredDisplay = referral.referred_display || 'Unknown';
                    const statusInfo = getStatusInfo(referral.status);
                    const isPending = referral.status === 'pending';
                    const isApproved = referral.status === 'approved';
                    const isPaid = referral.status === 'paid';
                    
                    return (
                      <tr key={referral.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-3 text-white text-sm">
                          <span className="font-medium">{referrerDisplay}</span>
                        </td>
                        <td className="px-6 py-3 text-white text-sm">
                          <span className="font-medium">{referredDisplay}</span>
                        </td>
                        <td className="px-6 py-3 text-purple-400 font-mono text-sm">
                          {referral.referral_code}
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-sm">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-green-400 text-sm">
                          {referral.amount_usdt || 7} USDT
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-sm">
                          {referral.referred_deposit > 0 
                            ? `${referral.referred_deposit} USDT` 
                            : '—'}
                          {referral.min_deposit_required > 0 && referral.referred_deposit === 0 && (
                            <span className="text-xs text-yellow-500/70 block">
                              Need {referral.min_deposit_required} USDT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text} w-fit`}>
                            {statusInfo.icon}
                            {isPending && '⏳ Pending'}
                            {isApproved && '✅ Ready'}
                            {isPaid && '💰 Paid'}
                            {referral.status === 'rejected' && '❌ Rejected'}
                          </span>
                          {isApproved && (
                            <span className="text-[10px] text-blue-400/70 block mt-1">
                              Deposit met: {referral.referred_deposit} USDT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {/* PENDING: Waiting for deposit */}
                          {isPending && (
                            <span className="text-xs text-yellow-500/70 flex items-center gap-1">
                              <Clock size={12} />
                              Waiting for deposit...
                            </span>
                          )}
                          
                          {/* APPROVED: Ready for payout - SHOW PAY BONUS BUTTON */}
                          {isApproved && (
                            <button
                              onClick={() => handlePayBonus(referral.id)}
                              disabled={!!actionLoading}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === `pay-${referral.id}` ? (
                                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                              ) : (
                                <>
                                  <Gift size={12} />
                                  Pay Bonus
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* PAID: Completed */}
                          {isPaid && (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Paid {referral.paid_at && new Date(referral.paid_at).toLocaleDateString()}
                            </span>
                          )}
                          
                          {/* REJECTED: Show rejected */}
                          {referral.status === 'rejected' && (
                            <span className="text-xs text-red-500">Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReferrals.length)} of {filteredReferrals.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* All Users Table */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">👥 All Users & Their Referral Codes</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Showing {users.length} of {userPagination.totalItems} users
                </p>
              </div>
              <button
                onClick={() => loadAllUsers(userSearch, userPagination.page)}
                className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0b0e14]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Referral Code</th>
                  <th className="px-6 py-3">Clicks</th>
                  <th className="px-6 py-3">Signups</th>
                  <th className="px-6 py-3">Earned</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-3 text-white text-sm">
                        <span className="font-medium">{user.full_name || 'User'}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm">
                        {user.email || 'No email'}
                      </td>
                      <td className="px-6 py-3">
                        {user.referral_code ? (
                          <span className="text-purple-400 font-mono text-sm">{user.referral_code}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">No code</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm">
                        {user.total_clicks || 0}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm">
                        {user.total_signups || 0}
                      </td>
                      <td className="px-6 py-3 text-green-400 text-sm">
                        {user.total_earned_usdt || 0} USDT
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {userPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Showing {((userPagination.page - 1) * userPagination.itemsPerPage) + 1} to {Math.min(userPagination.page * userPagination.itemsPerPage, userPagination.totalItems)} of {userPagination.totalItems} users
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUserPageChange(userPagination.page - 1)}
                  disabled={userPagination.page === 1}
                  className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                  {userPagination.page} / {userPagination.totalPages}
                </span>
                <button
                  onClick={() => handleUserPageChange(userPagination.page + 1)}
                  disabled={userPagination.page === userPagination.totalPages}
                  className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Referral Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create Referral Link</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGeneratedLink('');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Select User</label>
                <div className="relative">
                  <div className="flex items-center bg-[#0b0e14] rounded-lg border border-white/10 focus-within:border-purple-500 transition">
                    <Search className="text-gray-500 ml-3" size={18} />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={() => {
                        if (users.length > 0) setShowDropdown(true);
                      }}
                      placeholder="Search users by email or name..."
                      className="w-full bg-transparent text-white px-3 py-2 focus:outline-none"
                    />
                    {newReferral.userId && (
                      <button
                        onClick={() => {
                          setNewReferral({ userId: '', userEmail: '', bonusAmount: 7 });
                          setUserSearch('');
                          setShowDropdown(false);
                          loadAllUsers('', 1);
                        }}
                        className="text-gray-400 hover:text-white mr-2"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {showDropdown && userSearch && users.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1a2332] border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                      {getFilteredUsers().length === 0 ? (
                        <div className="px-4 py-2 text-gray-400 text-sm">No users found</div>
                      ) : (
                        getFilteredUsers().map((user) => (
                          <button
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-white text-sm transition"
                          >
                            <div className="font-medium">{user.full_name || 'User'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {newReferral.userId && (
                  <p className="text-green-400 text-xs mt-1">✅ Selected: {newReferral.userEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Bonus Amount (USDT)</label>
                <input
                  type="number"
                  value={newReferral.bonusAmount}
                  onChange={(e) => setNewReferral({...newReferral, bonusAmount: parseFloat(e.target.value)})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 7 USDT</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={generateReferralLink}
                  disabled={!newReferral.userId || actionLoading === 'generate'}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'generate' ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <Gift size={16} />
                      Generate Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setGeneratedLink('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>

              {generatedLink && (
                <div className="mt-4 p-3 bg-[#0b0e14] rounded-lg border border-green-500/20">
                  <p className="text-sm text-gray-400 mb-1">✅ Link Generated:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-green-400 break-all flex-1">{generatedLink}</code>
                    <button
                      onClick={() => copyLink(generatedLink)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {copied && <span className="text-xs text-green-400">Copied!</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}