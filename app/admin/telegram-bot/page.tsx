// app/admin/telegram-bot/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  BarChart3,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  Eye,
  Settings,
  Send,
  MessageSquare,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Group {
  id: number;
  chat_id: string;
  group_name: string;
  is_active: boolean;
  last_message_sent: string;
  last_message_status: string;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

interface NotificationTypes {
  deposits: boolean;
  withdrawals: boolean;
  trades: boolean;
  bot_purchases: boolean;
  testimonials: boolean;
  quotes: boolean;
}

interface BotIntervals {
  main_bot: number;
  testimonials: number;
  quotes: number;
}

interface Settings {
  setting_value: boolean;
  notification_types: NotificationTypes;
  intervals: BotIntervals;
  quiet_hours_start: string;
  quiet_hours_end: string;
  enable_quiet_hours: boolean;
}

interface Stats {
  total: number;
  byCategory: Record<string, number>;
}

const defaultNotificationTypes: NotificationTypes = {
  deposits: true,
  withdrawals: true,
  trades: true,
  bot_purchases: true,
  testimonials: true,
  quotes: true,
};

const defaultIntervals: BotIntervals = {
  main_bot: 15,
  testimonials: 60,
  quotes: 30,
};

const intervalOptions = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
  { value: 'random', label: '🎲 Random (10-60 min)' },
];

// ============================================================
// SKELETON
// ============================================================
function TelegramBotSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-80 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-full sm:w-52 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-14 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
    </div>
  );
}

