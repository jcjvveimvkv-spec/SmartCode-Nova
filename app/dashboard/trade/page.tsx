'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, 
  ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, Download, X
} from 'lucide-react';
import TradeChartWidget from '../TradeChartWidget';
import { sendTelegram, sendEmail } from '@/app/lib/notifications';

// Helper to parse duration strings into milliseconds
const parseDuration = (duration: string) => {
  const num = parseInt(duration);
  if (duration.includes('Days')) return num * 24 * 60 * 60 * 1000;
  if (duration.includes('Weeks')) return num * 7 * 24 * 60 * 60 * 1000;
  return 2 * 24 * 60 * 60 * 1000; // Default 2 days
};

export default function TradePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [allBots, setAllBots] = useState<any[]>([]);
  const [activeBots, setActiveBots] = useState<any[]>([]);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentChartPair, setCurrentChartPair] = useState('BITSTAMP:BTCUSD');

  // Bot Pagination
  const [botPage, setBotPage] = useState(1);
  const botsPerPage = 4;
  const totalBotPages = Math.ceil(activeBots.length / botsPerPage);
  const currentBots = activeBots.slice(
    (botPage - 1) * botsPerPage,
    botPage * botsPerPage
  );

  // Trade Log Pagination
  const [tradePage, setTradePage] = useState(1);
  const tradesPerPage = 5;
  const [totalTrades, setTotalTrades] = useState(0);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // 1. Fetch Balance
    const { data: bal } = await supabase.from('user_balances').select('funding_balance').eq('user_id', user.id).single();
    if (bal) setBalance(bal.funding_balance || 0);

    // 2. Fetch ALL Bots
    const { data: botData } = await supabase
      .from('active_bots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (botData) {
      const updatedBots = botData.map((bot: any) => {
        const durationMs = parseDuration(bot.bot_name.includes('NOVA-1') ? '2 Days' : 
                                        bot.bot_name.includes('NOVA-2') ? '4 Days' :
                                        bot.bot_name.includes('NOVA-3') ? '7 Days' : '2 Weeks');
        const elapsed = Date.now() - new Date(bot.created_at).getTime();
        const isExpired = elapsed > durationMs;
        return { ...bot, isExpired, progress: Math.min((elapsed / durationMs) * 100, 100) };
      });

      const expiredBots = updatedBots.filter((b: any) => b.isExpired && b.status !== 'Expired');
      for (const bot of expiredBots) {
        await supabase.from('active_bots').update({ status: 'Expired' }).eq('id', bot.id);
        const { data: userData } = await supabase.from('user_balances').select('email, telegram_chat_id').eq('user_id', user.id).single();
        if (userData) {
          await sendEmail(userData.email, '🤖 Bot Cycle Completed', `<h2>Your ${bot.bot_name} has completed its cycle!</h2><p>Total profit: ${bot.current_value_usdt - bot.invested_usdt} USDT</p>`);
          if (userData.telegram_chat_id) {
            await sendTelegram(userData.telegram_chat_id, `✅ ${bot.bot_name} cycle completed! Profit: ${(bot.current_value_usdt - bot.invested_usdt).toFixed(2)} USDT`);
          }
        }
      }

      setAllBots(updatedBots);
      setActiveBots(updatedBots.filter((b: any) => !b.isExpired && b.is_deployed));
    }

    // 3. Fetch Trade Logs with Count
    await fetchTradeLogs();

    setLoading(false);
    setLastUpdated(new Date());
  }, [supabase, router]);

  const fetchTradeLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: logs, count } = await supabase
      .from('bot_trade_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .range((tradePage - 1) * tradesPerPage, tradePage * tradesPerPage - 1);

    if (logs) {
      // Fetch bot names for each trade
      const logsWithBotNames = await Promise.all(logs.map(async (trade) => {
        const { data: botData } = await supabase
          .from('active_bots')
          .select('bot_name')
          .eq('id', trade.bot_id)
          .single();
        return { ...trade, bot_name: botData?.bot_name || 'Unknown Bot' };
      }));

      setTradeLogs(logsWithBotNames);
      setTotalTrades(count || 0);

      if (logs.length > 0) {
        const lastTrade = logs[0];
        let tradingViewSymbol = 'BITSTAMP:BTCUSD';
        if (lastTrade.pair === 'BTC/USDT') tradingViewSymbol = 'BITSTAMP:BTCUSD';
        else if (lastTrade.pair === 'ETH/USDT') tradingViewSymbol = 'BITSTAMP:ETHUSD';
        else if (lastTrade.pair === 'LTC/USDT') tradingViewSymbol = 'BITSTAMP:LTCUSD';
        else if (lastTrade.pair === 'XRP/USDT') tradingViewSymbol = 'BITSTAMP:XRPUSD';
        else if (lastTrade.pair === 'EUR/USD') tradingViewSymbol = 'FX:EURUSD';
        else if (lastTrade.pair === 'GBP/USD') tradingViewSymbol = 'FX:GBPUSD';
        else if (lastTrade.pair === 'SOL/USDT') tradingViewSymbol = 'COINBASE:SOLUSD';
        setCurrentChartPair(tradingViewSymbol);
      }
    }
    setLastUpdated(new Date());
  };

  // Polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchTradeLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchData, tradePage]);

  const openReceipt = (trade: any) => {
    const logoUrl = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';
    const usdtLogo = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/USDTpg.jpg';
    const receiptNumber = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date(trade.executed_at).toLocaleString();

    const html = `
      <div style="background-color: #0b0e14; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; max-width: 480px; margin: 0 auto;">
        <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${logoUrl}" alt="SmartCodeNova" style="height: 32px; width: auto;" />
              <span style="font-size: 18px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
            </div>
            <div style="background-color: rgba(99, 102, 241, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid #6366f140; font-size: 10px; color: #6366f1; font-weight: 600;">📈 TRADE SETTLEMENT</div>
          </div>
          <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 16px; border: 1px solid #2a2a50;">
            <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Profit</p>
            <p style="font-size: 32px; font-weight: 700; color: #10b981; margin: 4px 0;">+${trade.profit_usdt} USDT</p>
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Pair: <span style="color: #f3f4f6; font-weight: 600;">${trade.pair}</span></p>
          </div>
          <div style="background-color: #0b0e14; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #1a1a40;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
              <span style="color: #8e96a3; font-size: 13px;">Bot</span>
              <span style="color: #f3f4f6; font-size: 13px; font-weight: 500;">${trade.bot_name || 'Unknown Bot'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
              <span style="color: #8e96a3; font-size: 13px;">Amount</span>
              <span style="color: #f3f4f6; font-size: 13px; font-weight: 500;">${trade.amount_usdt} USDT</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40;">
              <span style="color: #8e96a3; font-size: 13px;">Action</span>
              <span style="color: #10b981; font-size: 13px; font-weight: 600;">${trade.action}</span>
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

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h1 className="text-2xl font-bold">Autonomous Trading Dashboard</h1>
        <div className="flex items-center gap-4 text-sm bg-[#141a24] px-4 py-2 rounded-xl border border-white/5">
          <RefreshCw size={16} className="text-[#6366f1] animate-spin" />
          <span className="text-[#8e96a3] text-xs">Updating every 5s</span>
          <div className="w-px h-4 bg-white/10"></div>
          <Wallet size={16} className="text-[#6366f1]" /> Balance: <span className="font-bold text-green-400">{balance.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0b0e14]/50">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#8e96a3]" />
            <span className="text-xs text-[#8e96a3]">1m interval</span>
          </div>
          <span className="text-[10px] text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
            {currentChartPair}
          </span>
        </div>
        <div className="h-[500px] w-full p-2">
          <TradeChartWidget symbol={currentChartPair} />
        </div>
      </div>

      {/* Active Bot Fleet Section */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot size={18} className="text-[#6366f1]" /> Active Bot Fleet
          </h2>
          <span className="text-xs text-[#8e96a3]">Showing {activeBots.length} active bots</span>
        </div>

        {activeBots.length === 0 ? (
          <div className="py-8 text-center text-[#8e96a3]">No active bots deployed.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentBots.map((bot) => {
                const isTrading = bot.current_value_usdt !== bot.invested_usdt;
                let statusColor = 'bg-green-500';
                let statusText = 'Online';
                let pulseClass = '';

                if (bot.isExpired || bot.status === 'Expired') {
                  statusColor = 'bg-red-500';
                  statusText = 'Expired';
                } else if (isTrading) {
                  statusColor = 'bg-yellow-400';
                  statusText = 'Trading';
                  pulseClass = 'animate-pulse';
                }

                return (
                  <motion.div 
                    key={bot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-[#6366f1]/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Bot className="text-blue-400 w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{bot.bot_name}</p>
                        <p className="text-xs text-[#8e96a3]">Invested: {bot.invested_usdt} USDT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-bold">+{bot.profit_percent}%</p>
                        <p className="text-[10px] text-[#8e96a3]">{statusText}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${statusColor} ${pulseClass}`}></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bot Pagination Controls */}
            {totalBotPages > 1 && (
              <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setBotPage(prev => Math.max(1, prev - 1))}
                  disabled={botPage === 1}
                  className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-[#8e96a3]">
                  Page {botPage} of {totalBotPages}
                </span>
                <button 
                  onClick={() => setBotPage(prev => Math.min(totalBotPages, prev + 1))}
                  disabled={botPage === totalBotPages}
                  className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trade Feed Section */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0b0e14]/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-[#6366f1]" /> Settlement Trade History
          </h3>
          <span className="text-xs text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
            {lastUpdated?.toLocaleTimeString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Bot</th>
                <th className="px-6 py-3">Pair</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Profit</th>
                <th className="px-6 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {tradeLogs.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#8e96a3]">Waiting for trades to execute...</td></tr>
              ) : (
                tradeLogs.map((trade, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 text-[#8e96a3] text-xs">{new Date(trade.executed_at).toLocaleTimeString()}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Bot size={14} className="text-[#6366f1]" />
                        <span className="font-medium text-xs">{trade.bot_name || 'Unknown Bot'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono">{trade.pair}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">{trade.amount_usdt} USDT</td>
                    <td className={`px-6 py-3 font-bold ${trade.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit_usdt >= 0 ? '+' : ''}{trade.profit_usdt.toFixed(2)} USDT
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => openReceipt(trade)} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs hover:bg-[#6366f1]/20 transition">
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Trade History Pagination Controls */}
          {totalTrades > 5 && (
            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5 px-4">
              <button 
                onClick={() => setTradePage(prev => Math.max(1, prev - 1))}
                disabled={tradePage === 1}
                className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-[#8e96a3]">
                Page {tradePage} of {Math.ceil(totalTrades / 5)}
              </span>
              <button 
                onClick={() => setTradePage(prev => prev + 1)}
                disabled={tradePage * 5 >= totalTrades}
                className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
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
                <h2 className="text-2xl font-bold text-white">Trade Receipt</h2>
                <p className="text-[#8e96a3] text-sm">Transaction details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-4 overflow-auto min-h-[300px]">
                  {receipt && <div dangerouslySetInnerHTML={{ __html: receipt }} />}
                </div>
                <div className="flex gap-3">
                  <button onClick={handlePrint} className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2">
                    <Download size={18} /> Download Receipt
                  </button>
                  <button onClick={() => setIsReceiptOpen(false)} className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition">
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