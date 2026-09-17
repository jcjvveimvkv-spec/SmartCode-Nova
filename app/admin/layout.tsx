'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { Bell, Search, LogOut, XCircle, Loader2 } from 'lucide-react';

const ADMIN_EMAILS = ['admin@smartcodenova.online', 'smartcodenova@gmail.com'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (ADMIN_EMAILS.includes(user.email || '')) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      setLoading(false);
    }
    checkAdminAccess();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
        <p className="text-sm text-[#8e96a3]">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-white gap-4 px-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-center">Access Denied</h1>
        <p className="text-[#8e96a3] text-sm text-center max-w-xs">
          You are not authorized to view the Admin Panel.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full max-w-xs px-6 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex font-sans w-full overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full relative min-w-0">

        {/* Header — mobile has left padding for the hamburger */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 backdrop-blur-xl border-b border-white/5 pl-16 pr-3 sm:px-6 py-3 sm:py-4 h-16 sm:h-20 w-full flex justify-between items-center gap-3">

          {/* Search — desktop only */}
          <div className="hidden md:flex items-center bg-[#0b0e14] rounded-full px-4 py-2 border border-white/5 w-64">
            <Search className="text-gray-500 w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search admin..."
              className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-full"
            />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 ml-auto">

            {/* Bell */}
            <button
              aria-label="Notifications"
              className="relative text-gray-400 hover:text-white transition p-1.5"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#141a24]"></span>
            </button>

            {/* Logout */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 transition bg-red-500/10 px-2.5 sm:px-4 py-2 rounded-lg border border-red-500/20 shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto bg-[#0b0e14] w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
