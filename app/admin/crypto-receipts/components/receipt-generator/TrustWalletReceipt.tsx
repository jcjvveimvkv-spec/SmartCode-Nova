// app/admin/crypto-receipts/components/receipt-generator/TrustWalletReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Share2, Info, ChevronRight } from 'lucide-react';

interface TrustWalletReceiptData {
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

interface TrustWalletReceiptProps {
  data: TrustWalletReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function TrustWalletReceipt({ data, themeMode = 'dark' }: TrustWalletReceiptProps) {
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
    cryptocurrency: data?.cryptocurrency || 'BTC',
    amount: data?.amount || '0',
    amountUSD: data?.amountUSD || '',
    receiverAddress: data?.receiverAddress || 'bc1q3g2t64dg4',
    networkFee: data?.networkFee || '0.00003417',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    network: data?.network || 'Bitcoin (BTC)',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(8);
  const networkFee = safeData.networkFee || '0.00003417';
  
  const isDeposit = safeData.transactionMode === 'receive';
  const amountSign = isDeposit ? '+' : '-';
  
  // USD value - use user input or auto-calculate
  const usdValue = safeData.amountUSD || (parseFloat(safeData.amount || '0') * 65000).toFixed(2);
  
  // Calculate network fee in USD (approximate based on BTC rate)
  const networkFeeUSD = (parseFloat(networkFee) * 65000).toFixed(2);
  
  // Format address with dots in the middle (first 7 chars + ... + last 6 chars)
  const formatAddress = (address: string) => {
    if (!address || address.length <= 13) return address;
    const firstPart = address.slice(0, 7);
    const lastPart = address.slice(-6);
    return `${firstPart}...${lastPart}`;
  };
  
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
        return `${monthNames[month-1]} ${day}, ${year} at ${timeStr}`;
      }
      return `${dateStr} at ${timeStr}`;
    }
    return 'Today';
  };
  
  // Colors based on theme
  const bgColor = isDark ? 'bg-[#1e2530]' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#2a2f3a]' : 'bg-gray-50';
  const dividerColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const amountColor = textColor;
  const statusColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const iconColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const iconHover = isDark ? 'hover:text-white' : 'hover:text-gray-700';
  
  const title = 'Transfer';
  const addressLabel = isDeposit ? 'Sender' : 'Recipient';
  const displayAddress = formatAddress(safeData.receiverAddress || 'bc1q3g2t64dg4');
  const displayDate = formatDate(safeData.date, safeData.time);

  return (
    <div className={`${bgColor} ${textColor} rounded-2xl overflow-hidden shadow-2xl`} style={{ maxWidth: '420px', width: '100%', margin: '0 auto', padding: '20px 16px 30px' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-1 pb-4">
        <button className={`${iconColor} ${iconHover} transition-colors`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-lg font-bold ${textColor} tracking-tight`}>{title}</h1>
        <button className={`${iconColor} ${iconHover} transition-colors`}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Amount Section - Uses default text color */}
      <div className="flex flex-col items-center py-4 pb-6">
        <div className={`text-3xl font-bold ${amountColor} tracking-tight`}>
          {amountSign}{formattedAmount} {safeData.cryptocurrency}
        </div>
        <div className={`text-base ${textSecondary} mt-1`}>
          ≈ ${usdValue}
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className={`${cardBg} rounded-xl p-4 mb-4`}>
        <div className="flex justify-between items-center py-2">
          <span className={`${textSecondary} text-sm`}>Date</span>
          <span className={`${textColor} text-sm font-medium`}>{displayDate}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className={`${textSecondary} text-sm`}>Status</span>
          <span className={`${statusColor} text-sm font-medium`}>Completed</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className={`${textSecondary} text-sm`}>{addressLabel}</span>
          <span className={`${textColor} text-sm font-mono text-right max-w-[55%] break-all`}>
            {displayAddress}
          </span>
        </div>
      </div>

      {/* Network Fee Card - Shows BTC with USD in parentheses */}
      <div className={`${cardBg} rounded-xl p-4 mb-4`}>
        <div className="flex justify-between items-center py-2">
          <span className={`${textSecondary} text-sm flex items-center gap-1`}>
            Network fee
            <Info className="w-3.5 h-3.5" />
          </span>
          <span className={`${textColor} text-sm font-medium`}>
            {networkFee} {safeData.cryptocurrency} (${networkFeeUSD})
          </span>
        </div>
      </div>

      {/* More Details - In a text box/card like network fee */}
      <div className={`${cardBg} rounded-xl p-4 mb-2 cursor-pointer hover:${isDark ? 'bg-[#333842]' : 'bg-gray-100'} transition-colors`}>
        <div className="flex justify-between items-center py-2">
          <span className={`${textSecondary} text-sm`}>More Details</span>
          <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .bg-[#1e2530] { background-color: #1e2530; }
          .bg-white { background-color: #ffffff; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-[#2a2f3a] { background-color: #2a2f3a; }
          .text-gray-400 { color: ${isDark ? '#9ca3af' : '#9ca3af'}; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-300 { color: #d1d5db; }
          .text-gray-900 { color: #111827; }
          .text-white { color: ${isDark ? '#d9dadf' : '#111827'}; }
          .border-gray-200 { border-color: #e5e7eb; }
          .border-gray-700 { border-color: #374151; }
          .rounded-2xl { border-radius: 1rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-full { border-radius: 9999px; }
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-base { font-size: 1rem; }
          .text-lg { font-size: 1.125rem; }
          .text-3xl { font-size: 1.875rem; }
          .font-medium { font-weight: 500; }
          .font-bold { font-weight: 700; }
          .font-mono { font-family: monospace; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .break-all { word-break: break-all; }
          .tracking-tight { letter-spacing: -0.025em; }
          .gap-1 { gap: 0.25rem; }
          .gap-1\\.5 { gap: 0.375rem; }
          .p-1 { padding: 0.25rem; }
          .p-4 { padding: 1rem; }
          .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
          .pb-6 { padding-bottom: 1.5rem; }
          .pb-4 { padding-bottom: 1rem; }
          .pt-4 { padding-top: 1rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mr-1\\.5 { margin-right: 0.375rem; }
          .max-w-[55%] { max-width: 55%; }
          .w-2 { width: 0.5rem; }
          .w-3\\.5 { width: 0.875rem; }
          .w-4 { width: 1rem; }
          .w-5 { width: 1.25rem; }
          .h-2 { height: 0.5rem; }
          .h-3\\.5 { height: 0.875rem; }
          .h-4 { height: 1rem; }
          .h-5 { height: 1.25rem; }
          .inline-block { display: inline-block; }
          .inline { display: inline; }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .overflow-hidden { overflow: hidden; }
          .cursor-pointer { cursor: pointer; }
          .transition-colors { transition: color 0.2s, background-color 0.2s; }
          .hover\\:text-white:hover { color: #ffffff; }
          .hover\\:text-gray-700:hover { color: #374151; }
          .hover\\:text-gray-900:hover { color: #111827; }
          .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
          .hover\\:bg-\\[\\#333842\\]:hover { background-color: #333842; }
          .border { border-width: 1px; }
          .border-b { border-bottom-width: 1px; }
          .border-t { border-top-width: 1px; }
          .border-dashed { border-style: dashed; }
          .gap-1 { gap: 0.25rem; }
          .p-6 { padding: 1.5rem; }
        `
      }} />
    </div>
  );
}