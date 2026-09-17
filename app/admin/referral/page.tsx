'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
  Copy, RefreshCw, Plus, Users, DollarSign, Gift, Search,
  X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ============================================================
// SKELETON
// ============================================================
function ReferralSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="h-7 w-64 rounded bg-white/10 animate-pulse" />
        <div className="h-10 w-full sm:w-44 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-14 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
      <div className="bg-[#1a2332] border border-white/5 rounded-xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 sm:h-16 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
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
    totalApproved: 0,
    totalAmount: 0,
    pendingPayoutAmount: 0,
  });

  // Auto-dismiss banners
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(''), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

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
        setSuccessMessage(`Referral status updated to ${status}`);
        await loadReferralData();
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
        setSuccessMessage(result.message);
        await loadReferralData();
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
        setSuccessMessage('Referral link created successfully!');
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          label: 'Pending',
          icon: <Clock size={12} className="text-yellow-400" />
        };
      case 'approved':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          label: 'Ready',
          icon: <CheckCircle size={12} className="text-blue-400" />
        };
      case 'paid':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          label: 'Paid',
          icon: <CheckCircle size={12} className="text-green-400" />
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          label: 'Rejected',
          icon: <AlertCircle size={12} className="text-red-400" />
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

  if (loading) return <ReferralSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 min-w-0">
          <span className="shrink-0">📊</span>
          <span className="truncate">Referral System Management</span>
        </h1>
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
          className="w-full sm:w-auto shrink-0 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
        >
          <Plus size={18} />
          Create Referral Link
        </button>
      </div>

      {/* Banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 sm:px-4 py-3 rounded-lg flex items-start gap-3 text-sm"
          >
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words flex-1">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 sm:px-4 py-3 rounded-lg flex items-start gap-3 text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {warning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 sm:px-4 py-3 rounded-lg flex items-start gap-3 text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words flex-1">⚠️ {warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Referrals</p>
          <p className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">{stats.totalReferrals}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Pending</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-500 tabular-nums truncate">{stats.totalPending}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Approved</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-500 tabular-nums truncate">{stats.totalApproved}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Paid</p>
          <p className="text-lg sm:text-2xl font-bold text-green-500 tabular-nums truncate">{stats.totalPaid}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total USDT</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums truncate">{stats.totalAmount}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Ready to Pay</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-400 tabular-nums truncate">{stats.pendingPayoutAmount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4">
        <input
          type="text"
          placeholder="Search by email, name, or referral code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition text-sm"
        />
      </div>

      {/* All Referrals */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex justify-between items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate">All Referrals</h2>
          <button
            onClick={loadAllData}
            className="text-gray-400 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm shrink-0 p-1"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {currentItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Inbox size={26} className="text-purple-400 opacity-60" />
            </div>
            <p className="text-white font-medium text-sm sm:text-base">No referrals found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {searchTerm ? 'Try adjusting your search.' : 'Referrals will appear here once users share their links.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {currentItems.map((referral) => {
                const referrerDisplay = referral.referrer_display || 'Unknown';
                const referredDisplay = referral.referred_display || 'Unknown';
                const statusInfo = getStatusInfo(referral.status);
                const isPending = referral.status === 'pending';
                const isApproved = referral.status === 'approved';
                const isPaid = referral.status === 'paid';

                return (
                  <div key={referral.id} className="p-3 space-y-3">
                    {/* Top row: status + amount */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      <span className="text-green-400 text-sm font-bold tabular-nums shrink-0">
                        {referral.amount_usdt || 7} USDT
                      </span>
                    </div>

                    {/* Referrer → Referred */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Referrer</span>
                        <span className="text-white text-right truncate min-w-0">{referrerDisplay}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Referred</span>
                        <span className="text-white text-right truncate min-w-0">{referredDisplay}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Code</span>
                        <span className="text-purple-400 font-mono text-right truncate min-w-0">{referral.referral_code}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Deposit</span>
                        <span className="text-right tabular-nums min-w-0">
                          {referral.referred_deposit > 0 ? (
                            <span className="text-gray-300">{referral.referred_deposit} USDT</span>
                          ) : referral.min_deposit_required > 0 ? (
                            <span className="text-yellow-500/80">Need {referral.min_deposit_required}</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Date</span>
                        <span className="text-gray-300 tabular-nums text-right">{new Date(referral.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2 border-t border-white/5">
                      {isPending && (
                        <span className="text-xs text-yellow-500/80 flex items-center gap-1.5">
                          <Clock size={12} /> Waiting for deposit...
                        </span>
                      )}
                      {isApproved && (
                        <button
                          onClick={() => handlePayBonus(referral.id)}
                          disabled={!!actionLoading}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          {actionLoading === `pay-${referral.id}` ? (
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Gift size={12} /> Pay Bonus
                            </>
                          )}
                        </button>
                      )}
                      {isPaid && (
                        <span className="text-xs text-green-500 flex items-center gap-1.5">
                          <CheckCircle size={12} /> Paid {referral.paid_at && new Date(referral.paid_at).toLocaleDateString()}
                        </span>
                      )}
                      {referral.status === 'rejected' && (
                        <span className="text-xs text-red-500">Rejected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                  {currentItems.map((referral) => {
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
                        <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-green-400 text-sm tabular-nums">
                          {referral.amount_usdt || 7} USDT
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                          {isApproved && (
                            <span className="text-[10px] text-blue-400/70 block mt-1 tabular-nums">
                              Deposit met: {referral.referred_deposit} USDT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {isPending && (
                            <span className="text-xs text-yellow-500/70 flex items-center gap-1">
                              <Clock size={12} /> Waiting for deposit...
                            </span>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handlePayBonus(referral.id)}
                              disabled={!!actionLoading}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === `pay-${referral.id}` ? (
                                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Gift size={12} />
                                  Pay Bonus
                                </>
                              )}
                            </button>
                          )}

                          {isPaid && (
                            <span className="text-xs text-green-500 flex items-center gap-1 tabular-nums">
                              <CheckCircle size={12} />
                              Paid {referral.paid_at && new Date(referral.paid_at).toLocaleDateString()}
                            </span>
                          )}

                          {referral.status === 'rejected' && (
                            <span className="text-xs text-red-500">Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left tabular-nums">
                    Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredReferrals.length)} of {filteredReferrals.length}
                  </span>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="px-3 py-1.5 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm tabular-nums whitespace-nowrap">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="px-3 py-1.5 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* All Users */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400 shrink-0" />
                <span className="truncate">All Users & Their Referral Codes</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 tabular-nums">
                Showing {users.length} of {userPagination.totalItems} users
              </p>
            </div>
            <button
              onClick={() => loadAllUsers(userSearch, userPagination.page)}
              className="text-gray-400 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm shrink-0 p-1"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {users.map((user) => (
                <div key={user.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{user.full_name || 'User'}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email || 'No email'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                    <span className="text-gray-400">Code</span>
                    <span className="text-right font-mono text-purple-400 truncate">
                      {user.referral_code || '—'}
                    </span>
                    <span className="text-gray-400">Clicks</span>
                    <span className="text-right text-gray-300 tabular-nums">{user.total_clicks || 0}</span>
                    <span className="text-gray-400">Signups</span>
                    <span className="text-right text-gray-300 tabular-nums">{user.total_signups || 0}</span>
                    <span className="text-gray-400">Earned</span>
                    <span className="text-right text-green-400 font-medium tabular-nums">
                      {user.total_earned_usdt || 0} USDT
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                  {users.map((user) => (
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
                      <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                        {user.total_clicks || 0}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                        {user.total_signups || 0}
                      </td>
                      <td className="px-6 py-3 text-green-400 text-sm tabular-nums">
                        {user.total_earned_usdt || 0} USDT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.totalPages > 1 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left tabular-nums">
                    Showing {((userPagination.page - 1) * userPagination.itemsPerPage) + 1}–{Math.min(userPagination.page * userPagination.itemsPerPage, userPagination.totalItems)} of {userPagination.totalItems} users
                  </span>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleUserPageChange(userPagination.page - 1)}
                      disabled={userPagination.page === 1}
                      aria-label="Previous page"
                      className="px-3 py-1.5 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm tabular-nums whitespace-nowrap">
                      {userPagination.page} / {userPagination.totalPages}
                    </span>
                    <button
                      onClick={() => handleUserPageChange(userPagination.page + 1)}
                      disabled={userPagination.page === userPagination.totalPages}
                      aria-label="Next page"
                      className="px-3 py-1.5 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => {
              setShowCreateModal(false);
              setGeneratedLink('');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a2332] rounded-xl border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center gap-3 p-4 sm:p-6 border-b border-white/5 shrink-0">
                <h2 className="text-base sm:text-xl font-bold text-white">Create Referral Link</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setGeneratedLink('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white transition p-1 shrink-0"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Select User</label>
                  <div className="relative">
                    <div className="flex items-center bg-[#0b0e14] rounded-lg border border-white/10 focus-within:border-purple-500 transition">
                      <Search className="text-gray-500 ml-3 shrink-0" size={18} />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        onFocus={() => {
                          if (users.length > 0) setShowDropdown(true);
                        }}
                        placeholder="Search users..."
                        className="w-full bg-transparent text-white px-3 py-2.5 focus:outline-none text-sm"
                      />
                      {newReferral.userId && (
                        <button
                          onClick={() => {
                            setNewReferral({ userId: '', userEmail: '', bonusAmount: 7 });
                            setUserSearch('');
                            setShowDropdown(false);
                            loadAllUsers('', 1);
                          }}
                          aria-label="Clear user"
                          className="text-gray-400 hover:text-white mr-2 shrink-0 p-1"
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
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {newReferral.userId && (
                    <p className="text-green-400 text-xs mt-1 break-all">✅ Selected: {newReferral.userEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Bonus Amount (USDT)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={newReferral.bonusAmount}
                    onChange={(e) => setNewReferral({ ...newReferral, bonusAmount: parseFloat(e.target.value) })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                  />
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Default: 7 USDT</p>
                </div>

                {generatedLink && (
                  <div className="p-3 bg-[#0b0e14] rounded-lg border border-green-500/20">
                    <p className="text-xs sm:text-sm text-gray-400 mb-2">✅ Link Generated:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-green-400 break-all flex-1 min-w-0">{generatedLink}</code>
                      <button
                        onClick={() => copyLink(generatedLink)}
                        aria-label="Copy link"
                        className="text-gray-400 hover:text-white transition shrink-0 p-1"
                      >
                        {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                    {copied && <span className="text-xs text-green-400 mt-1 inline-block">Copied!</span>}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-6 pt-0 sm:pt-0 border-t border-white/5 shrink-0">
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setGeneratedLink('');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateReferralLink}
                    disabled={!newReferral.userId || actionLoading === 'generate'}
                    className="w-full sm:flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {actionLoading === 'generate' ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Gift size={16} /> Generate Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
