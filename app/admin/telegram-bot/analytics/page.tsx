// app/admin/telegram-bot/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BarChart3, Activity, Clock, CheckCircle, XCircle, Eye, RefreshCw, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Group {
  id: number;
  chat_id: string;
  group_name: string;
  is_active: boolean;
  total_sent: number;
  total_failed: number;
  last_message_sent: string;
  last_message_status: string;
}

interface Log {
  id: number;
  chat_id: string;
  message_text: string;
  category: string;
  status: string;
  error_message: string;
  sent_at: string;
}

interface Stats {
  totalMessages: number;
  successful: number;
  failed: number;
  successRate: number;
  byCategory: Record<string, number>;
  last24Hours: number;
}

// ============================================================
// SKELETON
// ============================================================
function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 sm:w-48 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-14 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="bg-[#1a2332] border border-white/5 rounded-xl p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 sm:h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedGroupId = searchParams.get('group');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    byCategory: {},
    last24Hours: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  const loadData = async () => {
    setIsLoading(true);
    await loadGroups();
    if (selectedGroupId) {
      await loadGroupAnalytics(parseInt(selectedGroupId));
      await loadGroupLogs(parseInt(selectedGroupId));
    }
    setIsLoading(false);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const loadGroups = async () => {
    try {
      const { data } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: true });

      setGroups(data || []);

      if (!selectedGroupId && data && data.length > 0) {
        setSelectedGroup(data[0]);
        await loadGroupAnalytics(data[0].id);
        await loadGroupLogs(data[0].id);
      } else if (selectedGroupId) {
        const group = data?.find(g => g.id === parseInt(selectedGroupId));
        if (group) {
          setSelectedGroup(group);
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadGroupAnalytics = async (groupId: number) => {
    try {
      const { data: logsData } = await supabase
        .from('telegram_message_logs')
        .select('*')
        .eq('group_id', groupId)
        .order('sent_at', { ascending: false });

      if (!logsData) {
        setStats({
          totalMessages: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
          byCategory: {},
          last24Hours: 0,
        });
        return;
      }

      const total = logsData.length;
      const successful = logsData.filter(l => l.status === 'sent').length;
      const failed = logsData.filter(l => l.status === 'failed').length;
      const last24Hours = logsData.filter(l => {
        const sentAt = new Date(l.sent_at);
        const now = new Date();
        const diff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
        return diff <= 24;
      }).length;

      const byCategory: Record<string, number> = {};
      logsData.forEach(log => {
        if (log.category) {
          byCategory[log.category] = (byCategory[log.category] || 0) + 1;
        }
      });

      setStats({
        totalMessages: total,
        successful,
        failed,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        byCategory,
        last24Hours,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadGroupLogs = async (groupId: number) => {
    try {
      const { data } = await supabase
        .from('telegram_message_logs')
        .select('*')
        .eq('group_id', groupId)
        .order('sent_at', { ascending: false })
        .limit(50);

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleGroupChange = (groupId: number) => {
    router.push(`/admin/telegram-bot/analytics?group=${groupId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCategory = (cat: string) => {
    return cat?.replace('_', ' ') || 'Unknown';
  };

  if (isLoading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/telegram-bot" className="shrink-0">
            <button
              aria-label="Back to Telegram bot"
              className="p-2 rounded-lg bg-[#1a2332] border border-white/5 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
              📊 Bot Analytics
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 line-clamp-1">
              Monitor your Telegram bot's performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGroup?.id || ''}
            onChange={(e) => handleGroupChange(parseInt(e.target.value))}
            className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 text-sm border border-white/10 rounded-lg bg-[#1a2332] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {groups.length === 0 && <option value="">No groups available</option>}
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.group_name || group.chat_id} {!group.is_active ? '(Disabled)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="shrink-0 px-3 py-2.5 sm:py-2 bg-[#1a2332] border border-white/5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-white tabular-nums truncate">{stats.totalMessages}</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <div className="flex items-center gap-2 text-green-400 text-[10px] sm:text-xs uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Successful</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-green-400 tabular-nums truncate">{stats.successful}</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <div className="flex items-center gap-2 text-red-400 text-[10px] sm:text-xs uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Failed</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-red-400 tabular-nums truncate">{stats.failed}</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <div className="flex items-center gap-2 text-blue-400 text-[10px] sm:text-xs uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Rate</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-blue-400 tabular-nums truncate">
            {stats.successRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* By Category */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Messages by Category
          </h3>
          <div className="space-y-2">
            {Object.keys(stats.byCategory).length === 0 ? (
              <p className="text-gray-500 text-sm">No messages sent yet</p>
            ) : (
              Object.entries(stats.byCategory).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3 text-sm">
                  <span className="capitalize text-gray-300 truncate min-w-0">
                    {formatCategory(key)}
                  </span>
                  <span className="font-medium text-white tabular-nums shrink-0">{value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-gray-300">Last 24 hours</span>
              <span className="font-medium text-white tabular-nums shrink-0">
                {stats.last24Hours} msgs
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-gray-300">Group Status</span>
              <span className={`font-medium shrink-0 ${selectedGroup?.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {selectedGroup?.is_active ? '🟢 Active' : '🔴 Disabled'}
              </span>
            </div>
            {selectedGroup?.last_message_sent && (
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-300 shrink-0">Last sent</span>
                <span className="text-gray-400 text-right truncate tabular-nums">
                  {formatDate(selectedGroup.last_message_sent)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Logs */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
          <h3 className="text-base sm:text-lg font-semibold text-white">📜 Recent Messages</h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Inbox size={26} className="text-blue-400 opacity-60" />
            </div>
            <p className="text-white font-medium text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Messages sent to this group will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="capitalize text-xs font-medium text-white truncate">
                      {formatCategory(log.category)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 inline-flex items-center gap-1 ${
                      log.status === 'sent'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {log.status === 'sent' ? (
                        <><CheckCircle size={10} /> Sent</>
                      ) : (
                        <><XCircle size={10} /> Failed</>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <span className="text-gray-400">Time</span>
                    <span className="text-right text-gray-300 tabular-nums">{formatDate(log.sent_at)}</span>
                  </div>
                  {log.message_text && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-gray-300 break-words line-clamp-3">
                        {log.message_text}
                      </p>
                    </div>
                  )}
                  {log.error_message && (
                    <p className="text-[11px] text-red-400 break-words">
                      ⚠️ {log.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap tabular-nums">
                        {formatDate(log.sent_at)}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-200">
                        {formatCategory(log.category)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                          log.status === 'sent'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status === 'sent' ? (
                            <><CheckCircle size={10} /> Sent</>
                          ) : (
                            <><XCircle size={10} /> Failed</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs">
                        {log.message_text ? (
                          <span className="line-clamp-1">{log.message_text}</span>
                        ) : (
                          <span className="text-gray-500 italic">No message</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
