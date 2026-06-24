'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from './DashboardSidebar';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Wallet, X, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToastProvider from '@/app/providers/ToastProvider';
import ProfileRing from '@/app/components/ProfileRing';
import MobileBottomNav from '@/app/components/MobileBottomNav';
import { useTheme } from '@/app/providers/ThemeProvider'; // <--- NEW IMPORT

const ADMIN_EMAILS = ['smartcodenova@gmail.com', 'admin@smartcodenova.com'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme(); // <--- NEW HOOK

  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true);
      }

      const { data: profile } = await supabase
        .from('user_balances')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const { data: notifs } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setUserData({ ...user, ...profile });
      setNotifications(notifs || []);
      setUnreadCount(notifs?.filter((n: any) => !n.is_read).length || 0);
    }
    fetchUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const markAsRead = async (id: string) => {
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] text-white dark:text-white light:text-[#111827] flex font-sans w-full transition-colors duration-300">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full relative">
        
        <header className="sticky top-0 z-30 bg-[#141a24]/95 dark:bg-[#141a24]/95 light:bg-[#ffffff]/95 backdrop-blur-xl border-b border-white/5 light:border-gray-200 px-6 py-4 flex justify-between items-center h-20 w-full transition-colors duration-300">
          <div className="hidden md:flex items-center bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] rounded-full px-4 py-2 border border-white/5 light:border-gray-200 w-64 transition-colors duration-300">
            <Search className="text-gray-500 w-4 h-4 mr-2" />
            <input type="text" placeholder="Search markets..." className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-full" />
          </div>

          <div className="flex items-center gap-6 ml-auto">
            
            {/* --- THEME TOGGLE BUTTON (Added next to Notification Bell) --- */}
            <button
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white dark:hover:text-white light:hover:text-[#111827] transition"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative text-gray-400 hover:text-white transition">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center border-2 border-[#141a24]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-12 w-80 bg-[#141a24] dark:bg-[#141a24] light:bg-[#ffffff] border border-white/5 light:border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 transition-colors duration-300">
                    <div className="p-4 border-b border-white/5 light:border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-bold">Notifications</span>
                      <button onClick={() => setIsNotifOpen(false)} className="text-[#8e96a3] hover:text-white"><X size={14} /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-[#8e96a3] text-sm">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-white/5 light:border-gray-200 hover:bg-white/5 light:hover:bg-gray-100 cursor-pointer transition ${n.is_read ? 'opacity-60' : ''}`}>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-[#8e96a3]">{n.message}</p>
                            <p className="text-[10px] text-[#8e96a3] mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAdmin && (
              <Link href="/admin">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#6366f1] hover:bg-[#6366f1]/20 transition">
                  <Shield size={18} />
                  <span className="text-xs font-medium hidden sm:inline">Admin</span>
                </button>
              </Link>
            )}

            <div className="relative border-l border-white/10 pl-6">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
                <ProfileRing src={userData?.avatar_url} size={36} />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {userData?.full_name || userData?.email || 'User'}
                  </p>
                  <p className="text-xs text-[#8e96a3]">Pro Trader</p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-14 w-48 bg-[#141a24] dark:bg-[#141a24] light:bg-[#ffffff] border border-white/5 light:border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 transition-colors duration-300">
                    <Link href="/dashboard/settings" onClick={() => setIsProfileOpen(false)}>
                      <div className="flex items-center gap-3 p-3 hover:bg-white/5 light:hover:bg-gray-100 transition cursor-pointer border-b border-white/5 light:border-gray-200">
                        <SettingsIcon size={16} className="text-[#8e96a3]" />
                        <span className="text-sm">Settings</span>
                      </div>
                    </Link>
                    <Link href="/dashboard/wallet" onClick={() => setIsProfileOpen(false)}>
                      <div className="flex items-center gap-3 p-3 hover:bg-white/5 light:hover:bg-gray-100 transition cursor-pointer border-b border-white/5 light:border-gray-200">
                        <Wallet size={16} className="text-[#8e96a3]" />
                        <span className="text-sm">My Wallet</span>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-500/10 transition w-full text-left cursor-pointer border-t border-white/5 light:border-gray-200">
                      <LogOut size={16} className="text-red-400" />
                      <span className="text-sm text-red-400">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] w-full pb-20 lg:pb-6 transition-colors duration-300">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}