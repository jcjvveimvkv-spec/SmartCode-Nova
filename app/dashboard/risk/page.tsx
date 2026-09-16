'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Shield,
    AlertTriangle,
    Save,
    Sliders,
    TrendingUp,
    RotateCcw,
    Check,
    Minus,
    Plus,
    Info,
    Loader2,
} from 'lucide-react';

// ============================================================
// TYPES & CONSTANTS
// ============================================================
interface RiskSettings {
    stopLoss: number;
    takeProfit: number;
    maxTradeSize: number;
}

const DEFAULTS: RiskSettings = {
    stopLoss: 10,
    takeProfit: 20,
    maxTradeSize: 500,
};

const RANGES = {
    stopLoss: { min: 0, max: 50, step: 1, unit: '%', label: 'Stop Loss Limit', color: 'red' },
    takeProfit: { min: 0, max: 100, step: 1, unit: '%', label: 'Take Profit Target', color: 'green' },
    maxTradeSize: { min: 50, max: 5000, step: 50, unit: 'USDT', label: 'Max Trade Size', color: 'yellow' },
} as const;

// ============================================================
// SAFE PARSE — handles null, missing keys, wrong types
// ============================================================
function normalizeSettings(raw: any): RiskSettings {
    if (!raw || typeof raw !== 'object') return DEFAULTS;
    const num = (v: any, fallback: number) =>
        typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    return {
        stopLoss: num(raw.stopLoss, DEFAULTS.stopLoss),
        takeProfit: num(raw.takeProfit, DEFAULTS.takeProfit),
        maxTradeSize: num(raw.maxTradeSize, DEFAULTS.maxTradeSize),
    };
}

// ============================================================
// SLIDER ROW
// ============================================================
function SliderRow({
    value,
    onChange,
    config,
}: {
    value: number;
    onChange: (v: number) => void;
    config: (typeof RANGES)[keyof typeof RANGES];
}) {
    const { min, max, step, unit, color } = config;

    const accentMap: Record<string, string> = {
        red: 'accent-red-500',
        green: 'accent-green-500',
        yellow: 'accent-yellow-500',
    };

    const textMap: Record<string, string> = {
        red: 'text-red-400',
        green: 'text-green-400',
        yellow: 'text-yellow-400',
    };

    const clamp = (n: number) => Math.max(min, Math.min(max, n));

    const handleStep = (delta: number) => onChange(clamp(value + delta));

    const handleInput = (raw: string) => {
        if (raw === '') {
            onChange(min);
            return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        onChange(clamp(n));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`flex-1 h-2 bg-[#0b0e14] rounded-lg appearance-none cursor-pointer touch-manipulation ${accentMap[color]}`}
                />
                <span className={`text-lg sm:text-xl font-bold tabular-nums min-w-[60px] sm:min-w-[80px] text-right ${textMap[color]}`}>
                    {value}{unit === '%' ? '%' : ''}
                </span>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 tabular-nums px-1">
                <span>{min}{unit === '%' ? '%' : ''}</span>
                <span>{max}{unit === '%' ? '%' : ''}</span>
            </div>

            <div className="flex items-stretch gap-2">
                <button
                    type="button"
                    onClick={() => handleStep(-step)}
                    disabled={value <= min}
                    aria-label={`Decrease ${config.label}`}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#0b0e14] border border-white/5 text-white flex items-center justify-center hover:bg-white/5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Minus size={16} />
                </button>

                <div className="relative flex-1 min-w-0">
                    <input
                        type="number"
                        inputMode="numeric"
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        onChange={(e) => handleInput(e.target.value)}
                        className="w-full h-11 bg-[#0b0e14] border border-white/5 rounded-xl px-3 pr-16 text-white font-bold text-center focus:border-[#6366f1] focus:outline-none transition tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-500 pointer-events-none">
                        {unit}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => handleStep(step)}
                    disabled={value >= max}
                    aria-label={`Increase ${config.label}`}
                    className="w-11 h-11 shrink-0 rounded-xl bg-[#0b0e14] border border-white/5 text-white flex items-center justify-center hover:bg-white/5 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
}

