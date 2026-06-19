'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Edit3, Save, X, Search, 
  AlertCircle 
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }

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
        u.full_name?.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, users]);

  const handleEdit = (user: any) => {
    setEditModal({ open: true, user: { ...user } });
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
          bonus_usdt: parseFloat(editModal.user.bonus_usdt)
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

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading users...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-[#8e96a3] text-sm">View, search, and edit user balances.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141a24] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
          />
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle size={18} /> {error}</div>}

      <div className="bg-[#141a24] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Funding</th>
                <th className="px-6 py-3">Profit</th>
                <th className="px-6 py-3">Bonus</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-[#8e96a3]">No users found.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                        {u.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name || u.email || 'Unknown'}</p>
                        <p className="text-xs text-[#8e96a3]">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono">{Number(u.funding_balance).toFixed(2)} USDT</td>
                    <td className="px-6 py-3 font-mono text-green-400">+{Number(u.total_profit_usdt).toFixed(2)} USDT</td>
                    <td className="px-6 py-3 font-mono text-orange-400">+{Number(u.bonus_usdt).toFixed(2)} USDT</td>
                    <td className="px-6 py-3 font-mono text-white font-bold">
                      {(Number(u.funding_balance || 0) + Number(u.total_profit_usdt || 0) + Number(u.bonus_usdt || 0)).toFixed(2)} USDT
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleEdit(u)} className="flex items-center gap-1 px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] hover:bg-[#6366f1]/20 transition text-xs">
                        <Edit3 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <h2 className="text-xl font-bold text-white">Edit User Balance</h2>
                <button onClick={() => setEditModal({ open: false, user: null })} className="text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-[#8e96a3] text-sm">
                  Editing balance for <span className="text-white font-medium">{editModal.user.full_name || editModal.user.email}</span>
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Funding Balance (USDT)</label>
                    <input 
                      type="number"
                      value={editModal.user.funding_balance}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, funding_balance: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Total Profit (USDT)</label>
                    <input 
                      type="number"
                      value={editModal.user.total_profit_usdt}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, total_profit_usdt: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bonus Balance (USDT)</label>
                    <input 
                      type="number"
                      value={editModal.user.bonus_usdt}
                      onChange={(e) => setEditModal({ 
                        ...editModal, 
                        user: { ...editModal.user, bonus_usdt: e.target.value } 
                      })}
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
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