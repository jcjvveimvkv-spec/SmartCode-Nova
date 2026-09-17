'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// ACCESS SCAN LOADER
// A HUD-style credential verification display. A horizontal
// scan bar sweeps across an ID keycard silhouette while
// verification text types out below. Ends with a green check.
// ============================================================

export default function AccessScanLoader({
  duration = 2200,
  label = 'VERIFYING',
}: {
  duration?: number;
  label?: string;
}) {
  const [progress, setProgress] = useState(0);       // 0 → 100
  const [scanY, setScanY] = useState(0);              // scan bar position
  const [statusIndex, setStatusIndex] = useState(0);
  const [granted, setGranted] = useState(false);

  const STATUS_STEPS = [
    'Establishing secure channel...',
    'Verifying credentials...',
    'Authenticating session...',
    'ACCESS GRANTED',
  ];

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const p = 100 * eased;

      setProgress(p);
      setScanY(eased); // 0 → 1, mapped to % in the render

      // Update status text based on progress
      const idx = Math.min(
        Math.floor(p / (100 / STATUS_STEPS.length)),
        STATUS_STEPS.length - 1
      );
      setStatusIndex(idx);

      if (t < 1) raf = requestAnimationFrame(tick);
      else setGranted(true);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const accentColor = granted ? '#10b981' : progress > 50 ? '#22d3ee' : '#6366f1';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#070a1a] overflow-hidden">

      {/* Radial + grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, rgba(34, 211, 238, 0.06) 0%, rgba(7, 10, 26, 1) 60%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
          <defs>
            <pattern id="access-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#access-grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md px-6"
      >

        {/* Top HUD label */}
        <div className="flex items-center justify-between mb-4 text-[10px] font-mono tracking-[0.3em]">
          <span className="text-cyan-300/60">SECURE.AUTH.SYS</span>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-cyan-400/70"
          >
            ● LIVE
          </motion.span>
        </div>

        {/* Keycard container */}
        <div className="relative rounded-2xl border border-cyan-500/20 bg-[#0a0f24] overflow-hidden"
             style={{ aspectRatio: '1.586 / 1' }}>

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/40" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/40" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/40" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/40" />

          {/* ID chip */}
          <div className="absolute top-6 left-6 w-12 h-9 rounded-md border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-3 h-2 bg-amber-400/30 rounded-sm" />
              <div className="w-3 h-2 bg-amber-400/30 rounded-sm" />
              <div className="w-3 h-2 bg-amber-400/30 rounded-sm" />
              <div className="w-3 h-2 bg-amber-400/30 rounded-sm" />
            </div>
          </div>

          {/* Generic placeholder lines (simulate blurred personal data) */}
          <div className="absolute top-20 left-6 right-6 space-y-2">
            <div className="h-2 rounded bg-cyan-500/10 w-3/4" />
            <div className="h-2 rounded bg-cyan-500/10 w-1/2" />
            <div className="h-2 rounded bg-cyan-500/10 w-2/3" />
          </div>
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="h-2 rounded bg-cyan-500/10 w-1/3" />
            <div className="h-2 rounded bg-cyan-500/10 w-1/4" />
          </div>

          {/* The scanning bar — sweeps from top to bottom */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              top: `${scanY * 100}%`,
              background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
              boxShadow: `0 0 20px 4px ${accentColor}aa`,
            }}
          />
          {/* Trailing glow under the scan line */}
          <motion.div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${scanY * 100}%`,
              height: '40px',
              transform: 'translateY(-40px)',
              background: `linear-gradient(180deg, transparent 0%, ${accentColor}15 100%)`,
            }}
          />

          {/* Bottom-right ID code */}
          <div className="absolute bottom-2 right-3 text-[8px] font-mono text-cyan-400/40 tracking-widest">
            ID ••••-••••-{String(Math.floor(progress)).padStart(3, '0')}
          </div>
        </div>

        {/* Progress bar under the card */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest mb-1.5">
            <span className="text-cyan-400/60">ACCESS LEVEL</span>
            <span style={{ color: accentColor }} className="tabular-nums">
              {String(Math.round(progress)).padStart(3, '0')}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-[#0f172a] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
            />
          </div>
        </div>

        {/* Status text */}
        <div className="mt-4 text-center min-h-[20px]">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] font-mono tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            {STATUS_STEPS[statusIndex]}
          </motion.p>
        </div>

        {/* Granted check */}
        {granted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-3 flex justify-center"
          >
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center"
                 style={{ boxShadow: '0 0 20px rgba(16,185,129,0.6)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Bottom label */}
        <div className="mt-5 text-center">
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[10px] font-mono tracking-[0.4em] text-cyan-300/60"
          >
            {label}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
