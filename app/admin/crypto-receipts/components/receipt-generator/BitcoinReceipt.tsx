// app/admin/crypto-receipts/components/receipt-generator/BitcoinReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface BitcoinReceiptData {
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
  note?: string;
}

interface BitcoinReceiptProps {
  data: BitcoinReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function BitcoinReceipt({ data, themeMode = 'dark' }: BitcoinReceiptProps) {
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
    receiverAddress: data?.receiverAddress || 'HKJLYOTIGFYKLHIOGUKJ',
    networkFee: data?.networkFee || '0.0005',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    network: data?.network || 'Bitcoin (BTC)',
    note: data?.note || '',
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

  const displayAddress = formatAddress(safeData.receiverAddress || 'HKJLYOTIGFYKLHIOGUKJ');
  const isDeposit = safeData.transactionMode === 'receive';
  const isSend = safeData.transactionMode === 'send';

  // Colors based on theme
  const gradientBg = isDark 
    ? 'from-[#0a0a0f] via-[#1a120a] to-[#0a0a0f]'
    : 'from-[#fef3e8] via-[#fde8d0] to-[#fef3e8]';
  
  const cardBg = isDark ? 'bg-[#1a120a]/80' : 'bg-white/95';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-orange-500/20' : 'border-orange-200/50';
  const inputBg = isDark ? 'bg-gray-800/80' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const badgeBg = isDark ? 'bg-white/10' : 'bg-orange-100';
  const badgeText = isDark ? 'text-white/85' : 'text-orange-800';

  return (
    <div className={`w-full max-w-[560px] mx-auto rounded-3xl bg-gradient-to-b ${gradientBg} p-6 backdrop-blur-sm border ${borderColor} shadow-2xl`}>
      {/* Content */}
      <div className="max-w-[400px] mx-auto text-center">
        {/* Payment Sent/Received Title */}
        <h1 className={`${textSecondary} text-sm font-medium tracking-wide`}>
          Payment {isDeposit ? 'Received' : 'Sent'}
        </h1>

        {/* Circle Check */}
        <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full border-2 border-white/60 mx-auto mt-5">
          <Check className="w-10 h-10 text-white" />
        </div>

        {/* Amount USD */}
        <p className={`text-4xl font-semibold text-white tracking-tight mt-6`}>
          ${usdValue}
        </p>

        {/* Crypto Badge */}
        <div className={`inline-flex items-center gap-2 ${badgeBg} rounded-full px-4 py-1.5 mt-3`}>
          {/* BTC Icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="11" fill="#F7931A" />
            <path d="M16.2 11.15c.2-1.35-.83-2.08-2.24-2.56l.46-1.83-1.11-.28-.44 1.78c-.29-.07-.59-.14-.89-.21l.45-1.79-1.11-.28-.46 1.83c-.24-.05-.48-.11-.71-.17l0 0-1.53-.38-.3 1.18s.83.19.81.2c.45.11.53.41.52.65l-.52 2.09c.03.01.07.02.12.03l-.12-.03-.73 2.93c-.06.14-.2.35-.51.27.01.01-.81-.2-.81-.2l-.55 1.27 1.45.36c.27.07.53.14.79.2l-.46 1.86 1.11.28.46-1.84c.3.08.6.16.88.23l-.46 1.83 1.11.28.46-1.85c1.91.36 3.35.22 3.95-1.51.49-1.39-.02-2.19-1.03-2.71.73-.17 1.28-.65 1.43-1.64zm-2.56 3.59c-.35 1.39-2.69.64-3.45.45l.62-2.47c.77.19 3.2.57 2.83 2.02zm.35-3.61c-.31 1.27-2.24.62-2.87.47l.56-2.24c.63.16 2.65.45 2.31 1.77z" fill="white" />
          </svg>
          <span className={`${badgeText} text-base font-normal`}>
            {formattedAmount} {safeData.cryptocurrency}
          </span>
        </div>

        {/* Recipient */}
        <p className={`${textMuted} text-sm mt-6`}>
          Your payment has been {isDeposit ? 'received from' : 'sent to'}
        </p>
        <p className={`font-mono text-sm text-white/90 break-all mt-1`}>
          {displayAddress}
        </p>

        {/* Note Input - Display as text if provided */}
        {safeData.note && (
          <div className={`mt-6 w-full ${inputBg} rounded-2xl px-4 py-3 text-sm ${inputText} border ${borderColor} text-left`}>
            {safeData.note}
          </div>
        )}

        {/* Network Fee (hidden but present for completeness) */}
        <div className="mt-4 text-xs text-white/40">
          Network fee: {networkFee} {safeData.cryptocurrency}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .from-\\[\\#0a0a0f\\] { --tw-gradient-from: #0a0a0f; }
          .via-\\[\\#1a120a\\] { --tw-gradient-via: #1a120a; }
          .to-\\[\\#0a0a0f\\] { --tw-gradient-to: #0a0a0f; }
          .from-\\[\\#fef3e8\\] { --tw-gradient-from: #fef3e8; }
          .via-\\[\\#fde8d0\\] { --tw-gradient-via: #fde8d0; }
          .to-\\[\\#fef3e8\\] { --tw-gradient-to: #fef3e8; }
          .bg-\\[\\#1a120a\\]\\/80 { background-color: rgba(26, 18, 10, 0.8); }
          .bg-white\\/95 { background-color: rgba(255, 255, 255, 0.95); }
          .bg-gray-800\\/80 { background-color: rgba(31, 41, 55, 0.8); }
          .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1); }
          .bg-orange-100 { background-color: #ffedd5; }
          .border-orange-500\\/20 { border-color: rgba(249, 115, 22, 0.2); }
          .border-orange-200\\/50 { border-color: rgba(252, 211, 175, 0.5); }
          .text-white\\/85 { color: rgba(255, 255, 255, 0.85); }
          .text-orange-800 { color: #9a3412; }
          .text-white\\/90 { color: rgba(255, 255, 255, 0.9); }
          .text-white\\/40 { color: rgba(255, 255, 255, 0.4); }
          .backdrop-blur-sm { backdrop-filter: blur(8px); }
          .border-white\\/60 { border-color: rgba(255, 255, 255, 0.6); }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .rounded-3xl { border-radius: 1.5rem; }
          .rounded-2xl { border-radius: 1rem; }
          .w-\\[100px\\] { width: 100px; }
          .h-\\[100px\\] { height: 100px; }
          .w-10 { width: 2.5rem; }
          .h-10 { height: 2.5rem; }
          .w-5 { width: 1.25rem; }
          .h-5 { height: 1.25rem; }
          .gap-2 { gap: 0.5rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
          .mt-3 { margin-top: 0.75rem; }
          .mt-5 { margin-top: 1.25rem; }
          .mt-6 { margin-top: 1.5rem; }
          .mt-4 { margin-top: 1rem; }
          .text-sm { font-size: 0.875rem; }
          .text-base { font-size: 1rem; }
          .text-xs { font-size: 0.75rem; }
          .text-4xl { font-size: 2.25rem; }
          .font-normal { font-weight: 400; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-mono { font-family: monospace; }
          .tracking-wide { letter-spacing: 0.025em; }
          .tracking-tight { letter-spacing: -0.025em; }
          .break-all { word-break: break-all; }
          .text-left { text-align: left; }
          .w-full { width: 100%; }
          .max-w-\\[560px\\] { max-width: 560px; }
          .max-w-\\[400px\\] { max-width: 400px; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .flex { display: flex; }
          .inline-flex { display: inline-flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .rounded-full { border-radius: 9999px; }
          .border { border-width: 1px; }
          .border-2 { border-width: 2px; }
          .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
          .p-6 { padding: 1.5rem; }
        `
      }} />
    </div>
  );
}