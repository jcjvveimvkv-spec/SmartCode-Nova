// app/admin/telegram-bot/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BarChart3, Activity, Clock, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/telegram-bot">
          <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Bot Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor your Telegram bot's performance and message history
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedGroup?.id || ''}
            onChange={(e) => handleGroupChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.group_name || group.chat_id} {!group.is_active ? '(Disabled)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <BarChart3 className="w-4 h-4" />
            Total Messages
          </div>
          <p className="text-3xl font-bold mt-2">{stats.totalMessages}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Successful
          </div>
          <p className="text-3xl font-bold mt-2 text-green-600">{stats.successful}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <XCircle className="w-4 h-4" />
            Failed
          </div>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Activity className="w-4 h-4" />
            Success Rate
          </div>
          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.successRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Messages by Category</h3>
          <div className="space-y-2">
            {Object.keys(stats.byCategory).length === 0 ? (
              <p className="text-gray-400 text-sm">No messages sent yet</p>
            ) : (
              Object.entries(stats.byCategory).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize text-sm">{key.replace('_', ' ')}</span>
                  <span className="font-medium text-sm">{value}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Last 24 hours</span>
              <span className="font-medium text-sm">{stats.last24Hours} messages</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Group Status</span>
              <span className={`text-sm font-medium ${selectedGroup?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {selectedGroup?.is_active ? '🟢 Active' : '🔴 Disabled'}
              </span>
            </div>
            {selectedGroup?.last_message_sent && (
              <div className="flex justify-between">
                <span className="text-sm">Last message sent</span>
                <span className="text-sm text-gray-500">{formatDate(selectedGroup.last_message_sent)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">📜 Recent Messages</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">No messages found for this group</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.sent_at)}</td>
                    <td className="py-2 text-sm capitalize">{log.category?.replace('_', ' ') || 'Unknown'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {log.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {log.message_text ? log.message_text.slice(0, 60) + '...' : 'No message'}
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