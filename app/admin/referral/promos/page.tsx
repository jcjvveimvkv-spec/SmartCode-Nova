'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
  Plus, RefreshCw, Tag, Copy, X, Check, Trash2, Edit2,
  Power, PowerOff, Calendar, DollarSign, Hash, FileText, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromoCode {
  id: number;
  code: string;
  description: string;
  bonus_amount: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ============================================================
// SKELETON
// ============================================================
function PromoSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-full sm:w-44 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-12 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-[#1a2332] border border-white/5 rounded-xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 sm:h-14 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [newPromo, setNewPromo] = useState({
    code: '',
    description: '',
    bonus_amount: 10,
    usage_limit: 100,
    expires_at: '',
  });
  const [editForm, setEditForm] = useState({
    description: '',
    bonus_amount: 0,
    usage_limit: 0,
    expires_at: '',
    is_active: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadPromos();
  }, []);

  // Auto-dismiss message banner
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-promos' }),
      });

      const result = await response.json();

      if (result.success) {
        setPromos(result.data || []);
      }
    } catch (error) {
      console.error('Error loading promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPromo = async () => {
    if (!newPromo.code || !newPromo.bonus_amount) {
      setMessage({ type: 'error', text: 'Code and bonus amount are required' });
      return;
    }

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-promo',
          code: newPromo.code.toUpperCase(),
          description: newPromo.description,
          bonus_amount: newPromo.bonus_amount,
          usage_limit: newPromo.usage_limit || 0,
          expires_at: newPromo.expires_at || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowCreateModal(false);
        setNewPromo({ code: '', description: '', bonus_amount: 10, usage_limit: 100, expires_at: '' });
        await loadPromos();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error creating promo' });
      }
    } catch (error) {
      console.error('Error creating promo:', error);
      setMessage({ type: 'error', text: 'Error creating promo code' });
    }
  };

  const togglePromo = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-promo',
          promo_id: id,
          is_active: !isActive,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadPromos();
        setMessage({ type: 'success', text: result.message });
      }
    } catch (error) {
      console.error('Error toggling promo:', error);
      setMessage({ type: 'error', text: 'Error toggling promo' });
    }
  };

  const deletePromo = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-promo',
          promo_id: id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadPromos();
        setMessage({ type: 'success', text: result.message });
      }
    } catch (error) {
      console.error('Error deleting promo:', error);
      setMessage({ type: 'error', text: 'Error deleting promo' });
    }
  };

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setEditForm({
      description: promo.description || '',
      bonus_amount: promo.bonus_amount ?? 0,
      usage_limit: promo.usage_limit ?? 0,
      expires_at: promo.expires_at || '',
      is_active: promo.is_active ?? true,
    });
    setShowEditModal(true);
  };

  const updatePromo = async () => {
    if (!editingPromo) return;

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-promo',
          promo_id: editingPromo.id,
          description: editForm.description,
          bonus_amount: editForm.bonus_amount,
          usage_limit: editForm.usage_limit || 0,
          expires_at: editForm.expires_at || null,
          is_active: editForm.is_active,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowEditModal(false);
        await loadPromos();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error updating promo' });
      }
    } catch (error) {
      console.error('Error updating promo:', error);
      setMessage({ type: 'error', text: 'Error updating promo' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setMessage({ type: 'success', text: '✅ Code copied to clipboard!' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return <PromoSkeleton />;

  const totalUses = promos.reduce((sum, p) => sum + p.used_count, 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 truncate">
            <span>🏷️</span>
            <span className="truncate">Promo Codes</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Create and manage promotional codes for users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto shrink-0 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium"
        >
          <Plus size={18} />
          Create Promo Code
        </button>
      </div>

      {/* Message banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 sm:p-4 rounded-lg flex items-start gap-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-red-500/20 text-red-400 border border-red-500/20'
            }`}
          >
            <span className="min-w-0 break-words flex-1">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70 transition p-0.5"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Total Promos</p>
          <p className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">{promos.length}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Active</p>
          <p className="text-lg sm:text-2xl font-bold text-green-400 tabular-nums truncate">{promos.filter(p => p.is_active).length}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Inactive</p>
          <p className="text-lg sm:text-2xl font-bold text-red-400 tabular-nums truncate">{promos.filter(p => !p.is_active).length}</p>
        </div>
        <div className="bg-[#1a2332] p-3 sm:p-4 rounded-xl border border-white/5 min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Total Uses</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-400 tabular-nums truncate">{totalUses}</p>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex justify-between items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate">All Promo Codes</h2>
          <button
            onClick={loadPromos}
            className="text-gray-400 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm shrink-0 p-1"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {promos.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Tag size={28} className="text-purple-400 opacity-60" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5">No promo codes yet</h3>
            <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto mb-5">
              Create your first promo code to start rewarding users with bonuses.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg transition text-sm inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Promo Code
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {promos.map((promo) => {
                const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
                const isLimitReached = promo.usage_limit > 0 && promo.used_count >= promo.usage_limit;
                const isActuallyActive = promo.is_active && !isExpired && !isLimitReached;

                return (
                  <div key={promo.id} className="p-3 space-y-3">
                    {/* Code + copy + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-yellow-400 font-bold text-sm truncate">{promo.code}</span>
                        <button
                          onClick={() => copyCode(promo.code)}
                          aria-label="Copy code"
                          className="text-gray-400 hover:text-white transition p-1 shrink-0"
                        >
                          {copiedCode === promo.code ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        isActuallyActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isActuallyActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Description */}
                    {promo.description && (
                      <p className="text-gray-300 text-xs break-words">{promo.description}</p>
                    )}

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                      <span className="text-gray-400">Bonus</span>
                      <span className="text-right text-green-400 font-medium tabular-nums">
                        {promo.bonus_amount} USDT
                      </span>

                      <span className="text-gray-400">Used / Limit</span>
                      <span className={`text-right tabular-nums ${isLimitReached ? 'text-red-400 font-medium' : 'text-gray-300'}`}>
                        {promo.used_count} / {promo.usage_limit === 0 ? '∞' : promo.usage_limit}
                      </span>

                      <span className="text-gray-400">Expires</span>
                      <span className={`text-right tabular-nums ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                        {promo.expires_at
                          ? new Date(promo.expires_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => togglePromo(promo.id, promo.is_active)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 border ${
                          promo.is_active
                            ? 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                            : 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                        }`}
                      >
                        {promo.is_active ? (
                          <><PowerOff size={14} /> Deactivate</>
                        ) : (
                          <><Power size={14} /> Activate</>
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(promo)}
                        aria-label="Edit"
                        className="px-3 py-2 rounded-lg text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center justify-center shrink-0"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deletePromo(promo.id, promo.code)}
                        aria-label="Delete"
                        className="px-3 py-2 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0b0e14]">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Bonus</th>
                    <th className="px-6 py-3">Used / Limit</th>
                    <th className="px-6 py-3">Expires</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => {
                    const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
                    const isLimitReached = promo.usage_limit > 0 && promo.used_count >= promo.usage_limit;
                    const isActuallyActive = promo.is_active && !isExpired && !isLimitReached;

                    return (
                      <tr key={promo.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-yellow-400 font-bold">{promo.code}</span>
                            <button
                              onClick={() => copyCode(promo.code)}
                              aria-label="Copy code"
                              className="text-gray-400 hover:text-white transition"
                            >
                              {copiedCode === promo.code ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-300 text-sm max-w-[200px] truncate">
                          {promo.description || '—'}
                        </td>
                        <td className="px-6 py-3 text-green-400 font-medium tabular-nums">
                          {promo.bonus_amount} USDT
                        </td>
                        <td className="px-6 py-3 text-gray-300 text-sm tabular-nums">
                          <span className={isLimitReached ? 'text-red-400' : ''}>
                            {promo.used_count} / {promo.usage_limit === 0 ? '∞' : promo.usage_limit}
                          </span>
                          {isLimitReached && (
                            <span className="ml-2 text-xs text-red-400">(Limit)</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-sm tabular-nums">
                          {promo.expires_at ? (
                            <span className={isExpired ? 'text-red-400' : ''}>
                              {new Date(promo.expires_at).toLocaleDateString()}
                            </span>
                          ) : (
                            'Never'
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActuallyActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isActuallyActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => togglePromo(promo.id, promo.is_active)}
                              className={`p-1.5 rounded-lg transition ${
                                promo.is_active
                                  ? 'text-red-400 hover:bg-red-500/20'
                                  : 'text-green-400 hover:bg-green-500/20'
                              }`}
                              title={promo.is_active ? 'Deactivate' : 'Activate'}
                              aria-label={promo.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {promo.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                            <button
                              onClick={() => openEditModal(promo)}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deletePromo(promo.id, promo.code)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => { setShowCreateModal(false); setMessage(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a2332] rounded-xl border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center gap-3 p-4 sm:p-6 border-b border-white/5 shrink-0">
                <h2 className="text-base sm:text-xl font-bold text-white">Create Promo Code</h2>
                <button
                  onClick={() => { setShowCreateModal(false); setMessage(null); }}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white transition p-1 shrink-0"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Promo Code *</label>
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER25"
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Description</label>
                  <input
                    type="text"
                    value={newPromo.description}
                    onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                    placeholder="Summer promotion 2026"
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Bonus Amount (USDT) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={newPromo.bonus_amount ?? 0}
                    onChange={(e) => setNewPromo({ ...newPromo, bonus_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Usage Limit (0 = unlimited)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newPromo.usage_limit ?? 0}
                    onChange={(e) => setNewPromo({ ...newPromo, usage_limit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition tabular-nums"
                  />
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">1 user = 1 use maximum</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Expiry Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newPromo.expires_at}
                    onChange={(e) => setNewPromo({ ...newPromo, expires_at: e.target.value })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-6 pt-0 sm:pt-0 border-t border-white/5 shrink-0">
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={() => { setShowCreateModal(false); setMessage(null); }}
                    className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPromo}
                    className="w-full sm:flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg transition text-sm font-medium"
                  >
                    Create Promo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && editingPromo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => { setShowEditModal(false); setMessage(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a2332] rounded-xl border border-white/10 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center gap-3 p-4 sm:p-6 border-b border-white/5 shrink-0">
                <h2 className="text-base sm:text-xl font-bold text-white">Edit Promo Code</h2>
                <button
                  onClick={() => { setShowEditModal(false); setMessage(null); }}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white transition p-1 shrink-0"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Code</label>
                  <p className="text-yellow-400 font-mono font-bold text-lg break-all">{editingPromo.code}</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Bonus Amount (USDT)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editForm.bonus_amount ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, bonus_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Usage Limit (0 = unlimited)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editForm.usage_limit ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, usage_limit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.expires_at}
                    onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>

                <label className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-[#0b0e14] text-purple-500 focus:ring-purple-500"
                  />
                  Active
                </label>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-6 pt-0 sm:pt-0 border-t border-white/5 shrink-0">
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={() => { setShowEditModal(false); setMessage(null); }}
                    className="w-full sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updatePromo}
                    className="w-full sm:flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg transition text-sm font-medium"
                  >
                    Update Promo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
