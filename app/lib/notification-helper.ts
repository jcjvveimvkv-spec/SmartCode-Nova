// /app/lib/notification-helper.ts
// Unified notification helper - uses user_notifications table

import { createBrowserClient } from '@supabase/ssr';

export type NotificationType = 
    | 'welcome'
    | 'deposit_pending'
    | 'deposit_approved'
    | 'deposit_rejected'
    | 'withdrawal_pending'
    | 'withdrawal_approved'
    | 'withdrawal_rejected'
    | 'bot_purchased'
    | 'bot_deployed'
    | 'bot_stopped'
    | 'referral_pending'
    | 'referral_eligible'
    | 'referral_paid'
    | 'referral_bonus'
    | 'promo_claim'
    | 'card_application'
    | 'card_approved'
    | 'card_shipped'
    | 'card_activated'
    | 'card_blocked'
    | 'card_unblocked'
    | 'general';

/**
 * Create a Supabase browser client
 */
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials missing');
        return null;
    }
    
    return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * Create an in-app notification
 * Uses user_notifications table
 */
export async function createInAppNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: any = {}
) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('⚠️ Skipping in-app notification - no Supabase client');
            return { success: false, error: 'No Supabase client' };
        }

        console.log('📝 Creating in-app notification:', { userId, type, title, message });

        // ✅ Try using the browser client directly
        const { data: result, error } = await supabase
            .from('user_notifications')
            .insert({
                user_id: userId,
                type: type,
                title: title,
                message: message,
                data: data || {},
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('❌ Supabase error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return { success: false, error: error.message };
        }

        console.log(`✅ In-app notification created: ${title} for user ${userId}`);
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ In-app notification error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return { success: false };

        const { error } = await supabase
            .from('user_notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('❌ Error marking notification as read:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        return { success: false };
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return { success: false };

        const { error } = await supabase
            .from('user_notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('❌ Error marking all notifications as read:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return { success: false };
    }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return { success: false, data: [] };

        const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Error fetching notifications:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        return { success: false, data: [] };
    }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return 0;

        const { count, error } = await supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('❌ Error fetching unread count:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('❌ Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return { success: false };

        const { error } = await supabase
            .from('user_notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('❌ Error deleting notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        return { success: false };
    }
}