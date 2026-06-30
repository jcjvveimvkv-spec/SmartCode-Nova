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
    cryptocurrency: data?.cryptocurrency || 'ETH',
    amount: data?.amount || '0',
    amountUSD: data?.amountUSD || '',
    receiverAddress: data?.receiverAddress || 'jhilytfrdcvkbjlihoghlk',
    networkFee: data?.networkFee || '0.0005',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    network: data?.network || 'Ethereum (ERC20)',
    note: data?.note || '',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(4);
  const networkFee = safeData.networkFee || '0.0005';
  
  const usdValue = safeData.amountUSD || (parseFloat(safeData.amount || '0') * 3500).toFixed(2);
  const displayAddress = safeData.receiverAddress || 'jhilytfrdcvkbjlihoghlk';
  const isDeposit = safeData.transactionMode === 'receive';

  // Get crypto icon based on currency
  const getCryptoIcon = () => {
    const currency = safeData.cryptocurrency.toUpperCase();
    switch (currency) {
      case 'BTC':
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="11" fill="#f7931a" />
            <path d="M16.2 11.15c.2-1.35-.83-2.08-2.24-2.56l.46-1.83-1.11-.28-.44 1.78c-.29-.07-.59-.14-.89-.21l.45-1.79-1.11-.28-.46 1.83c-.24-.05-.48-.11-.71-.17l0 0-1.53-.38-.3 1.18s.83.19.81.2c.45.11.53.41.52.65l-.52 2.09c.03.01.07.02.12.03l-.12-.03-.73 2.93c-.06.14-.2.35-.51.27.01.01-.81-.2-.81-.2l-.55 1.27 1.45.36c.27.07.53.14.79.2l-.46 1.86 1.11.28.46-1.84c.3.08.6.16.88.23l-.46 1.83 1.11.28.46-1.85c1.91.36 3.35.22 3.95-1.51.49-1.39-.02-2.19-1.03-2.71.73-.17 1.28-.65 1.43-1.64zm-2.56 3.59c-.35 1.39-2.69.64-3.45.45l.62-2.47c.77.19 3.2.57 2.83 2.02zm.35-3.61c-.31 1.27-2.24.62-2.87.47l.56-2.24c.63.16 2.65.45 2.31 1.77z" fill="white" />
          </svg>
        );
      case 'ETH':
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="11" fill="#627EEA" />
            <path d="M12 4L11.65 5.18V14.82L12 15.17L16 12.42L12 4Z" fill="white" fillOpacity="0.6" />
            <path d="M12 4L8 12.42L12 15.17V4Z" fill="white" />
            <path d="M12 16.17L11.79 16.43V19.58L12 20.17L16 13.42L12 16.17Z" fill="white" fillOpacity="0.6" />
            <path d="M12 20.17V16.17L8 13.42L12 20.17Z" fill="white" />
            <path d="M12 15.17L16 12.42L12 10.25V15.17Z" fill="white" fillOpacity="0.2" />
            <path d="M8 12.42L12 15.17V10.25L8 12.42Z" fill="white" fillOpacity="0.6" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <circle cx="12" cy="12" r="11" fill="#f7931a" />
            <path d="M16.2 11.15c.2-1.35-.83-2.08-2.24-2.56l.46-1.83-1.11-.28-.44 1.78c-.29-.07-.59-.14-.89-.21l.45-1.79-1.11-.28-.46 1.83c-.24-.05-.48-.11-.71-.17l0 0-1.53-.38-.3 1.18s.83.19.81.2c.45.11.53.41.52.65l-.52 2.09c.03.01.07.02.12.03l-.12-.03-.73 2.93c-.06.14-.2.35-.51.27.01.01-.81-.2-.81-.2l-.55 1.27 1.45.36c.27.07.53.14.79.2l-.46 1.86 1.11.28.46-1.84c.3.08.6.16.88.23l-.46 1.83 1.11.28.46-1.85c1.91.36 3.35.22 3.95-1.51.49-1.39-.02-2.19-1.03-2.71.73-.17 1.28-.65 1.43-1.64zm-2.56 3.59c-.35 1.39-2.69.64-3.45.45l.62-2.47c.77.19 3.2.57 2.83 2.02zm.35-3.61c-.31 1.27-2.24.62-2.87.47l.56-2.24c.63.16 2.65.45 2.31 1.77z" fill="white" />
          </svg>
        );
    }
  };

  // SHINING GREEN GRADIENT - Vibrant emerald with glow effect
  const getGradientBackground = () => {
    if (isDark) {
      return 'linear-gradient(145deg, #059669, #047857, #065f46)';
    }
    return 'linear-gradient(145deg, #34d399, #10b981, #059669)';
  };

  // Colors based on theme
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-white/10' : 'border-white/20';
  const badgeBg = isDark ? 'bg-white/10' : 'bg-white/20';
  const badgeText = isDark ? 'text-white/85' : 'text-white/90';
  const inputBg = isDark ? 'bg-gray-800/80' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-slate-800';
  
  // Circle colors - Always White
  const circleBorderColor = '#ffffff';
  const checkColor = '#ffffff';

  return (
    <div 
      className="w-full max-w-[560px] mx-auto rounded-3xl p-6 backdrop-blur-sm border shadow-2xl"
      style={{
        background: getGradientBackground(),
        borderColor: 'rgba(255,255,255,0.15)',
        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Content */}
      <div className="max-w-[400px] mx-auto text-center">
        {/* Payment Sent/Received Title */}
        <h1 className={`${textSecondary} text-sm font-medium tracking-wide`}>
          Payment {isDeposit ? 'Received' : 'Sent'}
        </h1>

        {/* Circle Check - White border with white checkmark */}
        <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full border-2 mx-auto mt-5" style={{ borderColor: circleBorderColor }}>
          <Check className="w-10 h-10" style={{ color: checkColor }} />
        </div>

        {/* Amount USD */}
        <p className={`text-4xl font-semibold text-white tracking-tight mt-6`}>
          ${usdValue}
        </p>

        {/* Crypto Badge */}
        <div className={`inline-flex items-center gap-2 ${badgeBg} rounded-full px-4 py-1.5 mt-3`}>
          {getCryptoIcon()}
          <span className={`${badgeText} text-base font-normal`}>
            {formattedAmount} {safeData.cryptocurrency}
          </span>
        </div>

        {/* Recipient - Full Address */}
        <p className={`${textMuted} text-sm mt-6`}>
          Your payment has been {isDeposit ? 'received from' : 'sent to'}
        </p>
        <p className={`font-mono text-sm text-white/95 break-all mt-1`}>
          {displayAddress}
        </p>

        {/* Personal Note - Display as text if provided */}
        {safeData.note && (
          <div className={`mt-6 w-full ${inputBg} rounded-2xl px-4 py-3 text-sm ${inputText} border ${borderColor} text-left`}>
            {safeData.note}
          </div>
        )}

        {/* Personal Note Input - Always show */}
        <div className="mt-6">
          <div className={`rounded-2xl bg-white/95 shadow-md ring-1 ring-black/5 focus-within:ring-emerald-300`}>
            <input 
              type="text" 
              placeholder="Add a personal note"
              className="w-full rounded-2xl bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none"
              value={safeData.note}
              readOnly
            />
          </div>
        </div>

        {/* Network Fee */}
        <div className="mt-4 text-xs text-white/40">
          Network fee: {networkFee} {safeData.cryptocurrency}
        </div>
      </div>

      {/* Glow effect overlay */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .shadow-2xl {
            box-shadow: 0 20px 60px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255,255,255,0.1) !important;
          }
        `
      }} />
    </div>
  );
}