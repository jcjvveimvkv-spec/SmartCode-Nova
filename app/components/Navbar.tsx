'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    }
    checkUser();
  }, [supabase]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  if (loading) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a2a]/90 backdrop-blur-md border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* UPDATED LOGO SECTION */}
          <div className="flex items-center space-x-3">
            <img 
              src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" 
              alt="SmartCodeNova" 
              className="h-8 w-auto object-contain" 
            />
            <div className="text-xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              SmartCodeNova
            </div>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
            <Link href="#bots" className="text-gray-300 hover:text-white transition">Bots</Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
            <Link href="/auth/login" className="text-gray-300 hover:text-white transition">Login</Link>
            
            {/* SMART GET STARTED BUTTON */}
            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white font-semibold hover:opacity-90 transition"
            >
              {isLoggedIn ? 'Dashboard' : 'Get Started'}
            </button>
          </div>

          {/* MOBILE TOGGLE */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0a2a] border-b border-blue-500/20">
          <div className="px-4 py-4 space-y-4">
            <Link href="#features" className="block text-gray-300 hover:text-white">Features</Link>
            <Link href="#bots" className="block text-gray-300 hover:text-white">Bots</Link>
            <Link href="#pricing" className="block text-gray-300 hover:text-white">Pricing</Link>
            <Link href="/auth/login" className="block text-gray-300 hover:text-white">Login</Link>
            
            {/* MOBILE SMART BUTTON */}
            <button
              onClick={() => {
                setIsOpen(false);
                handleGetStarted();
              }}
              className="block w-full px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white text-center font-semibold hover:opacity-90 transition"
            >
              {isLoggedIn ? 'Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}