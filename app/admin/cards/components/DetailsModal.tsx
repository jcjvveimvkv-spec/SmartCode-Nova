'use client';

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Card } from '../types';

interface DetailsModalProps {
    card: Card | null;
    onClose: () => void;
    getStatusDisplay: (status: string) => { label: string; color: string; icon: string };
}

export default function DetailsModal({ card, onClose, getStatusDisplay }: DetailsModalProps) {
    const [copied, setCopied] = useState<string | null>(null);

    if (!card) return null;

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(field);
            toast.success(`${field} copied!`);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const statusDisplay = getStatusDisplay(card.status);
    const cvvValue = card.cvv || '•••';
    const hasCvv = !!card.cvv;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Card Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Card Display */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/70 text-xs uppercase">Card</p>
                                <p className="text-white font-bold text-lg">{card.card_name}</p>
                            </div>
                            <div className="text-white">
                                {card.card_type === 'master_credit' && '🌟🌟🌟🌟🌟'}
                                {card.card_type === 'visa_debit' && '💳💳💳'}
                                {card.card_type === 'verve_debit' && '💳💳'}
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-white text-xl font-mono tracking-wider">
                                •••• •••• •••• {card.card_last4}
                            </p>
                        </div>
                        <div className="flex justify-between mt-4">
                            <div>
                                <p className="text-white/70 text-xs">Expires</p>
                                <p className="text-white font-medium">
                                    {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year.toString().slice(-2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/70 text-xs">CVV</p>
                                <p className="text-white font-mono">•••</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-xs">Status</p>
                                <p className="text-white font-medium">{statusDisplay.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Details */}
                    <div className="bg-[#0b0e14] rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Card Number</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-mono">{card.card_number}</p>
                                    <button
                                        onClick={() => copyToClipboard(card.card_number, 'Card Number')}
                                        className="text-gray-400 hover:text-white transition"
                                    >
                                        {copied === 'Card Number' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">CVV</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-mono">{cvvValue}</p>
                                    {hasCvv && (
                                        <button
                                            onClick={() => {
                                                if (card.cvv) {
                                                    copyToClipboard(card.cvv, 'CVV');
                                                }
                                            }}
                                            className="text-gray-400 hover:text-white transition"
                                        >
                                            {copied === 'CVV' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Expiry</p>
                                <p className="text-white">{card.expiry_month}/{card.expiry_year}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Fee</p>
                                <p className="text-green-400">${card.fee} USDT</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Daily Limit</p>
                                <p className="text-white">${card.daily_limit} USDT</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Monthly Limit</p>
                                <p className="text-white">${card.monthly_limit} USDT</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-[#0b0e14] rounded-lg p-4">
                        <h4 className="text-gray-400 text-sm mb-2">Shipping Address</h4>
                        <p className="text-white">{card.shipping_address?.address}</p>
                        <p className="text-white">{card.shipping_address?.city}, {card.shipping_address?.state} {card.shipping_address?.zip}</p>
                        <p className="text-white">{card.shipping_address?.country}</p>
                    </div>

                    {/* Admin Notes */}
                    {card.admin_notes && (
                        <div className="bg-[#0b0e14] rounded-lg p-4">
                            <h4 className="text-gray-400 text-sm mb-2">Admin Notes</h4>
                            <p className="text-white">{card.admin_notes}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-[#0b0e14] rounded-lg p-4">
                        <h4 className="text-gray-400 text-sm mb-2">Timeline</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Applied</span>
                                <span className="text-white">{new Date(card.application_date).toLocaleString()}</span>
                            </div>
                            {card.approved_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Approved</span>
                                    <span className="text-white">{new Date(card.approved_date).toLocaleString()}</span>
                                </div>
                            )}
                            {card.shipped_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Shipped</span>
                                    <span className="text-white">{new Date(card.shipped_date).toLocaleString()}</span>
                                </div>
                            )}
                            {card.activated_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Activated</span>
                                    <span className="text-white">{new Date(card.activated_date).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}