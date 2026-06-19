'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { Bell, Search, User, LogOut, XCircle } from 'lucide-react';

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

  if (loading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white">Loading Admin Panel...</div>;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white flex-col gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-[#8e96a3]">You are not authorized to view the Admin Panel.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex font-sans w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full relative">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center h-20 w-full">
          <div className="hidden md:flex items-center bg-[#0b0e14] rounded-full px-4 py-2 border border-white/5 w-64">
            <Search className="text-gray-500 w-4 h-4 mr-2" />
            <input type="text" placeholder="Search admin..." className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-full" />
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <button className="relative text-gray-400 hover:text-white transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#141a24]"></span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0b0e14] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}