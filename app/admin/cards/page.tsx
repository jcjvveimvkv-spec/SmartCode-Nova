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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 text-sm">Loading cards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4">
                    ⚠️ {error}
                </div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Card Management</h2>
                    <p className="text-gray-400 text-sm">Unable to load cards. Please try again later.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">💳 Card Management</h1>
                    <p className="text-gray-400 text-sm">Manage user card applications and cards</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/cards/settings'}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <Shield className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <Download className="w-4 h-4" />
                        Export
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