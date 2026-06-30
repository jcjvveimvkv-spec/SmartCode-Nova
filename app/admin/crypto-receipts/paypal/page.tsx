// app/admin/crypto-receipts/paypal/page.tsx
'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import html2canvas from 'html2canvas';
import { PayPalReceipt } from '../components/receipt-generator';

interface FormData {
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
  useCustomDate: boolean;
}

export default function PayPalPage() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  
  const [formData, setFormData] = useState<FormData>({
    recipientName: '',
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    note: '',
    transactionType: 'send',
    transactionMode: 'goods_services',
    status: 'completed',
    date: '',
    time: '',
    transactionId: '',
    fee: '',
    useCustomDate: false,
  });

  const [isGenerated, setIsGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 
    'INR', 'BRL', 'ZAR', 'NGN', 'KES', 'GHS', 'PKR', 'BDT',
    'VND', 'PHP', 'SGD', 'NZD'
  ];

  const statusOptions = [
    { value: 'completed', label: '✅ Completed' },
    { value: 'pending', label: '⏳ Pending' },
    { value: 'on_hold', label: '⏸️ On Hold' },
    { value: 'refunded', label: '↩️ Refunded' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleGenerate = () => {
    if (!formData.amount || !formData.recipientName) {
      alert('Please fill in Amount and Recipient Name');
      return;
    }
    setIsGenerated(true);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 8);
    return { date, time };
  };

  const getReceiptData = () => {
    const now = getCurrentDateTime();
    return {
      ...formData,
      date: formData.date || now.date,
      time: formData.time || now.time,
      transactionId: formData.transactionId || `PP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };
  };

  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: themeMode === 'dark' ? '#1e2530' : '#ffffff',
        useCORS: true,
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `paypal-receipt-${Date.now()}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt');
      return;
    }

    const bgColor = themeMode === 'dark' ? '#1e2530' : '#ffffff';

    printWindow.document.write(`
      <html>
        <head>
          <title>PayPal Receipt</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
          <style>
            body { margin: 0; padding: 20px; background: ${bgColor}; }
            * { box-sizing: border-box; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const platform = {
    name: 'PayPal',
    icon: 'P',
    color: '#003087',
    type: 'Payment'
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`p-4 md:p-6 space-y-6 min-h-screen ${themeMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/crypto-receipts"
          className={`p-2 rounded-lg transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft className={`w-5 h-5 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ 
                backgroundColor: platform.color + '20',
                color: platform.color
              }}
            >
              {platform.icon}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Generate PayPal Receipt
              </h1>
              <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Create professional PayPal payment receipts
              </p>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              themeMode === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <span className={`text-xs ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full`}>
            {platform.type}
          </span>
          {isGenerated && (
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              ✓ Generated
            </span>
          )}
        </div>
      </div>

      {/* Main Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Form */}
        <div className={`rounded-lg border p-4 md:p-6 ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📝 Recipient Information
          </h2>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Recipient Name */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Recipient Name
              </label>
              <input
                type="text"
                name="recipientName"
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.recipientName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Recipient Email */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Recipient Email
              </label>
              <input
                type="email"
                name="recipientEmail"
                placeholder="john.doe@email.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.recipientEmail}
                onChange={handleInputChange}
              />
            </div>

            <h2 className={`text-lg font-semibold mt-6 pt-4 border-t ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              💰 Transaction Details
            </h2>

            {/* Currency */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Currency
              </label>
              <select
                name="currency"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.currency}
                onChange={handleInputChange}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount
              </label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                required
              />
            </div>

            {/* Fee */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Fee (Optional)
              </label>
              <input
                type="number"
                name="fee"
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.fee}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    formData.transactionType === 'send'
                      ? 'bg-blue-500/20 text-blue-600 border-2 border-blue-500'
                      : themeMode === 'dark'
                        ? 'bg-gray-700 text-gray-400 border-2 border-transparent hover:border-gray-500'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, transactionType: 'send' }))}
                >
                  📤 Send
                  <span className="block text-xs opacity-60">Outgoing payment</span>
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    formData.transactionType === 'receive'
                      ? 'bg-green-500/20 text-green-600 border-2 border-green-500'
                      : themeMode === 'dark'
                        ? 'bg-gray-700 text-gray-400 border-2 border-transparent hover:border-gray-500'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, transactionType: 'receive' }))}
                >
                  📥 Receive
                  <span className="block text-xs opacity-60">Incoming payment</span>
                </button>
              </div>
            </div>

            {/* Transaction Mode */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Transaction Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    formData.transactionMode === 'goods_services'
                      ? 'bg-blue-500/20 text-blue-600 border-2 border-blue-500'
                      : themeMode === 'dark'
                        ? 'bg-gray-700 text-gray-400 border-2 border-transparent hover:border-gray-500'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, transactionMode: 'goods_services' }))}
                >
                  🛒 Goods & Services
                  <span className="block text-xs opacity-60">Purchase protection</span>
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    formData.transactionMode === 'friends_family'
                      ? 'bg-green-500/20 text-green-600 border-2 border-green-500'
                      : themeMode === 'dark'
                        ? 'bg-gray-700 text-gray-400 border-2 border-transparent hover:border-gray-500'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, transactionMode: 'friends_family' }))}
                >
                  👨‍👩‍👧 Friends & Family
                  <span className="block text-xs opacity-60">No purchase protection</span>
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                name="status"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Transaction ID
              </label>
              <input
                type="text"
                name="transactionId"
                placeholder="Auto-generated"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.transactionId}
                onChange={handleInputChange}
              />
              <p className={`text-xs mt-1 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Leave blank to auto-generate
              </p>
            </div>

            {/* Note */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Note (Optional)
              </label>
              <input
                type="text"
                name="note"
                placeholder="Add a note about this payment"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={formData.note}
                onChange={handleInputChange}
              />
            </div>

            {/* Custom Date & Time */}
            <div className={`border-t pt-4 mt-4 ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Custom Date & Time
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useCustomDate"
                    className="sr-only peer"
                    checked={formData.useCustomDate}
                    onChange={handleToggleChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <p className={`text-xs mb-3 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Set a custom timestamp for the receipt
              </p>
              
              {formData.useCustomDate && (
                <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg ${themeMode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        themeMode === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        themeMode === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/25"
            >
              🧾 Generate PayPal Receipt
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Receipt Preview */}
        <div className={`rounded-lg border p-4 md:p-6 ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className={`text-lg font-semibold ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              👁️ Live Preview
            </h2>
            <div className="flex gap-2">
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed no-print ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={!isGenerated || isDownloading}
                onClick={handleDownloadPNG}
              >
                {isDownloading ? '⏳ Downloading...' : '⬇️ Download PNG'}
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed no-print ${
                  themeMode === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={!isGenerated}
                onClick={handlePrint}
              >
                🖨️ Print
              </button>
            </div>
          </div>
          
          {/* Receipt Preview Area */}
          <div className="min-h-[500px] flex items-center justify-center">
            {isGenerated ? (
              <div ref={receiptRef} className="w-full flex justify-center">
                <PayPalReceipt data={getReceiptData()} themeMode={themeMode} />
              </div>
            ) : (
              <div className={`text-center ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-5xl mb-3">🧾</p>
                <p className="text-sm font-medium">No PayPal Receipt Generated</p>
                <p className="text-xs mt-1">Fill in the form and click Generate</p>
                <p className={`text-xs mt-4 ${themeMode === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Platform: <span className="font-medium">PayPal</span>
                </p>
                {formData.amount && (
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Amount: <span className="font-medium">{formData.amount} {formData.currency}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}