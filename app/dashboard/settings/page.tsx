'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Save, UploadCloud, 
  CheckCircle, AlertCircle, X, Send, Check, Loader2
} from 'lucide-react';
import { notifyTelegramConnected, notifyTelegramConnectedTelegram } from '@/app/lib/telegram-connect';

export default function SettingsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStepOne, setIsStepOne] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    state: '',
    telegram_username: '',
    telegram_chat_id: '',
    email_notifications: true,
    telegram_notifications: false,
    avatar_url: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data } = await supabase
        .from('user_balances')
        .select('full_name, phone, country, state, telegram_username, telegram_chat_id, email_notifications, telegram_notifications, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          country: data.country || '',
          state: data.state || '',
          telegram_username: data.telegram_username || '',
          telegram_chat_id: data.telegram_chat_id || '',
          email_notifications: data.email_notifications ?? true,
          telegram_notifications: data.telegram_notifications ?? false,
          avatar_url: data.avatar_url || ''
        });
        if (data.telegram_chat_id) {
          setIsConnected(true);
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      await supabase
        .from('user_balances')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      setSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      setError('Failed to upload image: ' + err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_balances')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          state: formData.state,
          telegram_username: formData.telegram_username,
          telegram_chat_id: formData.telegram_chat_id,
          email_notifications: formData.email_notifications,
          telegram_notifications: formData.telegram_notifications
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- TWO-STEP HANDSHAKE ---
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsStepOne(true);
  };

  const handleStepOneContinue = () => {
    // Open Telegram in a new tab
    window.open('https://t.me/SmartCodeNova_bot', '_blank');
    // Transition to Step 2 in the modal
    setIsStepOne(false);
  };

  const handleStepTwoConfirm = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // UPDATED: Direct Supabase Edge Function URL
      const response = await fetch('https://texuzrwyjecjxkrnemeg.supabase.co/functions/v1/telegram-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) throw new Error('Failed to fetch Telegram ID');

      const data = await response.json();
      if (data.chat_id) {
        // Update state and database
        setFormData(prev => ({ ...prev, telegram_chat_id: data.chat_id }));
        await supabase
          .from('user_balances')
          .update({ telegram_chat_id: data.chat_id })
          .eq('user_id', user.id);
        
        setIsConnected(true);

        // --- FIX STARTS HERE ---
        // Send Telegram Welcome Message
        const nameToUse = formData.full_name || user.email || 'User';
        await notifyTelegramConnectedTelegram(data.chat_id, nameToUse);
        
        // Send Email Confirmation
        const emailToUse = user.email || '';
        if (emailToUse) {
          await notifyTelegramConnected(emailToUse, nameToUse);
        }
        // --- FIX ENDS HERE ---

        // Close modal and show success
        setIsModalOpen(false);
        setSuccess('✅ Telegram connected successfully! Check your email and Telegram.');
      } else {
        throw new Error('No chat ID found. Please make sure you sent /start to the bot.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Telegram.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading settings...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-[#8e96a3] text-sm">Manage your profile, notifications, and preferences.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2"><CheckCircle size={18} /> {success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6 md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div 
              className="w-32 h-32 rounded-full bg-[#0b0e14] border-2 border-[#6366f1]/50 flex items-center justify-center cursor-pointer overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-[#8e96a3]" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <UploadCloud size={24} className="text-white" />
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <h2 className="text-lg font-bold mt-4">{formData.full_name || 'User'}</h2>
            <p className="text-[#8e96a3] text-sm">Click the avatar to upload a new photo.</p>
          </div>
        </div>

        <div className="bg-[#141a24] border border-white/5 rounded-2xl p-6 md:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#8e96a3] uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Full Name</label>
                <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Phone Number</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">Country</label>
                <input name="country" value={formData.country} onChange={handleChange} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-[#8e96a3] uppercase tracking-wider block mb-1">State</label>
                <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-[#0b0e14] border border-white/5 rounded-lg p-2 text-white" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="text-sm font-bold text-[#8e96a3] uppercase tracking-wider mb-3">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-sm">Telegram Username</p>
                  <p className="text-xs text-[#8e96a3]">Your display name for SmartCodeNova</p>
                </div>
                <input name="telegram_username" value={formData.telegram_username} onChange={handleChange} placeholder="@username" className="bg-[#141a24] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white w-40 text-right" />
              </div>

              {/* NEW TELEGRAM CONNECT CARD */}
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-[#0b0e14] border-white/5'}`}>
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    Telegram Connection
                    {isConnected && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Connected</span>}
                  </p>
                  <p className="text-xs text-[#8e96a3]">Receive real-time alerts on your Telegram account.</p>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={18} /> Connected
                  </div>
                ) : (
                  <button 
                    onClick={handleOpenModal}
                    className="px-4 py-2 bg-[#6366f1] rounded-lg text-sm font-medium text-white hover:opacity-90 transition flex items-center gap-2"
                  >
                    <Send size={14} /> Connect
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-[#8e96a3]">Receive trade & deposit updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="email_notifications" checked={formData.email_notifications} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-sm">Telegram Notifications</p>
                  <p className="text-xs text-[#8e96a3]">Receive trade & deposit updates via Telegram</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="telegram_notifications" checked={formData.telegram_notifications} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                </label>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><Save size={18} /> Save Settings</>}
          </button>
        </div>
      </div>

      {/* --- TELEGRAM CONNECT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#141a24] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#1a1a4e] to-[#0b0e14] p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {isSyncing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#6366f1]" />
                  ) : (
                    <Send size={20} className="text-[#6366f1]" />
                  )}
                  {isSyncing ? 'Syncing...' : 'Connect Telegram'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#8e96a3] hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {isStepOne ? (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#6366f1]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#6366f1]/30">
                        <Send className="text-[#6366f1] w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Step 1: Open Telegram</h3>
                      <p className="text-[#8e96a3] text-sm">
                        Click the button below to open @SmartCodeNova_bot on Telegram.
                        Once opened, send <span className="bg-[#0b0e14] px-2 py-0.5 rounded border border-white/5 font-mono text-[#f59e0b]">/start</span>.
                      </p>
                    </div>
                    <button 
                      onClick={handleStepOneContinue}
                      className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition"
                    >
                      Open Telegram & Continue
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                        <Check className="text-green-400 w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Step 2: Confirm Action</h3>
                      <p className="text-[#8e96a3] text-sm">
                        Have you sent <span className="bg-[#0b0e14] px-2 py-0.5 rounded border border-white/5 font-mono text-[#f59e0b]">/start</span> 
                        to @SmartCodeNova_bot on Telegram?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsStepOne(true)}
                        className="flex-1 py-3 bg-[#0b0e14] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleStepTwoConfirm}
                        disabled={isSyncing}
                        className="flex-1 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                      >
                        {isSyncing ? 'Verifying...' : 'Confirm & Connect'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}