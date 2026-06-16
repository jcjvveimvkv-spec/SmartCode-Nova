'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a2a]/90 backdrop-blur-md border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              SmartCodeNova
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
            <Link href="#bots" className="text-gray-300 hover:text-white transition">Bots</Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
            <Link href="/auth/login" className="text-gray-300 hover:text-white transition">Login</Link>
            <Link href="/auth/register" className="px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white font-semibold hover:opacity-90 transition">
              Get Started
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0a0a2a] border-b border-blue-500/20">
          <div className="px-4 py-4 space-y-4">
            <Link href="#features" className="block text-gray-300 hover:text-white">Features</Link>
            <Link href="#bots" className="block text-gray-300 hover:text-white">Bots</Link>
            <Link href="#pricing" className="block text-gray-300 hover:text-white">Pricing</Link>
            <Link href="/auth/login" className="block text-gray-300 hover:text-white">Login</Link>
            <Link href="/auth/register" className="block px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full text-white text-center">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}