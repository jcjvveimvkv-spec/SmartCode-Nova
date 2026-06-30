'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Edit3, Save, X, Search, 
  AlertCircle, ChevronLeft, ChevronRight,
  Eye, User, Mail, Phone, MapPin, Send,
  Copy, CheckCheck, Globe
} from 'lucide-react';

export default function AdminUsersPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [viewModal, setViewModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }

        // Fetch user balances
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_balances?select=*&order=updated_at.desc`;
        const response = await fetch(url, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Raw API Error:', errorText);
          setError(`API Error: ${response.status} - ${errorText}`);
          return;
        }

        const data = await response.json();
        console.log('Raw API Data:', data);
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [supabase, router]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.telegram_username?.toLowerCase().includes(term) ||
        u.country?.toLowerCase().includes(term) ||
        u.phone_number?.includes(term)
      ));
    }
    setCurrentPage(1);
  }, [searchTerm, users]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (user: any) => {
    setEditModal({ open: true, user: { ...user } });
  };

  const handleView = (user: any) => {
    setViewModal({ open: true, user: { ...user } });
  };

  const handleSaveEdit = async () => {
    if (!editModal.user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_balances')
        .update({
          funding_balance: parseFloat(editModal.user.funding_balance),
          total_profit_usdt: parseFloat(editModal.user.total_profit_usdt),
          bonus_usdt: parseFloat(editModal.user.bonus_usdt),
          full_name: editModal.user.full_name,
          phone_number: editModal.user.phone_number,
          telegram_username: editModal.user.telegram_username,
          country: editModal.user.country,
        })
        .eq('id', editModal.user.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === editModal.user.id ? editModal.user : u));
      setFilteredUsers(prev => prev.map(u => u.id === editModal.user.id ? editModal.user : u));
      setEditModal({ open: false, user: null });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading users...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-[#8e96a3] text-sm">View, search, and edit user details and balances.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by email, name, telegram, country..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141a24] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div className="text-xs text-[#8e96a3] bg-[#141a24] px-3 py-2 rounded-lg border border-white/5 flex items-center whitespace-nowrap">
            <Users size={14} className="mr-2" />
            {filteredUsers.length} users
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle size={18} /> {error}</div>}

      <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Funding</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#8e96a3]">No users found.</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-sm font-medium text-[#6366f1] flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || 'Unknown'}</p>
                          <p className="text-xs text-[#8e96a3] truncate max-w-[120px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        {u.phone_number && (
                          <div className="flex items-center gap-1 text-[#8e96a3]">
                            <Phone size={12} />
                            <span>{u.phone_number}</span>
                          </div>
                        )}
                        {u.telegram_username && (
                          <div className="flex items-center gap-1 text-[#8e96a3]">
                            <Send size={12} />
                            <span>@{u.telegram_username}</span>
                          </div>
                        )}
                        {!u.phone_number && !u.telegram_username && (
                          <span className="text-[#5a5a6e]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.country ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#8e96a3]">
                          <Globe size={14} />
                          <span>{u.country}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#5a5a6e]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(u.funding_balance).toFixed(2)} USDT</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-400">+{Number(u.total_profit_usdt).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-orange-400">+{Number(u.bonus_usdt).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white font-bold">
                      {(Number(u.funding_balance || 0) + Number(u.total_profit_usdt || 0) + Number(u.bonus_usdt || 0)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleView(u)} 
                          className="p-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] hover:bg-[#6366f1]/20 transition"
                          title="View Full Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="p-1.5 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] hover:bg-[#6366f1]/20 transition"
                          title="Edit Balance"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#141a24] border border-white/5 rounded-lg px-4 py-3">
          <div className="text-sm text-[#8e96a3]">
            Showing <span className="text-white font-medium">{startIndex + 1}</span> to{' '}
            <span className="text-white font-medium">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> of{' '}
            <span className="text-white font-medium">{filteredUsers.length}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#0b0e14] border border-white/5 text-[#8e96a3] hover:text-white hover:border-[#6366f1] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-[#0b0e14] border border-white/5 text-[#8e96a3] hover:text-white hover:border-[#6366f1]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-[#8e96a3]">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className={`w-8 h-8 rounded-lg text-sm transition bg-[#0b0e14] border border-white/5 text-[#8e96a3] hover:text-white hover:border-[#6366f1]`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#0b0e14] border border-white/5 text-[#8e96a3] hover:text-white hover:border-[#6366f1] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* View User Modal */}
      <AnimatePresence>
        {viewModal.open && viewModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewModal({ open: false, user: null })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-xl font-bold text-[#6366f1]">
                    {viewModal.user.full_name?.[0]?.toUpperCase() || viewModal.user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{viewModal.user.full_name || 'Unknown User'}</h2>
                    <p className="text-sm text-[#8e96a3]">{viewModal.user.email}</p>
                  </div>
                </div>
                <button onClick={() => setViewModal({ open: false, user: null })} className="text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0b0e14] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-[#8e96a3] text-xs uppercase tracking-wider mb-2">
                      <User size={14} />
                      Personal Information
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">Full Name</span>
                        <span className="text-white text-sm">{viewModal.user.full_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">Email</span>
                        <span className="text-white text-sm flex items-center gap-1">
                          {viewModal.user.email}
                          <button onClick={() => copyToClipboard(viewModal.user.email)} className="text-[#8e96a3] hover:text-white">
                            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">Phone</span>
                        <span className="text-white text-sm">{viewModal.user.phone_number || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0b0e14] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-[#8e96a3] text-xs uppercase tracking-wider mb-2">
                      <Globe size={14} />
                      Location & Social
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">Country</span>
                        <span className="text-white text-sm">{viewModal.user.country || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">Telegram</span>
                        <span className="text-white text-sm">
                          {viewModal.user.telegram_username ? (
                            <a 
                              href={`https://t.me/${viewModal.user.telegram_username}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#6366f1] hover:underline"
                            >
                              @{viewModal.user.telegram_username}
                            </a>
                          ) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e96a3] text-sm">User ID</span>
                        <span className="text-white text-xs font-mono">{viewModal.user.id?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Summary */}
                <div className="bg-[#0b0e14] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-[#8e96a3] text-xs uppercase tracking-wider mb-3">
                    <Users size={14} />
                    Balance Summary
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#8e96a3]">Funding</p>
                      <p className="text-lg font-bold text-white">{Number(viewModal.user.funding_balance).toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8e96a3]">Total Profit</p>
                      <p className="text-lg font-bold text-green-400">+{Number(viewModal.user.total_profit_usdt).toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8e96a3]">Bonus</p>
                      <p className="text-lg font-bold text-orange-400">+{Number(viewModal.user.bonus_usdt).toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8e96a3]">Total Balance</p>
                      <p className="text-lg font-bold text-[#6366f1]">
                        {(Number(viewModal.user.funding_balance || 0) + Number(viewModal.user.total_profit_usdt || 0) + Number(viewModal.user.bonus_usdt || 0)).toFixed(2)} USDT
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setViewModal({ open: false, user: null });
                      handleEdit(viewModal.user);
                    }}
                    className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Edit Balance
                  </button>
                  <button
                    onClick={() => setViewModal({ open: false, user: null })}
                    className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-[#8e96a3] hover:text-white hover:border-[#6366f1] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal.open && editModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditModal({ open: false, user: null })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit User</h2>
                  <p className="text-sm text-[#8e96a3]">{editModal.user.full_name || editModal.user.email}</p>
                </div>
                <button onClick={() => setEditModal({ open: false, user: null })} className="text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Full Name</label>
                    <input 
                      type="text"
                      value={editModal.user.full_name || ''}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, full_name: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Phone Number</label>
                    <input 
                      type="text"
                      value={editModal.user.phone_number || ''}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, phone_number: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Telegram Username</label>
                    <input 
                      type="text"
                      value={editModal.user.telegram_username || ''}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, telegram_username: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                      placeholder="Enter telegram username"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Country</label>
                    <input 
                      type="text"
                      value={editModal.user.country || ''}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, country: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                      placeholder="Enter country"
                    />
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-2">
                    <p className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-3">Balance (USDT)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#8e96a3] block mb-1">Funding</label>
                        <input 
                          type="number"
                          value={editModal.user.funding_balance}
                          onChange={(e) => setEditModal({ 
                            ...editModal, 
                            user: { ...editModal.user, funding_balance: e.target.value } 
                          })}
                          className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#8e96a3] block mb-1">Profit</label>
                        <input 
                          type="number"
                          value={editModal.user.total_profit_usdt}
                          onChange={(e) => setEditModal({ 
                            ...editModal, 
                            user: { ...editModal.user, total_profit_usdt: e.target.value } 
                          })}
                          className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#8e96a3] block mb-1">Bonus</label>
                        <input 
                          type="number"
                          value={editModal.user.bonus_usdt}
                          onChange={(e) => setEditModal({ 
                            ...editModal, 
                            user: { ...editModal.user, bonus_usdt: e.target.value } 
                          })}
                          className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white focus:outline-none focus:border-[#6366f1]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}