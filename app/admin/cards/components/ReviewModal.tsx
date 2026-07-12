'use client';

import { X, Check, RefreshCw, Download, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Card, User } from '../types';

interface ReviewModalProps {
    card: Card | null;
    users: Record<string, User>;
    adminNote: string;
    setAdminNote: (note: string) => void;
    onApprove: (cardId: string) => void;
    onReject: (cardId: string) => void;
    onClose: () => void;
    processing: boolean;
}

export default function ReviewModal({
    card,
    users,
    adminNote,
    setAdminNote,
    onApprove,
    onReject,
    onClose,
    processing,
}: ReviewModalProps) {
    if (!card) return null;

    const user = users[card.user_id];

    // Handle approve with validation
    const handleApprove = () => {
        console.log('✅ Approve button clicked for card:', card.id);
        console.log('📝 Admin note:', adminNote);
        
        if (!adminNote || adminNote.trim() === '') {
            toast.error('Please add an admin note before approving');
            return;
        }
        
        // Call the approve handler from parent
        onApprove(card.id);
    };

    // Handle reject with validation
    const handleReject = () => {
        console.log('❌ Reject button clicked for card:', card.id);
        console.log('📝 Admin note:', adminNote);
        
        if (!adminNote || adminNote.trim() === '') {
            toast.error('Please add an admin note before rejecting');
            return;
        }
        
        // Call the reject handler from parent
        onReject(card.id);
    };

    // Open receipt in new tab
    const openReceipt = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    // Download receipt
    const downloadReceipt = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `receipt-${card.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Receipt downloaded!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download receipt');
        }
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Review Card Application</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* User Info */}
                    <div className="bg-[#0b0e14] rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Name</p>
                                <p className="text-white">{user?.full_name || 'Unknown User'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Email</p>
                                <p className="text-white">{user?.email || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Phone</p>
                                <p className="text-white">{card.application_data?.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Alternative Phone</p>
                                <p className="text-white">{card.application_data?.alternative_phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Alternative Email</p>
                                <p className="text-white">{card.application_data?.alternative_email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Card Type</p>
                                <p className="text-white">{card.card_name}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Fee</p>
                                <p className="text-green-400">${card.fee} USDT</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Payment Method</p>
                                <p className="text-white">{card.payment_method === 'internal' ? '💳 Internal' : '🌐 External'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details - External Payment */}
                    {card.payment_method === 'external' && (
                        <div className="bg-[#0b0e14] rounded-lg p-4 border border-yellow-500/20">
                            <h4 className="text-yellow-400 text-sm font-semibold mb-3">💳 External Payment Details</h4>
                            <div className="space-y-3">
                                {/* Transaction ID */}
                                {card.payment_txid && (
                                    <div>
                                        <p className="text-gray-400 text-xs">Transaction ID</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-white font-mono text-sm break-all">{card.payment_txid}</p>
                                            <button
                                                onClick={() => copyToClipboard(card.payment_txid!, 'Transaction ID')}
                                                className="text-gray-400 hover:text-white transition"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Screenshot / Receipt */}
                                {card.payment_screenshot ? (
                                    <div>
                                        <p className="text-gray-400 text-xs">Payment Receipt</p>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => openReceipt(card.payment_screenshot!)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Receipt
                                            </button>
                                            <button
                                                onClick={() => downloadReceipt(card.payment_screenshot!)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition text-sm"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </div>
                                        {/* Receipt Preview */}
                                        <div className="mt-2 relative">
                                            <img 
                                                src={card.payment_screenshot}
                                                alt="Payment Receipt"
                                                className="max-h-32 rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-80 transition"
                                                onClick={() => openReceipt(card.payment_screenshot!)}
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                Click to expand
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-gray-400 text-xs">Payment Receipt</p>
                                        <p className="text-yellow-500/70 text-sm mt-1">⚠️ No receipt uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shipping Address */}
                    <div className="bg-[#0b0e14] rounded-lg p-4">
                        <h4 className="text-gray-400 text-sm mb-2">Shipping Address</h4>
                        <p className="text-white">{card.shipping_address?.address}</p>
                        <p className="text-white">{card.shipping_address?.city}, {card.shipping_address?.state} {card.shipping_address?.zip}</p>
                        <p className="text-white">{card.shipping_address?.country}</p>
                    </div>

                    {/* Signature */}
                    {card.signature && (
                        <div className="bg-[#0b0e14] rounded-lg p-4">
                            <h4 className="text-gray-400 text-sm mb-2">Signature</h4>
                            <img 
                                src={card.signature} 
                                alt="Signature" 
                                className="max-w-[200px] max-h-[60px] border border-white/10 rounded"
                            />
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">Admin Notes *</label>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add notes about this application (required for approve/reject)..."
                            className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none resize-none h-20"
                            required
                        />
                        <p className="text-gray-500 text-xs mt-1">⚠️ Admin note is required before approving or rejecting</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve & Issue Card
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}