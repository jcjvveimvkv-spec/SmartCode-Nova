// app/admin/crypto-receipts/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { platforms } from './data/platforms';

export default function CryptoReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlatforms = platforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          💳 Crypto Receipt Generator
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Select a platform to generate a legitimate receipt
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search wallets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPlatforms.map((platform) => (
          <Link key={platform.id} href={`/admin/crypto-receipts/${platform.id}`}>
            <div className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-yellow-500 hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2 transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: platform.color + '20',
                    color: platform.color
                  }}
                >
                  {platform.icon}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {platform.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {platform.type}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No platforms found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Platform Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}