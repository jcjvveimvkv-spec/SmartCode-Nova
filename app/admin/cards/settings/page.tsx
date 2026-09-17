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

// ✅ Safe number parsing — prevents NaN when user clears a field
const safeNum = (value: string, fallback = 0) => {
    if (value === '' || value === '-') return fallback;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
};

// ============================================================
// SKELETON
// ============================================================
function SettingsSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto overflow-x-hidden">
            <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-white/5 pb-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded bg-white/10 animate-pulse" />
                    <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 flex-1 sm:w-24 rounded-lg bg-white/5 animate-pulse" />
                    <div className="h-10 flex-1 sm:w-32 rounded-lg bg-white/5 animate-pulse" />
                </div>
            </div>
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1a2332] border border-white/5 rounded-xl p-4 sm:p-6 space-y-3">
                    <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
                    <div className="h-14 w-full rounded-lg bg-white/5 animate-pulse" />
                    <div className="h-14 w-full rounded-lg bg-white/5 animate-pulse" />
                </div>
            ))}
        </div>
    );
}

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

    if (loading) return <SettingsSkeleton />;

    if (!settings) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm break-words">
                    Failed to load settings
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto bg-[#0b0e14] text-white overflow-x-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 border-b border-white/5 pb-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 min-w-0">
                        <span className="shrink-0">⚙️</span>
                        <span className="truncate">Card Settings</span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        Manage card types, payment options, and fees
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <button
                        onClick={loadSettings}
                        className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        Refresh
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs sm:text-sm"
                    >
                        <Save className="w-4 h-4 shrink-0" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Card Availability */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">📋 Card Availability</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">Master Credit Card</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Premium · Fee: {settings.master_credit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.master_credit_enabled}
                                onChange={(e) => setSettings({ ...settings, master_credit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">Visa Debit Card</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Global · Fee: {settings.visa_debit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.visa_debit_enabled}
                                onChange={(e) => setSettings({ ...settings, visa_debit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">Verve Debit Card</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Regular · Fee: {settings.verve_debit_fee} USDT</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.verve_debit_enabled}
                                onChange={(e) => setSettings({ ...settings, verve_debit_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>
                </div>
            </div>

            {/* Payment Options */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">💳 Payment Options</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">Option A: Internal</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Fee deducted from funding balance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.option_a_enabled}
                                onChange={(e) => setSettings({ ...settings, option_a_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#0b0e14] rounded-lg">
                        <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">Option B: External</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Pay via USDT (TRC20/BEP20)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.option_b_enabled}
                                onChange={(e) => setSettings({ ...settings, option_b_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                        </label>
                    </div>
                </div>
            </div>

            {/* External Payment Details */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 shrink-0" />
                    <span className="truncate">External Payment Details</span>
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-xs sm:text-sm block mb-2">USDT Network</label>
                        <select
                            value={settings.usdt_network}
                            onChange={(e) => setSettings({ ...settings, usdt_network: e.target.value })}
                            className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        >
                            <option value="TRC20">TRC20</option>
                            <option value="BEP20">BEP20</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs sm:text-sm block mb-2">Wallet Address</label>
                        <input
                            type="text"
                            value={settings.wallet_address || ''}
                            onChange={(e) => setSettings({ ...settings, wallet_address: e.target.value })}
                            placeholder="Enter USDT wallet address"
                            className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs sm:text-sm block mb-2">QR Code</label>

                        {/* ✅ QR quick-select — 2×2 grid on mobile, flex on desktop */}
                        <div className="grid grid-cols-2 sm:flex gap-2 mb-3">
                            <button
                                onClick={() => handleQRSelect('trc20')}
                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs sm:text-sm transition text-center"
                            >
                                Use TRC20
                            </button>
                            <button
                                onClick={() => handleQRSelect('bep20')}
                                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs sm:text-sm transition text-center"
                            >
                                Use BEP20
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                    <Upload className="w-3 h-3 shrink-0" />
                                )}
                                <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                            </button>
                            {settings.qr_code_url && (
                                <button
                                    onClick={() => setSettings({ ...settings, qr_code_url: '' })}
                                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3 shrink-0" />
                                    <span>Remove</span>
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

                        {settings.qr_code_url && (
                            <div className="mt-2 p-3 sm:p-4 bg-[#0b0e14] rounded-lg flex flex-col items-center">
                                <img
                                    src={settings.qr_code_url}
                                    alt="QR Code"
                                    className="max-w-[180px] sm:max-w-[200px] max-h-[180px] sm:max-h-[200px] rounded-lg border border-white/10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <p className="text-gray-500 text-[10px] sm:text-xs mt-2 break-all text-center">{settings.qr_code_url}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Fees & Limits */}
            <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">💰 Card Fees & Limits</h2>

                <div className="space-y-4 sm:space-y-6">
                    {/* Master Credit */}
                    <div className="border border-white/5 rounded-lg p-3 sm:p-4">
                        <h3 className="text-white font-medium mb-3 text-sm sm:text-base">Master Credit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.master_credit_fee}
                                    onChange={(e) => setSettings({ ...settings, master_credit_fee: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.master_credit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, master_credit_daily_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.master_credit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, master_credit_monthly_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visa Debit */}
                    <div className="border border-white/5 rounded-lg p-3 sm:p-4">
                        <h3 className="text-white font-medium mb-3 text-sm sm:text-base">Visa Debit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.visa_debit_fee}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_fee: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.visa_debit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_daily_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.visa_debit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, visa_debit_monthly_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Verve Debit */}
                    <div className="border border-white/5 rounded-lg p-3 sm:p-4">
                        <h3 className="text-white font-medium mb-3 text-sm sm:text-base">Verve Debit Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Fee (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.verve_debit_fee}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_fee: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Daily Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.verve_debit_daily_limit}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_daily_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs sm:text-sm block mb-2">Monthly Limit (USDT)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={settings.verve_debit_monthly_limit}
                                    onChange={(e) => setSettings({ ...settings, verve_debit_monthly_limit: safeNum(e.target.value) })}
                                    className="w-full bg-[#0b0e14] text-white px-4 py-2.5 text-sm rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none tabular-nums"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-center sm:justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                >
                    <Save className="w-5 h-5 shrink-0" />
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
}
