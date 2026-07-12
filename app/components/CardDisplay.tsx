'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface CardDisplayProps {
    cardName: string;
    cardType: string;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    holderName: string;
    status: string;
    cardImage?: string;
    showFullDetails?: boolean;
}

export default function CardDisplay({ 
    cardName, 
    cardType, 
    cardNumber, 
    expiryMonth, 
    expiryYear, 
    cvv, 
    holderName, 
    status,
    cardImage,
    showFullDetails = true
}: CardDisplayProps) {
    const [showCVV, setShowCVV] = useState(false);
    const [showFullNumber, setShowFullNumber] = useState(false);
    const [showDetails, setShowDetails] = useState(showFullDetails);
    const [copied, setCopied] = useState<string | null>(null);

    const formatCardNumber = (num: string) => {
        const clean = num.replace(/\s/g, '');
        const parts = [];
        for (let i = 0; i < clean.length; i += 4) {
            parts.push(clean.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            awaiting_payment: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            payment_confirmed: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            approved: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            issued: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            shipped: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            not_activated: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            active: 'text-green-400 border-green-500/30 bg-green-500/10',
            blocked: 'text-red-400 border-red-500/30 bg-red-500/10',
            rejected: 'text-red-400 border-red-500/30 bg-red-500/10',
            expired: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
        };
        return colors[status] || 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: '⏳ Under Review',
            awaiting_payment: '⏳ Awaiting Payment',
            payment_confirmed: '💳 Payment Confirmed',
            approved: '✅ Approved',
            issued: '📤 Issued',
            shipped: '📬 Shipped',
            not_activated: '⚠️ Not Activated',
            active: '✅ Active',
            blocked: '🔒 Blocked',
            rejected: '❌ Rejected',
            expired: '⏰ Expired',
        };
        return labels[status] || status;
    };

    return (
        <div className="relative group max-w-md mx-auto">
            <div className="relative">
                {cardImage ? (
                    <div className="relative">
                        <img 
                            src={cardImage} 
                            alt={cardName}
                            className="w-full rounded-xl shadow-2xl border border-white/10"
                        />
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(status)} backdrop-blur-sm`}>
                            {getStatusLabel(status)}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl p-6 shadow-2xl border border-white/10 min-h-[220px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/60 text-xs uppercase tracking-wider">Card</p>
                                <p className="text-white font-bold text-lg">{cardName}</p>
                            </div>
                            <div className="text-white text-2xl">💳</div>
                        </div>
                        
                        <div className="mt-4">
                            <div className="flex items-center gap-2">
                                <p className="text-white text-xl font-mono tracking-wider">
                                    {showFullNumber ? formatCardNumber(cardNumber) : `•••• •••• •••• ${cardNumber.slice(-4)}`}
                                </p>
                                <button
                                    onClick={() => setShowFullNumber(!showFullNumber)}
                                    className="text-white/50 hover:text-white transition"
                                >
                                    {showFullNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => copyToClipboard(cardNumber, 'number')}
                                    className="text-white/50 hover:text-white transition"
                                >
                                    {copied === 'number' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                            <div>
                                <p className="text-white/60 text-xs">Expires</p>
                                <p className="text-white font-medium">
                                    {expiryMonth.toString().padStart(2, '0')}/{expiryYear.toString().slice(-2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">CVV</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-mono">
                                        {showCVV ? cvv : '•••'}
                                    </p>
                                    <button
                                        onClick={() => setShowCVV(!showCVV)}
                                        className="text-white/50 hover:text-white transition"
                                    >
                                        {showCVV ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(cvv, 'cvv')}
                                        className="text-white/50 hover:text-white transition"
                                    >
                                        {copied === 'cvv' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                            <p className="text-white font-medium uppercase text-sm">{holderName}</p>
                            <div className={`text-sm font-medium ${getStatusColor(status)}`}>
                                {getStatusLabel(status)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Card Details Dropdown - Toggle with Show/Hide */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-3 w-full flex items-center justify-between px-4 py-2 bg-[#1a2332] hover:bg-[#2a3a4a] rounded-lg border border-white/5 transition"
            >
                <span className="text-sm text-white font-medium flex items-center gap-2">
                    {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showDetails ? 'Hide Card Details' : 'Show Card Details'}
                </span>
                {showDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showDetails && (
                <div className="mt-2 bg-[#1a2332] rounded-xl border border-white/10 p-4 space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Card Number</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-mono text-sm">{formatCardNumber(cardNumber)}</span>
                            <button
                                onClick={() => copyToClipboard(cardNumber, 'number')}
                                className="text-gray-400 hover:text-white transition"
                            >
                                {copied === 'number' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">CVV</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-mono text-sm">{showCVV ? cvv : '•••'}</span>
                            <button
                                onClick={() => setShowCVV(!showCVV)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                {showCVV ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                                onClick={() => copyToClipboard(cvv, 'cvv')}
                                className="text-gray-400 hover:text-white transition"
                            >
                                {copied === 'cvv' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Expiry Date</span>
                        <span className="text-white text-sm">
                            {expiryMonth.toString().padStart(2, '0')}/{expiryYear.toString().slice(-2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400 text-sm">Status</span>
                        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}