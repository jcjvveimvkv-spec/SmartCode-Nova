'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  Plus, RefreshCw, Tag, Copy, X, Check, Trash2, Edit2, 
  Power, PowerOff, Calendar, DollarSign, Hash, FileText
} from 'lucide-react';

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

  useEffect(() => {
    loadPromos();
  }, []);

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
    setMessage({ type: 'success', text: '✅ Code copied to clipboard!' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🏷️ Promo Codes</h1>
            <p className="text-gray-400 mt-1">Create and manage promotional codes for users</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Create Promo Code
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
              : 'bg-red-500/20 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">×</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
            <p className="text-sm text-gray-400">Total Promos</p>
            <p className="text-2xl font-bold text-white">{promos.length}</p>
          </div>
          <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
            <p className="text-sm text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-400">{promos.filter(p => p.is_active).length}</p>
          </div>
          <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
            <p className="text-sm text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-red-400">{promos.filter(p => !p.is_active).length}</p>
          </div>
          <div className="bg-[#1a2332] p-4 rounded-xl border border-white/5">
            <p className="text-sm text-gray-400">Total Uses</p>
            <p className="text-2xl font-bold text-yellow-400">{promos.reduce((sum, p) => sum + p.used_count, 0)}</p>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-[#1a2332] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">All Promo Codes</h2>
            <button
              onClick={loadPromos}
              className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
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
                {promos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No promo codes created yet
                    </td>
                  </tr>
                ) : (
                  promos.map((promo) => {
                    const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
                    const isLimitReached = promo.usage_limit > 0 && promo.used_count >= promo.usage_limit;
                    const isActuallyActive = promo.is_active && !isExpired && !isLimitReached;
                    
                    return (
                      <tr key={promo.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-3">
                          <span className="font-mono text-yellow-400 font-bold">{promo.code}</span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="ml-2 text-gray-400 hover:text-white transition"
                          >
                            <Copy size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-3 text-gray-300 text-sm">
                          {promo.description || '-'}
                        </td>
                        <td className="px-6 py-3 text-green-400 font-medium">
                          {promo.bonus_amount} USDT
                        </td>
                        <td className="px-6 py-3 text-gray-300 text-sm">
                          <span className={isLimitReached ? 'text-red-400' : ''}>
                            {promo.used_count} / {promo.usage_limit === 0 ? '∞' : promo.usage_limit}
                          </span>
                          {isLimitReached && (
                            <span className="ml-2 text-xs text-red-400">(Limit Reached)</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-sm">
                          {promo.expires_at ? (
                            <span className={isExpired ? 'text-red-400' : ''}>
                              {new Date(promo.expires_at).toLocaleDateString()}
                              {isExpired && ' (Expired)'}
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
                            >
                              {promo.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                            <button
                              onClick={() => openEditModal(promo)}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deletePromo(promo.id, promo.code)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Promo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create Promo Code</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setMessage(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Promo Code *</label>
                <input
                  type="text"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., SUMMER25"
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition uppercase"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <input
                  type="text"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
                  placeholder="Summer promotion 2024"
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Bonus Amount (USDT) *</label>
                <input
                  type="number"
                  value={newPromo.bonus_amount ?? 0}
                  onChange={(e) => setNewPromo({...newPromo, bonus_amount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Usage Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={newPromo.usage_limit ?? 0}
                  onChange={(e) => setNewPromo({...newPromo, usage_limit: parseInt(e.target.value) || 0})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">1 user = 1 use maximum</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={newPromo.expires_at}
                  onChange={(e) => setNewPromo({...newPromo, expires_at: e.target.value})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={createPromo}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Create Promo
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setMessage(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Promo Modal */}
      {showEditModal && editingPromo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a2332] rounded-xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Edit Promo Code</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setMessage(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Code</label>
                <p className="text-yellow-400 font-mono font-bold text-lg">{editingPromo.code}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Bonus Amount (USDT)</label>
                <input
                  type="number"
                  value={editForm.bonus_amount ?? 0}
                  onChange={(e) => setEditForm({...editForm, bonus_amount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Usage Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={editForm.usage_limit ?? 0}
                  onChange={(e) => setEditForm({...editForm, usage_limit: parseInt(e.target.value) || 0})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Expiry Date</label>
                <input
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm({...editForm, expires_at: e.target.value})}
                  className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-[#0b0e14] text-purple-500 focus:ring-purple-500"
                  />
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={updatePromo}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Update Promo
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setMessage(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}