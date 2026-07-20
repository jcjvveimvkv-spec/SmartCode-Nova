// /app/dashboard/components/DashboardSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/app/lib/supabase';
import { 
  LayoutDashboard, 
  Bot, 
  LineChart, 
  BarChart3, 
  Wallet, 
  History, 
  ShieldCheck, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Users,
  ArrowRightLeft, 
  Gift, 
  CreditCard,
  Sparkles,
  LogOut,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard', color: '#6366f1' },
  { name: 'My Bots', icon: Bot, href: '/dashboard/my-bots', color: '#06b6d4' },
  { name: 'Live Markets', icon: LineChart, href: '/dashboard/trade', color: '#10b981' },
  { name: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', color: '#f59e0b' },
  { name: 'My Wallet', icon: Wallet, href: '/dashboard/wallet', color: '#8b5cf6' },
  { name: 'Transfer', icon: ArrowRightLeft, href: '/dashboard/transfer', color: '#ec4899' },
  { name: 'Trade History', icon: History, href: '/dashboard/transactions', color: '#f472b6' },
  { name: 'My Cards', icon: CreditCard, href: '/dashboard/cards', color: '#f97316' },
  { 
    name: 'Referral Program', 
    icon: Gift, 
    href: '/dashboard/referral', 
    color: '#ef4444',
    description: 'Earn 7 USDT per referral'
  },
  { name: 'Risk Controls', icon: ShieldCheck, href: '/dashboard/risk', color: '#14b8a6' },
  { name: 'Community', icon: Users, href: '/dashboard/community', color: '#8b5cf6' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings', color: '#6b7280' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Find active index on mount and path change
  useEffect(() => {
    const index = menuItems.findIndex(
      item => pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
    );
    setActiveIndex(index);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileMenuOpen(true)} 
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-br from-[#1a2332] to-[#10161f] text-white p-3 rounded-xl border border-white/10 shadow-xl shadow-purple-500/10 backdrop-blur-xl"
      >
        <Menu size={24} />
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Using inline animation instead of variants */}
      <motion.aside 
        animate={{
          width: isCollapsed ? 80 : 260,
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        className={`
          fixed top-0 left-0 bottom-0 z-50
          bg-gradient-to-b from-[#0f1629] via-[#141a2e] to-[#0a0f1f]
          border-r border-white/5
          flex flex-col
          shadow-2xl shadow-purple-500/5
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Logo */}
        <div className={`p-6 border-b border-white/5 flex justify-between items-center relative ${isCollapsed ? 'justify-center' : ''}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 cursor-pointer ${isCollapsed ? 'flex-col gap-1' : ''}`}>
            <motion.div
              whileHover={{ rotate: -5, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl animate-pulse" />
              <img 
                src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" 
                alt="SmartCodeNova" 
                className="h-9 w-auto object-contain relative z-10" 
              />
            </motion.div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent"
              >
                SmartCode<span className="text-[#6366f1]">Nova</span>
              </motion.span>
            )}
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* User Status Badge */}
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                <Sparkles size={14} />
              </div>
              <div>
                <p className="text-white text-xs font-medium">Pro Trader</p>
                <p className="text-[#8e96a3] text-[10px]">Active</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Navigation - Improved Scrolling */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/20 hover:scrollbar-thumb-purple-500/40">
          {!isCollapsed && (
            <p className="text-[10px] uppercase text-[#8e96a3] font-bold tracking-wider px-4 pt-2 pb-3">
              Main Menu
            </p>
          )}

          {/* Active Indicator Background */}
          {!isCollapsed && activeIndex >= 0 && (
            <motion.div
              className="absolute left-3 right-3 h-11 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/10 border-l-2 border-purple-500"
              layoutId="activeIndicator"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ top: `calc(${activeIndex * 52}px + ${!isCollapsed ? '100px' : '0px'})` }}
            />
          )}

          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const isHovered = hoveredItem === item.href;
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative"
              >
                <Link 
                  href={item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <motion.div 
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer relative
                      ${isActive && !isCollapsed ? 'text-white' : ''}
                      ${isHovered && !isActive && !isCollapsed ? 'text-white' : ''}
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                  >
                    {/* Icon with glow */}
                    <div className="relative">
                      <div className={`
                        absolute inset-0 rounded-full blur-xl transition-opacity duration-300
                        ${isActive ? 'opacity-100' : 'opacity-0'}
                      `} style={{ backgroundColor: item.color }} />
                      <IconComponent 
                        size={20} 
                        className={`relative z-10 transition-all duration-300 ${isActive || isHovered ? 'scale-110' : ''}`}
                        style={{ 
                          color: isActive ? item.color : (isHovered ? item.color : '#8e96a3'),
                          filter: isActive ? `drop-shadow(0 0 8px ${item.color}40)` : 'none'
                        }}
                      />
                      {isActive && !isCollapsed && (
                        <motion.div 
                          className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                          style={{ backgroundColor: item.color }}
                          layoutId="activeDot"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex flex-col flex-1">
                        <span className={`font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                          isActive ? 'text-white' : (isHovered ? 'text-white' : 'text-[#8e96a3]')
                        }`}>
                          {item.name}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-[#8e96a3]">{item.description}</span>
                        )}
                      </div>
                    )}

                    {/* Active glow badge */}
                    {isActive && !isCollapsed && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {/* Logout Button */}
          <motion.button 
            whileHover={{ x: isCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.97 }}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
              text-[#8e96a3] hover:text-red-400 hover:bg-red-500/10
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </motion.button>

          {/* Collapse Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200
              bg-white/5 hover:bg-white/10 border border-white/5
              text-gray-400 hover:text-white
            `}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </motion.div>
            {!isCollapsed && (
              <span className="text-xs font-medium ml-2 text-[#8e96a3]">Collapse</span>
            )}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}