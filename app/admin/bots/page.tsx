'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Bot, PlusCircle, Trash2, Edit3, UploadCloud, Save, 
  RefreshCw, Search, AlertCircle, CheckCircle, X, 
  ChevronLeft, ChevronRight, Wallet, Plus, XCircle 
} from 'lucide-react';

export default function AdminBotsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data States
  const [assignedBots, setAssignedBots] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [filteredDefs, setFilteredDefs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const currentTransactions = transactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Form States for Bot Definition
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

  // Pair Input State
  const [pairInput, setPairInput] = useState('');

  // Form States for Bot Assignment
  const [assignForm, setAssignForm] = useState({
    userId: '', botName: '', invested: '', profitPercent: '5'
  });

  // --- FETCH ALL DATA ---
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const defUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_bots?select=*&order=created_at.desc`;
      const defRes = await fetch(defUrl, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` }
      });
      if (defRes.ok) {
        const defData = await defRes.json();
        setDefinitions(defData || []);
        setFilteredDefs(defData || []);
      }

      const assignUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/active_bots?select=*&order=created_at.desc`;
      const assignRes = await fetch(assignUrl, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` }
      });
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignedBots(assignData || []);
      }

      const userUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_balances?select=user_id,email,full_name`;
      const userRes = await fetch(userUrl, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setAllUsers(userData || []);
      }

      const txUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/active_bots?select=*&order=created_at.desc`;
      const txRes = await fetch(txUrl, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` }
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
  }, [supabase, router]);

  // Search Filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDefs(definitions);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredDefs(definitions.filter(d => d.name?.toLowerCase().includes(term)));
    }
  }, [searchTerm, definitions]);

  // --- BOT DEFINITION CRUD ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `bot_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // FIX: Explicitly set the content type and upsert
      const { error: uploadError } = await supabase.storage
        .from('bot_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type // Force the correct MIME type
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

  // --- ASSIGN BOT TO USER ---

  const handleAssignBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.userId || !assignForm.botName || !assignForm.invested) return alert('Please fill in all fields');
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

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading bots...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Bot Management</h1>
          <p className="text-[#8e96a3] text-sm">Create, edit, and publish bot definitions for the store.</p>
        </div>
        <button onClick={() => fetchData()} className="flex items-center gap-2 px-4 py-2 bg-[#141a24] border border-white/5 rounded-lg text-sm hover:bg-white/5 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400"><CheckCircle size={18} /> {success}</div>}

      {/* --- SECTION 1: CREATE / EDIT BOT DEFINITION --- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {defForm.id ? <Edit3 size={18} /> : <PlusCircle size={18} />}
            {defForm.id ? 'Edit Bot Definition' : 'Create New Bot Definition'}
          </h2>
          {defForm.id && (
            <button onClick={() => setDefForm({
              id: '', name: '', image_url: '', min_deposit: 35, max_deposit: 500,
              profit_percent: 5, duration: '2 Days', bonus_usdt: 0, is_active: true,
              trading_pairs: [], license_key_prefix: 'SCN'
            })} className="text-sm text-[#8e96a3] hover:text-white transition flex items-center gap-1">
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={saveBotDefinition} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bot Name</label>
              <input value={defForm.name} onChange={(e) => setDefForm({...defForm, name: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Min Deposit (USDT)</label>
                <input type="number" value={defForm.min_deposit} onChange={(e) => setDefForm({...defForm, min_deposit: parseFloat(e.target.value)})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Max Deposit (USDT)</label>
                <input type="number" value={defForm.max_deposit} onChange={(e) => setDefForm({...defForm, max_deposit: parseFloat(e.target.value)})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Profit %</label>
                <input type="number" value={defForm.profit_percent} onChange={(e) => setDefForm({...defForm, profit_percent: parseFloat(e.target.value)})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" required />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Duration</label>
                <select value={defForm.duration} onChange={(e) => setDefForm({...defForm, duration: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white">
                  <option>2 Days</option>
                  <option>4 Days</option>
                  <option>7 Days</option>
                  <option>2 Weeks</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bonus USDT</label>
                <input type="number" value={defForm.bonus_usdt} onChange={(e) => setDefForm({...defForm, bonus_usdt: parseFloat(e.target.value)})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">License Key Prefix</label>
                <input value={defForm.license_key_prefix} onChange={(e) => setDefForm({...defForm, license_key_prefix: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Trading Pairs</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={pairInput} 
                  onChange={(e) => setPairInput(e.target.value)} 
                  placeholder="e.g. BTC/USDT" 
                  className="flex-1 bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white" 
                />
                <button type="button" onClick={addPair} className="px-3 py-1.5 bg-[#6366f1] rounded-lg text-xs font-medium text-white hover:opacity-90 transition">
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {defForm.trading_pairs.map((pair, idx) => (
                  <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-[#0b0e14] border border-white/5 rounded text-xs text-[#8e96a3]">
                    {pair}
                    <button type="button" onClick={() => removePair(idx)} className="text-red-400 hover:text-red-300">
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
                <input type="checkbox" checked={defForm.is_active} onChange={(e) => setDefForm({...defForm, is_active: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
              </label>
              <span className="text-sm text-[#8e96a3]">Publish to Store</span>
            </div>
          </div>

          {/* Right Column: Image Uploader */}
          <div className="space-y-4">
            <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Bot Image</label>
            <div 
              className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#6366f1]/50 transition bg-[#0b0e14] relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {defForm.image_url ? (
                <img src={defForm.image_url} alt="Bot Preview" className="w-full h-full object-contain" />
              ) : (
                <>
                  <UploadCloud className="text-[#8e96a3] mb-2" size={32} />
                  <p className="text-[#8e96a3] text-sm">Click to upload bot image</p>
                </>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2">
              <Save size={18} /> {defForm.id ? 'Update Bot' : 'Create Bot'}
            </button>
          </div>
        </form>
      </div>

      {/* --- SECTION 2: EXISTING BOT DEFINITIONS --- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Bot size={18} /> Bot Definitions</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e96a3] w-4 h-4" />
            <input type="text" placeholder="Search bots..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white" />
          </div>
        </div>
        <div className="overflow-x-auto">
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
              {filteredDefs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[#8e96a3]">No bot definitions created yet.</td></tr>
              ) : (
                filteredDefs.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-2">
                      {d.image_url ? (
                        <img src={d.image_url} alt={d.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#0b0e14] flex items-center justify-center text-[#8e96a3]">?</div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{d.name}</td>
                    <td className="px-4 py-2">{d.min_deposit} - {d.max_deposit} USDT</td>
                    <td className="px-4 py-2 text-green-400 font-bold">{d.profit_percent}%</td>
                    <td className="px-4 py-2">{d.duration}</td>
                    <td className="px-4 py-2 text-xs text-[#8e96a3]">{(d.trading_pairs || []).slice(0, 3).join(', ')}{(d.trading_pairs || []).length > 3 ? '...' : ''}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => togglePublish(d.id, d.is_active)} className={`px-2 py-0.5 rounded-full text-xs font-medium border transition ${d.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-[#8e96a3]/10 text-[#8e96a3] border-[#8e96a3]/20 hover:bg-[#8e96a3]/20'}`}>
                        {d.is_active ? 'Published' : 'Unpublished'}
                      </button>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => loadBotForEdit(d)} className="flex items-center gap-1 px-2 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded text-[#6366f1] hover:bg-[#6366f1]/20 transition text-xs">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => deleteBotDefinition(d.id)} className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 transition text-xs">
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SECTION 3: BOT PURCHASE TRANSACTIONS --- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Wallet size={18} /> Bot Purchase Transactions</h2>
          <span className="text-sm text-[#8e96a3]">Total: {transactions.length}</span>
        </div>
        <div className="overflow-x-auto">
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
              {currentTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#8e96a3]">No purchases yet.</td></tr>
              ) : (
                currentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-2 text-[#8e96a3] text-xs">{tx.user_id}</td>
                    <td className="px-4 py-2 font-medium">{tx.bot_name}</td>
                    <td className="px-4 py-2 font-bold text-green-400">{tx.invested_usdt} USDT</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">{tx.status}</span>
                    </td>
                    <td className="px-4 py-2 text-[#8e96a3] text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-[#8e96a3]">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 bg-[#141a24] rounded-lg border border-white/5 hover:bg-white/5 transition disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* --- SECTION 4: ASSIGN BOT TO USER --- */}
      <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} /> Assign Bot to User</h2>
        <form onSubmit={handleAssignBot} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select value={assignForm.userId} onChange={(e) => setAssignForm({...assignForm, userId: e.target.value})} className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white" required>
            <option value="">Select User</option>
            {allUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.full_name || u.email || u.user_id}</option>
            ))}
          </select>
          <input placeholder="Bot Name (e.g. Nova-1)" value={assignForm.botName} onChange={(e) => setAssignForm({...assignForm, botName: e.target.value})} className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white" required />
          <input type="number" placeholder="Invested USDT" value={assignForm.invested} onChange={(e) => setAssignForm({...assignForm, invested: e.target.value})} className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white" required />
          <input type="number" placeholder="Profit %" value={assignForm.profitPercent} onChange={(e) => setAssignForm({...assignForm, profitPercent: e.target.value})} className="bg-[#0b0e14] border border-white/5 rounded-lg px-4 py-2 text-white" required />
          <button type="submit" className="bg-[#6366f1] text-white rounded-lg px-4 py-2 font-medium hover:opacity-90 transition">Assign Bot</button>
        </form>
      </div>
    </div>
  );
}