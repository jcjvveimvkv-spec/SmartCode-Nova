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
import { sendTelegram, sendEmail } from '@/app/lib/notification-export';

const parseDuration = (duration: string) => {
  const num = parseInt(duration);
  if (duration.includes('Days')) return num * 24 * 60 * 60 * 1000;
  if (duration.includes('Weeks')) return num * 7 * 24 * 60 * 60 * 1000;
  return 2 * 24 * 60 * 60 * 1000;
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
  const [userTimeZone, setUserTimeZone] = useState('UTC');
  const [marketStatus, setMarketStatus] = useState<'Open' | 'Closed'>('Closed');

  const [botPage, setBotPage] = useState(1);
  const botsPerPage = 4;
  const totalBotPages = Math.ceil(activeBots.length / botsPerPage);
  const currentBots = activeBots.slice((botPage - 1) * botsPerPage, botPage * botsPerPage);

  const [tradePage, setTradePage] = useState(1);
  const tradesPerPage = 5;
  const [totalTrades, setTotalTrades] = useState(0);

  const [receipt, setReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase
      .from('user_balances')
      .select('funding_balance, timezone')
      .eq('user_id', user.id)
      .single();

    if (userData) {
      setBalance(userData.funding_balance || 0);
      const tz = userData.timezone || 'UTC';
      setUserTimeZone(tz);

      const now = new Date();
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const hour = localTime.getHours();
      setMarketStatus(hour >= 8 && hour < 20 ? 'Open' : 'Closed');
    }

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

    // ✅ FIX: width:100% + max-width:480px so it shrinks on mobile inside the modal
    const html = `
      <div style="background-color: #0b0e14; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;">
        <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 12px; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${logoUrl}" alt="SmartCodeNova" style="height: 28px; width: auto;" />
              <span style="font-size: 16px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
            </div>
            <div style="background-color: rgba(99, 102, 241, 0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid #6366f140; font-size: 10px; color: #6366f1; font-weight: 600;">📈 TRADE SETTLEMENT</div>
          </div>
          <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 12px; border: 1px solid #2a2a50;">
            <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Profit</p>
            <p style="font-size: 26px; font-weight: 700; color: #10b981; margin: 4px 0; word-break: break-all;">+${trade.profit_usdt} USDT</p>
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Pair: <span style="color: #f3f4f6; font-weight: 600;">${trade.pair}</span></p>
          </div>
          <div style="background-color: #0b0e14; border-radius: 12px; padding: 12px; margin: 12px 0; border: 1px solid #1a1a40;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px;">Bot</span>
              <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${trade.bot_name || 'Unknown Bot'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px;">Amount</span>
              <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${trade.amount_usdt} USDT</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a40; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px;">Action</span>
              <span style="color: #10b981; font-size: 12px; font-weight: 600; text-align: right;">${trade.action}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px;">Date & Time</span>
              <span style="color: #f3f4f6; font-size: 12px; text-align: right;">${date}</span>
            </div>
          </div>
          <div style="border-top: 1px solid #2a2a50; padding-top: 12px; margin-top: 8px; text-align: center;">
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
    // ✅ FIX: removed p-6 (layout already pads); added space-y-4 sm:space-y-6 + overflow-x-hidden
    <div className="space-y-4 sm:space-y-6 w-full max-w-full bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      {/* ✅ FIX: flex-col on mobile, tighter gaps, wrap the balance chip */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Autonomous Trading Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#8e96a3] mt-1">
            <Clock size={14} /> Market:
            <span className={marketStatus === 'Open' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {marketStatus}
            </span>
            <span className="text-xs bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
              {userTimeZone}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm bg-[#141a24] px-3 sm:px-4 py-2 rounded-xl border border-white/5 w-full lg:w-auto">
          <RefreshCw size={16} className="text-[#6366f1] animate-spin shrink-0" />
          <span className="text-[#8e96a3] text-xs">Updating every 5s</span>
          <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
          <Wallet size={16} className="text-[#6366f1] shrink-0" />
          <span className="text-[#8e96a3]">Balance:</span>
          <span className="font-bold text-green-400 truncate">{balance.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between gap-2 bg-[#0b0e14]/50">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} className="text-[#8e96a3] shrink-0" />
            <span className="text-xs text-[#8e96a3]">1m interval</span>
          </div>
          <span className="text-[10px] text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5 truncate max-w-[60%]">
            {currentChartPair}
          </span>
        </div>
        {/* ✅ FIX: shorter on mobile — was fixed 500px which exceeds mobile viewport */}
        <div className="h-[280px] sm:h-[380px] md:h-[500px] w-full p-2">
          <TradeChartWidget symbol={currentChartPair} />
        </div>
      </div>

      {/* Active Bot Fleet */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-white/5 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Bot size={18} className="text-[#6366f1]" /> Active Bot Fleet
          </h2>
          <span className="text-xs text-[#8e96a3]">Showing {activeBots.length} active bots</span>
        </div>

        {activeBots.length === 0 ? (
          <div className="py-8 text-center text-[#8e96a3]">No active bots deployed.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                    className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 hover:border-[#6366f1]/30 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                        <Bot className="text-blue-400 w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{bot.bot_name}</p>
                        <p className="text-xs text-[#8e96a3] truncate">Invested: {bot.invested_usdt} USDT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

            {totalBotPages > 1 && (
              <div className="flex justify-center sm:justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => setBotPage(prev => Math.max(1, prev - 1))}
                  disabled={botPage === 1}
                  aria-label="Previous page"
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
                  aria-label="Next page"
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
        <div className="p-3 sm:p-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-2 bg-[#0b0e14]/50">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp size={18} className="text-[#6366f1]" /> Settlement Trade History
          </h3>
          <span className="text-xs text-[#8e96a3] bg-[#141a24] px-2 py-0.5 rounded-full border border-white/5">
            {lastUpdated?.toLocaleTimeString()}
          </span>
        </div>

        {/* ✅ FIX: Mobile card list (< md), desktop table (≥ md) — same data, two render paths */}
        {tradeLogs.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#8e96a3] text-sm">Waiting for trades to execute...</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {tradeLogs.map((trade, idx) => (
                <div key={idx} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot size={14} className="text-[#6366f1] shrink-0" />
                      <span className="font-medium text-xs text-white truncate">{trade.bot_name || 'Unknown Bot'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trade.action}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div className="text-[#8e96a3]">Time</div>
                    <div className="text-right text-white">{new Date(trade.executed_at).toLocaleTimeString()}</div>

                    <div className="text-[#8e96a3]">Pair</div>
                    <div className="text-right font-mono text-white truncate">{trade.pair}</div>

                    <div className="text-[#8e96a3]">Amount</div>
                    <div className="text-right text-white truncate">{trade.amount_usdt} USDT</div>

                    <div className="text-[#8e96a3]">Profit</div>
                    <div className={`text-right font-bold ${trade.profit_usdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit_usdt >= 0 ? '+' : ''}{trade.profit_usdt.toFixed(2)} USDT
                    </div>
                  </div>

                  <button
                    onClick={() => openReceipt(trade)}
                    className="w-full mt-1 py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs font-medium hover:bg-[#6366f1]/20 transition"
                  >
                    View Receipt
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                  {tradeLogs.map((trade, idx) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalTrades > 5 && (
              <div className="flex justify-center sm:justify-end items-center gap-4 py-3 px-4 border-t border-white/5">
                <button
                  onClick={() => setTradePage(prev => Math.max(1, prev - 1))}
                  disabled={tradePage === 1}
                  aria-label="Previous page"
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
                  aria-label="Next page"
                  className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
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
            onClick={() => setIsReceiptOpen(false)}
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
                  onClick={() => setIsReceiptOpen(false)}
                  aria-label="Close receipt"
                  className="absolute right-3 top-3 sm:right-4 sm:top-4 text-[#8e96a3] hover:text-white transition p-1"
                >
                  <X size={22} />
                </button>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Trade Receipt</h2>
                <p className="text-[#8e96a3] text-xs sm:text-sm">Transaction details</p>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* ✅ FIX: removed min-h-[300px] (unnecessary on mobile), added scroll to inner HTML wrapper */}
                <div className="bg-[#0b0e14] rounded-xl border border-white/5 p-2 sm:p-4 overflow-auto">
                  {receipt && <div dangerouslySetInnerHTML={{ __html: receipt }} />}
                </div>
              </div>

              {/* ✅ FIX: buttons pinned outside the scroll area, sit at bottom of modal */}
              <div className="p-3 sm:p-6 pt-0 flex gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 sm:py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download size={18} /> Download
                </button>
                <button
                  onClick={() => setIsReceiptOpen(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition text-sm sm:text-base"
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
