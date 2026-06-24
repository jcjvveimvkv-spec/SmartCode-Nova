'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, LineChart, Settings } from 'lucide-react';

const navItems = [
  { name: 'Home', icon: Home, href: '/dashboard' },
  { name: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Live Market', icon: LineChart, href: '/dashboard/trade' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#10141D] border-t border-white/10 flex justify-around items-center h-16 px-2 shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200"
          >
            <item.icon
              size={22}
              className={isActive ? 'text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : 'text-[#8e96a3]'}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#00e5ff]' : 'text-[#8e96a3]'
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}