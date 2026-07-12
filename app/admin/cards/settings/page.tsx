'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Save, RefreshCw, Upload, Wallet, Trash2 } from 'lucide-react';

interface CardSettings {
    id: string;
    master_credit_enabled: boolean;
    visa_debit_enabled: boolean;
    verve_debit_enabled: boolean;
    option_a_enabled: boolean;
    option_b_enabled: boolean;
    usdt_network: string;
    wallet_address: string;
    qr_code_url: string;
    master_credit_fee: number;
    visa_debit_fee: number;
    verve_debit_fee: number;
    master_credit_daily_limit: number;
    master_credit_monthly_limit: number;
    visa_debit_daily_limit: number;
    visa_debit_monthly_limit: number;
    verve_debit_daily_limit: number;
    verve_debit_monthly_limit: number;
}

const QR_OPTIONS = {
    bep20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtBEP20.jpeg',
    trc20: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/deposit/usdtTRC20.jpeg',
};

export default function AdminCardSettings() {
    const [settings, setSettings] = useState<CardSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/cards/settings');
            const data = await response.json();
            
            if (data.success) {
                setSettings(data.data);
            } else {
                toast.error('Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        
        setSaving(true);
        try {
            const response = await fetch('/api/cards/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Settings saved successfully!');
                await loadSettings();
            } else {
                toast.error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleQRCodeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/qr-code', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (data.success && settings) {
                setSettings({
                    ...settings,
                    qr_code_url: data.url,
                });
                toast.success('QR Code uploaded successfully!');
            } else {
                toast.error(data.error || 'Failed to upload QR code');
            }
        } catch (error) {
            console.error('Error uploading QR code:', error);
            toast.error('Failed to upload QR code');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleQRSelect = (type: 'bep20' | 'trc20') => {
        if (!settings) return;
        setSettings({
            ...settings,
            qr_code_url: QR_OPTIONS[type],
        });
        toast.info(`QR code set to ${type.toUpperCase()}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                    Failed to load settings
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">⚙️ Card Settings</h1>
                    <p className="text-gray-400 text-sm">Manage card types, payment options, and fees</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadSettings}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Card Availability */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">📋 Card Availability</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                        <div>
                            <p className="text-white font-medium">Master Credit Card (Premium)</p>
                            <p className="text-gray-400 text-sm">Fee: {settings.master_credit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.master_credit_enabled}
                                onChange={(e) => setSettings({ ...settings, master_credit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                        <div>
                            <p className="text-white font-medium">Visa Debit Card (Global)</p>
                            <p className="text-gray-400 text-sm">Fee: {settings.visa_debit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.visa_debit_enabled}
                                onChange={(e) => setSettings({ ...settings, visa_debit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                        <div>
                            <p className="text-white font-medium">Verve Debit Card (Regular)</p>
                            <p className="text-gray-400 text-sm">Fee: {settings.verve_debit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.verve_debit_enabled}
                                onChange={(e) => setSettings({ ...settings, verve_debit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Payment Options */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">💳 Payment Options</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                        <div>
                            <p className="text-white font-medium">Option A: Internal Payment</p>
                            <p className="text-gray-400 text-sm">Fee deducted from funding balance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.option_a_enabled}
                                onChange={(e) => setSettings({ ...settings, option_a_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0b0e14] rounded-lg">
                        <div>
                            <p className="text-white font-medium">Option B: External Payment</p>
                            <p className="text-gray-400 text-sm">Pay via USDT (TRC20/BEP20)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.option_b_enabled}
                                onChange={(e) => setSettings({ ...settings, option_b_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* External Payment Details */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    External Payment Details (Option B)
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">USDT Network</label>
                        <select
                            value={settings.usdt_network}
                            onChange={(e) => setSettings({ ...settings, usdt_network: e.target.value })}
                            className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        >
                            <option value="TRC20">TRC20</option>
                            <option value="BEP20">BEP20</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">Wallet Address</label>
                        <input
                            type="text"
                            value={settings.wallet_address || ''}
                            onChange={(e) => setSettings({ ...settings, wallet_address: e.target.value })}
                            placeholder="Enter USDT wallet address"
                            className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">QR Code</label>
                        
                        {/* Quick Select Buttons */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => handleQRSelect('trc20')}
                                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition"
                            >
                                Use TRC20 QR
                            </button>
                            <button
                                onClick={() => handleQRSelect('bep20')}
                                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition"
                            >
                                Use BEP20 QR
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition flex items-center gap-1"
                            >
                                <Upload className="w-3 h-3" />
                                Upload Custom
                            </button>
                            {settings.qr_code_url && (
                                <button
                                    onClick={() => setSettings({ ...settings, qr_code_url: '' })}
                                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Remove
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleQRCodeUpload}
                            className="hidden"
                        />

                        {/* QR Code Preview */}
                        {settings.qr_code_url && (
                            <div className="mt-2 p-4 bg-[#0b0e14] rounded-lg flex flex-col items-center">
                                <img 
                                    src={settings.qr_code_url} 
                                    alt="QR Code" 
                                    className="max-w-[200px] max-h-[200px] rounded-lg border border-white/10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <p className="text-gray-500 text-xs mt-2 break-all">{settings.qr_code_url}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Fees & Limits */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">💰 Card Fees & Limits</h2>
                
                <div className="space-y-6">
                    {/* Master Credit */}
                    <div className="border border-white/5 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3">Master Credit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.master_credit_fee}
                                    onChange={(e) => setSettings({ ...settings, master_credit_fee: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.master_credit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, master_credit_daily_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.master_credit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, master_credit_monthly_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visa Debit */}
                    <div className="border border-white/5 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3">Visa Debit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.visa_debit_fee}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_fee: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.visa_debit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_daily_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.visa_debit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_monthly_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Verve Debit */}
                    <div className="border border-white/5 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3">Verve Debit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.verve_debit_fee}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_fee: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.verve_debit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_daily_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    value={settings.verve_debit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_monthly_limit: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
}