// ============================================================
// PAGE
// ============================================================
export default function RiskControlsPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [stopLoss, setStopLoss] = useState(DEFAULTS.stopLoss);
    const [takeProfit, setTakeProfit] = useState(DEFAULTS.takeProfit);
    const [maxTradeSize, setMaxTradeSize] = useState(DEFAULTS.maxTradeSize);

    const [savedState, setSavedState] = useState<RiskSettings>(DEFAULTS);
    const [justSaved, setJustSaved] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load settings from Supabase on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push('/auth/login');
                    return;
                }

                setUserId(user.id);

                const { data, error } = await supabase
                    .from('user_balances')
                    .select('risk_settings')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    // Column might not exist yet, or RLS — fall back to defaults
                    console.warn('Failed to load risk settings:', error.message);
                    setLoading(false);
                    return;
                }

                const loaded = normalizeSettings(data?.risk_settings);
                setStopLoss(loaded.stopLoss);
                setTakeProfit(loaded.takeProfit);
                setMaxTradeSize(loaded.maxTradeSize);
                setSavedState(loaded);
            } catch (err) {
                console.warn('Unexpected error loading risk settings:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [supabase, router]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const current: RiskSettings = { stopLoss, takeProfit, maxTradeSize };

    const isDirty =
        current.stopLoss !== savedState.stopLoss ||
        current.takeProfit !== savedState.takeProfit ||
        current.maxTradeSize !== savedState.maxTradeSize;

    const handleSave = async () => {
        if (!isDirty || saving || !userId) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('user_balances')
                .update({ risk_settings: current })
                .eq('user_id', userId);

            if (error) throw error;

            setSavedState(current);
            setJustSaved(true);
            toast.success('Risk settings saved');

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setJustSaved(false), 2000);
        } catch (err: any) {
            console.error('Save error:', err);
            toast.error(err?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setStopLoss(DEFAULTS.stopLoss);
        setTakeProfit(DEFAULTS.takeProfit);
        setMaxTradeSize(DEFAULTS.maxTradeSize);
    };

    const preview = useMemo(() => {
        const sample = maxTradeSize;
        return {
            maxLoss: ((stopLoss / 100) * sample).toFixed(2),
            maxGain: ((takeProfit / 100) * sample).toFixed(2),
            sampleSize: sample,
        };
    }, [stopLoss, takeProfit, maxTradeSize]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 w-full bg-[#0b0e14] text-white overflow-x-hidden">
                <div className="border-b border-white/5 pb-4">
                    <div className="h-7 w-48 rounded bg-white/5 animate-pulse mb-2" />
                    <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
                </div>
                <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4 ${i === 2 ? 'md:col-span-2' : ''}`}
                        >
                            <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
                            <div className="h-3 w-64 rounded bg-white/5 animate-pulse" />
                            <div className="h-2 w-full rounded bg-white/10 animate-pulse" />
                            <div className="h-11 w-full rounded-xl bg-white/5 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full bg-[#0b0e14] text-white overflow-x-hidden">

            {/* Header */}
            <div className="border-b border-white/5 pb-4">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-[#6366f1] shrink-0" size={22} />
                    Risk Controls
                </h1>
                <p className="text-[#8e96a3] text-xs sm:text-sm mt-1">
                    Configure your automated trading limits.
                </p>
            </div>

            {/* Live preview */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#1a1a4e] via-[#141a24] to-[#0b0e14] rounded-2xl border border-white/5 p-4 sm:p-6"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Info size={16} className="text-[#6366f1] shrink-0" />
                    <p className="text-xs sm:text-sm font-medium text-[#8e96a3]">
                        Impact on a <span className="text-white font-bold">${preview.sampleSize.toLocaleString()} USDT</span> trade
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider mb-1">
                            Max Loss
                        </p>
                        <p className="text-base sm:text-2xl font-bold text-red-400 tabular-nums truncate">
                            −${preview.maxLoss}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-[#8e96a3] uppercase tracking-wider mb-1">
                            Max Gain
                        </p>
                        <p className="text-base sm:text-2xl font-bold text-green-400 tabular-nums truncate">
                            +${preview.maxGain}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="text-red-400 shrink-0" size={20} />
                        <h2 className="text-base sm:text-lg font-bold">{RANGES.stopLoss.label}</h2>
                    </div>
                    <p className="text-[#8e96a3] text-xs sm:text-sm mb-4">
                        The maximum % loss allowed per trade before auto-closing.
                    </p>
                    <SliderRow value={stopLoss} onChange={setStopLoss} config={RANGES.stopLoss} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="text-green-400 shrink-0" size={20} />
                        <h2 className="text-base sm:text-lg font-bold">{RANGES.takeProfit.label}</h2>
                    </div>
                    <p className="text-[#8e96a3] text-xs sm:text-sm mb-4">
                        The target % profit at which the bot automatically closes a trade.
                    </p>
                    <SliderRow value={takeProfit} onChange={setTakeProfit} config={RANGES.takeProfit} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-[#141a24] border border-white/5 rounded-2xl p-4 sm:p-6 md:col-span-2"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Sliders className="text-yellow-400 shrink-0" size={20} />
                        <h2 className="text-base sm:text-lg font-bold">{RANGES.maxTradeSize.label}</h2>
                    </div>
                    <p className="text-[#8e96a3] text-xs sm:text-sm mb-4">
                        The maximum USDT amount a single trade can execute.
                    </p>
                    <SliderRow value={maxTradeSize} onChange={setMaxTradeSize} config={RANGES.maxTradeSize} />
                </motion.div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                    onClick={handleReset}
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-3 bg-[#141a24] border border-white/5 rounded-xl font-bold text-white hover:bg-white/5 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                    <RotateCcw size={16} />
                    Reset to Defaults
                </button>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving || justSaved}
                    className={`w-full sm:flex-1 px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm ${
                        justSaved
                            ? 'bg-green-500 text-white'
                            : isDirty
                            ? 'bg-[#6366f1] hover:opacity-90 text-white'
                            : 'bg-[#141a24] border border-white/5 text-[#8e96a3] cursor-not-allowed'
                    }`}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {saving ? (
                            <motion.span
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Loader2 size={18} className="animate-spin" />
                                Saving…
                            </motion.span>
                        ) : justSaved ? (
                            <motion.span
                                key="saved"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Check size={18} />
                                Saved
                            </motion.span>
                        ) : (
                            <motion.span
                                key="save"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Save size={18} />
                                {isDirty ? 'Save Risk Settings' : 'All Changes Saved'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
}
