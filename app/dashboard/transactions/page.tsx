'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react';

export default function TransactionsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'deposits' | 'trades' | 'withdrawals'>('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Fetch Trades
      const { data: tradeData } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch Deposits
      const { data: depositData } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch Withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTrades(tradeData || []);
      setDeposits(depositData || []);
      setWithdrawals(withdrawalData || []);
      setLoading(false);
    }
    fetchHistory();
  }, [supabase, router]);

  // Filter functions
  const filteredDeposits = deposits.filter(d => 
    d.txid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrades = trades.filter(t => 
    t.pair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.trade_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter(w => 
    w.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading history...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-[#8e96a3] text-sm">Complete record of your deposits, trades, and withdrawals.</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex bg-[#0b0e14] rounded-xl p-1 border border-white/5">
            {['deposits', 'trades', 'withdrawals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-[#6366f1] text-white' : 'text-[#8e96a3] hover:text-white'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search TXID, Pair, or Wallet..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {/* Deposits Table */}
        {activeTab === 'deposits' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Network</th>
                  <th className="px-4 py-3">TXID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeposits.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8e96a3]">No deposits found matching your search.</td></tr>
                ) : (
                  filteredDeposits.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-green-400">{d.amount} USDT</td>
                      <td className="px-4 py-3 text-[#8e96a3]">{d.network}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#f59e0b] truncate max-w-[100px]">{d.txid}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${d.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : d.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                          {d.status === 'approved' ? <CheckCircle size={12} /> : d.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Trades Table */}
        {activeTab === 'trades' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Profit</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8e96a3]">No trades found matching your search.</td></tr>
                ) : (
                  filteredTrades.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{t.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.trade_type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.trade_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{t.amount_usdt} USDT</td>
                      <td className={`px-4 py-3 font-bold ${t.profit_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.profit_percent >= 0 ? '+' : ''}{t.profit_percent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Withdrawals Table (NEW) */}
        {activeTab === 'withdrawals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/5 text-[#8e96a3]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Fee (3%)</th>
                  <th className="px-4 py-3">Net Received</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8e96a3]">No withdrawal requests found matching your search.</td></tr>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-yellow-400">{w.amount} USDT</td>
                      <td className="px-4 py-3 text-red-400">-{w.fee_amount?.toFixed(2)} USDT</td>
                      <td className="px-4 py-3 font-bold text-green-400">{w.net_amount?.toFixed(2)} USDT</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#8e96a3] truncate max-w-[100px]">{w.wallet_address}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${w.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : w.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                          {w.status === 'approved' ? <CheckCircle size={12} /> : w.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
}