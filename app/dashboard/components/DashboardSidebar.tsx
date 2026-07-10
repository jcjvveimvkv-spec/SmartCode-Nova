'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/app/lib/supabase';
import { 
  LayoutDashboard, Bot, LineChart, BarChart3, Wallet, History, 
  ShieldCheck, Settings, Menu, X, ChevronLeft, ChevronRight, Users,
  ArrowRightLeft, Gift, TrendingUp
} from 'lucide-react';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Bots', icon: Bot, href: '/dashboard/my-bots' },
  { name: 'Live Markets', icon: LineChart, href: '/dashboard/trade' },
  { name: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { name: 'My Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Transfer', icon: ArrowRightLeft, href: '/dashboard/transfer' },
  { name: 'Trade History', icon: History, href: '/dashboard/transactions' },
  { 
    name: 'Referral Program', 
    icon: Gift, 
    href: '/dashboard/referral',
    description: 'Earn 7 USDT per referral'
  },
  { name: 'Risk Controls', icon: ShieldCheck, href: '/dashboard/risk' },
  { name: 'Community', icon: Users, href: '/dashboard/community' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [pendingBonus, setPendingBonus] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUserAndReferralData();
  }, []);

  const getUserAndReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        const { data: referrals } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id);
        
        if (referrals) {
          const pending = referrals.filter(r => r.status === 'pending');
          setReferralCount(referrals.length);
          setPendingBonus(pending.length * 7);
        }
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

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
          <Link href="/dashboard" className={`flex items-center gap-3 cursor-pointer ${isCollapsed ? 'flex-col gap-1' : ''}`}>
            <img 
              src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" 
              alt="SmartCodeNova" 
              className="h-8 w-auto object-contain" 
            />
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white">SmartCode<span className="text-[#6366f1]">Nova</span></span>
            )}
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {!isCollapsed && (referralCount > 0 || pendingBonus > 0) && (
          <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Referrals:</span>
              <span className="text-white font-medium">{referralCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Bonus:</span>
              <span className="text-green-400 font-medium">{pendingBonus} USDT</span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <p className="text-xs uppercase text-[#8e96a3] font-semibold tracking-wider px-4 pt-4 pb-2">Navigation</p>
          )}
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer relative ${
                  isActive 
                    ? 'bg-[#6366f1]/10 text-[#6366f1] border-l-2 border-[#6366f1]' 
                    : 'text-[#8e96a3] hover:text-white hover:bg-white/5'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}>
                  <IconComponent size={20} />
                  {!isCollapsed && (
                    <div className="flex flex-col flex-1">
                      <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                      {item.description && (
                        <span className="text-[10px] text-[#8e96a3]">{item.description}</span>
                      )}
                    </div>
                  )}
                  {!isCollapsed && item.name === 'Referral Program' && referralCount > 0 && (
                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {referralCount}
                    </span>
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