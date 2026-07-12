'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================
export interface Card {
    id: string;
    user_id: string;
    card_type: string;
    card_name: string;
    card_number: string;
    card_last4: string;
    expiry_month: number;
    expiry_year: number;
    status: string;
    fee: number;
    payment_method: string;
    payment_status: string;
    payment_txid: string | null;
    payment_screenshot: string | null;
    application_data: any;
    signature: string;
    shipping_address: any;
    daily_limit: number;
    monthly_limit: number;
    application_date: string;
    approved_date: string | null;
    issued_date: string | null;
    shipped_date: string | null;
    activated_date: string | null;
    admin_notes: string | null;
    cvv?: string;
    card_holder_name?: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
}

export type StatusFilter = 'all' | 'pending' | 'awaiting_payment' | 'payment_pending' | 'payment_confirmed' | 'approved' | 'issued' | 'shipped' | 'not_activated' | 'active' | 'blocked' | 'rejected' | 'expired';
export type TypeFilter = 'all' | 'master_credit' | 'visa_debit' | 'verve_debit';

// ============================================================
// STATUS DISPLAY HELPER
// ============================================================
const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
        pending: { label: 'Pending Review', color: 'text-yellow-500 bg-yellow-500/10', icon: '🕐' },
        awaiting_payment: { label: 'Awaiting Payment', color: 'text-yellow-500 bg-yellow-500/10', icon: '🕐' },
        payment_pending: { label: 'Payment Pending', color: 'text-yellow-500 bg-yellow-500/10', icon: '🕐' },
        payment_confirmed: { label: 'Payment Confirmed', color: 'text-green-500 bg-green-500/10', icon: '✅' },
        approved: { label: 'Approved', color: 'text-blue-500 bg-blue-500/10', icon: '✅' },
        issued: { label: 'Issued', color: 'text-blue-500 bg-blue-500/10', icon: '💳' },
        shipped: { label: 'Shipped', color: 'text-blue-500 bg-blue-500/10', icon: '💳' },
        not_activated: { label: 'Not Activated', color: 'text-yellow-500 bg-yellow-500/10', icon: '🕐' },
        active: { label: 'Active', color: 'text-green-500 bg-green-500/10', icon: '✅' },
        blocked: { label: 'Blocked', color: 'text-red-500 bg-red-500/10', icon: '🔒' },
        rejected: { label: 'Rejected', color: 'text-red-500 bg-red-500/10', icon: '❌' },
        expired: { label: 'Expired', color: 'text-gray-500 bg-gray-500/10', icon: '⚠️' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-500 bg-gray-500/10', icon: '⚠️' };
};

