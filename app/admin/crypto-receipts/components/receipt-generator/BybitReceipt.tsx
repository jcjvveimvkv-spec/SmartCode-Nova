// app/admin/crypto-receipts/components/receipt-generator/BybitReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy } from 'lucide-react';

interface BybitReceiptData {
  cryptocurrency: string;
  amount: string;
  amountUSD: string;
  receiverAddress: string;
  networkFee: string;
  transactionMode: 'send' | 'receive';
  useCustomDate: boolean;
  date: string;
  time: string;
  txid?: string;
  network?: string;
}

interface BybitReceiptProps {
  data: BybitReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function BybitReceipt({ data, themeMode = 'dark' }: BybitReceiptProps) {
  const [isDark, setIsDark] = useState(themeMode === 'dark');

  useEffect(() => {
    if (themeMode) {
      setIsDark(themeMode === 'dark');
    } else {
      const checkTheme = () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
      };
      
      checkTheme();
      
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      
      return () => observer.disconnect();
    }
  }, [themeMode]);

  const safeData = {
    cryptocurrency: data?.cryptocurrency || 'USDT',
    amount: data?.amount || '0',
    amountUSD: data?.amountUSD || '',
    receiverAddress: data?.receiverAddress || '0xe8eB7183a68fe48861A2a3f5CB449A5e63D166dF',
    networkFee: data?.networkFee || '1',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    network: data?.network || 'BSC (BEP20)',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(2);
  const networkFee = safeData.networkFee || '1';
  
  const isDeposit = safeData.transactionMode === 'receive';
  const isSend = safeData.transactionMode === 'send';
  
  // Format date
  const formatDate = (dateStr: string, timeStr: string) => {
    if (!dateStr && !timeStr) return 'Today';
    if (dateStr && timeStr) {
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const year = parseInt(dateParts[0]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${timeStr}`;
      }
      return `${dateStr} ${timeStr}`;
    }
    return 'Today';
  };
  
  // Format address with line breaks for display
  const formatAddressWithBreaks = (address: string) => {
    if (!address) return '';
    const chunkSize = 18;
    const chunks = [];
    for (let i = 0; i < address.length; i += chunkSize) {
      chunks.push(address.slice(i, i + chunkSize));
    }
    return chunks.join('\n');
  };

  // Format hash with line breaks
  const formatHashWithBreaks = (hash: string) => {
    if (!hash) return '';
    const chunkSize = 18;
    const chunks = [];
    for (let i = 0; i < hash.length; i += chunkSize) {
      chunks.push(hash.slice(i, i + chunkSize));
    }
    return chunks.join('\n');
  };

  const displayAddress = safeData.receiverAddress || '0xe8eB7183a68fe48861A2a3f5CB449A5e63D166dF';
  const displayTxid = safeData.txid || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const displayDate = formatDate(safeData.date, safeData.time);

  // Colors based on theme
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-[#707682]' : 'text-gray-500';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-400';
  const borderColor = isDark ? 'border-[#2a3340]' : 'border-gray-200';
  const btnBg = isDark ? 'bg-black hover:bg-[#1a1a1a]' : 'bg-white hover:bg-gray-50';
  const btnBorder = isDark ? 'border-[#2a3340]' : 'border-gray-300';
  const btnText = isDark ? 'text-[#d9dadf]' : 'text-gray-700';
  const statusBg = isDark ? 'bg-[#065f46]' : 'bg-green-100';
  const statusText = isDark ? 'text-[#34d399]' : 'text-green-600';
  const statusBorder = isDark ? 'border-[#34d399]' : 'border-green-500';
  const statusIconColor = isDark ? 'text-[#34d399]' : 'text-green-500';
  const copyIconColor = isDark ? 'text-[#707682] hover:text-[#d9dadf]' : 'text-gray-400 hover:text-gray-600';
  const viewBtnColor = isDark ? 'text-[#d9dadf]' : 'text-gray-700';
  const viewBtnBorder = isDark ? 'border-[#2a3340]' : 'border-gray-300';
  
  const title = isDeposit ? 'Deposit Details' : 'Withdrawal Details';
  const statusTextDisplay = isDeposit ? 'Deposit Completed' : 'Withdrawal Completed';
  const accountLabel = isDeposit ? 'Deposit Account' : 'Withdrawal Account';
  const accountValue = isDeposit ? 'Funding Account' : 'Funding Account';
  const chainType = safeData.network || 'BSC (BEP20)';

  return (
    <div className={`${bgColor} ${textColor} rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto`} style={{ width: '375px', padding: '24px 20px 20px' }}>
      {/* Header - No headset icon */}
      <div className="flex justify-between items-center mb-5">
        <button className="text-[#d9dadf] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-semibold tracking-wide">{title}</h1>
        <div className="w-8"></div>
      </div>

      {/* Quantity */}
      <div className="text-center mb-3">
        <div className="text-xs text-[#707682] font-normal tracking-wide mb-1">Quantity</div>
        <div className="text-[30px] font-bold tracking-wide">
          {formattedAmount} {safeData.cryptocurrency}
        </div>
      </div>

      {/* Status - Light green with dark green circle - NO LINE UNDER */}
      <div className="flex items-center justify-center gap-2 mb-4 pb-0 border-b-0">
        <div className={`w-[18px] h-[18px] ${statusBg} rounded-full flex items-center justify-center flex-shrink-0 border-2 ${statusBorder}`}>
          <Check className={`w-[9px] h-[9px] ${statusIconColor}`} />
        </div>
        <span className={`text-sm font-medium ${statusText}`}>{statusTextDisplay}</span>
      </div>

      {/* Details - No border lines between rows, NO DIVIDER LINE */}
      <div className="detail-row">
        <span className={`text-sm ${textSecondary}`}>{accountLabel}</span>
        <span className={`text-sm ${textColor}`}>{accountValue}</span>
      </div>

      <div className="detail-row">
        <span className={`text-sm ${textSecondary}`}>Fees</span>
        <span className={`text-sm ${textColor}`}>{networkFee}</span>
      </div>

      <div className="detail-row">
        <span className={`text-sm ${textSecondary}`}>Chain Type</span>
        <span className={`text-sm ${textColor}`}>{chainType}</span>
      </div>

      <div className="detail-row">
        <span className={`text-sm ${textSecondary}`}>Time</span>
        <span className={`text-sm ${textColor}`}>{displayDate}</span>
      </div>

      <div className="flex justify-between items-start py-2.5">
        <span className={`text-sm ${textSecondary}`}>Withdrawal Address</span>
        <div className="flex items-start gap-2 max-w-[55%] text-right">
          <span className={`text-sm ${textColor} leading-relaxed whitespace-pre-line`}>
            {formatAddressWithBreaks(displayAddress)}
          </span>
          <button 
            className={`${copyIconColor} flex-shrink-0 mt-0.5 transition-colors bg-transparent border-none cursor-pointer p-0`}
            onClick={() => navigator.clipboard.writeText(displayAddress)}
          >
            <Copy className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start py-2.5">
        <span className={`text-sm ${textSecondary}`}>Transaction Hash</span>
        <div className="flex items-start gap-2 max-w-[55%] text-right">
          <span className={`text-sm ${textColor} leading-relaxed whitespace-pre-line`}>
            {formatHashWithBreaks(displayTxid)}
          </span>
          <button 
            className={`${copyIconColor} flex-shrink-0 mt-0.5 transition-colors bg-transparent border-none cursor-pointer p-0`}
            onClick={() => navigator.clipboard.writeText(displayTxid)}
          >
            <Copy className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>

      {/* View Blockchain Button - Black background, no icon, no top line */}
      <div className="mt-[178px] text-center">
        <button className={`${btnBg} ${btnText} ${btnBorder} w-full py-3 px-5 rounded-lg text-sm font-medium transition-colors border cursor-pointer`}>
          View in Blockchain Explorer
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 10px 0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .text-gray-400 { color: #707682; }
          .bg-black { background-color: #000000; }
          .bg-white { background-color: #ffffff; }
          .text-white { color: #ffffff; }
          .text-gray-900 { color: #111827; }
          .border-\\[\\#2a3340\\] { border-color: #2a3340; }
          .border-gray-200 { border-color: #e5e7eb; }
          .border-gray-300 { border-color: #d1d5db; }
          .whitespace-pre-line { white-space: pre-line; }
          .leading-relaxed { line-height: 1.625; }
          .w-\\[14px\\] { width: 14px; }
          .h-\\[14px\\] { height: 14px; }
          .w-\\[18px\\] { width: 18px; }
          .h-\\[18px\\] { height: 18px; }
          .w-\\[9px\\] { width: 9px; }
          .h-\\[9px\\] { height: 9px; }
          .border-2 { border-width: 2px; }
          .border-b-0 { border-bottom-width: 0; }
          .gap-2 { gap: 0.5rem; }
          .gap-1 { gap: 0.25rem; }
          .mt-\\[178px\\] { margin-top: 178px; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-5 { margin-bottom: 1.25rem; }
          .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
          .p-0 { padding: 0; }
          .p-1 { padding: 0.25rem; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-\\[17px\\] { font-size: 17px; }
          .text-\\[30px\\] { font-size: 30px; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .tracking-wide { letter-spacing: 0.025em; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-full { border-radius: 9999px; }
          .rounded-xl { border-radius: 0.75rem; }
          .overflow-hidden { overflow: hidden; }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .max-w-\\[55%\\] { max-width: 55%; }
          .flex-shrink-0 { flex-shrink: 0; }
          .mt-0\\.5 { margin-top: 0.125rem; }
          .gap-2 { gap: 0.5rem; }
          .bg-transparent { background-color: transparent; }
          .border { border-width: 1px; }
          .border-none { border: none; }
          .cursor-pointer { cursor: pointer; }
          .transition-colors { transition: color 0.2s, background-color 0.2s; }
          .hover\\:text-white:hover { color: #ffffff; }
          .hover\\:text-\\[\\#d9dadf\\]:hover { color: #d9dadf; }
          .hover\\:text-gray-600:hover { color: #4b5563; }
          .hover\\:bg-\\[\\#1a1a1a\\]:hover { background-color: #1a1a1a; }
          .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
          .focus\\:outline-none:focus { outline: none; }
          .bg-\\[\\#065f46\\] { background-color: #065f46; }
          .text-\\[\\#34d399\\] { color: #34d399; }
          .border-\\[\\#34d399\\] { border-color: #34d399; }
          .text-\\[\\#707682\\] { color: #707682; }
          .text-\\[\\#d9dadf\\] { color: #d9dadf; }
          .text-gray-500 { color: #6b7280; }
          .text-green-600 { color: #16a34a; }
          .border-green-500 { border-color: #22c55e; }
          .bg-green-100 { background-color: #d1fae5; }
          .hover\\:bg-\\[\\#1a1a1a\\]:hover { background-color: #1a1a1a; }
          .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
          .max-w-md { max-width: 28rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .w-full { width: 100%; }
          .w-8 { width: 2rem; }
          .w-5 { width: 1.25rem; }
          .h-5 { height: 1.25rem; }
          .bg-black { background-color: #000000; }
          .bg-white { background-color: #ffffff; }
        `
      }} />
    </div>
  );
}