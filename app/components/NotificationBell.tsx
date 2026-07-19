// /app/components/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Bell, BellOff, X, CheckCircle, CheckCheck, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user and notifications on mount
    useEffect(() => {
        fetchUserAndNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUserAndNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUserAndNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            setUserId(user.id);

            // Fetch from user_notifications table
            const { data, error } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('❌ Error fetching notifications:', error);
                setNotifications([]);
            } else {
                setNotifications(data || []);
                setUnreadCount(data?.filter(n => !n.is_read).length || 0);
            }
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            if (!userId) return;

            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('❌ Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('user_notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Update unread count if the deleted notification was unread
            const deletedNotif = notifications.find(n => n.id === notificationId);
            if (deletedNotif && !deletedNotif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('❌ Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type: string): string => {
        const iconMap: Record<string, string> = {
            'welcome': '👋',
            'deposit_pending': '⏳',
            'deposit_approved': '✅',
            'deposit_rejected': '❌',
            'withdrawal_pending': '⏳',
            'withdrawal_approved': '✅',
            'withdrawal_rejected': '❌',
            'bot_purchased': '🤖',
            'bot_deployed': '🚀',
            'bot_stopped': '🛑',
            'referral_pending': '📝',
            'referral_eligible': '✅',
            'referral_paid': '🎉',
            'referral_bonus': '💰',
            'promo_claim': '🎁',
            'card_application': '💳',
            'card_approved': '✅',
            'card_shipped': '📬',
            'card_activated': '✅',
            'general': '📢',
        };
        return iconMap[type] || '📢';
    };

    const getNotificationColor = (type: string): string => {
        const colorMap: Record<string, string> = {
            'welcome': 'border-purple-500/20 bg-purple-500/10',
            'deposit_pending': 'border-yellow-500/20 bg-yellow-500/10',
            'deposit_approved': 'border-green-500/20 bg-green-500/10',
            'deposit_rejected': 'border-red-500/20 bg-red-500/10',
            'withdrawal_pending': 'border-yellow-500/20 bg-yellow-500/10',
            'withdrawal_approved': 'border-green-500/20 bg-green-500/10',
            'withdrawal_rejected': 'border-red-500/20 bg-red-500/10',
            'bot_purchased': 'border-blue-500/20 bg-blue-500/10',
            'bot_deployed': 'border-cyan-500/20 bg-cyan-500/10',
            'referral_paid': 'border-green-500/20 bg-green-500/10',
            'referral_eligible': 'border-blue-500/20 bg-blue-500/10',
            'referral_pending': 'border-yellow-500/20 bg-yellow-500/10',
            'promo_claim': 'border-yellow-500/20 bg-yellow-500/10',
            'card_approved': 'border-green-500/20 bg-green-500/10',
        };
        return colorMap[type] || 'border-gray-500/20 bg-gray-500/10';
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return past.toLocaleDateString();
    };

    if (loading) {
        return (
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
                <Bell className="w-5 h-5 text-gray-400" />
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white"
                aria-label="Notifications"
            >
                {unreadCount > 0 ? (
                    <>
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center px-1 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </>
                ) : (
                    <BellOff className="w-5 h-5" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[420px] max-h-[500px] bg-[#1a2332] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-[#1a2332] p-4 border-b border-white/5 flex justify-between items-center z-10">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded hover:bg-blue-500/10 flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto max-h-[400px]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <BellOff className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">No notifications yet</p>
                                    <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => {
                                        const isUnread = !notification.is_read;
                                        const icon = getNotificationIcon(notification.type);
                                        const colorClass = getNotificationColor(notification.type);

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`
                                                    p-4 transition cursor-pointer
                                                    ${isUnread ? 'bg-blue-500/5 border-l-2 border-blue-500' : 'hover:bg-white/5'}
                                                    hover:bg-white/5
                                                `}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Icon */}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center mt-0.5 border`}>
                                                        <span className="text-lg">{icon}</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-gray-300'}`}>
                                                                {notification.title}
                                                            </p>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                {isUnread && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(notification.id);
                                                                        }}
                                                                        className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10"
                                                                        title="Mark as read"
                                                                    >
                                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => deleteNotification(notification.id, e)}
                                                                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p className={`text-xs mt-1 leading-relaxed ${isUnread ? 'text-gray-300' : 'text-gray-400'}`}>
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-gray-500 text-[10px] flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {getTimeAgo(notification.created_at)}
                                                            </span>
                                                            {!isUnread && (
                                                                <span className="text-gray-600 text-[10px]">• Read</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}