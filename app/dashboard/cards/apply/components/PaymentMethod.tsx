'use client';

import { Wallet } from 'lucide-react';
import type { PaymentMethod as PaymentMethodType } from '../types';

interface PaymentMethodProps {
    paymentMethod: PaymentMethodType;
    onChange: (method: PaymentMethodType) => void;
    internalAvailable: boolean;
    externalAvailable: boolean;
    fee: number;
    totalBalance: number;
    hasSufficientBalance: boolean;
}

export default function PaymentMethod({
    paymentMethod,
    onChange,
    internalAvailable,
    externalAvailable,
    fee,
    totalBalance,
    hasSufficientBalance,
}: PaymentMethodProps) {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                Payment Method
            </h2>
            
            <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'internal' 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-white/10 hover:border-white/20'
                }`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="internal"
                            checked={paymentMethod === 'internal'}
                            onChange={() => onChange('internal')}
                            disabled={!internalAvailable}
                            className="accent-purple-500"
                        />
                        <div className="flex-1">
                            <p className="text-white font-medium">Internal Payment</p>
                            <p className="text-gray-400 text-sm">
                                Fee deducted from your balance
                                <span className={`ml-2 ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
                                    {hasSufficientBalance ? '✅ Sufficient balance' : '❌ Insufficient balance'}
                                </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Available: {totalBalance} USDT
                            </p>
                        </div>
                        <span className={`text-sm ${paymentMethod === 'internal' ? 'text-purple-400' : 'text-gray-500'}`}>
                            {fee} USDT
                        </span>
                    </label>
                </div>
                
                <div className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'external' 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-white/10 hover:border-white/20'
                }`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="external"
                            checked={paymentMethod === 'external'}
                            onChange={() => onChange('external')}
                            disabled={!externalAvailable}
                            className="accent-purple-500"
                        />
                        <div className="flex-1">
                            <p className="text-white font-medium">External Payment</p>
                            <p className="text-gray-400 text-sm">
                                Pay via USDT wallet (TRC20/BEP20)
                            </p>
                        </div>
                        <span className={`text-sm ${paymentMethod === 'external' ? 'text-purple-400' : 'text-gray-500'}`}>
                            {fee} USDT
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}