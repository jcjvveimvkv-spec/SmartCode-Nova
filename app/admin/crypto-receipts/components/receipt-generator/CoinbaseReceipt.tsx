// app/admin/crypto-receipts/components/receipt-generator/CoinbaseReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, FileText, CheckCircle, ChevronRight } from 'lucide-react';

interface CoinbaseReceiptData {
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

interface CoinbaseReceiptProps {
  data: CoinbaseReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function CoinbaseReceipt({ data, themeMode = 'dark' }: CoinbaseReceiptProps) {
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
    receiverAddress: data?.receiverAddress || 'GHJJJJJJJJJJJJJJJJJJJJJJJJJJJJCVXK',
    networkFee: data?.networkFee || '0.0005',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    network: data?.network || 'Bitcoin (BTC)',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(8);
  const networkFee = safeData.networkFee || '0.0005';
  
  // USD value - use user input or auto-calculate
  const usdValue = safeData.amountUSD || (parseFloat(safeData.amount || '0') * 65000).toFixed(2);
  
  // Format address with dots in the middle
  const formatAddress = (address: string) => {
    if (!address || address.length <= 13) return address;
    const firstPart = address.slice(0, 6);
    const lastPart = address.slice(-5);
    return `${firstPart}...${lastPart}`;
  };
  
  // Format date
  const formatDate = (dateStr: string, timeStr: string) => {
    if (!dateStr && !timeStr) return 'Today';
    if (dateStr) {
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const year = parseInt(dateParts[0]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month-1]} ${day}, ${year}`;
      }
      return dateStr;
    }
    return 'Today';
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hour = parseInt(parts[0]);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    }
    return timeStr;
  };

  const displayAddress = formatAddress(safeData.receiverAddress || 'GHJJJJJJJJJJJJJJJJJJJJJJJJJJJJCVXK');
  const displayDate = formatDate(safeData.date, safeData.time);
  const displayTime = formatTime(safeData.time);
  const displayTxid = safeData.txid ? `${safeData.txid.slice(0, 8)}...` : '4ba37713...';
  const isDeposit = safeData.transactionMode === 'receive';
  const actionText = isDeposit ? 'Received' : 'Sent';
  const addressLabel = isDeposit ? 'from' : 'to';

  // Colors based on theme
  const bgColor = isDark ? 'bg-[#0d0d14]' : 'bg-white';
  const containerBg = isDark ? 'bg-[#14141e]' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-[#8a8aa0]' : 'text-gray-500';
  const textMuted = isDark ? 'text-[#6b6b80]' : 'text-gray-400';
  const borderColor = isDark ? 'border-[#1a1a26]' : 'border-gray-200';
  const amountColor = 'text-[#3b82f6]';
  const statusBg = isDark ? 'bg-[#4ade80]/10' : 'bg-green-50';
  const statusText = isDark ? 'text-[#4ade80]' : 'text-green-600';
  const statusBorder = isDark ? 'border-[#4ade80]/20' : 'border-green-200';
  const buttonBg = 'bg-[#2563eb] hover:bg-[#1d4ed8]';
  const buttonText = 'text-white';
  const secondaryButtonBg = isDark ? 'bg-[#ffffff]/5 hover:bg-[#ffffff]/10' : 'bg-gray-100 hover:bg-gray-200';
  const secondaryButtonText = isDark ? 'text-[#b0b0c8]' : 'text-gray-600';
  const closeBtnBg = isDark ? 'bg-[#ffffff]/5 hover:bg-[#ffffff]/10' : 'bg-gray-100 hover:bg-gray-200';
  const closeBtnColor = isDark ? 'text-[#6b6b80] hover:text-white' : 'text-gray-500 hover:text-gray-900';
  const docIconBg = isDark ? 'bg-[#2563eb]/10 border-[#2563eb]/20' : 'bg-blue-50 border-blue-200';
  const docIconColor = isDark ? 'border-[#2563eb]/30' : 'border-blue-300';
  const docLineColor = isDark ? 'bg-[#2563eb]/30' : 'bg-blue-300';
  const docDotColor = isDark ? 'bg-[#2563eb]/25' : 'bg-blue-300';
  const dividerColor = isDark ? 'border-[#ffffff]/5' : 'border-gray-200';
  const balanceText = isDark ? 'text-[#d0d0e0]' : 'text-gray-700';
  const balanceIcon = isDark ? 'text-[#5a5a6e]' : 'text-gray-400';

  return (
    <div className={`${bgColor} rounded-2xl overflow-hidden shadow-2xl`} style={{ maxWidth: '400px', width: '100%' }}>
      <div className={`${containerBg} p-5 pb-6 relative min-h-[580px] flex flex-col`}>
        {/* Close Button */}
        <button className={`${closeBtnBg} ${closeBtnColor} absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10`}>
          <X className="w-4 h-4" />
        </button>

        {/* Document Icon */}
        <div className={`${docIconBg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border`}>
          <div className="relative w-9 h-11 bg-[#2563eb]/20 rounded-md border border-[#2563eb]/30 p-1.5 flex flex-col gap-1">
            <div className="h-0.5 bg-[#2563eb]/30 rounded w-full"></div>
            <div className="h-0.5 bg-[#2563eb]/30 rounded w-[70%]"></div>
            <div className="h-0.5 bg-[#2563eb]/30 rounded w-[45%]"></div>
            <div className="flex gap-0.5 mt-0.5">
              <span className="w-0.5 h-0.5 bg-[#2563eb]/25 rounded-full"></span>
              <span className="w-0.5 h-0.5 bg-[#2563eb]/25 rounded-full"></span>
              <span className="w-0.5 h-0.5 bg-[#2563eb]/25 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* Amount - BLUE COLOR */}
        <div className="text-center mb-3">
          <div className={`${amountColor} text-4xl font-bold tracking-tight`}>
            {formattedAmount} {safeData.cryptocurrency}
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-8">
          <p className={`${textSecondary} text-base`}>
            {actionText}
            <span className={`${textColor} font-medium`}> ${usdValue}</span>
            {addressLabel}
            <span className={`${textColor} font-medium`}> {displayAddress}</span>
          </p>
        </div>

        {/* Info Text */}
        <div className="text-center mb-6">
          <p className={`${textMuted} text-sm`}>
            This transaction usually takes less than 10 minutes
          </p>
        </div>

        {/* Additional Details */}
        <div className="w-full max-w-sm mx-auto space-y-0 mb-6">
          <div className={`flex justify-between items-center py-2.5 border-b ${dividerColor}`}>
            <span className={`${textMuted} text-sm`}>Status</span>
            <span className={`${statusBg} ${statusText} ${statusBorder} inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </span>
          </div>
          <div className={`flex justify-between items-center py-2.5 border-b ${dividerColor}`}>
            <span className={`${textMuted} text-sm`}>Network Fee</span>
            <span className={`${textColor} text-sm font-medium`}>{networkFee} {safeData.cryptocurrency}</span>
          </div>
          <div className={`flex justify-between items-center py-2.5 border-b ${dividerColor}`}>
            <span className={`${textMuted} text-sm`}>Date</span>
            <span className={`${textColor} text-sm font-medium`}>{displayDate}</span>
          </div>
          <div className={`flex justify-between items-center py-2.5 border-b ${dividerColor}`}>
            <span className={`${textMuted} text-sm`}>Time</span>
            <span className={`${textColor} text-sm font-medium`}>{displayTime || '11:05 PM'}</span>
          </div>
          <div className={`flex justify-between items-center py-2.5`}>
            <span className={`${textMuted} text-sm`}>Transaction ID</span>
            <span className={`${textMuted} text-sm font-mono`}>{displayTxid}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button className={`${buttonBg} ${buttonText} w-full py-3.5 rounded-xl font-semibold transition-all hover:translate-y-[-1px] hover:shadow-lg hover:shadow-blue-500/25`}>
            View transaction
          </button>
          <button className={`${secondaryButtonBg} ${secondaryButtonText} w-full py-3.5 rounded-xl font-medium transition-all border ${borderColor}`}>
            Done
          </button>

          {/* Balance Footer */}
          <div className={`flex justify-between items-center pt-4 mt-1 border-t ${dividerColor}`}>
            <span className={`${textMuted} text-sm`}>{formattedAmount} {safeData.cryptocurrency} balance</span>
            <div className="flex items-center gap-2">
              <span className={`${balanceText} text-sm font-medium`}>{formattedAmount} {safeData.cryptocurrency} ≈ ${usdValue}</span>
              <ChevronRight className={`${balanceIcon} w-4 h-4`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}