// ============================================================
// MAIN HOOK
// ============================================================
export function useAdminCards() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // State
    const [cards, setCards] = useState<Card[]>([]);
    const [filteredCards, setFilteredCards] = useState<Card[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Load data
    const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                console.error('Auth error:', authError);
                setError('Authentication error. Please refresh and try again.');
                setLoading(false);
                return;
            }

            if (!user) {
                router.push('/auth/login');
                return;
            }

            console.log('👤 Admin authenticated:', user.id);

            const cardsResponse = await fetch('/api/cards');
            
            if (!cardsResponse.ok) {
                console.warn('Cards API returned:', cardsResponse.status);
                setCards([]);
                setFilteredCards([]);
                setLoading(false);
                return;
            }
            
            const cardsResult = await cardsResponse.json();
            
            if (cardsResult.success && Array.isArray(cardsResult.data)) {
                const allCards = cardsResult.data as Card[];
                console.log(`📊 Found ${allCards.length} cards total`);
                
                setCards(allCards);
                setFilteredCards(allCards);
                
                // Fetch user data for each card
                const userIds = [...new Set(allCards.map((c: Card) => c.user_id))];
                console.log('👥 Fetching users:', userIds);
                
                const userMap: Record<string, User> = {};
                
                for (const userId of userIds) {
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('user_balances')
                            .select('user_id, email, full_name, phone')
                            .eq('user_id', userId)
                            .single();
                        
                        if (userData && !userError) {
                            userMap[userId] = {
                                id: userData.user_id,
                                email: userData.email || 'Unknown',
                                full_name: userData.full_name || 'Unknown User',
                                phone: userData.phone || ''
                            };
                            console.log(`✅ Found user: ${userData.full_name} (${userData.email})`);
                        } else {
                            // Try auth API as fallback
                            const userResponse = await fetch(`/api/users/${userId}`);
                            if (userResponse.ok) {
                                const userResult = await userResponse.json();
                                if (userResult.success && userResult.data) {
                                    const userData = userResult.data as User;
                                    userMap[userId] = {
                                        id: userData.id || userId,
                                        email: userData.email || 'Unknown',
                                        full_name: userData.full_name || 'Unknown User',
                                        phone: userData.phone || ''
                                    };
                                }
                            } else {
                                userMap[userId] = {
                                    id: userId,
                                    email: 'Unknown',
                                    full_name: 'Unknown User'
                                };
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching user ${userId}:`, error);
                        userMap[userId] = {
                            id: userId,
                            email: 'Unknown',
                            full_name: 'Unknown User'
                        };
                    }
                }
                setUsers(userMap);
                console.log('👥 Users loaded:', Object.keys(userMap).length);
            } else {
                setCards([]);
                setFilteredCards([]);
            }
        } catch (error: any) {
            console.error('Error loading cards:', error);
            setError(error.message || 'Failed to load cards');
        } finally {
            setLoading(false);
        }
    };

    // Filter cards
    const filterCards = () => {
        let filtered = [...cards];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((card: Card) => {
                const user = users[card.user_id];
                return (
                    card.card_name.toLowerCase().includes(term) ||
                    card.card_number.includes(term) ||
                    card.card_last4.includes(term) ||
                    (user?.email || '').toLowerCase().includes(term) ||
                    (user?.full_name || '').toLowerCase().includes(term)
                );
            });
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter((card: Card) => card.status === statusFilter);
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter((card: Card) => card.card_type === typeFilter);
        }
        
        setFilteredCards(filtered);
        setCurrentPage(1);
    };

    // ============================================================
    // FIXED: Approve Handler
    // ============================================================
    const handleApprove = async (cardId: string) => {
        console.log('🟢 handleApprove called for card:', cardId);
        console.log('📝 Admin note:', adminNote);
        
        if (!adminNote || adminNote.trim() === '') {
            toast.error('Please add an admin note before approving');
            return;
        }
        
        setProcessing(true);
        try {
            const response = await fetch(`/api/cards/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cardId, 
                    action: 'approve', 
                    note: adminNote.trim() 
                }),
            });
            
            const data = await response.json();
            console.log('📡 Approve response:', data);
            
            if (data.success) {
                toast.success('✅ Card approved successfully! The card is now ready for activation.');
                setShowReviewModal(false);
                setAdminNote('');
                await loadData();
            } else {
                toast.error(data.error || 'Failed to approve card');
                console.error('❌ Approve error:', data.error);
            }
        } catch (error) {
            console.error('❌ Error approving card:', error);
            toast.error('Failed to approve card');
        } finally {
            setProcessing(false);
        }
    };

    // ============================================================
    // FIXED: Reject Handler
    // ============================================================
    const handleReject = async (cardId: string) => {
        console.log('🔴 handleReject called for card:', cardId);
        console.log('📝 Admin note:', adminNote);
        
        if (!adminNote || adminNote.trim() === '') {
            toast.error('Please add an admin note before rejecting');
            return;
        }
        
        setProcessing(true);
        try {
            const response = await fetch(`/api/cards/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cardId, 
                    action: 'reject', 
                    note: adminNote.trim() 
                }),
            });
            
            const data = await response.json();
            console.log('📡 Reject response:', data);
            
            if (data.success) {
                toast.success('❌ Card rejected');
                setShowReviewModal(false);
                setAdminNote('');
                await loadData();
            } else {
                toast.error(data.error || 'Failed to reject card');
                console.error('❌ Reject error:', data.error);
            }
        } catch (error) {
            console.error('❌ Error rejecting card:', error);
            toast.error('Failed to reject card');
        } finally {
            setProcessing(false);
        }
    };

    // ============================================================
    // FIXED: Activate Handler
    // ============================================================
    const handleActivate = async (cardId: string) => {
        console.log('🔵 handleActivate called for card:', cardId);
        
        setProcessing(true);
        try {
            const response = await fetch(`/api/cards/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cardId, 
                    action: 'activate', 
                    note: 'Card activated by admin' 
                }),
            });
            
            const data = await response.json();
            console.log('📡 Activate response:', data);
            
            if (data.success) {
                toast.success('✅ Card activated successfully! The user can now use their card.');
                await loadData();
            } else {
                toast.error(data.error || 'Failed to activate card');
                console.error('❌ Activate error:', data.error);
            }
        } catch (error) {
            console.error('❌ Error activating card:', error);
            toast.error('Failed to activate card');
        } finally {
            setProcessing(false);
        }
    };

    // ============================================================
    // Block Handler
    // ============================================================
    const handleBlock = async (cardId: string, action: 'block' | 'unblock') => {
        try {
            const response = await fetch(`/api/cards/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, action }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success(`Card ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
                await loadData();
            } else {
                toast.error(data.error || `Failed to ${action} card`);
            }
        } catch (error) {
            console.error('Error blocking card:', error);
            toast.error(`Failed to ${action} card`);
        }
    };

    // Computed
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const paginatedCards = filteredCards.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalCards = cards.length;
    const pendingReview = cards.filter((c: Card) => c.status === 'pending' || c.status === 'payment_confirmed').length;
    const awaitingPayment = cards.filter((c: Card) => c.status === 'awaiting_payment' || c.status === 'payment_pending').length;
    const activeCards = cards.filter((c: Card) => c.status === 'active').length;

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    // Apply filters when dependencies change
    useEffect(() => {
        filterCards();
    }, [searchTerm, statusFilter, typeFilter, cards]);

    return {
        // State
        cards,
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
        itemsPerPage,
        totalPages,
        paginatedCards,
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
    };
}