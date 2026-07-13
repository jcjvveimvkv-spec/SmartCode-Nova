'use client';

import { useState, useEffect } from 'react';
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

export default function ReferralAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          ❌ {error}
          <button 
            onClick={loadAnalytics}
            className="ml-4 text-blue-400 hover:text-blue-300 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg">
          ⚠️ No analytics data available. Start referring users to see data here.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Referral Analytics</h1>
          <p className="text-gray-400 text-sm">Track referral performance and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#1a2332] rounded-lg border border-white/5 p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-md text-xs transition ${
                timeRange === 'week' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-md text-xs transition ${
                timeRange === 'month' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-md text-xs transition ${
                timeRange === 'all' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
          <button
            onClick={loadAnalytics}
            className="bg-[#1a2332] hover:bg-[#2a3a4a] text-white px-3 py-2 rounded-lg border border-white/5 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="bg-[#1a2332] hover:bg-[#2a3a4a] text-white px-3 py-2 rounded-lg border border-white/5 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{data.totalReferrals}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="text-purple-400" size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {data.paidReferrals} paid · {data.pendingReferrals} pending
          </div>
        </div>

        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Payouts</p>
              <p className="text-2xl font-bold text-green-400">${formatCurrency(data.totalPayouts)}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Avg payout: ${data.averagePayout}
          </div>
        </div>

        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-400">{data.conversionRate}%</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {data.totalClicks} clicks · {data.totalSignups} signups
          </div>
        </div>

        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bonus Distributed</p>
              <p className="text-2xl font-bold text-yellow-400">${formatCurrency(data.totalBonusDistributed)}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Gift className="text-yellow-400" size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {data.totalPromoUses} promo uses · ${formatCurrency(data.totalPromoBonus)} from promos
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Referral Trends
          </h2>
          <span className="text-xs text-gray-400">Last 6 months</span>
        </div>

        {/* Bar Chart */}
        <div className="h-64 flex items-end gap-2">
          {data.monthlyLabels.map((label, index) => {
            const count = data.monthlyCounts[index] || 0;
            const maxCount = Math.max(...data.monthlyCounts, 1);
            const height = (count / maxCount) * 100;
            
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-purple-500/20 hover:bg-purple-500/40 transition rounded-t"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div 
                    className="w-full bg-purple-500 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2 transform -rotate-45">
                  {label}
                </div>
                <div className="text-xs text-white font-bold mt-1">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Referrers & Top Clickers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-yellow-400" size={20} />
            <h2 className="text-lg font-semibold text-white">🏆 Top Referrers</h2>
          </div>
          
          {data.topReferrers.length === 0 ? (
            <p className="text-gray-400 text-sm">No referrers yet</p>
          ) : (
            <div className="space-y-3">
              {paginatedReferrers.map((referrer, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <div key={referrer.referrer_id} className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        globalIndex === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        globalIndex === 1 ? 'bg-gray-400/20 text-gray-400' :
                        globalIndex === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {globalIndex + 1}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {referrer.full_name || referrer.email}
                        </p>
                        <p className="text-gray-500 text-xs">{referrer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{referrer.count}</p>
                      <p className="text-gray-500 text-xs">referrals</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination for Top Referrers */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.topReferrers.length)} of {data.topReferrers.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Clickers */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">👆 Top Clickers</h2>
          </div>
          
          {data.topClickers.length === 0 ? (
            <p className="text-gray-400 text-sm">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {data.topClickers.map((clicker, index) => (
                <div key={clicker.user_id} className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {clicker.full_name || clicker.email}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Code: <span className="font-mono text-purple-400">{clicker.code}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{clicker.total_clicks}</p>
                    <p className="text-gray-500 text-xs">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <p className="text-gray-400 text-sm">Total Referrers</p>
          <p className="text-xl font-bold text-white">{data.totalReferrers}</p>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <p className="text-gray-400 text-sm">Total Clicks</p>
          <p className="text-xl font-bold text-white">{data.totalClicks}</p>
        </div>
        <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
          <p className="text-gray-400 text-sm">Total Signups</p>
          <p className="text-xl font-bold text-white">{data.totalSignups}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-400">💡 Analytics Insights</h4>
            <ul className="text-sm text-blue-300 space-y-1 mt-1">
              <li>• <strong>{data.totalReferrers}</strong> unique users have referred others</li>
              <li>• Conversion rate: <strong>{data.conversionRate}%</strong> of clicks become signups</li>
              <li>• Average payout: <strong>${data.averagePayout}</strong> per referral</li>
              <li>• Total bonus distributed: <strong>${formatCurrency(data.totalBonusDistributed)}</strong> USDT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}