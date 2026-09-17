'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Bot,
  Receipt,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wallet,
  FileText,
  Send,
  BarChart3,
  Image,
  Gift,
  TrendingUp,
  Tag,
  CreditCard
} from 'lucide-react';

const menuItems = [
  { name: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin' },
  { name: 'User Management', icon: Users, href: '/admin/users' },
  { name: 'Bot Management', icon: Bot, href: '/admin/bots' },
  { name: 'Receipt Generator', icon: FileText, href: '/admin/receipts', description: 'Standard Receipts' },
  { name: 'Crypto Receipts', icon: Wallet, href: '/admin/crypto-receipts', description: 'All Platforms' },
  { name: 'Telegram Bot', icon: Send, href: '/admin/telegram-bot', description: 'Auto Notifications' },
  { name: 'Bot Analytics', icon: BarChart3, href: '/admin/telegram-bot/analytics', description: 'Performance & Stats' },
  { name: 'Screenshot Generator', icon: Image, href: '/admin/telegram-screenshot', description: 'AI Telegram Screenshots' },
  { name: 'Card Management', icon: CreditCard, href: '/admin/cards', description: 'Manage User Cards' },
  { name: 'Referral System', icon: Gift, href: '/admin/referral', description: 'Manage Referrals & Payouts' },
  { name: 'Promo Codes', icon: Tag, href: '/admin/referral/promos', description: 'Create & Manage Promos' },
  { name: 'Referral Analytics', icon: TrendingUp, href: '/admin/referral/analytics', description: 'Referral Performance' },
  { name: 'Approvals', icon: ShieldCheck, href: '/admin/approvals' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setIsMobileMenuOpen(false);
    };
    handle(mq);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ESC + body scroll lock while drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  // On mobile, always render full width drawer (never icon-only)
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <>
      {/* Mobile hamburger — sits above content, respects safe area */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Open admin menu"
        className="lg:hidden fixed top-3 left-3 z-[60] bg-[#10161f] text-white p-2.5 rounded-xl border border-white/5 shadow-xl active:scale-95 transition"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 bg-[#10161f] border-r border-white/5
        transform transition-transform duration-300 flex flex-col
        max-w-[85vw] md:max-w-[320px]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen lg:max-w-none
        ${effectiveCollapsed ? 'w-[80px]' : 'w-[260px]'}
      `}>

        {/* Logo */}
        <div className={`p-6 border-b border-white/5 flex justify-between items-center ${effectiveCollapsed ? 'justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${effectiveCollapsed ? 'flex-col gap-1' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-blue-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            {!effectiveCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white">
                Admin<span className="text-[#6366f1]">Panel</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!effectiveCollapsed && (
            <p className="text-xs uppercase text-[#8e96a3] font-semibold tracking-wider px-4 pt-4 pb-2">
              Administration
            </p>
          )}
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#6366f1]/10 text-[#6366f1] border-l-2 border-[#6366f1]'
                    : 'text-[#8e96a3] hover:text-white hover:bg-white/5'
                } ${effectiveCollapsed ? 'justify-center px-2' : ''}`}>
                  <IconComponent size={20} className="shrink-0" />
                  {!effectiveCollapsed && (
                    <div className="flex flex-col min-w-0">
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

        {/* Collapse toggle — hidden on mobile */}
        <div className="hidden lg:block p-4 border-t border-white/5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition text-gray-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
