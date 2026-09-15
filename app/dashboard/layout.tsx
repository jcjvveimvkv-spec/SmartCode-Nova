// /app/dashboard/layout.tsx
'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from './components/DashboardSidebar';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Wallet, X, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToastProvider from '@/app/providers/ToastProvider';
import ProfileRing from '@/app/components/ProfileRing';
import MobileBottomNav from '@/app/components/MobileBottomNav';
import { useTheme } from '@/app/providers/ThemeProvider';

import NotificationBell from '@/app/components/NotificationBell';

const ADMIN_EMAILS = ['smartcodenova@gmail.com', 'admin@smartcodenova.com'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

      setUserData({ ...user, ...profile });
    }
    fetchUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] text-white dark:text-white light:text-[#111827] flex font-sans w-full transition-colors duration-300">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full ml-0 lg:ml-[260px] transition-all duration-300 relative">

        {/* ✅ FIX: mobile left-pad so hamburger doesn't overlap header; smaller padding + height on mobile */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 dark:bg-[#141a24]/95 light:bg-[#ffffff]/95 backdrop-blur-xl border-b border-white/5 light:border-gray-200 pl-16 pr-3 sm:px-6 py-3 sm:py-4 h-16 sm:h-20 flex justify-between items-center w-full transition-colors duration-300">

          <div className="hidden md:flex items-center bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] rounded-full px-4 py-2 border border-white/5 light:border-gray-200 w-64 transition-colors duration-300">
            <Search className="text-gray-500 w-4 h-4 mr-2" />
            <input type="text" placeholder="Search markets..." className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-full" />
          </div>

          {/* ✅ FIX: tighter gap on mobile (was gap-6) */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 ml-auto">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 text-gray-400 hover:text-white dark:hover:text-white light:hover:text-[#111827] transition"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Admin Button */}
            {isAdmin && (
              <Link href="/admin">
                <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#6366f1] hover:bg-[#6366f1]/20 transition">
                  <Shield size={18} />
                  <span className="text-xs font-medium hidden sm:inline">Admin</span>
                </button>
              </Link>
            )}

            {/* Profile */}
            <div className="relative border-l border-white/10 light:border-gray-200 pl-2 sm:pl-6">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Open profile menu"
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
              >
                <ProfileRing src={userData?.avatar_url} size={36} />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white light:text-[#111827] leading-tight">
                    {userData?.full_name || userData?.email || 'User'}
                  </p>
                  <p className="text-xs text-[#8e96a3]">Pro Trader</p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    {/* ✅ FIX: invisible backdrop to close menu on outside tap (was relying on click-away that didn't exist) */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-14 w-44 sm:w-48 bg-[#141a24] dark:bg-[#141a24] light:bg-[#ffffff] border border-white/5 light:border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 transition-colors duration-300"
                    >
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
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* ✅ FIX: smaller padding on mobile, safe area for iOS home bar */}
        <main
          className="flex-1 p-3 sm:p-6 overflow-y-auto bg-[#0b0e14] dark:bg-[#0b0e14] light:bg-[#f3f4f6] w-full transition-colors duration-300"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
