'use client';

import { RefreshCw, Download, Shield } from 'lucide-react';
import { useAdminCards } from './hooks/useAdminCards';
import StatsCards from './components/StatsCards';
import CardFilters from './components/CardFilters';
import CardTable from './components/CardTable';
import ReviewModal from './components/ReviewModal';
import DetailsModal from './components/DetailsModal';

export default function AdminCardManagement() {
    const {
        // State
        filteredCards,
        users,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        currentPage,
        setCurrentPage,
        totalPages,
        itemsPerPage,
        selectedCard,
        setSelectedCard,
        showReviewModal,
        setShowReviewModal,
        showDetailsModal,
        setShowDetailsModal,
        adminNote,
        setAdminNote,
        processing,
        totalCards,
        pendingReview,
        awaitingPayment,
        activeCards,
        // Actions
        loadData,
        handleApprove,
        handleActivate,
        handleReject,
        handleBlock,
        getStatusDisplay,
    } = useAdminCards();

    // Handlers for modals
    const handleViewCard = (card: any) => {
        setSelectedCard(card);
        if (card.status === 'pending' || card.status === 'awaiting_payment' || card.status === 'payment_pending' || card.status === 'payment_confirmed') {
            setShowReviewModal(true);
        } else {
            setShowDetailsModal(true);
        }
    };

    const handleCloseModals = () => {
        setShowReviewModal(false);
        setShowDetailsModal(false);
        setSelectedCard(null);
        setAdminNote('');
    };

    // ✅ CSV Export of the currently filtered cards
    const handleExport = () => {
        if (!filteredCards || filteredCards.length === 0) return;

        const escapeCsv = (val: any) => {
            const s = String(val ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        // ✅ FIX: users may be typed as a single object OR an array.
        // Normalize to an array before iterating, and defensively handle null/undefined.
        const userLookup: Record<string, { name: string; email: string }> = {};
        const userList: any[] = Array.isArray(users)
            ? users
            : (users ? [users as any] : []);

        userList.forEach((u: any) => {
            const id = u.user_id || u.id;
            if (id) {
                userLookup[id] = {
                    name: u.full_name || '',
                    email: u.email || '',
                };
            }
        });

        const lines: string[] = [];
        lines.push('Card Management Export');
        lines.push(`Generated,${escapeCsv(new Date().toISOString())}`);
        lines.push(`Total Cards,${filteredCards.length}`);
        lines.push('');

        lines.push('ID,User Name,User Email,Card Type,Card Name,Card Last 4,Status,Daily Limit,Monthly Limit,Fee,Application Date,Approved Date,Issued Date,Activated Date');
        filteredCards.forEach((card: any) => {
            const user = userLookup[card.user_id] || { name: '', email: '' };
            lines.push([
                escapeCsv(card.id),
                escapeCsv(user.name),
                escapeCsv(user.email),
                escapeCsv(card.card_type),
                escapeCsv(card.card_name),
                escapeCsv(card.card_last4),
                escapeCsv(card.status),
                card.daily_limit ?? '',
                card.monthly_limit ?? '',
                card.fee ?? '',
                escapeCsv(card.application_date),
                escapeCsv(card.approved_date),
                escapeCsv(card.issued_date),
                escapeCsv(card.activated_date),
            ].join(','));
        });

        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `card-management-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ✅ Skeleton loader
    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-52 rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
                        <div className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
                    </div>
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
                            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                            <div className="h-7 w-14 rounded bg-white/10 animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Filters skeleton */}
                <div className="h-24 rounded-xl bg-white/5 animate-pulse" />

                {/* Table skeleton */}
                <div className="bg-[#1a2332] border border-white/5 rounded-xl p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 sm:h-14 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm break-words">
                    ⚠️ {error}
                </div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Card Management</h2>
                    <p className="text-gray-400 text-sm">Unable to load cards. Please try again later.</p>
                    <button
                        onClick={() => loadData()}
                        className="mt-4 w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg transition text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] overflow-x-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 border-b border-white/5 pb-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 min-w-0">
                        <span className="shrink-0">💳</span>
                        <span className="truncate">Card Management</span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        Manage user card applications and cards
                    </p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:gap-2 shrink-0">
                    <button
                        onClick={loadData}
                        aria-label="Refresh"
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/cards/settings'}
                        aria-label="Settings"
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                        <Shield className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Settings</span>
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!filteredCards || filteredCards.length === 0}
                        aria-label="Export CSV"
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards
                totalCards={totalCards}
                pendingReview={pendingReview}
                awaitingPayment={awaitingPayment}
                activeCards={activeCards}
            />

            {/* Filters */}
            <CardFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
            />

            {/* Card Table */}
            <CardTable
                cards={filteredCards}
                users={users}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                onView={handleViewCard}
                onActivate={handleActivate}
                onBlock={handleBlock}
                getStatusDisplay={getStatusDisplay}
                processing={processing}
            />

            {/* Review Modal */}
            {showReviewModal && (
                <ReviewModal
                    card={selectedCard}
                    users={users}
                    adminNote={adminNote}
                    setAdminNote={setAdminNote}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onClose={handleCloseModals}
                    processing={processing}
                />
            )}

            {/* Details Modal */}
            {showDetailsModal && (
                <DetailsModal
                    card={selectedCard}
                    onClose={handleCloseModals}
                    getStatusDisplay={getStatusDisplay}
                />
            )}
        </div>
    );
}
