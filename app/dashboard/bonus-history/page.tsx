'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  RefreshCw, Filter, Calendar, ChevronLeft, ChevronRight,
  Gift, Users, CheckCircle, Clock, XCircle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'referral' | 'promo';
  amount: number;
  status: 'approved' | 'pending' | 'failed';
  description: string;
  created_at: string;
  balance_after: number;
}

export default function BonusHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'promo'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBonus, setTotalBonus] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [promoEarned, setPromoEarned] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, startDate, endDate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user balance
      const { data: balance } = await supabase
        .from('user_balances')
        .select('bonus_usdt, referral_earned, promo_earned')
        .eq('user_id', user.id)
        .single();

      setTotalBonus(balance?.bonus_usdt || 0);
      setReferralEarned(balance?.referral_earned || 0);
      setPromoEarned(balance?.promo_earned || 0);

      // Get all payouts (referrals + promo codes)
      const { data: payouts, error } = await supabase
        .from('referral_payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false });

      if (error) {
        console.error('Error loading history:', error);
        setLoading(false);
        return;
      }

      const historyItems: Transaction[] = (payouts || []).map((p: any) => {
        let type: 'referral' | 'promo' = 'referral';
        let description = 'Referral bonus';
        
        if (p.description && p.description.includes('Promo:')) {
          type = 'promo';
          description = p.description;
        } else if (p.referral_id) {
          description = 'Referral bonus';
        }

        return {
          id: p.id,
          type,
          amount: p.amount_usdt || 0,
          status: p.status || 'approved',
          description,
          created_at: p.paid_at || p.created_at,
          balance_after: p.balance_after || 0,
        };
      });

      setTransactions(historyItems);
      setFilteredTransactions(historyItems);

    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (startDate) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(t => new Date(t.created_at) <= end);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Approved</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-400"><Clock size={14} /> Pending</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-red-400"><XCircle size={14} /> Failed</span>;
      default:
        return <span className="text-gray-400">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'referral') {
      return <span className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs"><Users size={12} /> Referral</span>;
    } else {
      return <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs"><Gift size={12} /> Promo</span>;
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8">
        <div>
          <Link 
            href="/dashboard/referral" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-2"
          >
            <ArrowLeft size={18} />
            <span>Back to Referral Program</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">📊 Bonus History</h1>
          <p className="text-gray-400 mt-1">All your referral and promo code bonuses in one place</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#1a2332] px-4 py-2 rounded-lg border border-white/5 text-center">
            <p className="text-sm text-gray-400">Total Bonus</p>
            <p className="text-2xl font-bold text-purple-400">{totalBonus} USDT</p>
          </div>
          <button
            onClick={loadHistory}
            className="bg-[#1a2332] hover:bg-white/5 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a2332] p-4 rounded-lg border border-white/5">
          <p className="text-sm text-gray-400">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-lg border border-white/5">
          <p className="text-sm text-gray-400">Referral Bonuses</p>
          <p className="text-2xl font-bold text-purple-400">
            {transactions.filter(t => t.type === 'referral').length}
          </p>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-lg border border-white/5">
          <p className="text-sm text-gray-400">Promo Bonuses</p>
          <p className="text-2xl font-bold text-yellow-400">
            {transactions.filter(t => t.type === 'promo').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#0b0e14] text-white px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
          >
            <option value="all">All Types</option>
            <option value="referral">Referrals</option>
            <option value="promo">Promo Codes</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#0b0e14] text-white px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#0b0e14] text-white px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          <button
            onClick={resetFilters}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0b0e14]">
              <tr className="text-left text-gray-400 text-sm">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Balance After</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No bonus history found
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 text-gray-400 text-sm">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="px-6 py-3 text-white text-sm">
                      {item.description}
                    </td>
                    <td className="px-6 py-3 text-green-400 font-medium">
                      +{item.amount} USDT
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">
                      {item.balance_after > 0 ? `${item.balance_after} USDT` : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length}
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

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <p className="text-sm text-gray-400">💰 From Referrals</p>
          <p className="text-2xl font-bold text-purple-400">{referralEarned} USDT</p>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <p className="text-sm text-gray-400">🎁 From Promo Codes</p>
          <p className="text-2xl font-bold text-yellow-400">{promoEarned} USDT</p>
        </div>
      </div>
    </div>
  );
}