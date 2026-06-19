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

// Helper to find bot image
const getBotImage = (name: string) => {
  const map: {[key: string]: string} = {
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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Receipt Modal State
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

  // FIXED: SAFE RECEIPT OPENER WITH MANUAL FALLBACK
  const openReceipt = (item: any) => {
    let receiptData = item.receipt_data;
    
    // 1. If it's a string, try to parse it safely
    if (typeof receiptData === 'string') {
      try {
        receiptData = JSON.parse(receiptData);
      } catch (e) {
        receiptData = null;
      }
    }

    // 2. If parsing failed OR receiptData is empty, rebuild it manually
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

  const handlePrintReceipt = () => {
    window.print();
  };

  const closeModal = () => {
    setIsReceiptOpen(false);
    setReceipt(null);
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading history...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Complete Purchase History</h1>
          <p className="text-[#8e96a3] text-sm">A full record of every bot you have ever purchased.</p>
        </div>
        <Link href="/dashboard/buy-bot">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition">
            <ArrowLeft size={16} /> Back to Store
          </button>
        </Link>
      </div>

      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4">
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

        <div className="overflow-x-auto">
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
              {currentItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8e96a3]">No purchases found.</td></tr>
              ) : (
                currentItems.map((item, idx) => {
                  const image = getBotImage(item.bot_name);
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => openReceipt(item)}
                      className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        {image ? (
                          <img src={image} alt={item.bot_name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#141a24] flex items-center justify-center text-[#8e96a3] text-xs">Bot</div>
                        )}
                        <span className="font-medium group-hover:text-[#6366f1] transition">{item.bot_name}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-400">{item.invested_usdt} USDT</td>
                      <td className="px-4 py-3 font-mono text-[#f59e0b] text-xs">{item.license_key}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#8e96a3]/10 text-[#8e96a3] border border-[#8e96a3]/20'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#8e96a3] text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="text-sm text-[#8e96a3]">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* --- RECEIPT MODAL --- */}
      <AnimatePresence>
        {isReceiptOpen && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 text-center relative">
                <button onClick={closeModal} className="absolute right-4 top-4 text-[#8e96a3] hover:text-white transition"><X size={24} /></button>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/30"><CheckCircle size={32} className="text-green-400" /></div>
                <h2 className="text-2xl font-bold text-white">Purchase Receipt</h2>
                <p className="text-[#8e96a3] text-sm">Transaction details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-6 relative">
                  <div className="flex items-center justify-center gap-2 mb-4 border-b border-white/5 pb-4">
                    <img src="https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png" alt="Logo" className="h-6 w-auto" />
                    <span className="text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">SmartCodeNova</span>
                  </div>
                  <div className="font-mono text-[#8e96a3] text-xs text-center mb-4">Receipt #{receipt.receiptNumber}</div>
                  <div className="flex gap-4 mb-4">
                    <img src={receipt.botImage} alt="Bot" className="w-16 h-16 rounded-lg object-cover border border-white/5" />
                    <div className="flex-1">
                      <p className="text-lg font-bold text-white">{receipt.product}</p>
                      <div className="flex items-center gap-2 text-xs text-[#8e96a3]"><span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">{receipt.status}</span></div>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
                    <div className="flex justify-between text-sm"><span className="text-[#8e96a3]">Investment Amount</span><span className="font-bold text-blue-400">{receipt.investmentAmount} USDT</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[#8e96a3]">License Key</span><span className="font-mono text-[#f59e0b] text-xs">{receipt.licenseKey}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[#8e96a3]">Date</span><span className="text-[#8e96a3] text-xs">{receipt.date}</span></div>
                  </div>
                  <div className="text-center border-t border-white/5 pt-4"><p className="text-[10px] text-[#8e96a3] font-mono tracking-widest">Thank you for choosing SmartCodeNova</p></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handlePrintReceipt} className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"><Download size={18} /> Download Receipt</button>
                  <button onClick={closeModal} className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}