'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowLeft, ChevronLeft, ChevronRight,
  Download, X, CheckCircle
} from 'lucide-react';

const getBotImage = (name: string) => {
  const map: { [key: string]: string } = {
    'NOVA-1 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot1.jpeg',
    'NOVA-2 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot2.jpeg',
    'NOVA-3 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot3.jpeg',
    'NOVA-4 BOT': 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/bot/Nova%20Bot4.jpeg',
  };
  return map[name] || '';
};

export default function PurchaseHistoryPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    async function fetchAllHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data } = await supabase
        .from('active_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setHistory(data || []);
      setFilteredHistory(data || []);
      setLoading(false);
    }
    fetchAllHistory();
  }, [supabase, router]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHistory(history);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredHistory(history.filter(item =>
        item.bot_name.toLowerCase().includes(term) ||
        item.license_key?.toLowerCase().includes(term)
      ));
    }
    setCurrentPage(1);
  }, [searchTerm, history]);

  const openReceipt = (item: any) => {
    let receiptData = item.receipt_data;

    if (typeof receiptData === 'string') {
      try { receiptData = JSON.parse(receiptData); }
      catch (e) { receiptData = null; }
    }

    if (!receiptData || typeof receiptData !== 'object') {
      receiptData = {
        receiptNumber: '#' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        product: item.bot_name || 'Unknown Bot',
        investmentAmount: item.invested_usdt || 0,
        licenseKey: item.license_key || 'N/A',
        botImage: getBotImage(item.bot_name) || '',
        date: new Date(item.created_at).toLocaleString(),
        status: item.status || 'Active'
      };
    }

    setReceipt(receiptData);
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => window.print();
  const closeModal = () => { setIsReceiptOpen(false); setReceipt(null); };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading history...</div>;

  return (
    // ✅ FIX: removed p-6 (layout pads), added overflow-x-hidden, tighter mobile spacing
    <div className="space-y-4 sm:space-y-6 w-full max-w-6xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      {/* ✅ FIX: stacks on mobile, gap-3 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Complete Purchase History</h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm">A full record of every bot you have ever purchased.</p>
        </div>
        <Link href="/dashboard/buy-bot" className="shrink-0">
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition w-full sm:w-auto justify-center">
            <ArrowLeft size={16} /> Back to Store
          </button>
        </Link>
      </div>

      {/* Container */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-3 sm:p-4">

        {/* Search */}
        <div className="flex justify-end mb-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by bot name or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {/* ✅ FIX: Mobile cards (< md) + Desktop table (≥ md) */}
        {currentItems.length === 0 ? (
          <div className="py-8 text-center text-[#8e96a3] text-sm">No purchases found.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {currentItems.map((item, idx) => {
                const image = getBotImage(item.bot_name);
                return (
                  <div
                    key={idx}
                    onClick={() => openReceipt(item)}
                    className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-3 cursor-pointer hover:border-[#6366f1]/30 transition active:scale-[0.99]"
                  >
                    {/* Header: avatar + name + status */}
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img src={image} alt={item.bot_name} className="w-12 h-12 rounded-lg object-cover border border-white/5 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#141a24] border border-white/5 flex items-center justify-center text-[#8e96a3] text-[10px] shrink-0">Bot</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white text-sm truncate">{item.bot_name}</p>
                        <p className="text-[11px] text-[#8e96a3]">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        item.status === 'Active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-[#8e96a3]/10 text-[#8e96a3] border border-[#8e96a3]/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Detail rows */}
                    <div className="space-y-1.5 text-xs pt-3 border-t border-white/5">
                      <div className="flex justify-between gap-2">
                        <span className="text-[#8e96a3] shrink-0">Investment</span>
                        <span className="font-bold text-green-400 truncate text-right">{item.invested_usdt} USDT</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[#8e96a3] shrink-0">License Key</span>
                        <span className="font-mono text-[#f59e0b] text-[11px] break-all text-right">{item.license_key}</span>
                      </div>
                    </div>

                    {/* Explicit affordance */}
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[11px] text-[#6366f1] font-medium">Tap to view receipt →</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-white/5 text-[#8e96a3]">
                  <tr>
                    <th className="px-4 py-3">Bot</th>
                    <th className="px-4 py-3">Investment</th>
                    <th className="px-4 py-3">License Key</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, idx) => {
                    const image = getBotImage(item.bot_name);
                    return (
                      <tr
                        key={idx}
                        onClick={() => openReceipt(item)}
                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img src={image} alt={item.bot_name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-[#141a24] flex items-center justify-center text-[#8e96a3] text-xs">Bot</div>
                            )}
                            <span className="font-medium group-hover:text-[#6366f1] transition">{item.bot_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-400">{item.invested_usdt} USDT</td>
                        <td className="px-4 py-3 font-mono text-[#f59e0b] text-xs">{item.license_key}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-[#8e96a3]/10 text-[#8e96a3] border border-[#8e96a3]/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#8e96a3] text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center sm:justify-end items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm text-[#8e96a3]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {isReceiptOpen && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-4 sm:p-6 border-b border-white/5 text-center relative shrink-0">
                <button
                  onClick={closeModal}
                  aria-label="Close receipt"
                  className="absolute right-3 top-3 sm:right-4 sm:top-4 text-[#8e96a3] hover:text-white transition p-1"
                >
                  <X size={22} />
                </button>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-green-500/30">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Purchase Receipt</h2>
                <p className="text-[#8e96a3] text-xs sm:text-sm">Transaction details</p>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4 sm:p-6 relative">
                  <div className="flex items-center justify-center gap-2 mb-4 border-b border-white/5 pb-4">
                    <img
                      src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png"
                      alt="Logo"
                      className="h-6 w-auto"
                    />
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                      SmartCodeNova
                    </span>
                  </div>

                  <div className="font-mono text-[#8e96a3] text-xs text-center mb-4 break-all">
                    Receipt {receipt.receiptNumber}
                  </div>

                  <div className="flex gap-3 sm:gap-4 mb-4">
                    <img src={receipt.botImage} alt="Bot" className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-white/5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-white truncate">{receipt.product}</p>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3]">
                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                          {receipt.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3] shrink-0">Investment Amount</span>
                      <span className="font-bold text-blue-400 truncate text-right">{receipt.investmentAmount} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3] shrink-0">License Key</span>
                      <span className="font-mono text-[#f59e0b] text-xs break-all text-right">{receipt.licenseKey}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-[#8e96a3] shrink-0">Date</span>
                      <span className="text-[#8e96a3] text-xs text-right">{receipt.date}</span>
                    </div>
                  </div>

                  <div className="text-center border-t border-white/5 pt-4">
                    <p className="text-[10px] text-[#8e96a3] font-mono tracking-widest">
                      Thank you for choosing SmartCodeNova
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-6 pt-0 flex gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 sm:py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Download size={16} /> Download Receipt
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 sm:py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition text-xs sm:text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
