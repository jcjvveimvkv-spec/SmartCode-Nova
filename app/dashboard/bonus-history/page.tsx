'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
  RefreshCw, Filter, Calendar, ChevronLeft, ChevronRight,
  Gift, Users, CheckCircle, Clock, XCircle, ArrowLeft,
  X, SlidersHorizontal, Inbox
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  type: 'referral' | 'promo';
  amount: number;
  status: 'approved' | 'pending' | 'failed';
  description: string;
  created_at: string;
  balance_after: number;
}

type DatePreset = 'all' | '7d' | '30d' | '90d' | 'custom';

// ============================================================
// SKELETON
// ============================================================
function BonusHistorySkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
          <div className="h-8 w-56 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-16 w-32 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function BonusHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'promo'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalBonus, setTotalBonus] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [promoEarned, setPromoEarned] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: balance } = await supabase
        .from('user_balances')
        .select('bonus_usdt, referral_earned, promo_earned')
        .eq('user_id', user.id)
        .single();

      setTotalBonus(balance?.bonus_usdt || 0);
      setReferralEarned(balance?.referral_earned || 0);
      setPromoEarned(balance?.promo_earned || 0);

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
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute the actual date range based on preset
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    if (datePreset === 'custom') {
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      if (e) e.setHours(23, 59, 59, 999);
      return { effectiveStart: s, effectiveEnd: e };
    }
    if (datePreset === 'all') {
      return { effectiveStart: null, effectiveEnd: null };
    }
    const days = datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { effectiveStart: start, effectiveEnd: end };
  }, [datePreset, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (effectiveStart) {
      filtered = filtered.filter(t => new Date(t.created_at) >= effectiveStart);
    }
    if (effectiveEnd) {
      filtered = filtered.filter(t => new Date(t.created_at) <= effectiveEnd);
    }

    return filtered;
  }, [transactions, filterType, effectiveStart, effectiveEnd]);

  const resetFilters = () => {
    setFilterType('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setShowAdvanced(false);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, datePreset, startDate, endDate]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const hasActiveFilters = filterType !== 'all' || datePreset !== 'all';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} /> Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-yellow-400 text-xs"><Clock size={12} /> Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} /> Failed</span>;
      default:
        return <span className="text-gray-400 text-xs">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'referral') {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs whitespace-nowrap">
          <Users size={12} /> Referral
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs whitespace-nowrap">
        <Gift size={12} /> Promo
      </span>
    );
  };

  if (loading) return <BonusHistorySkeleton />;

  // Filters content — reused between desktop inline and mobile drawer
  const FiltersContent = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Type filter */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="w-full bg-[#0b0e14] text-white px-3 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
        >
          <option value="all">All Types</option>
          <option value="referral">Referrals</option>
          <option value="promo">Promo Codes</option>
        </select>
      </div>

      {/* Date presets */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">Date Range</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { key: 'all', label: 'All time' },
            { key: '7d', label: 'Last 7d' },
            { key: '30d', label: 'Last 30d' },
            { key: '90d', label: 'Last 90d' },
          ] as const).map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setDatePreset(preset.key);
                setStartDate('');
                setEndDate('');
              }}
              className={`text-xs px-3 py-2 rounded-lg border transition ${
                datePreset === preset.key
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-[#0b0e14] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAdvanced(!showAdvanced);
            if (!showAdvanced) setDatePreset('custom');
            else if (startDate || endDate) setDatePreset('custom');
          }}
          className="text-xs text-purple-400 hover:text-purple-300 transition mt-2 flex items-center gap-1"
        >
          <Calendar size={12} />
          {showAdvanced ? 'Hide custom range' : 'Custom date range'}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full bg-[#0b0e14] text-white px-3 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
                />
                <span className="text-gray-500 text-xs text-center sm:text-left">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full bg-[#0b0e14] text-white px-3 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full sm:w-auto text-sm text-gray-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5 border border-white/10"
        >
          Reset filters
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard/referral"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition mb-2 text-xs sm:text-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to Referral Program</span>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <span>📊</span>
            <span className="truncate">Bonus History</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            All your referral and promo code bonuses in one place
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <div className="flex-1 sm:flex-none bg-[#1a2332] px-3 sm:px-4 py-2 rounded-lg border border-white/5 text-center sm:text-right min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Total Bonus</p>
            <p className="text-lg sm:text-xl font-bold text-purple-400 tabular-nums truncate">
              {totalBonus} <span className="text-xs font-medium">USDT</span>
            </p>
          </div>
          <button
            onClick={loadHistory}
            aria-label="Refresh"
            className="bg-[#1a2332] hover:bg-white/5 px-3 sm:px-4 py-2 rounded-lg text-gray-400 hover:text-white transition flex items-center justify-center gap-2 shrink-0 h-full min-h-[52px] sm:min-h-0"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-lg border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Total Transactions</p>
          <p className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">{transactions.length}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-lg border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Referral Bonuses</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums truncate">
            {transactions.filter(t => t.type === 'referral').length}
          </p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-lg border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Promo Bonuses</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-400 tabular-nums truncate">
            {transactions.filter(t => t.type === 'promo').length}
          </p>
        </div>
      </div>

      {/* Filters — mobile: collapsible; desktop: inline */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        {/* Mobile toggle button */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="sm:hidden w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal size={16} className="shrink-0" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <ChevronRight
            size={16}
            className={`shrink-0 transition-transform ${showMobileFilters ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Filters body — hidden on mobile unless toggled, always visible on desktop */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block p-4 border-t sm:border-t-0 border-white/5`}>
          <div className="hidden sm:flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <FiltersContent />
        </div>
      </div>

      {/* Active filter chips (mobile only, above table) */}
      {hasActiveFilters && (
        <div className="sm:hidden flex flex-wrap gap-2">
          {filterType !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-full">
              {filterType === 'referral' ? 'Referrals' : 'Promo Codes'}
              <button
                onClick={() => setFilterType('all')}
                aria-label="Clear type filter"
                className="hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {datePreset !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-full">
              {datePreset === 'custom'
                ? `${startDate || '…'} → ${endDate || '…'}`
                : datePreset === '7d' ? 'Last 7 days'
                : datePreset === '30d' ? 'Last 30 days'
                : 'Last 90 days'}
              <button
                onClick={() => {
                  setDatePreset('all');
                  setStartDate('');
                  setEndDate('');
                }}
                aria-label="Clear date filter"
                className="hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Transactions */}
      {currentItems.length === 0 ? (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Inbox size={32} className="text-purple-400 opacity-60" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5">
            {hasActiveFilters ? 'No matching bonuses' : 'No bonus history yet'}
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto mb-5">
            {hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more results.'
              : 'Refer friends or apply promo codes to start earning bonuses.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg transition"
            >
              Clear filters
            </button>
          ) : (
            <Link href="/dashboard/referral">
              <button className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg transition">
                Go to Referral Program
              </button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#1a2332] border border-white/5 rounded-xl p-3 space-y-2.5"
              >
                {/* Top row: type + amount */}
                <div className="flex items-center justify-between gap-2">
                  {getTypeBadge(item.type)}
                  <span className="text-green-400 font-bold text-sm tabular-nums shrink-0">
                    +{item.amount} USDT
                  </span>
                </div>

                {/* Description */}
                <p className="text-white text-sm break-words">{item.description}</p>

                {/* Detail rows */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-400">Date</span>
                  <span className="text-right text-gray-300 tabular-nums">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>

                  <span className="text-gray-400">Balance after</span>
                  <span className="text-right text-gray-300 tabular-nums">
                    {item.balance_after > 0 ? `${item.balance_after} USDT` : '—'}
                  </span>

                  <span className="text-gray-400">Status</span>
                  <span className="text-right">{getStatusBadge(item.status)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
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
                  {currentItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">{getTypeBadge(item.type)}</td>
                      <td className="px-6 py-3 text-white text-sm">{item.description}</td>
                      <td className="px-6 py-3 text-green-400 font-medium tabular-nums">
                        +{item.amount} USDT
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                        {item.balance_after > 0 ? `${item.balance_after} USDT` : '—'}
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-[#1a2332] rounded-xl border border-white/5 px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left tabular-nums">
                  Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length}
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

      {/* Stats Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">
            💰 From Referrals
          </p>
          <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums truncate">
            {referralEarned} <span className="text-xs font-medium">USDT</span>
          </p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">
            🎁 From Promo Codes
          </p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-400 tabular-nums truncate">
            {promoEarned} <span className="text-xs font-medium">USDT</span>
          </p>
        </div>
      </div>
    </div>
  );
}
