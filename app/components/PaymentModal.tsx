'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    network: string;
    walletAddress: string;
    qrCodeUrl: string;
    applicationId: string | null;
}

export default function PaymentModal({
    isOpen,
    onClose,
    onSuccess,
    amount,
    network,
    walletAddress,
    qrCodeUrl,
    applicationId,
}: PaymentModalProps) {
    const [txId, setTxId] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setTxId('');
            setScreenshot(null);
            setCopied(false);
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            toast.success('Wallet address copied!');
            setTimeout(() => setCopied(false), 3000);
        } catch (error) {
            toast.error('Failed to copy address');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!txId.trim()) {
            setError('Please enter your transaction ID');
            toast.error('Please enter your transaction ID');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('applicationId', applicationId || '');
            formData.append('txId', txId);
            if (screenshot) {
                formData.append('screenshot', screenshot);
            }

            const response = await fetch('/api/cards/confirm-payment', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to confirm payment');
            }

            toast.success('Payment confirmed! Application submitted.');
            onSuccess(); // This will redirect to cards page
        } catch (error: any) {
            setError(error.message || 'Failed to confirm payment');
            toast.error(error.message || 'Failed to confirm payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">💳 Complete External Payment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="bg-[#0b0e14] rounded-lg p-4 border border-white/5">
                        <h3 className="text-white font-semibold mb-3">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Amount</span>
                                <span className="text-green-400 font-bold">{amount} USDT</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Network</span>
                                <span className="text-white">{network || 'TRC20'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Wallet Address</span>
                                <button
                                    onClick={handleCopyAddress}
                                    className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 text-sm"
                                    disabled={loading}
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="mt-2 p-2 bg-[#0b0e14] rounded-lg border border-white/5 break-all font-mono text-xs text-gray-300">
                                {walletAddress || 'Wallet address not configured'}
                            </div>
                        </div>
                    </div>

                    {qrCodeUrl && (
                        <div className="bg-[#0b0e14] rounded-lg p-4 border border-white/5 text-center">
                            <p className="text-gray-400 text-sm mb-2">Scan QR Code to Pay</p>
                            <img 
                                src={qrCodeUrl} 
                                alt="Payment QR Code" 
                                className="mx-auto max-w-[200px] max-h-[200px] rounded-lg border border-white/10"
                                loading="lazy"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-[#0b0e14] rounded-lg p-4 border border-white/5">
                        <h3 className="text-white font-semibold mb-3">Confirm Payment</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">Transaction ID *</label>
                                <input
                                    type="text"
                                    value={txId}
                                    onChange={(e) => setTxId(e.target.value)}
                                    placeholder="Enter your transaction ID"
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-1">Payment Screenshot (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setScreenshot(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                    disabled={loading}
                                />
                                {screenshot && (
                                    <p className="text-xs text-green-400 mt-1">✅ {screenshot.name} selected</p>
                                )}
                            </div>
                        </div>

                        {loading && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting payment confirmation...
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 mt-3 border-t border-white/5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!txId.trim() || loading}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Confirm Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}