export default function TelegramBotPage() {
  const [settings, setSettings] = useState<Settings>({
    setting_value: false,
    notification_types: { ...defaultNotificationTypes },
    intervals: { ...defaultIntervals },
    quiet_hours_start: '23:00',
    quiet_hours_end: '06:00',
    enable_quiet_hours: false,
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, byCategory: {} });
  const [isToggling, setIsToggling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'testimonials' | 'quotes'>('main');
  const [testMessageType, setTestMessageType] = useState<'main' | 'testimonial' | 'quote'>('main');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSettings(),
        loadGroups(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_automation_settings')
        .select('*')
        .eq('setting_key', 'telegram_bot_enabled')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const notificationTypes = {
          ...defaultNotificationTypes,
          ...(data.notification_types || {}),
        };

        const intervals = {
          main_bot: data.intervals?.main_bot ?? 15,
          testimonials: data.intervals?.testimonials ?? 60,
          quotes: data.intervals?.quotes ?? 30,
        };

        setSettings({
          setting_value: data.setting_value ?? false,
          notification_types: notificationTypes,
          intervals: intervals,
          quiet_hours_start: data.quiet_hours_start ?? '23:00',
          quiet_hours_end: data.quiet_hours_end ?? '06:00',
          enable_quiet_hours: data.enable_quiet_hours ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_sent_messages')
        .select('category');

      if (error) throw error;

      const byCategory: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        byCategory[row.category] = (byCategory[row.category] || 0) + 1;
      });

      setStats({
        total: data?.length || 0,
        byCategory,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
      toast.success('Data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleAutomation = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const newValue = !settings.setting_value;

      const { error } = await supabase
        .from('telegram_automation_settings')
        .update({
          setting_value: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'telegram_bot_enabled');

      if (error) throw error;

      setSettings(prev => ({ ...prev, setting_value: newValue }));
      toast.success(`Bot ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      console.error('Error toggling:', error);
      toast.error(error?.message || 'Failed to toggle');
    } finally {
      setIsToggling(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const intervals = {
        main_bot: settings.intervals.main_bot || 15,
        testimonials: settings.intervals.testimonials || 60,
        quotes: settings.intervals.quotes || 30,
      };

      const { error } = await supabase
        .from('telegram_automation_settings')
        .update({
          notification_types: settings.notification_types,
          intervals: intervals,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
          enable_quiet_hours: settings.enable_quiet_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'telegram_bot_enabled');

      if (error) throw error;

      toast.success('Settings saved successfully!');
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroup = async (groupId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('telegram_groups')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (error) throw error;

      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, is_active: !currentStatus } : g
      ));
      toast.success(`Group ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling group:', error);
      toast.error('Failed to toggle group');
    }
  };

  const addGroup = async () => {
    if (!newGroupId.trim()) {
      toast.error('Please enter a Group Chat ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('telegram_groups')
        .insert({
          chat_id: newGroupId.trim(),
          group_name: newGroupName.trim() || `Group ${newGroupId.trim().slice(-6)}`,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Group added successfully!');
      setNewGroupId('');
      setNewGroupName('');
      setShowAddGroup(false);
      await loadGroups();
    } catch (error: any) {
      console.error('Error adding group:', error);
      toast.error(error?.message || 'Failed to add group');
    }
  };

  const removeGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to remove this group?')) return;

    try {
      const { error } = await supabase
        .from('telegram_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group removed successfully');
      await loadGroups();
    } catch (error) {
      console.error('Error removing group:', error);
      toast.error('Failed to remove group');
    }
  };

  const sendTestMessage = async (type: 'main' | 'testimonial' | 'quote') => {
    setIsSendingTest(true);
    setTestMessageType(type);

    try {
      const typeLabels = {
        main: 'main notification',
        testimonial: 'testimonial',
        quote: 'quote'
      };

      toast.info(`Generating ${typeLabels[type]} test message...`);

      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        toast.error('Server returned invalid response');
        setIsSendingTest(false);
        return;
      }

      if (response.ok && data.success) {
        toast.success(`✅ ${typeLabels[type]} message generated!`);

        if (data.data?.note) {
          setTimeout(() => {
            toast.info(data.data.note);
          }, 500);
        }

        await Promise.all([loadStats(), loadGroups()]);
      } else {
        const errorMessage = data?.message || data?.error || `Failed to generate ${type} test message`;
        toast.error(errorMessage);
        console.error('Test message error:', data);
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast.error(error?.message || 'Failed to send test message');
    } finally {
      setIsSendingTest(false);
    }
  };

  const toggleNotificationType = (type: keyof NotificationTypes) => {
    setSettings(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: !prev.notification_types[type],
      },
    }));
  };

  const handleIntervalChange = (botType: keyof BotIntervals, value: number | string) => {
    const intervalValue = value === 'random' ? 0 : Number(value);

    setSettings(prev => ({
      ...prev,
      intervals: {
        ...prev.intervals,
        [botType]: intervalValue,
      },
    }));
  };

  const getIntervalDisplay = (minutes: number) => {
    if (minutes === 0) return '🎲 Random (10-60 min)';
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return '1 hour';
    if (minutes < 1440) return `${minutes / 60} hours`;
    return '24 hours';
  };

  const getGroupStatus = (group: Group) => {
    if (!group.is_active) {
      return { color: 'bg-gray-400', text: 'Disabled', blink: false };
    }
    if (group.last_message_status === 'failed') {
      return { color: 'bg-red-500', text: 'Failed', blink: true };
    }
    if (group.last_message_sent) {
      const timeSince = (Date.now() - new Date(group.last_message_sent).getTime()) / (1000 * 60);
      if (timeSince > 60) {
        return { color: 'bg-yellow-500', text: 'Inactive', blink: true };
      }
      return { color: 'bg-green-500', text: 'Active', blink: true };
    }
    return { color: 'bg-gray-400', text: 'No activity', blink: false };
  };

  if (isLoading) return <TelegramBotSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
            🤖 Telegram Bot
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Control what the bot sends, when, and to which groups
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <Link href="/admin/telegram-bot/analytics" className="flex-1 sm:flex-none">
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 shrink-0" />
              Analytics
            </button>
          </Link>

          <div className="flex items-center gap-3 bg-[#1a2332] border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${settings.setting_value ? 'text-green-400' : 'text-red-400'}`}>
              {settings.setting_value ? '🟢 Active' : '🔴 Disabled'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.setting_value}
                onChange={toggleAutomation}
                disabled={isToggling}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`} />
            </label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">Total Sent</h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-white tabular-nums truncate">{stats.total}</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">Active Groups</h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-green-400 tabular-nums truncate">{groups.filter(g => g.is_active).length}</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-3 sm:p-4 min-w-0">
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">Total Groups</h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 text-white tabular-nums truncate">{groups.length}</p>
        </div>
      </div>

      {/* Group Management */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-semibold truncate">📋 Group Management</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Group</span>
            </button>
            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none px-3 py-2 bg-[#0b0e14] hover:bg-white/5 border border-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Add Group Form */}
        <AnimatePresence>
          {showAddGroup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 sm:p-4 bg-[#0b0e14] rounded-lg border border-white/5 space-y-3">
                <input
                  type="text"
                  placeholder="Group Chat ID (e.g., -1001234567890)"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#141a24] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Group Name (optional)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#141a24] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={addGroup}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Add Group
                  </button>
                  <button
                    onClick={() => setShowAddGroup(false)}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-[#1a2332] border border-white/5 hover:bg-white/5 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  The bot will automatically send notifications to all active groups.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups List */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No groups added yet. Click "Add Group" to get started.
            </p>
          ) : (
            groups.map((group) => {
              const status = getGroupStatus(group);
              return (
                <div key={group.id} className="bg-[#0b0e14] border border-white/5 rounded-lg p-3 sm:p-4">
                  {/* Top row: status + name + actions (desktop) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Status indicator */}
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <div className={`w-3 h-3 rounded-full ${status.color} ${status.blink ? 'animate-pulse' : ''}`} />
                        <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1 whitespace-nowrap">{status.text}</span>
                      </div>

                      {/* Group info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                          <span className="font-medium text-white text-sm truncate">
                            {group.group_name || group.chat_id}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">
                            {group.chat_id}
                          </span>
                        </div>

                        {/* Stats line — wraps on mobile */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 mt-1.5">
                          <span className="whitespace-nowrap">📤 Sent: <span className="tabular-nums">{group.total_sent || 0}</span></span>
                          <span className="whitespace-nowrap">❌ Failed: <span className="tabular-nums">{group.total_failed || 0}</span></span>
                          {group.last_message_sent && (
                            <span className="whitespace-nowrap">🕐 <span className="tabular-nums">{new Date(group.last_message_sent).toLocaleTimeString()}</span></span>
                          )}
                        </div>
                      </div>

                      {/* Desktop actions */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <Link href={`/admin/telegram-bot/analytics?group=${group.id}`}>
                          <button
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Analytics"
                            aria-label="View analytics"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => toggleGroup(group.id, group.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            group.is_active
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-gray-400 hover:bg-white/5'
                          }`}
                          title={group.is_active ? 'Deactivate' : 'Activate'}
                          aria-label={group.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeGroup(group.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove Group"
                          aria-label="Remove group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile actions row */}
                  <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <Link href={`/admin/telegram-bot/analytics?group=${group.id}`} className="flex-1">
                      <button className="w-full py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Analytics
                      </button>
                    </Link>
                    <button
                      onClick={() => toggleGroup(group.id, group.is_active)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 border ${
                        group.is_active
                          ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {group.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => removeGroup(group.id)}
                      aria-label="Remove group"
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">📨 Notification Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {[
            { key: 'deposits' as const, label: '📥 Deposits' },
            { key: 'withdrawals' as const, label: '📤 Withdrawals' },
            { key: 'trades' as const, label: '📊 Trades' },
            { key: 'bot_purchases' as const, label: '🤖 Bot Purchases' },
            { key: 'testimonials' as const, label: '🗣️ Testimonials' },
            { key: 'quotes' as const, label: '💬 Quotes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
              <span className="text-sm font-medium min-w-0 truncate">{item.label}</span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.notification_types[item.key]}
                  onChange={() => toggleNotificationType(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Timer Settings */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">⏰ Timer Settings</h3>

        {/* Tabs — equal width on mobile */}
        <div className="flex border-b border-white/5 mb-4">
          {(['main', 'testimonials', 'quotes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'main' && '📊 Main'}
              {tab === 'testimonials' && '🗣️ Testimonials'}
              {tab === 'quotes' && '💬 Quotes'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'main' && (
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-3">
                Configure interval for deposits, withdrawals, trades, and bot purchases.
              </p>
              <div className="max-w-xs">
                <label className="block text-xs sm:text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.main_bot === 0 ? 'random' : settings.intervals.main_bot}
                  onChange={(e) => handleIntervalChange('main_bot', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#0b0e14] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                  Current: {settings.intervals.main_bot === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.main_bot)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => sendTestMessage('main')}
                  disabled={isSendingTest}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  {isSendingTest && testMessageType === 'main' ? 'Sending...' : 'Send Test Main Message'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-3">
                Configure interval for testimonial messages.
              </p>
              <div className="max-w-xs">
                <label className="block text-xs sm:text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.testimonials === 0 ? 'random' : settings.intervals.testimonials}
                  onChange={(e) => handleIntervalChange('testimonials', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#0b0e14] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                  Current: {settings.intervals.testimonials === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.testimonials)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => sendTestMessage('testimonial')}
                  disabled={isSendingTest}
                  className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {isSendingTest && testMessageType === 'testimonial' ? 'Sending...' : 'Send Test Testimonial'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div>
              <p className="text-xs sm:text-sm text-gray-400 mb-3">
                Configure interval for inspiration quotes.
              </p>
              <div className="max-w-xs">
                <label className="block text-xs sm:text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.quotes === 0 ? 'random' : settings.intervals.quotes}
                  onChange={(e) => handleIntervalChange('quotes', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#0b0e14] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                  Current: {settings.intervals.quotes === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.quotes)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => sendTestMessage('quote')}
                  disabled={isSendingTest}
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Quote className="w-4 h-4 shrink-0" />
                  {isSendingTest && testMessageType === 'quote' ? 'Sending...' : 'Send Test Quote'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">🌙 Quiet Hours</h3>

        <div className="flex items-center gap-3 mb-4">
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.enable_quiet_hours}
              onChange={(e) => setSettings(prev => ({ ...prev, enable_quiet_hours: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
          <span className="text-xs sm:text-sm text-gray-400">Enable Quiet Hours</span>
        </div>

        {settings.enable_quiet_hours && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-2">Start</label>
              <input
                type="time"
                value={settings.quiet_hours_start}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#0b0e14] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none tabular-nums"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-2">End</label>
              <input
                type="time"
                value={settings.quiet_hours_end}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg bg-[#0b0e14] text-white focus:ring-2 focus:ring-blue-500 focus:outline-none tabular-nums"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full sm:flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="w-full sm:flex-1 px-4 py-3 bg-[#0b0e14] hover:bg-white/5 border border-white/5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>
    </div>
  );
}
