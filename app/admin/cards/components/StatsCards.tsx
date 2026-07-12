'use client';

interface StatsCardsProps {
    totalCards: number;
    pendingReview: number;
    awaitingPayment: number;
    activeCards: number;
}

export default function StatsCards({ totalCards, pendingReview, awaitingPayment, activeCards }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm">Total Cards</p>
                <p className="text-2xl font-bold text-white">{totalCards}</p>
            </div>
            <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingReview}</p>
            </div>
            <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm">Awaiting Payment</p>
                <p className="text-2xl font-bold text-orange-500">{awaitingPayment}</p>
            </div>
            <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-sm">Active Cards</p>
                <p className="text-2xl font-bold text-green-500">{activeCards}</p>
            </div>
        </div>
    );
}