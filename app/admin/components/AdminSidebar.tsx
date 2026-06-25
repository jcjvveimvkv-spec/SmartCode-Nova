'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Bot, Receipt, 
  Menu, X, ChevronLeft, ChevronRight, ShieldCheck,
  Wallet, FileText, Coins
} from 'lucide-react';

const menuItems = [
  { name: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin' },
  { name: 'User Management', icon: Users, href: '/admin/users' },
  { name: 'Bot Management', icon: Bot, href: '/admin/bots' },
  { 
    name: 'Receipt Generator', 
    icon: FileText, 
    href: '/admin/receipts',
    description: 'Standard Receipts'
  },
  { 
    name: 'Crypto Receipts', 
    icon: Wallet, 
    href: '/admin/crypto-receipts',
    description: 'All Platforms'
  },
  { 
    name: 'Binance', 
    icon: Coins, 
    href: '/admin/crypto-receipts/binance',
    description: 'Binance Receipts'
  },
  { name: 'Approvals', icon: ShieldCheck, href: '/admin/approvals' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsMobileMenuOpen(true)} 
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#10161f] text-white p-3 rounded-xl border border-white/5 shadow-xl"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 bg-[#10161f] border-r border-white/5 transform transition-all duration-300 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen
        ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}
      `}>
        
        <div className={`p-6 border-b border-white/5 flex justify-between items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col gap-1' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white">Admin<span className="text-[#6366f1]">Panel</span></span>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <p className="text-xs uppercase text-[#8e96a3] font-semibold tracking-wider px-4 pt-4 pb-2">Administration</p>
          )}
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive ? 'bg-[#6366f1]/10 text-[#6366f1] border-l-2 border-[#6366f1]' : 'text-[#8e96a3] hover:text-white hover:bg-white/5'} ${isCollapsed ? 'justify-center px-2' : ''}`}>
                  <IconComponent size={20} />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                      {item.description && (
                        <span className="text-[10px] text-[#8e96a3]">{item.description}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition text-gray-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}