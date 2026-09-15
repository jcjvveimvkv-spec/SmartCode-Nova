'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle, XCircle, X, Download, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'deposits' | 'trades' | 'withdrawals'>('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [tradePage, setTradePage] = useState(1);
  const [totalTrades, setTotalTrades] = useState(0);
  const tradesPerPage = 5;

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

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

      const { data: tradeData, count } = await supabase
        .from('bot_trade_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .range((tradePage - 1) * tradesPerPage, tradePage * tradesPerPage - 1);

      const tradeWithBotNames = await Promise.all((tradeData || []).map(async (trade) => {
        const { data: botData } = await supabase
          .from('active_bots')
          .select('bot_name, status')
          .eq('id', trade.bot_id)
          .single();

        return {
          ...trade,
          bot_name: botData?.bot_name || 'Unknown Bot',
          bot_status: botData?.status || 'Unknown'
        };
      }));

      setTrades(tradeWithBotNames || []);
      setTotalTrades(count || 0);
      setDeposits(depositData || []);
      setWithdrawals(withdrawalData || []);
      setLoading(false);
    }
    fetchHistory();
  }, [supabase, router, tradePage]);

  const openReceipt = (item: any, type: 'deposit' | 'withdrawal' | 'trade') => {
    const logoUrl = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';
    const usdtLogo = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/USDTpg.jpg';
    const receiptNumber = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date(item.created_at || item.executed_at).toLocaleString();

    let html = '';
    if (type === 'deposit') {
      html = `
        <div style="background-color: #0b0e14; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;">
          <div style="background-color: #141a24; border-radius: 20px; border: 1px solid #2a2a50; padding: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 12px; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 28px; width: auto;" />
                <span style="font-size: 16px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid #10b98140; font-size: 10px; color: #10b981; font-weight: 600;">📥 DEPOSIT</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 12px; border: 1px solid #2a2a50;">
              <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Amount</p>
              <p style="font-size: 26px; font-weight: 700; color: #10b981; margin: 4px 0; word-break: break-all;">${item.amount} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Status: <span style="color: #10b981; font-weight: 600;">${item.status}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 12px; margin: 12px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">TXID</span>
                <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${item.txid}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Date &amp; Time</span>
                <span style="color: #f3f4f6; font-size: 12px; text-align: right;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 12px; margin-top: 8px; text-align: center;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'withdrawal') {
      html = `
        <div style="background-color: #0b0e14; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;">
          <div style="background-color: #141a24; border-radius: 20px; border: 1px solid #2a2a50; padding: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 12px; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 28px; width: auto;" />
                <span style="font-size: 16px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(245, 158, 11, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid #f59e0b40; font-size: 10px; color: #f59e0b; font-weight: 600;">📤 WITHDRAWAL</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 12px; border: 1px solid #2a2a50;">
              <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Net Amount</p>
              <p style="font-size: 26px; font-weight: 700; color: #10b981; margin: 4px 0; word-break: break-all;">${item.net_amount} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Status: <span style="color: #10b981; font-weight: 600;">${item.status}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 12px; margin: 12px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Amount Requested</span>
                <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${item.amount} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Fee (3%)</span>
                <span style="color: #ef4444; font-size: 12px; font-weight: 500; text-align: right;">-${item.fee_amount} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Destination Wallet</span>
                <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${item.wallet_address}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Date &amp; Time</span>
                <span style="color: #f3f4f6; font-size: 12px; text-align: right;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 12px; margin-top: 8px; text-align: center;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'trade') {
      html = `
        <div style="background-color: #0b0e14; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;">
          <div style="background-color: #141a24; border-radius: 20px; border: 1px solid #2a2a50; padding: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 12px; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${logoUrl}" alt="SmartCodeNova" style="height: 28px; width: auto;" />
                <span style="font-size: 16px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
              </div>
              <div style="background-color: rgba(99, 102, 241, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid #6366f140; font-size: 10px; color: #6366f1; font-weight: 600;">📈 TRADE</div>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 12px; border: 1px solid #2a2a50;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #f3f4f6; font-weight: 600;">${item.bot_name || 'Unknown Bot'}</span>
              </div>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Profit</p>
              <p style="font-size: 26px; font-weight: 700; color: #10b981; margin: 4px 0; word-break: break-all;">+${item.profit_usdt} USDT</p>
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Pair: <span style="color: #f3f4f6; font-weight: 600;">${item.pair}</span></p>
            </div>
            <div style="background-color: #0b0e14; border-radius: 12px; padding: 12px; margin: 12px 0; border: 1px solid #1a1a40;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Bot</span>
                <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${item.bot_name || 'Unknown Bot'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Amount</span>
                <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${item.amount_usdt} USDT</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Action</span>
                <span style="color: #10b981; font-size: 12px; font-weight: 600; text-align: right;">${item.action}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
                <span style="color: #8e96a3; font-size: 12px;">Date &amp; Time</span>
                <span style="color: #f3f4f6; font-size: 12px; text-align: right;">${date}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #2a2a50; padding-top: 12px; margin-top: 8px; text-align: center;">
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-6xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Transaction History</h1>
        <p className="text-[#8e96a3] text-xs sm:text-sm">Complete record of your deposits, trades, and withdrawals.</p>
      </div>

      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-3 sm:p-4">

        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4">
          <div className="flex bg-[#0b0e14] rounded-xl p-1 border border-white/5 overflow-x-auto">
            {['deposits', 'trades', 'withdrawals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab ? 'bg-[#6366f1] text-white' : 'text-[#8e96a3] hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input
              type="text"
              placeholder="Search TXID, Pair, Bot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {/* ---------- DEPOSITS ---------- */}
        {activeTab === 'deposits' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {deposits.length === 0 ? (
              <div className="py-8 text-center text-[#8e96a3] text-sm">No deposits found.</div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {deposits.map((d) => {
                    const badge = d.status === 'approved'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : d.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                    const Icon = d.status === 'approved' ? CheckCircle : d.status === 'rejected' ? XCircle : Clock;
                    return (
                      <div key={d.id} className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#8e96a3]">{new Date(d.created_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border inline-flex items-center gap-1 ${badge}`}>
                            <Icon size={12} /> {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-green-400">{d.amount} USDT</div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs pt-2 border-t border-white/5">
                          <span className="text-[#8e96a3]">Network</span>
                          <span className="text-right text-white">{d.network}</span>
                          <span className="text-[#8e96a3]">TXID</span>
                          <span className="text-right font-mono text-[#f59e0b] break-all">{d.txid}</span>
                        </div>
                        <button
                          onClick={() => openReceipt(d, 'deposit')}
                          className="w-full py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs font-medium hover:bg-[#6366f1]/20 transition"
                        >
                          View Receipt
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
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
                      {deposits.map((d) => (
                        <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="px-4 py-3">{new Date(d.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-bold text-green-400">{d.amount} USDT</td>
                          <td className="px-4 py-3 text-[#8e96a3]">{d.network}</td>
                          <td className="px-4 py-3 text-xs font-mono text-[#f59e0b] truncate max-w-[140px]">{d.txid}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${d.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : d.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ---------- TRADES ---------- */}
        {activeTab === 'trades' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {trades.length === 0 ? (
              <div className="py-8 text-center text-[#8e96a3] text-sm">No trades found.</div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {trades.map((t) => {
                    const sBadge = t.bot_status === 'Active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : t.bot_status === 'Expired'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                    const SIcon = t.bot_status === 'Active' ? CheckCircle : XCircle;
                    return (
                      <div key={t.id} className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Bot size={14} className="text-[#6366f1] shrink-0" />
                            <span className="text-xs text-white truncate">{t.bot_name || 'Unknown Bot'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${t.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.action}
                          </span>
                        </div>
                        <div className="text-xs text-[#8e96a3]">{new Date(t.executed_at).toLocaleString()}</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                          <span className="text-[#8e96a3]">Pair</span>
                          <span className="text-right text-white font-mono truncate">{t.pair}</span>
                          <span className="text-[#8e96a3]">Amount</span>
                          <span className="text-right text-white truncate">{t.amount_usdt} USDT</span>
                          <span className="text-[#8e96a3]">Profit</span>
                          <span className={`text-right font-bold ${t.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {t.profit_usdt >= 0 ? '+' : ''}{t.profit_usdt} USDT
                          </span>
                          <span className="text-[#8e96a3]">Bot Status</span>
                          <span className="text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${sBadge}`}>
                              <SIcon size={12} /> {t.bot_status || 'Unknown'}
                            </span>
                          </span>
                        </div>
                        <button
                          onClick={() => openReceipt(t, 'trade')}
                          className="w-full py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs font-medium hover:bg-[#6366f1]/20 transition"
                        >
                          View Receipt
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="border-b border-white/5 text-[#8e96a3]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Bot</th>
                        <th className="px-4 py-3">Pair</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Profit</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="px-4 py-3">{new Date(t.executed_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Bot size={14} className="text-[#6366f1]" />
                              <span className="font-medium text-xs">{t.bot_name || 'Unknown Bot'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{t.pair}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {t.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">{t.amount_usdt} USDT</td>
                          <td className={`px-4 py-3 font-bold ${t.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {t.profit_usdt >= 0 ? '+' : ''}{t.profit_usdt} USDT
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${t.bot_status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : t.bot_status === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                              {t.bot_status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {t.bot_status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openReceipt(t, 'trade')} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs hover:bg-[#6366f1]/20 transition">
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalTrades > 5 && (
                  <div className="flex justify-center sm:justify-end items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setTradePage(prev => Math.max(1, prev - 1))}
                      disabled={tradePage === 1}
                      aria-label="
