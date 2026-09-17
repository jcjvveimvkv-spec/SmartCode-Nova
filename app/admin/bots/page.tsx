'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Bot, PlusCircle, Trash2, Edit3, UploadCloud, Save,
  RefreshCw, Search, AlertCircle, CheckCircle, X,
  ChevronLeft, ChevronRight, Wallet, Plus, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// SKELETON
// ============================================================
function BotsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-white/5 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-full sm:w-28 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="h-96 rounded-2xl bg-white/5 animate-pulse" />
      <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
      <div className="h-56 rounded-2xl bg-white/5 animate-pulse" />
    </div>
  );
}

export default function AdminBotsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignedBots, setAssignedBots] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [filteredDefs, setFilteredDefs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const currentTransactions = transactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const [defForm, setDefForm] = useState({
    id: '',
    name: '',
    image_url: '',
    min_deposit: 35,
    max_deposit: 500,
    profit_percent: 5,
    duration: '2 Days',
    bonus_usdt: 0,
    is_active: true,
    trading_pairs: [] as string[],
    license_key_prefix: 'SCN'
  });

  const [pairInput, setPairInput] = useState('');

  const [assignForm, setAssignForm] = useState({
    userId: '', botName: '', invested: '', profitPercent: '5'
  });

  // Auto-dismiss banners
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const defUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_bots?select=*&order=created_at.desc`;
      const defRes = await fetch(defUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      if (defRes.ok) {
        const defData = await defRes.json();
        setDefinitions(defData || []);
        setFilteredDefs(defData || []);
      }

      const assignUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/active_bots?select=*&order=created_at.desc`;
      const assignRes = await fetch(assignUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignedBots(assignData || []);
      }

      const userUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_balances?select=user_id,email,full_name`;
      const userRes = await fetch(userUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setAllUsers(userData || []);
      }

      const txUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/active_bots?select=*&order=created_at.desc`;
      const txRes = await fetch(txUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData || []);
      }
    } catch (err: any) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDefs(definitions);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredDefs(definitions.filter(d => d.name?.toLowerCase().includes(term)));
    }
  }, [searchTerm, definitions]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `bot_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bot_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('bot_images')
        .getPublicUrl(filePath);

      setDefForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      setSuccess('Image uploaded successfully!');
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
  };

  const addPair = () => {
    if (pairInput.trim() && !defForm.trading_pairs.includes(pairInput.trim())) {
      setDefForm(prev => ({ ...prev, trading_pairs: [...prev.trading_pairs, pairInput.trim()] }));
      setPairInput('');
    }
  };

  const removePair = (index: number) => {
    setDefForm(prev => ({ ...prev, trading_pairs: prev.trading_pairs.filter((_, i) => i !== index) }));
  };

  const saveBotDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (defForm.id) {
        const { error } = await supabase
          .from('admin_bots')
          .update({
            name: defForm.name,
            image_url: defForm.image_url,
            min_deposit: defForm.min_deposit,
            max_deposit: defForm.max_deposit,
            profit_percent: defForm.profit_percent,
            duration: defForm.duration,
            bonus_usdt: defForm.bonus_usdt,
            is_active: defForm.is_active,
            trading_pairs: defForm.trading_pairs,
            license_key_prefix: defForm.license_key_prefix
          })
          .eq('id', defForm.id);
        if (error) throw error;
        setSuccess('Bot updated successfully!');
      } else {
        const { error } = await supabase
          .from('admin_bots')
          .insert({
            name: defForm.name,
            image_url: defForm.image_url,
            min_deposit: defForm.min_deposit,
            max_deposit: defForm.max_deposit,
            profit_percent: defForm.profit_percent,
            duration: defForm.duration,
            bonus_usdt: defForm.bonus_usdt,
            is_active: defForm.is_active,
            trading_pairs: defForm.trading_pairs,
            license_key_prefix: defForm.license_key_prefix
          });
        if (error) throw error;
        setSuccess('New bot created successfully!');
      }
      setDefForm({
        id: '', name: '', image_url: '', min_deposit: 35, max_deposit: 500,
        profit_percent: 5, duration: '2 Days', bonus_usdt: 0, is_active: true,
        trading_pairs: [], license_key_prefix: 'SCN'
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadBotForEdit = (bot: any) => {
    setDefForm({
      id: bot.id,
      name: bot.name,
      image_url: bot.image_url || '',
      min_deposit: bot.min_deposit,
      max_deposit: bot.max_deposit,
      profit_percent: bot.profit_percent,
      duration: bot.duration,
      bonus_usdt: bot.bonus_usdt || 0,
      is_active: bot.is_active,
      trading_pairs: bot.trading_pairs || [],
      license_key_prefix: bot.license_key_prefix || 'SCN'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBotDefinition = async (id: string) => {
    if (!confirm('Delete this bot definition?')) return;
    const { error } = await supabase.from('admin_bots').delete().eq('id', id);
    if (!error) fetchData();
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('admin_bots')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    if (!error) fetchData();
  };

  const handleAssignBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.userId || !assignForm.botName || !assignForm.invested) {
      setError('Please fill in all fields');
      return;
    }
    const invested = parseFloat(assignForm.invested);
    const profit = parseFloat(assignForm.profitPercent);
    const { error } = await supabase.from('active_bots').insert({
      user_id: assignForm.userId,
      bot_name: assignForm.botName,
      invested_usdt: invested,
      current_value_usdt: invested,
      profit_percent: profit,
      status: 'Active'
    });
    if (error) {
      setError(error.message);
    } else {
      setAssignForm({ userId: '', botName: '', invested: '', profitPercent: '5' });
      fetchData();
      setSuccess('Bot assigned to user successfully!');
    }
  };

  const deleteAssignedBot = async (id: string) => {
    if (!confirm('Delete this assigned bot?')) return;
    const { error } = await supabase.from('active_bots').delete().eq('id', id);
    if (!error) fetchData();
  };

  const resetDefForm = () => {
    setDefForm({
      id: '', name: '', image_url: '', min_deposit: 35, max_deposit: 500,
      profit_percent: 5, duration: '2 Days', bonus_usdt: 0, is_active: true,
      trading_pairs: [], license_key_prefix: 'SCN'
    });
  };

  if (loading) return <BotsSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/5 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Bot Management</h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm">Create, edit, and publish bot definitions for the store.</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#141a24] border border-white/5 rounded-lg text-xs sm:text-sm hover:bg-white/5 transition"
        >
          <RefreshCw size={16} className="shrink-0" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words flex-1">{error}</span>
            <button
              onClick={() => setError('')}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70 p-0.5"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400 text-sm"
          >
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-words flex-1">{success}</span>
            <button
              onClick={() => setSuccess('')}
              aria-label="Dismiss"
              className="shrink-0 hover:opacity-70 p-0.5"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: CREATE / EDIT */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-white/5 pb-3">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 min-w-0">
            {defForm.id ? <Edit3 size={18} className="shrink-0" /> : <PlusCircle size={18} className="shrink-0" />}
            <span className="truncate">
              {defForm.id ? 'Edit Bot Definition' : 'Create New Bot Definition'}
            </span>
          </h2>
          {defForm.id && (
            <button
              onClick={resetDefForm}
              className="text-xs sm:text-sm text-[#8e96a3] hover:text-white transition flex items-center gap-1 shrink-0"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={saveBotDefinition} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bot Name</label>
              <input
                value={defForm.name}
                onChange={(e) => setDefForm({ ...defForm, name: e.target.value })}
                className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                required
              />
            </div>

            {/* ✅ Fix: 1 col on mobile, 2 cols on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Min Deposit (USDT)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={defForm.min_deposit}
                  onChange={(e) => setDefForm({ ...defForm, min_deposit: parseFloat(e.target.value) })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Max Deposit (USDT)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={defForm.max_deposit}
                  onChange={(e) => setDefForm({ ...defForm, max_deposit: parseFloat(e.target.value) })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Profit %</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={defForm.profit_percent}
                  onChange={(e) => setDefForm({ ...defForm, profit_percent: parseFloat(e.target.value) })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Duration</label>
                <select
                  value={defForm.duration}
                  onChange={(e) => setDefForm({ ...defForm, duration: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                >
                  <option>2 Days</option>
                  <option>4 Days</option>
                  <option>7 Days</option>
                  <option>2 Weeks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bonus USDT</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={defForm.bonus_usdt}
                  onChange={(e) => setDefForm({ ...defForm, bonus_usdt: parseFloat(e.target.value) })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">License Key Prefix</label>
                <input
                  value={defForm.license_key_prefix}
                  onChange={(e) => setDefForm({ ...defForm, license_key_prefix: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Trading Pairs</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={pairInput}
                  onChange={(e) => setPairInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPair();
                    }
                  }}
                  placeholder="e.g. BTC/USDT"
                  className="flex-1 min-w-0 bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                />
                <button
                  type="button"
                  onClick={addPair}
                  className="shrink-0 px-3 py-2 bg-[#6366f1] rounded-lg text-xs font-medium text-white hover:opacity-90 transition flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {defForm.trading_pairs.map((pair, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-[#0b0e14] border border-white/5 rounded text-xs text-[#8e96a3]"
                  >
                    {pair}
                    <button
                      type="button"
                      onClick={() => removePair(idx)}
                      aria-label={`Remove ${pair}`}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle size={12} />
                    </button>
                  </span>
                ))}
                {defForm.trading_pairs.length === 0 && (
                  <span className="text-xs text-[#8e96a3]">No pairs added yet.</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={defForm.is_active}
                  onChange={(e) => setDefForm({ ...defForm, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]" />
              </label>
              <span className="text-xs sm:text-sm text-[#8e96a3]">Publish to Store</span>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="space-y-2">
            <label className="text-xs text-[#8e96a3] uppercase tracking-wider block">Bot Image</label>
            <div
              className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#6366f1]/50 transition bg-[#0b0e14] relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {defForm.image_url ? (
                <img src={defForm.image_url} alt="Bot Preview" className="w-full h-full object-contain" />
              ) : (
                <>
                  <UploadCloud className="text-[#8e96a3] mb-2" size={32} />
                  <p className="text-[#8e96a3] text-sm px-4 text-center">Click to upload bot image</p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save size={18} className="shrink-0" />
              {defForm.id ? 'Update Bot' : 'Create Bot'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: BOT DEFINITIONS */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-white/5 pb-3">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 shrink-0">
            <Bot size={18} className="shrink-0" /> Bot Definitions
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input
              type="text"
              placeholder="Search bots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {filteredDefs.length === 0 ? (
          <div className="py-8 text-center text-[#8e96a3] text-sm">
            No bot definitions created yet.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredDefs.map((d) => (
                <div key={d.id} className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-3">
                  {/* Image + name + status */}
                  <div className="flex items-start gap-3">
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#141a24] flex items-center justify-center text-[#8e96a3] shrink-0">?</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm truncate">{d.name}</p>
                      <p className="text-xs text-[#8e96a3] truncate">{d.duration}</p>
                    </div>
                    <button
                      onClick={() => togglePublish(d.id, d.is_active)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition shrink-0 ${
                        d.is_active
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-[#8e96a3]/10 text-[#8e96a3] border-[#8e96a3]/20'
                      }`}
                    >
                      {d.is_active ? 'Published' : 'Unpublished'}
                    </button>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-white/5">
                    <span className="text-[#8e96a3]">Min/Max</span>
                    <span className="text-right text-white tabular-nums">
                      {d.min_deposit}–{d.max_deposit} USDT
                    </span>
                    <span className="text-[#8e96a3]">Return</span>
                    <span className="text-right text-green-400 font-bold tabular-nums">{d.profit_percent}%</span>
                    <span className="text-[#8e96a3]">Pairs</span>
                    <span className="text-right text-gray-400 truncate">
                      {(d.trading_pairs || []).slice(0, 2).join(', ')}
                      {(d.trading_pairs || []).length > 2 ? '…' : ''}
                      {(!d.trading_pairs || d.trading_pairs.length === 0) ? '—' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => loadBotForEdit(d)}
                      className="flex-1 py-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[#6366f1] text-xs font-medium hover:bg-[#6366f1]/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => deleteBotDefinition(d.id)}
                      className="flex-1 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                  <tr>
                    <th className="px-4 py-2">Image</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Min/Max</th>
                    <th className="px-4 py-2">Return</th>
                    <th className="px-4 py-2">Duration</th>
                    <th className="px-4 py-2">Pairs</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDefs.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-2">
                        {d.image_url ? (
                          <img src={d.image_url} alt={d.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#0b0e14] flex items-center justify-center text-[#8e96a3]">?</div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium">{d.name}</td>
                      <td className="px-4 py-2 tabular-nums">{d.min_deposit} - {d.max_deposit} USDT</td>
                      <td className="px-4 py-2 text-green-400 font-bold tabular-nums">{d.profit_percent}%</td>
                      <td className="px-4 py-2">{d.duration}</td>
                      <td className="px-4 py-2 text-xs text-[#8e96a3]">
                        {(d.trading_pairs || []).slice(0, 3).join(', ')}
                        {(d.trading_pairs || []).length > 3 ? '…' : ''}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => togglePublish(d.id, d.is_active)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition ${
                            d.is_active
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                              : 'bg-[#8e96a3]/10 text-[#8e96a3] border-[#8e96a3]/20 hover:bg-[#8e96a3]/20'
                          }`}
                        >
                          {d.is_active ? 'Published' : 'Unpublished'}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadBotForEdit(d)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded text-[#6366f1] hover:bg-[#6366f1]/20 transition text-xs"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => deleteBotDefinition(d.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 transition text-xs"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* SECTION 3: TRANSACTIONS */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-white/5 pb-3">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 min-w-0">
            <Wallet size={18} className="shrink-0" /> Bot Purchase Transactions
          </h2>
          <span className="text-xs sm:text-sm text-[#8e96a3] tabular-nums shrink-0">
            Total: {transactions.length}
          </span>
        </div>

        {currentTransactions.length === 0 ? (
          <div className="py-8 text-center text-[#8e96a3] text-sm">No purchases yet.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {currentTransactions.map((tx) => (
                <div key={tx.id} className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white text-sm truncate">{tx.bot_name}</span>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] border border-green-500/20 shrink-0">
                      {tx.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-2 border-t border-white/5">
                    <span className="text-[#8e96a3]">Invested</span>
                    <span className="text-right text-green-400 font-bold tabular-nums">{tx.invested_usdt} USDT</span>
                    <span className="text-[#8e96a3]">Date</span>
                    <span className="text-right text-gray-300 tabular-nums">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[#8e96a3]">User ID</span>
                    <span className="text-right font-mono text-gray-400 text-[10px] truncate">{tx.user_id}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0b0e14] border-b border-white/5 text-[#8e96a3]">
                  <tr>
                    <th className="px-4 py-2">User ID</th>
                    <th className="px-4 py-2">Bot Name</th>
                    <th className="px-4 py-2">Invested</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-2 text-[#8e96a3] text-xs font-mono">{tx.user_id}</td>
                      <td className="px-4 py-2 font-medium">{tx.bot_name}</td>
                      <td className="px-4 py-2 font-bold text-green-400 tabular-nums">{tx.invested_usdt} USDT</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#8e96a3] text-xs tabular-nums">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center sm:justify-end items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm text-[#8e96a3] tabular-nums whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: ASSIGN BOT */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
          <PlusCircle size={20} className="shrink-0" /> Assign Bot to User
        </h2>
        <form onSubmit={handleAssignBot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <select
            value={assignForm.userId}
            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
            className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] min-w-0"
            required
          >
            <option value="">Select User</option>
            {allUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.full_name || u.email || u.user_id}
              </option>
            ))}
          </select>
          <input
            placeholder="Bot Name (e.g. Nova-1)"
            value={assignForm.botName}
            onChange={(e) => setAssignForm({ ...assignForm, botName: e.target.value })}
            className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] min-w-0"
            required
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Invested USDT"
            value={assignForm.invested}
            onChange={(e) => setAssignForm({ ...assignForm, invested: e.target.value })}
            className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums min-w-0"
            required
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Profit %"
            value={assignForm.profitPercent}
            onChange={(e) => setAssignForm({ ...assignForm, profitPercent: e.target.value })}
            className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] tabular-nums min-w-0"
            required
          />
          <button
            type="submit"
            className="bg-[#6366f1] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition lg:col-span-1 sm:col-span-2"
          >
            Assign Bot
          </button>
        </form>
      </div>
    </div>
  );
}
