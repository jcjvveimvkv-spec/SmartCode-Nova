'use client';

import { CreditCard, Check } from 'lucide-react';
import type { CardType } from '../types';

interface CardSelectionProps {
    cardTypes: CardType[];
    selectedCard: string;
    onSelect: (cardId: string) => void;
}

export default function CardSelection({ cardTypes, selectedCard, onSelect }: CardSelectionProps) {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Select Card Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cardTypes.map((card) => {
                    const isSelected = selectedCard === card.id;
                    
                    return (
                        <button
                            key={card.id}
                            onClick={() => card.enabled && onSelect(card.id)}
                            disabled={!card.enabled}
                            className={`p-6 rounded-xl border-2 transition text-left ${
                                isSelected
                                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                                    : card.enabled
                                        ? 'border-white/10 hover:border-white/20 bg-[#0b0e14]'
                                        : 'border-white/5 bg-[#0b0e14] opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-3xl">{card.icon}</span>
                                {isSelected && <Check className="w-6 h-6 text-purple-400" />}
                            </div>
                            <div className="mt-3 mb-4">
                                <img 
                                    src={card.imageUrl} 
                                    alt={card.name}
                                    loading="lazy"
                                    width="300"
                                    height="120"
                                    className={`w-full rounded-lg border border-white/10 transition-all ${
                                        isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]' : ''
                                    }`}
                                    style={{ height: '150px', objectFit: 'contain' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                            <h3 className="text-white font-semibold text-lg">{card.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                card.type === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' :
                                card.type === 'Global' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'
                            }`}>
                                {card.type}
                            </span>
                            <p className="text-gray-400 text-xs mt-2">{card.description}</p>
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <p className="text-green-400 font-bold text-lg">{card.fee} USDT</p>
                                <p className="text-gray-500 text-xs">Daily: {card.dailyLimit} USDT</p>
                                <p className="text-gray-500 text-xs">Monthly: {card.monthlyLimit} USDT</p>
                            </div>
                            {!card.enabled && (
                                <p className="text-red-400 text-xs mt-2">Currently Unavailable</p>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}