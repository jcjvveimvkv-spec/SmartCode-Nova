// app/admin/crypto-receipts/components/receipt-generator/PayPalReceipt.tsx
'use client';

import { useEffect, useState } from 'react';
import { Check, Shield, Info, AlertCircle } from 'lucide-react';

interface PayPalReceiptData {
  recipientName: string;
  recipientEmail: string;
  amount: string;
  currency: string;
  note: string;
  transactionType: 'send' | 'receive';
  transactionMode: 'goods_services' | 'friends_family';
  status: 'completed' | 'pending' | 'on_hold' | 'refunded';
  date: string;
  time: string;
  transactionId: string;
  fee: string;
}

interface PayPalReceiptProps {
  data: PayPalReceiptData;
  themeMode?: 'dark' | 'light';
}

export default function PayPalReceipt({ data, themeMode = 'dark' }: PayPalReceiptProps) {
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
    recipientName: data?.recipientName || 'John Doe',
    recipientEmail: data?.recipientEmail || 'john.doe@email.com',
    amount: data?.amount || '0',
    currency: data?.currency || 'USD',
    note: data?.note || '',
    transactionType: data?.transactionType || 'send',
    transactionMode: data?.transactionMode || 'goods_services',
    status: data?.status || 'completed',
    date: data?.date || new Date().toISOString().split('T')[0],
    time: data?.time || new Date().toTimeString().slice(0, 8),
    transactionId: data?.transactionId || `PP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    fee: data?.fee || '0',
  };

  const formattedAmount = parseFloat(safeData.amount || '0').toFixed(2);
  const feeAmount = parseFloat(safeData.fee || '0').toFixed(2);
  const totalAmount = (parseFloat(safeData.amount) + parseFloat(safeData.fee || '0')).toFixed(2);
  
  const isSend = safeData.transactionType === 'send';
  const isReceive = safeData.transactionType === 'receive';
  const isGoodsServices = safeData.transactionMode === 'goods_services';
  const isFriendsFamily = safeData.transactionMode === 'friends_family';

  // Status colors and text
  const getStatusConfig = () => {
    switch (safeData.status) {
      case 'completed':
        return { color: 'text-green-800 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', icon: <Check className="w-5 h-5 mr-1.5" />, label: 'Completed' };
      case 'pending':
        return { color: 'text-yellow-800 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', icon: <AlertCircle className="w-5 h-5 mr-1.5" />, label: 'Pending' };
      case 'on_hold':
        return { color: 'text-orange-800 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500', icon: <Info className="w-5 h-5 mr-1.5" />, label: 'On Hold' };
      case 'refunded':
        return { color: 'text-red-800 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', icon: <AlertCircle className="w-5 h-5 mr-1.5" />, label: 'Refunded' };
      default:
        return { color: 'text-green-800 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', icon: <Check className="w-5 h-5 mr-1.5" />, label: 'Completed' };
    }
  };

  const statusConfig = getStatusConfig();

  // Get payment method label
  const getPaymentMethod = () => {
    if (isGoodsServices) return 'Goods and Services';
    if (isFriendsFamily) return 'Friends and Family';
    return 'PayPal balance';
  };

  // Get transaction type label
  const getTransactionLabel = () => {
    if (isSend) return 'You sent a payment';
    if (isReceive) return 'You received a payment';
    return 'Payment';
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Today';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm} UTC`;
  };

  // Currencies list with symbols
  const currencies: Record<string, { symbol: string, name: string }> = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    BRL: { symbol: 'R$', name: 'Brazilian Real' },
    ZAR: { symbol: 'R', name: 'South African Rand' },
    NGN: { symbol: '₦', name: 'Nigerian Naira' },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
    GHS: { symbol: '₵', name: 'Ghanaian Cedi' },
    PKR: { symbol: '₨', name: 'Pakistani Rupee' },
    BDT: { symbol: '৳', name: 'Bangladeshi Taka' },
    VND: { symbol: '₫', name: 'Vietnamese Dong' },
    PHP: { symbol: '₱', name: 'Philippine Peso' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  };

  const currencyInfo = currencies[safeData.currency] || currencies.USD;
  const currencySymbol = currencyInfo.symbol;

  // PayPal Original Colors
  const paypalBlue = '#003087';
  const paypalLightBlue = '#009cde';
  const paypalDarkBlue = '#002366';

  // Colors based on theme - PayPal uses white/light background
  const bgColor = isDark ? '#1a1a2e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#4b5563';
  const textMuted = isDark ? '#6b7280' : '#9ca3af';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const cardBg = isDark ? '#2a2a4a' : '#f9fafb';
  const amountBg = isDark ? '#2a2a4a' : '#f9fafb';
  const breakdownBg = isDark ? '#1a2a3a' : '#eff6ff';
  const breakdownBorder = isDark ? '#2a4a6a' : '#bfdbfe';
  const helpBg = isDark ? '#2a2a4a' : '#f9fafb';
  const footerBg = isDark ? '#1a1a2e' : '#f3f4f6';
  const dividerColor = isDark ? '#374151' : '#f3f4f6';
  const inputBg = isDark ? '#1f2937' : '#ffffff';

  // Status color
  const statusBg = isDark ? statusConfig.bg : statusConfig.bg;

  return (
    <div 
      className="rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto"
      style={{ 
        width: '420px',
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Header - PayPal Original Blue */}
      <div 
        className="border-b-4 px-4 py-6"
        style={{ borderColor: paypalBlue, backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span style={{ color: paypalBlue }}>Pay</span>
              <span style={{ color: paypalLightBlue }}>Pal</span>
            </h1>
          </div>
          <div className="text-right">
            <p style={{ color: textSecondary }} className="text-xs">Receipt</p>
            <p style={{ color: textMuted }} className="text-xs">{formatDate(safeData.date)}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div 
        className={`${statusBg} border-l-4 px-6 py-4`}
        style={{ 
          borderColor: statusConfig.border === 'border-green-500' ? '#22c55e' : 
                       statusConfig.border === 'border-yellow-500' ? '#eab308' : 
                       statusConfig.border === 'border-orange-500' ? '#f97316' : '#ef4444',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : statusBg,
        }}
      >
        <div className="flex items-center">
          <div className={`${statusConfig.color} mr-3`}>
            {statusConfig.icon}
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${statusConfig.color}`}>{getTransactionLabel()}</h2>
            <p className={`text-sm ${statusConfig.color} opacity-80`}>{isSend ? 'You sent a payment' : 'You received a payment'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Amount Box */}
        <div 
          className="border rounded-lg p-6 mb-6"
          style={{ 
            backgroundColor: amountBg, 
            borderColor: borderColor,
          }}
        >
          <div className="text-center">
            <p style={{ color: textSecondary }} className="text-xs mb-2">{isSend ? 'You sent' : 'You received'}</p>
            <p className="text-4xl font-bold" style={{ color: textColor }}>
              {isSend ? '-' : '+'}{currencySymbol}{formattedAmount} <span style={{ color: textSecondary }} className="text-lg">{safeData.currency}</span>
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 pb-2 border-b-2`} style={{ color: textColor, borderColor: borderColor }}>Transaction details</h3>

          <div className="space-y-4">
            {/* To/From */}
            <div className={`flex justify-between items-start py-3 border-b`} style={{ borderColor: dividerColor }}>
              <span style={{ color: textSecondary }} className="font-medium">{isSend ? 'To' : 'From'}</span>
              <div className="text-right">
                <p className="font-semibold" style={{ color: textColor }}>{safeData.recipientName}</p>
                <p className="text-sm" style={{ color: textSecondary }}>{safeData.recipientEmail}</p>
              </div>
            </div>

            {/* Transaction ID */}
            <div className={`flex justify-between items-start py-3 border-b`} style={{ borderColor: dividerColor }}>
              <span style={{ color: textSecondary }} className="font-medium">Transaction ID</span>
              <p className="font-mono text-sm font-semibold" style={{ color: textColor }}>{safeData.transactionId}</p>
            </div>

            {/* Date */}
            <div className={`flex justify-between items-start py-3 border-b`} style={{ borderColor: dividerColor }}>
              <span style={{ color: textSecondary }} className="font-medium">Date</span>
              <div className="text-right">
                <p className="font-semibold" style={{ color: textColor }}>{formatDate(safeData.date)}</p>
                <p className="text-sm" style={{ color: textSecondary }}>{formatTime(safeData.time)}</p>
              </div>
            </div>

            {/* Payment method */}
            <div className={`flex justify-between items-start py-3 border-b`} style={{ borderColor: dividerColor }}>
              <span style={{ color: textSecondary }} className="font-medium">Payment method</span>
              <p className="font-semibold" style={{ color: textColor }}>{getPaymentMethod()}</p>
            </div>

            {/* Note */}
            {safeData.note && (
              <div className={`flex justify-between items-start py-3 border-b`} style={{ borderColor: dividerColor }}>
                <span style={{ color: textSecondary }} className="font-medium">Note</span>
                <p className="font-semibold text-right max-w-[60%]" style={{ color: textColor }}>{safeData.note}</p>
              </div>
            )}

            {/* Status */}
            <div className={`flex justify-between items-start py-3`}>
              <span style={{ color: textSecondary }} className="font-medium">Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} ${statusBg}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div 
          className="border rounded-lg p-6 mb-8"
          style={{ 
            backgroundColor: breakdownBg, 
            borderColor: breakdownBorder,
          }}
        >
          <h3 className={`text-base font-semibold mb-4`} style={{ color: textColor }}>Amount breakdown</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: textSecondary }}>Payment amount</span>
              <span className="font-semibold" style={{ color: textColor }}>{currencySymbol}{formattedAmount} {safeData.currency}</span>
            </div>
            {parseFloat(feeAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: textSecondary }}>Fee</span>
                <span className="font-semibold" style={{ color: textColor }}>{currencySymbol}{feeAmount} {safeData.currency}</span>
              </div>
            )}
            <div className={`pt-3 border-t-2 flex justify-between`} style={{ borderColor: dividerColor }}>
              <span className="font-semibold" style={{ color: textColor }}>Total</span>
              <span className={`font-bold text-lg`} style={{ color: textColor }}>{isSend ? '-' : '+'}{currencySymbol}{totalAmount} {safeData.currency}</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div 
          className="rounded-lg p-6 mb-6 border"
          style={{ 
            backgroundColor: helpBg, 
            borderColor: borderColor,
          }}
        >
          <h3 className={`text-base font-semibold mb-3`} style={{ color: textColor }}>Need help?</h3>
          <p className={`text-sm mb-4`} style={{ color: textSecondary }}>If you have questions about this transaction, you can visit our <a href="#" className="hover:underline font-medium" style={{ color: paypalLightBlue }}>Help Center</a> or <a href="#" className="hover:underline font-medium" style={{ color: paypalLightBlue }}>contact us</a>.</p>

          <div 
            className="flex items-start space-x-3 border rounded p-4"
            style={{ 
              backgroundColor: inputBg, 
              borderColor: borderColor,
            }}
          >
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm" style={{ color: textSecondary }}>
              <p className="font-medium mb-1" style={{ color: textColor }}>Important Information</p>
              <p>This payment was sent using PayPal. The recipient will receive the funds in their PayPal account. For your security, never share your password or personal information in response to an unsolicited request.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <button
            className="w-full text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:opacity-90"
            style={{ backgroundColor: paypalBlue }}
          >
            View transaction details
          </button>
          <button
            className="w-full border-2 font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
            style={{ 
              borderColor: borderColor, 
              color: textSecondary,
              backgroundColor: 'transparent',
            }}
          >
            Send another payment
          </button>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-8 border-t"
        style={{ 
          backgroundColor: footerBg, 
          borderColor: borderColor,
        }}
      >
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-xs" style={{ color: textSecondary }}>
            <p className="font-semibold mb-1" style={{ color: textColor }}>Security tips from PayPal</p>
            <p>PayPal will never ask you to provide your password, bank account or credit card number in an email. <a href="#" className="hover:underline font-medium" style={{ color: paypalLightBlue }}>Learn more about protecting your account</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}