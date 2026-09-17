'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Receipt, Printer, PlusCircle, Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';

export default function AdminReceiptsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();

  const [form, setForm] = useState({
    type: 'deposit',
    amount: '',
    network: 'TRC20',
    txid: '',
    wallet: '',
    status: 'Completed',
    timestamp: new Date().toISOString().slice(0, 16)
  });

  const [privacyMode, setPrivacyMode] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const maskLong = (data: string) => {
    if (!data || data.length < 12) return data;
    return '...' + data.slice(-6);
  };

  const generateReceipt = () => {
    setError('');
    const amount = parseFloat(form.amount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const timestamp = new Date(form.timestamp).toLocaleString();
    const networkDisplay = form.network;

    const logoUrl = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';
    const usdtLogo = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/USDTpg.jpg';
    const receiptNumber = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const displayTxid = privacyMode ? maskLong(form.txid) : form.txid;
    const displayWallet = privacyMode ? maskLong(form.wallet) : form.wallet;

    const themeColor = form.type === 'deposit' ? '#10b981' : '#f59e0b';
    const themeBg = form.type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';

    // ✅ width: 100%; max-width: 480px so the receipt shrinks on mobile
    const html = `
      <div style="background-color: #0b0e14; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;">
        <div style="background-color: #141a24; border-radius: 24px; border: 1px solid #2a2a50; padding: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); box-sizing: border-box;">

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a50; padding-bottom: 12px; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${logoUrl}" alt="SmartCodeNova" style="height: 28px; width: auto;" />
              <span style="font-size: 16px; font-weight: 600; background: linear-gradient(90deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SmartCodeNova</span>
            </div>
            <div style="background-color: ${themeBg}; padding: 4px 10px; border-radius: 20px; border: 1px solid ${themeColor}40; font-size: 10px; color: ${themeColor}; font-weight: 600;">
              ${form.type === 'deposit' ? '📥 DEPOSIT' : '📤 WITHDRAWAL'}
            </div>
          </div>

          <!-- Amount Card -->
          <div style="background: linear-gradient(135deg, #1a1a4e 0%, #0b0e14 100%); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 12px; border: 1px solid #2a2a50;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 8px;">
              <img src="${usdtLogo}" alt="USDT" style="width: 24px; height: 24px; border-radius: 50%;" />
              <p style="font-size: 12px; color: #8e96a3; margin: 0;">Tether (USDT)</p>
            </div>
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Amount</p>
            <p style="font-size: 26px; font-weight: 700; color: ${themeColor}; margin: 4px 0; word-break: break-all;">${amount.toFixed(2)} USDT</p>
            <p style="font-size: 12px; color: #8e96a3; margin: 0;">Status: <span style="color: ${themeColor}; font-weight: 600;">${form.status}</span></p>
          </div>

          <!-- Transaction Details -->
          <div style="background-color: #0b0e14; border-radius: 12px; padding: 12px; margin: 12px 0; border: 1px solid #1a1a40;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px;">Network</span>
              <span style="color: #f3f4f6; font-size: 12px; font-weight: 500; text-align: right;">${networkDisplay}</span>
            </div>
            ${form.type === 'deposit' ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px; flex-shrink: 0;">TXID</span>
              <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${displayTxid}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px; flex-shrink: 0;">Deposit Address</span>
              <span style="color: #8e96a3; font-size: 11px; word-break: break-all; text-align: right; max-width: 200px;">${displayWallet}</span>
            </div>
            ` : `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px; flex-shrink: 0;">Transaction ID</span>
              <span style="color: #f59e0b; font-size: 11px; font-weight: 500; word-break: break-all; text-align: right; max-width: 200px;">${displayTxid}</span>
            </div>
            `}
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #1a1a40; margin-top: 4px; padding-top: 8px; gap: 8px;">
              <span style="color: #8e96a3; font-size: 12px; flex-shrink: 0;">Date &amp; Time</span>
              <span style="color: #f3f4f6; font-size: 12px; text-align: right;">${timestamp}</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #2a2a50; padding-top: 12px; margin-top: 8px; text-align: center;">
            <p style="color: #8e96a3; font-size: 11px; margin: 0 0 4px 0; line-height: 1.5;">
              SmartCodeNova offers automated trading solutions powered by AI.
              <br />Trade smarter, grow your portfolio, and secure your financial future.
            </p>
            <p style="color: #4a4a6a; font-size: 10px; margin: 0;">Receipt ID: ${receiptNumber}</p>
          </div>
        </div>
      </div>
    `;

    setReceiptHtml(html);
  };

  const handleGenerateManual = (e: React.FormEvent) => {
    e.preventDefault();
    generateReceipt();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Receipt Generator</h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm mt-1">
            Generate clean professional transaction receipts.
          </p>
        </div>
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg border transition text-xs sm:text-sm shrink-0 w-full sm:w-auto ${
            privacyMode
              ? 'bg-[#6366f1]/20 border-[#6366f1]/40 text-[#6366f1]'
              : 'bg-[#141a24] border-white/5 text-[#8e96a3]'
          }`}
        >
          {privacyMode ? <EyeOff size={16} className="shrink-0" /> : <Eye size={16} className="shrink-0" />}
          <span className="font-medium whitespace-nowrap">{privacyMode ? 'Privacy ON' : 'Privacy OFF'}</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="min-w-0 break-words flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            aria-label="Dismiss"
            className="shrink-0 hover:opacity-70 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Form */}
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
            <PlusCircle size={20} className="shrink-0" />
            <span>Receipt Details</span>
          </h2>
          <form onSubmit={handleGenerateManual} className="space-y-4">

            {/* Type + Amount — stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Network</label>
              <select
                value={form.network}
                onChange={(e) => setForm({ ...form, network: e.target.value })}
                className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
              >
                <option>TRC20</option>
                <option>BEP20</option>
              </select>
            </div>

            {form.type === 'deposit' ? (
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">TXID</label>
                <input
                  type="text"
                  value={form.txid}
                  onChange={(e) => setForm({ ...form, txid: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Wallet Address</label>
                <input
                  type="text"
                  value={form.wallet}
                  onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] font-mono"
                  required
                />
              </div>
            )}

            {/* Timestamp + Status — stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Timestamp</label>
                <input
                  type="datetime-local"
                  value={form.timestamp}
                  onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                >
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Receipt size={18} className="shrink-0" />
              <span>Generate Receipt</span>
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
            <Printer size={20} className="shrink-0" />
            <span>Receipt Preview</span>
          </h2>
          <div className="flex-1 bg-[#0b0e14] border border-white/5 rounded-xl p-2 sm:p-4 overflow-auto min-h-[300px] sm:min-h-[400px]">
            {receiptHtml ? (
              <div dangerouslySetInnerHTML={{ __html: receiptHtml }} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8e96a3] text-center p-8">
                <div className="max-w-xs">
                  <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Configure details and click <strong className="text-white">"Generate Receipt"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {receiptHtml && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#141a24] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition flex items-center justify-center gap-2 text-sm"
              >
                <Printer size={18} className="shrink-0" />
                <span>Print / Download PDF</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-3 bg-[#141a24] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition flex items-center justify-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-green-400 shrink-0" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} className="shrink-0" />
                    <span>Copy Receipt</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
