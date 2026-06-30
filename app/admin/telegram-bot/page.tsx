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
  Bell,
  Send,
  MessageSquare,
  Quote
} from 'lucide-react';

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

// Default notification types
const defaultNotificationTypes: NotificationTypes = {
  deposits: true,
  withdrawals: true,
  trades: true,
  bot_purchases: true,
  testimonials: true,
  quotes: true,
};

// Default intervals
const defaultIntervals: BotIntervals = {
  main_bot: 15,
  testimonials: 60,
  quotes: 30,
};

// Interval options with random option
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

      console.log('💾 Saving settings:', {
        notification_types: settings.notification_types,
        intervals: intervals,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        enable_quiet_hours: settings.enable_quiet_hours,
      });

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

      if (error) {
        console.error('🔴 Supabase error:', error);
        throw error;
      }

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

  // UPDATED: sendTestMessage with better handling
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
      
      console.log(`🟢 Sending ${type} test message request...`);
      
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      console.log('🟢 Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('🟢 Response data:', data);
      } catch (parseError) {
        console.error('🔴 Failed to parse response:', parseError);
        toast.error('Server returned invalid response. Check console.');
        setIsSendingTest(false);
        return;
      }
      
      if (response.ok && data.success) {
        toast.success(`✅ ${typeLabels[type]} message generated!`);
        
        if (data.data?.formattedMessage) {
          setTimeout(() => {
            toast.info(data.data.formattedMessage.substring(0, 100) + '...');
          }, 500);
        }
        
        if (data.data?.note) {
          setTimeout(() => {
            toast.info(data.data.note);
          }, 1000);
        }
        
        await Promise.all([loadStats(), loadGroups()]);
      } else {
        const errorMessage = data?.message || data?.error || `Failed to generate ${type} test message`;
        toast.error(errorMessage);
        console.error('Test message error:', data);
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast.error(error?.message || 'Failed to send test message. Check console.');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🤖 Telegram Bot Automation
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Control what the bot sends, when, and to which groups
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/telegram-bot/analytics">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </Link>
          <span className={`text-sm font-medium ${settings.setting_value ? 'text-green-600' : 'text-red-600'}`}>
            {settings.setting_value ? '🟢 Active' : '🔴 Disabled'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.setting_value}
              onChange={toggleAutomation}
              disabled={isToggling}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}>
            </div>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Messages Sent</h3>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Groups</h3>
          <p className="text-3xl font-bold mt-2">{groups.filter(g => g.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Groups</h3>
          <p className="text-3xl font-bold mt-2">{groups.length}</p>
        </div>
      </div>

      {/* Groups Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📋 Group Management</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Group
            </button>
            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Add Group Form */}
        {showAddGroup && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Group Chat ID (e.g., -1001234567890)"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Group Name (optional)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={addGroup}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Group
                </button>
                <button
                  onClick={() => setShowAddGroup(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">The bot will automatically send notifications to all active groups.</p>
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No groups added yet. Click "Add Group" to get started.</p>
          ) : (
            groups.map((group) => {
              const status = getGroupStatus(group);
              return (
                <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`relative ${status.blink ? 'animate-pulse' : ''}`}>
                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">{status.text}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {group.group_name || group.chat_id}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{group.chat_id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>📤 Sent: {group.total_sent || 0}</span>
                        <span>❌ Failed: {group.total_failed || 0}</span>
                        {group.last_message_sent && (
                          <span>🕐 Last: {new Date(group.last_message_sent).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/telegram-bot/analytics?group=${group.id}`}>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Analytics">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => toggleGroup(group.id, group.is_active)}
                      className={`p-2 rounded-lg transition-colors ${group.is_active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      title={group.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">📨 Notification Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">📥 Deposits</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.deposits}
                onChange={() => toggleNotificationType('deposits')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">📤 Withdrawals</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.withdrawals}
                onChange={() => toggleNotificationType('withdrawals')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">📊 Trades</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.trades}
                onChange={() => toggleNotificationType('trades')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">🤖 Bot Purchases</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.bot_purchases}
                onChange={() => toggleNotificationType('bot_purchases')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">🗣️ Testimonials</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.testimonials}
                onChange={() => toggleNotificationType('testimonials')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-sm font-medium">💬 Inspiration Quotes</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_types.quotes}
                onChange={() => toggleNotificationType('quotes')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Timer Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">⏰ Timer Settings</h3>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'main'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📊 Main Bot
          </button>
          <button
            onClick={() => setActiveTab('testimonials')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'testimonials'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            🗣️ Testimonials
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'quotes'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            💬 Quotes
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* Main Bot Tab */}
          {activeTab === 'main' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Configure interval for deposits, withdrawals, trades, and bot purchases.
              </p>
              <div className="max-w-xs">
                <label className="block text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.main_bot === 0 ? 'random' : settings.intervals.main_bot}
                  onChange={(e) => handleIntervalChange('main_bot', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Current: {settings.intervals.main_bot === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.main_bot)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => sendTestMessage('main')}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {isSendingTest && testMessageType === 'main' ? 'Sending...' : 'Send Test Main Message'}
                </button>
              </div>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === 'testimonials' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Configure interval for testimonial messages.
              </p>
              <div className="max-w-xs">
                <label className="block text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.testimonials === 0 ? 'random' : settings.intervals.testimonials}
                  onChange={(e) => handleIntervalChange('testimonials', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Current: {settings.intervals.testimonials === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.testimonials)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => sendTestMessage('testimonial')}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  {isSendingTest && testMessageType === 'testimonial' ? 'Sending...' : 'Send Test Testimonial'}
                </button>
              </div>
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Configure interval for inspiration quotes.
              </p>
              <div className="max-w-xs">
                <label className="block text-sm font-medium mb-2">Send Interval</label>
                <select
                  value={settings.intervals.quotes === 0 ? 'random' : settings.intervals.quotes}
                  onChange={(e) => handleIntervalChange('quotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Current: {settings.intervals.quotes === 0 ? '🎲 Random (10-60 min)' : getIntervalDisplay(settings.intervals.quotes)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => sendTestMessage('quote')}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <Quote className="w-4 h-4" />
                  {isSendingTest && testMessageType === 'quote' ? 'Sending...' : 'Send Test Quote'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">🌙 Quiet Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_quiet_hours}
                  onChange={(e) => setSettings(prev => ({ ...prev, enable_quiet_hours: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-500">Enable Quiet Hours</span>
            </div>
          </div>
        </div>
        
        {settings.enable_quiet_hours && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-2">Quiet Hours Start</label>
              <input
                type="time"
                value={settings.quiet_hours_start}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quiet Hours End</label>
              <input
                type="time"
                value={settings.quiet_hours_end}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .animate-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
}