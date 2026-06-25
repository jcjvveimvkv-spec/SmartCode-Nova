// app/admin/crypto-receipts/components/receipt-generator/BinanceReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Headphones, Check, Copy } from 'lucide-react';

interface BinanceReceiptData {
  cryptocurrency: string;
  amount: string;
  receiverAddress: string;
  networkFee: string;
  transactionMode: 'send' | 'receive';
  useCustomDate: boolean;
  date: string;
  time: string;
  txid?: string;
  network?: string;
}

interface BinanceReceiptProps {
  data: BinanceReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function BinanceReceipt({ data, themeMode = 'dark' }: BinanceReceiptProps) {
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
    receiverAddress: data?.receiverAddress || '0xe871fbb4a8eec47734076f5cef8a6d3b3444b9ab',
    networkFee: data?.networkFee || '0.01',
    transactionMode: data?.transactionMode || 'send',
    useCustomDate: data?.useCustomDate || false,
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    txid: data?.txid || `0xf020f32a06a61076b94482f465e6cc34c3b4e8517dd8217351c2050b879d4164`,
    network: data?.network || 'BSC',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(7);
  const networkFee = safeData.networkFee || '0.01';
  
  const isDeposit = safeData.transactionMode === 'receive';
  const amountSign = isDeposit ? '+' : '-';
  
  // Colors based on theme
  const bgColor = isDark ? 'bg-[#1e2530]' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const dividerColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const amountColor = isDeposit ? 'text-[#10b981]' : (isDark ? 'text-white' : 'text-gray-900');
  const statusColor = 'text-[#10b981]';
  const linkColor = isDark ? 'text-yellow-400' : 'text-yellow-500';
  const buttonBg = isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200';
  const buttonText = isDark ? 'text-white' : 'text-gray-700';
  const iconColor = isDark ? 'text-white' : 'text-gray-700';
  const copyIconColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const copyIconHover = isDark ? 'hover:text-white' : 'hover:text-gray-700';
  const scamReportColor = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700';
  const withdrawButtonBg = 'bg-yellow-500 hover:bg-yellow-600';
  const withdrawButtonText = 'text-black';
  
  const title = isDeposit ? 'Deposit Details' : 'Withdrawal Details';
  const addressLabel = 'Address';
  const amountLabel = isDeposit ? 'Deposit Amount' : 'Amount';
  const walletLabel = isDeposit ? 'Deposit Wallet' : 'Wallet';
  const description = isDeposit 
    ? 'Crypto transferred into Binance. Your funds have been successfully deposited.'
    : 'Crypto transferred out of Binance. Please contact the recipient platform for your transaction receipt.';
  const helpText = isDeposit 
    ? 'Why hasn\'t my deposit arrived?'
    : 'Why hasn\'t my withdrawal arrived?';

  const displayAddress = safeData.receiverAddress || '0xe871fbb4a8eec47734076f5cef8a6d3b3444b9ab';

  return (
    <div className={`${bgColor} ${textColor} rounded-xl overflow-hidden shadow-2xl`} style={{ width: '375px', margin: '0 auto' }}>
      {/* Header - Left Arrow & Headset */}
      <div className="flex justify-between items-center px-4 py-6 mt-4">
        <button className={`${iconColor} hover:opacity-70 transition-opacity`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-base font-semibold ${textColor}`}>{title}</h1>
        <button className={`${iconColor} hover:opacity-70 transition-opacity`}>
          <Headphones className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-4 pb-4 flex flex-col items-center">
        <h2 className={`text-2xl font-semibold mb-3 ${amountColor}`}>
          {amountSign}{formattedAmount} {safeData.cryptocurrency}
        </h2>
        <div className="flex items-center mb-2">
          {/* Circle with checkmark inside - ✅ THIS IS THE CHECKMARK INSIDE CIRCLE */}
          <div className="bg-[#10b981] rounded-full p-1 mr-2 flex items-center justify-center" style={{ width: '16px', height: '16px' }}>
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <span className={`${statusColor} text-xs font-medium`}>Completed</span>
        </div>
        <p className={`${textSecondary} text-center text-xs mb-2`}>
          {description}
        </p>
        <button className={`${linkColor} text-xs font-medium mb-4`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {helpText}
        </button>
      </div>

      {/* Divider */}
      <div className={`border-t ${dividerColor} mx-4`}></div>

      {/* Transaction Details */}
      <div className="px-4 py-3 text-sm mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className={textSecondary}>Network</span>
          <span className={textColor}>{safeData.network}</span>
        </div>
        <div className="flex justify-between items-start mb-3">
          <span className={textSecondary}>{addressLabel}</span>
          <div className="flex items-start max-w-[55%]">
            <span className={`${textColor} text-right text-xs break-all`}>
              {displayAddress}
            </span>
            <button className={`ml-2 ${copyIconColor} ${copyIconHover} transition-colors flex-shrink-0 mt-0.5`}>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-start mb-3">
          <span className={textSecondary}>Txid</span>
          <div className="flex items-start max-w-[55%]">
            <a className={`${textColor} text-right underline text-xs break-all hover:${isDark ? 'text-yellow-400' : 'text-blue-600'} transition-colors`} href="#">
              {safeData.txid}
            </a>
            <button className={`ml-2 ${copyIconColor} ${copyIconHover} transition-colors flex-shrink-0 mt-0.5`}>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className={textSecondary}>{amountLabel}</span>
          <span className={textColor}>{formattedAmount} {safeData.cryptocurrency}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className={textSecondary}>Network fee</span>
          <span className={textColor}>{networkFee} {safeData.cryptocurrency}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className={textSecondary}>{walletLabel}</span>
          <span className={textColor}>Spot Wallet</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className={textSecondary}>Date</span>
          <span className={textColor}>{safeData.date} {safeData.time}</span>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="px-4 pb-2 flex gap-3">
        <button className={`${buttonBg} ${buttonText} text-sm font-medium py-3 px-4 rounded-lg flex-1 text-center transition-colors`}>
          Save Address
        </button>
        <button className={`${withdrawButtonBg} ${withdrawButtonText} text-sm font-medium py-3 px-4 rounded-lg flex-1 text-center transition-colors`}>
          Withdraw Again
        </button>
      </div>

      {/* Scam Report - Centered below buttons */}
      <div className="px-4 pb-4 flex justify-center">
        <button className={`${scamReportColor} text-xs font-medium transition-colors`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          Scam Report
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .text-gray-400 { color: ${isDark ? '#707682' : '#9ca3af'}; }
          .text-yellow-400 { color: #fbbf24; }
          .text-yellow-500 { color: #eab308; }
          .bg-[#1e2530] { background-color: #1e2530; }
          .bg-white { background-color: #ffffff; }
          .text-white { color: #d9dadf; }
          .text-gray-900 { color: #111827; }
          .text-gray-500 { color: #6b7280; }
          .text-blue-600 { color: #2563eb; }
          .bg-[#10b981] { background-color: #10b981; }
          .text-[#10b981] { color: #10b981; }
          .bg-yellow-500 { background-color: #eab308; }
          .hover\\:bg-yellow-600:hover { background-color: #ca8a04; }
          .text-black { color: #000000; }
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-base { font-size: 1rem; }
          .text-2xl { font-size: 1.5rem; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
          .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
          .pt-4 { padding-top: 1rem; }
          .pb-2 { padding-bottom: 0.5rem; }
          .pb-4 { padding-bottom: 1rem; }
          .mt-4 { margin-top: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-8 { margin-bottom: 2rem; }
          .ml-2 { margin-left: 0.5rem; }
          .mx-4 { margin-left: 1rem; margin-right: 1rem; }
          .border-t { border-top-width: 1px; }
          .border-gray-700 { border-color: #374151; }
          .border-gray-200 { border-color: #e5e7eb; }
          .rounded-full { border-radius: 9999px; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .break-all { word-break: break-all; }
          .underline { text-decoration: underline; }
          .text-center { text-align: center; }
          .overflow-hidden { overflow: hidden; }
          .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .cursor-pointer { cursor: pointer; }
          .transition-colors { transition: color 0.2s, background-color 0.2s; }
          .max-w-[55%] { max-width: 55%; }
          .flex-1 { flex: 1; }
          .gap-3 { gap: 0.75rem; }
          .bg-gray-700 { background-color: #374151; }
          .hover\\:bg-gray-600:hover { background-color: #4b5563; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .hover\\:bg-gray-200:hover { background-color: #e5e7eb; }
          .text-gray-700 { color: #374151; }
          .hover\\:text-yellow-400:hover { color: #fbbf24; }
          .hover\\:text-blue-600:hover { color: #2563eb; }
          .hover\\:text-white:hover { color: #ffffff; }
          .hover\\:text-gray-700:hover { color: #374151; }
          .w-5 { width: 1.25rem; }
          .h-5 { height: 1.25rem; }
          .w-2\\.5 { width: 0.625rem; }
          .h-2\\.5 { height: 0.625rem; }
          .w-3\\.5 { width: 0.875rem; }
          .h-3\\.5 { height: 0.875rem; }
          .flex-shrink-0 { flex-shrink: 0; }
          .mt-0\\.5 { margin-top: 0.125rem; }
          .hover\\:opacity-70:hover { opacity: 0.7; }
          .transition-opacity { transition: opacity 0.2s; }
        `
      }} />
    </div>
  );
}