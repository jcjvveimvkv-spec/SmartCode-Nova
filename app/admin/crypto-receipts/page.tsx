// app/admin/crypto-receipts/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { platforms } from './data/platforms';

export default function CryptoReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlatforms = platforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 min-w-0">
          <span className="shrink-0">💳</span>
          <span className="truncate">Crypto Receipt Generator</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Select a platform to generate a legitimate receipt
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Search wallets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-white/10 rounded-lg bg-[#1a2332] text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus:outline-none"
        />
      </div>

      {/* Platform Grid */}
      {filteredPlatforms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-yellow-400 opacity-60" />
          </div>
          <p className="text-white font-medium text-sm sm:text-base">No platforms found</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Nothing matches "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-xs sm:text-sm bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredPlatforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
            >
              <Link href={`/admin/crypto-receipts/${platform.id}`} className="block">
                <div className="group bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 hover:border-yellow-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer h-full active:scale-[0.98]">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mb-2 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: platform.color + '20',
                        color: platform.color
                      }}
                    >
                      {platform.icon}
                    </div>
                    <h3 className="font-medium text-white text-xs sm:text-sm truncate w-full">
                      {platform.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate w-full">
                      {platform.type}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Platform Count */}
      {filteredPlatforms.length > 0 && (
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-white/5 tabular-nums">
          {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
}
