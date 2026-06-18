'use client';
import DashboardSidebar from './DashboardSidebar';
import { Bell, Search, LogOut, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex font-sans w-full">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full relative">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center h-20 w-full">
          <div className="hidden md:flex items-center bg-[#0b0e14] rounded-full px-4 py-2 border border-white/5 w-64">
            <Search className="text-gray-500 w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder="Search markets..." 
              className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-6 ml-auto">
            {/* Notification Bell */}
            <button className="relative text-gray-400 hover:text-white transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#141a24]"></span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">User_7917</p>
              </div>
            </div>
            
            {/* Logout */}
            <button className="text-gray-400 hover:text-red-400 transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0b0e14] w-full">
          {children}
        </main>

        {/* Footer - Kept empty for now, the news widget will load inside page.tsx to avoid errors */}
        <footer className="bg-[#141a24] border-t border-white/5 p-6 w-full h-[50px]"></footer>
      </div>
    </div>
  );
}