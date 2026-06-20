'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, Clock, CheckCircle, XCircle, X, Download } from 'lucide-react';

export default function TransactionsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'deposits' | 'trades' | 'withdrawals'>('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: tradeData } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: depositData } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  const openReceipt = (item: any, type: 'deposit' | 'withdrawal' | 'trade') => {
    const logoUrl = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';
    const usdtLogo = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/USDTpg.jpg';
    const receiptNumber = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date(item.created_at || item.executed_at).toLocaleString();

    let html = '';
    if (type === 'deposit') {
      html = `
        <div style="background-color: #0b0e14; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 480px; margin: 0 auto;">
          <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 32px; width: auto;" />
                <span style="font-size: 18px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid #10b98140; font-size: 10px; color: #10b981; font-weight: 600;">📥 DEPOSIT</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 16px; border: 1px solid #2a2a50;">
              <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Amount</p>
              <p style="font-size: 32px; font-weight: 700; color: #10b981; margin: 4px 0;">${item.amount} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Status: <span style="color: #10b981; font-weight: 600;">${item.status}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px;">
                <span style="color: #8e96a3; font-size: 13px;">TXID</span>
                <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${item.txid}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px;">
                <span style="color: #8e96a3; font-size: 13px;">Date & Time</span>
                <span style="color: #f3f4f6; font-size: 13px;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 8px; text-align: center;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'withdrawal') {
      html = `
        <div style="background-color: #0b0e14; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 480px; margin: 0 auto;">
          <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 32px; width: auto;" />
                <span style="font-size: 18px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(245, 158, 11, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid #f59e0b40; font-size: 10px; color: #f59e0b; font-weight: 600;">📤 WITHDRAWAL</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 16px; border: 1px solid #2a2a50;">
              <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Net Amount</p>
              <p style="font-size: 32px; font-weight: 700; color: #10b981; margin: 4px 0;">${item.net_amount} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Status: <span style="color: #10b981; font-weight: 600;">${item.status}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
                <span style="color: #8e96a3; font-size: 13px;">Amount Requested</span>
                <span style="color: #f3f4f6; font-size: 13px; font-weight: 500;">${item.amount} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
                <span style="color: #8e96a3; font-size: 13px;">Fee (3%)</span>
                <span style="color: #ef4444; font-size: 13px; font-weight: 500;">-${item.fee_amount} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
                <span style="color: #8e96a3; font-size: 13px;">Destination Wallet</span>
                <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${item.wallet_address}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px;">
                <span style="color: #8e96a3; font-size: 13px;">Date & Time</span>
                <span style="color: #f3f4f6; font-size: 13px;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 8px; text-align: center;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'trade') {
      html = `
        <div style="background-color: #0b0e14; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 480px; margin: 0 auto;">
          <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 32px; width: auto;" />
                <span style="font-size: 18px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(99, 102, 241, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid #6366f140; font-size: 10px; color: #6366f1; font-weight: 600;">📈 TRADE</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 16px; border: 1px solid #2a2a50;">
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Profit</p>
              <p style="font-size: 32px; font-weight: 700; color: #10b981; margin: 4px 0;">+${item.profit_usdt} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Pair: <span style="color: #f3f4f6; font-weight: 600;">${item.pair}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
                <span style="color: #8e96a3; font-size: 13px;">Amount</span>
                <span style="color: #f3f4f6; font-size: 13px; font-weight: 500;">${item.amount_usdt} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
                <span style="color: #8e96a3; font-size: 13px;">Action</span>
                <span style="color: #10b981; font-size: 13px; font-weight: 600;">${item.action}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px;">
                <span style="color: #8e96a3; font-size: 13px;">Date & Time</span>
                <span style="color: #f3f4f6; font-size: 13px;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 16px; margin-top: 8px; text-align: center;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
            </div>
          </div>
        </div>
      `;
    }

    setReceipt(html);
    setIsReceiptOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receipt);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading history...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-[#8e96a3] text-sm">Complete record of your deposits, trades, and withdrawals.</p>
        </div>
      </div>

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
                  <th className="px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8e96a3]">No deposits found.</td></tr>
                ) : (
                  deposits.map((d) => (
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
                      <td className="px-4 py-3">
                        <button onClick={() => openReceipt(d, 'deposit')} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs hover:bg-[#6366f1]/20 transition">
                          View Receipt
                        </button>
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
                  <th className="px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8e96a3]">No trades found.</td></tr>
                ) : (
                  trades.map((t) => (
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
                      <td className="px-4 py-3">
                        <button onClick={() => openReceipt(t, 'trade')} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs hover:bg-[#6366f1]/20 transition">
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Withdrawals Table */}
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
                  <th className="px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-[#8e96a3]">No withdrawals found.</td></tr>
                ) : (
                  withdrawals.map((w) => (
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
                      <td className="px-4 py-3">
                        <button onClick={() => openReceipt(w, 'withdrawal')} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs hover:bg-[#6366f1]/20 transition">
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
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
            onClick={() => setIsReceiptOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 text-center relative">
                <button onClick={() => setIsReceiptOpen(false)} className="absolute right-4 top-4 text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white">Transaction Receipt</h2>
                <p className="text-[#8e96a3] text-sm">Transaction details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4 overflow-auto min-h-[300px]">
                  {receipt && <div dangerouslySetInnerHTML={{ __html: receipt }} />}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handlePrint}
                    className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download Receipt
                  </button>
                  <button 
                    onClick={() => setIsReceiptOpen(false)}
                    className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}