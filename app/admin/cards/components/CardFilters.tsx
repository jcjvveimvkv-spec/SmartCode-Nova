'use client';

import { Search } from 'lucide-react';
import type { StatusFilter, TypeFilter } from '../types';

interface CardFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (value: StatusFilter) => void;
    typeFilter: TypeFilter;
    setTypeFilter: (value: TypeFilter) => void;
}

export default function CardFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
}: CardFiltersProps) {
    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by user, email, card type, or last 4 digits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0b0e14] text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="awaiting_payment">Awaiting Payment</option>
                        <option value="payment_pending">Payment Pending</option>
                        <option value="payment_confirmed">Payment Confirmed</option>
                        <option value="approved">Approved</option>
                        <option value="issued">Issued</option>
                        <option value="shipped">Shipped</option>
                        <option value="not_activated">Not Activated</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                        className="bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="master_credit">Master Credit</option>
                        <option value="visa_debit">Visa Debit</option>
                        <option value="verve_debit">Verve Debit</option>
                    </select>
                </div>
            </div>
        </div>
    );
}