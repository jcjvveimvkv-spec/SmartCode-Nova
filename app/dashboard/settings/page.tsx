'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Bell, Save, UploadCloud, 
  CheckCircle, AlertCircle, X 
} from 'lucide-react';

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

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    state: '',
    telegram_username: '',
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
        .select('full_name, phone, country, state, telegram_username, email_notifications, telegram_notifications, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          country: data.country || '',
          state: data.state || '',
          telegram_username: data.telegram_username || '',
          email_notifications: data.email_notifications ?? true,
          telegram_notifications: data.telegram_notifications ?? false,
          avatar_url: data.avatar_url || ''
        });
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

  if (loading) return <div className="flex justify-center items-center h-[400px] text-white">Loading settings...</div>;

  return (
    <div className="p-6 bg-[#0b0e14] text-white space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-[#8e96a3] text-sm">Manage your profile, notifications, and preferences.</p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2"><CheckCircle size={18} /> {success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card */}
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
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <h2 className="text-lg font-bold mt-4">{formData.full_name || 'User'}</h2>
            <p className="text-[#8e96a3] text-sm">Click the avatar to upload a new photo.</p>
          </div>
        </div>

        {/* Settings Form */}
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
                  <p className="text-xs text-[#8e96a3]">Receive updates via Telegram (enter your @username)</p>
                </div>
                <input 
                  name="telegram_username" 
                  value={formData.telegram_username} 
                  onChange={handleChange}
                  placeholder="@username"
                  className="bg-[#141a24] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white w-40 text-right"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-[#8e96a3]">Receive trade & deposit updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="email_notifications" 
                    checked={formData.email_notifications} 
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-sm">Telegram Notifications</p>
                  <p className="text-xs text-[#8e96a3]">Receive trade & deposit updates via Telegram</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="telegram_notifications" 
                    checked={formData.telegram_notifications} 
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#2a2a4a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366f1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                </label>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><Save size={18} /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}