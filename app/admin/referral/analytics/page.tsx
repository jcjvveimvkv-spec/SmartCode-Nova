'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Gift,
  MousePointerClick,
  Award,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  totalReferrals: number;
  totalPayouts: number;
  pendingReferrals: number;
  conversionRate: number;
  totalClicks: number;
  totalSignups: number;
  averagePayout: number;
  totalBonusDistributed: number;
  totalPromoBonus: number;
  totalPromoUses: number;
  paidReferrals: number;
  totalReferrers: number;
  monthlyLabels: string[];
  monthlyCounts: number[];
  topReferrers: Array<{
    referrer_id: string;
    count: number;
    email: string;
    full_name: string;
  }>;
  topClickers: Array<{
    user_id: string;
    total_clicks: number;
    code: string;
    email: string;
    full_name: string;
  }>;
}

// ============================================================
// SKELETON
// ============================================================
function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-full sm:w-96 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-xl bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="h-80 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function ReferralAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/referral/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  // Pagination for top referrers
  const totalPages = data?.topReferrers ? Math.ceil(data.topReferrers.length / itemsPerPage) : 0;
  const paginatedReferrers = data?.topReferrers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  // Max count for chart scaling
  const maxCount = useMemo(() => {
    if (!data?.monthlyCounts?.length) return 1;
    return Math.max(...data.monthlyCounts, 1);
  }, [data?.monthlyCounts]);

  // ============================================================
  // CSV EXPORT
  // ============================================================
  const handleExport = () => {
    if (!data) return;
    setExporting(true);

    try {
      const escapeCsv = (val: any) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const lines: string[] = [];

      // Header section
      lines.push('Referral Analytics Report');
      lines.push(`Generated,${escapeCsv(new Date().toISOString())}`);
      lines.push(`Time Range,${escapeCsv(timeRange)}`);
      lines.push('');

      // Summary
      lines.push('Summary');
      lines.push('Metric,Value');
      lines.push(`Total Referrals,${data.totalReferrals}`);
      lines.push(`Paid Referrals,${data.paidReferrals}`);
      lines.push(`Pending Referrals,${data.pendingReferrals}`);
      lines.push(`Total Payouts,${data.totalPayouts}`);
      lines.push(`Average Payout,${data.averagePayout}`);
      lines.push(`Conversion Rate (%),${data.conversionRate}`);
      lines.push(`Total Clicks,${data.totalClicks}`);
      lines.push(`Total Signups,${data.totalSignups}`);
      lines.push(`Total Bonus Distributed,${data.totalBonusDistributed}`);
      lines.push(`Total Promo Bonus,${data.totalPromoBonus}`);
      lines.push(`Total Promo Uses,${data.totalPromoUses}`);
      lines.push(`Total Referrers,${data.totalReferrers}`);
      lines.push('');

      // Monthly trends
      lines.push('Monthly Trends');
      lines.push('Month,Referrals');
      (data.monthlyLabels || []).forEach((label, i) => {
        lines.push(`${escapeCsv(label)},${data.monthlyCounts?.[i] ?? 0}`);
      });
      lines.push('');

      // Top Referrers
      lines.push('Top Referrers');
      lines.push('Rank,Name,Email,Referrals');
      (data.topReferrers || []).forEach((r, i) => {
        lines.push(
          `${i + 1},${escapeCsv(r.full_name || '—')},${escapeCsv(r.email || '—')},${r.count}`
        );
      });
      lines.push('');

      // Top Clickers
      lines.push('Top Clickers');
      lines.push('Rank,Name,Email,Code,Clicks');
      (data.topClickers || []).forEach((c, i) => {
        lines.push(
          `${i + 1},${escapeCsv(c.full_name || '—')},${escapeCsv(c.email || '—')},${escapeCsv(c.code || '—')},${c.total_clicks}`
        );
      });

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().slice(0, 10);
      link.download = `referral-analytics-${timeRange}-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3 flex-wrap">
          <span className="min-w-0 break-words flex-1">❌ {error}</span>
          <button
            onClick={loadAnalytics}
            className="text-blue-400 hover:text-blue-300 transition shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg text-sm">
          ⚠️ No analytics data available. Start referring users to see data here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">📊 Referral Analytics</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Track referral performance and payouts</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Time range — full-width row on mobile */}
          <div className="flex bg-[#1a2332] rounded-lg border border-white/5 p-1 w-full md:w-auto">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs transition whitespace-nowrap ${
                  timeRange === range
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Refresh + Export */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={loadAnalytics}
              aria-label="Refresh"
              className="flex-1 md:flex-none bg-[#1a2332] hover:bg-[#2a3a4a] text-white px-3 py-2 rounded-lg border border-white/5 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span className="md:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              aria-label="Export CSV"
              className="flex-1 md:flex-none bg-[#1a2332] hover:bg-[#2a3a4a] text-white px-3 py-2 rounded-lg border border-white/5 transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
            >
              {exporting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full shrink-0" />
              ) : (
                <Download className="w-4 h-4 shrink-0" />
              )}
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Referrals */}
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Referrals</p>
              <p className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">{data.totalReferrals}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg shrink-0">
              <Users className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-gray-500 truncate">
            {data.paidReferrals} paid · {data.pendingReferrals} pending
          </div>
        </div>

        {/* Total Payouts */}
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Payouts</p>
              <p className="text-lg sm:text-2xl font-bold text-green-400 tabular-nums truncate">${formatCurrency(data.totalPayouts)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg shrink-0">
              <DollarSign className="text-green-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-gray-500 truncate">
            Avg: ${data.averagePayout}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Conversion</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-400 tabular-nums truncate">{data.conversionRate}%</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg shrink-0">
              <TrendingUp className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-gray-500 truncate">
            {data.totalClicks} clicks · {data.totalSignups} signups
          </div>
        </div>

        {/* Total Bonus */}
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Bonus Distributed</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-400 tabular-nums truncate">${formatCurrency(data.totalBonusDistributed)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-lg shrink-0">
              <Gift className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 text-[10px] sm:text-xs text-gray-500 truncate">
            {data.totalPromoUses} promos · ${formatCurrency(data.totalPromoBonus)}
          </div>
        </div>
      </div>

      {/* Referral Trends Chart */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400 shrink-0" />
            Referral Trends
          </h2>
          <span className="text-[10px] sm:text-xs text-gray-400">Last 6 months</span>
        </div>

        {/* Bar Chart */}
        <div className="h-52 sm:h-64 flex items-end gap-1 sm:gap-2">
          {data.monthlyLabels.map((label, index) => {
            const count = data.monthlyCounts[index] || 0;
            const height = (count / maxCount) * 100;

            return (
              <div key={label} className="flex-1 flex flex-col items-center min-w-0">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-purple-500/20 hover:bg-purple-500/40 transition rounded-t"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                </div>
                <div className="text-[9px] sm:text-xs text-gray-400 mt-2 whitespace-nowrap">
                  {label}
                </div>
                <div className="text-[10px] sm:text-xs text-white font-bold tabular-nums">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Referrers & Top Clickers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Referrers */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-yellow-400 shrink-0" size={20} />
            <h2 className="text-base sm:text-lg font-semibold text-white">🏆 Top Referrers</h2>
          </div>

          {data.topReferrers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No referrers yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {paginatedReferrers.map((referrer, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <div key={referrer.referrer_id} className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        globalIndex === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        globalIndex === 1 ? 'bg-gray-400/20 text-gray-400' :
                        globalIndex === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {globalIndex + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs sm:text-sm font-medium truncate">
                          {referrer.full_name || referrer.email}
                        </p>
                        <p className="text-gray-500 text-[10px] sm:text-xs truncate">{referrer.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-sm tabular-nums">{referrer.count}</p>
                      <p className="text-gray-500 text-[10px] sm:text-xs">referrals</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <span className="text-[10px] sm:text-xs text-gray-400 text-center sm:text-left tabular-nums">
                {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, data.topReferrers.length)} of {data.topReferrers.length}
              </span>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs tabular-nums whitespace-nowrap">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Clickers */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="text-blue-400 shrink-0" size={20} />
            <h2 className="text-base sm:text-lg font-semibold text-white">👆 Top Clickers</h2>
          </div>

          {data.topClickers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No clicks yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {data.topClickers.map((clicker, index) => (
                <div key={clicker.user_id} className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">
                      {clicker.full_name || clicker.email}
                    </p>
                    <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                      Code: <span className="font-mono text-purple-400">{clicker.code}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-sm tabular-nums">{clicker.total_clicks}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Referrers</p>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums truncate">{data.totalReferrers}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Clicks</p>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums truncate">{data.totalClicks}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0 col-span-2 md:col-span-1">
          <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider truncate">Total Signups</p>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums truncate">{data.totalSignups}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-blue-400">💡 Analytics Insights</h4>
            <ul className="text-xs sm:text-sm text-blue-300 space-y-1 mt-2">
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span className="min-w-0"><strong className="text-white">{data.totalReferrers}</strong> unique users have referred others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span className="min-w-0">Conversion rate: <strong className="text-white">{data.conversionRate}%</strong> of clicks become signups</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span className="min-w-0">Average payout: <strong className="text-white">${data.averagePayout}</strong> per referral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span className="min-w-0">Total bonus distributed: <strong className="text-white">${formatCurrency(data.totalBonusDistributed)}</strong> USDT</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
