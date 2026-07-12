'use client';

import { RefreshCw, Eye, Power, PowerOff, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Card, User } from '../types';

interface CardTableProps {
    cards: Card[];
    users: Record<string, User>;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    setCurrentPage: (page: number) => void;
    onView: (card: Card) => void;
    onActivate: (cardId: string) => void;
    onBlock: (cardId: string, action: 'block' | 'unblock') => void;
    getStatusDisplay: (status: string) => { label: string; color: string; icon: string };
    processing: boolean;
}

export default function CardTable({
    cards,
    users,
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    onView,
    onActivate,
    onBlock,
    getStatusDisplay,
    processing,
}: CardTableProps) {
    // Get the actual user for a card
    const getUser = (card: Card) => {
        return users[card.user_id] || { full_name: 'Unknown User', email: 'Unknown' };
    };

    // Get card type label
    const getCardTypeLabel = (type: string) => {
        switch (type) {
            case 'master_credit': return 'Premium';
            case 'visa_debit': return 'Global';
            case 'verve_debit': return 'Regular';
            default: return '';
        }
    };

    const getCardTypeColor = (type: string) => {
        switch (type) {
            case 'master_credit': return 'bg-orange-500/20 text-orange-400';
            case 'visa_debit': return 'bg-blue-500/20 text-blue-400';
            case 'verve_debit': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, cards.length);
    const paginatedCards = cards.slice(startIndex, endIndex);

    if (cards.length === 0) {
        return (
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-12 text-center">
                <p className="text-gray-400">No cards found</p>
            </div>
        );
    }

    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#0b0e14]">
                        <tr className="text-left text-gray-400 text-sm">
                            <th className="px-6 py-3">User / Email</th>
                            <th className="px-6 py-3">Card</th>
                            <th className="px-6 py-3">Card Number</th>
                            <th className="px-6 py-3">Fee</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCards.map((card) => {
                            const user = getUser(card);
                            const statusDisplay = getStatusDisplay(card.status);
                            
                            return (
                                <tr key={card.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="px-6 py-3">
                                        <div>
                                            <p className="text-white text-sm font-medium">{user.full_name}</p>
                                            <p className="text-gray-400 text-xs">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm">{card.card_name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getCardTypeColor(card.card_type)}`}>
                                                {getCardTypeLabel(card.card_type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-white text-sm font-mono">
                                        **** {card.card_last4}
                                    </td>
                                    <td className="px-6 py-3 text-green-400 text-sm">
                                        ${card.fee}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${statusDisplay.color}`}>
                                            <span>{statusDisplay.icon}</span>
                                            {statusDisplay.label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-sm">
                                        {card.payment_method === 'internal' ? '💳 Internal' : '🌐 External'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-sm">
                                        {new Date(card.application_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-1">
                                            {/* View/Review Button */}
                                            {(card.status === 'pending' || card.status === 'awaiting_payment' || card.status === 'payment_pending' || card.status === 'payment_confirmed') ? (
                                                <button
                                                    onClick={() => onView(card)}
                                                    className="text-blue-400 hover:text-blue-300 transition p-1"
                                                    title="Review Application"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onView(card)}
                                                    className="text-gray-400 hover:text-white transition p-1"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            {/* Activate Button - Only for approved cards */}
                                            {card.status === 'approved' && (
                                                <button
                                                    onClick={() => onActivate(card.id)}
                                                    disabled={processing}
                                                    className="text-green-400 hover:text-green-300 transition p-1 disabled:opacity-50"
                                                    title="Activate Card"
                                                >
                                                    {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                                </button>
                                            )}
                                            
                                            {/* Block/Unblock Buttons */}
                                            {card.status === 'active' && (
                                                <button
                                                    onClick={() => onBlock(card.id, 'block')}
                                                    className="text-red-400 hover:text-red-300 transition p-1"
                                                    title="Block Card"
                                                >
                                                    <PowerOff className="w-4 h-4" />
                                                </button>
                                            )}
                                            {card.status === 'blocked' && (
                                                <button
                                                    onClick={() => onBlock(card.id, 'unblock')}
                                                    className="text-green-400 hover:text-green-300 transition p-1"
                                                    title="Unblock Card"
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                        Showing {startIndex + 1} to {endIndex} of {cards.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}