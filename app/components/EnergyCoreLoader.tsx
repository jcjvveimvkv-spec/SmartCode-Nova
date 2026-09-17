'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// ENERGY CORE LOADER
// A sci-fi HUD-style loading gate. The core charges from 0% to 100%
// while orbiting particles circle the ring and the color shifts
// from red → amber → mint → cyan as energy rises.
// ============================================================

const SIZE = 260;                    // SVG viewBox size
const CENTER = SIZE / 2;             // 130
const RING_RADIUS = 100;             // main ring radius
const TICK_COUNT = 60;               // number of tick marks around the ring
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function EnergyCoreLoader({
  duration = 2400,
  label = 'LOADING',
}: {
  duration?: number;
  label?: string;
}) {
  const [energy, setEnergy] = useState(0);     // 0 → 100 (was 100 → 0)
  const [charged, setCharged] = useState(false);

  // Charge animation — easeInOut over `duration` ms
  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeInOutCubic so the charge feels intentional, not linear
      const eased =
        t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setEnergy(100 * eased);                    // was: 100 * (1 - eased)
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCharged(true);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // Color temperature shifts as energy RISES now
  const getColor = (e: number) => {
    if (e > 85) return '#22d3ee';   // cyan — near full
    if (e > 65) return '#10b981';   // mint
    if (e > 35) return '#f59e0b';   // amber
    return '#ef4444';               // red — near empty
  };

  const color = getColor(energy);
  const arcLength = (energy / 100) * CIRCUMFERENCE;
  const dash = `${arcLength} ${CIRCUMFERENCE - arcLength}`;

  // Position of the endpoint comet — at the tip of the arc
  const angle = (energy / 100) * 360 - 90; // degrees
  const endpointX = CENTER + RING_RADIUS * Math.cos((angle * Math.PI) / 180);
  const endpointY = CENTER + RING_RADIUS * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0a2a] overflow-hidden">

      {/* Radial grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, rgba(34, 211, 238, 0.08) 0%, rgba(10, 10, 42, 1) 65%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]">
          <defs>
            <pattern id="core-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#core-grid)" />
        </svg>
      </div>

      {/* HUD container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-4"
      >
        {/* Top label */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-mono tracking-[0.4em] text-cyan-300/70">
            ENERGY CORE
          </p>
          <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-cyan-400/40 mt-0.5">
            v2.0 · AI ENGINE
          </p>
        </div>

        {/* Core HUD */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>

          {/* Orbiting particles */}
          {[0, 1, 2].map((ringIdx) => (
            <motion.div
              key={`orbit-${ringIdx}`}
              className="absolute inset-0"
              animate={{ rotate: ringIdx % 2 === 0 ? 360 : -360 }}
              transition={{
                duration: 8 + ringIdx * 4,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ originX: '50%', originY: '50%' }}
            >
              {Array.from({ length: 3 }).map((_, i) => {
                const r = RING_RADIUS + 18 + ringIdx * 8;
                const a = (i / 3) * 360;
                const x = CENTER + r * Math.cos((a * Math.PI) / 180);
                const y = CENTER + r * Math.sin((a * Math.PI) / 180);
                return (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      left: x,
                      top: y,
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}`,
                      opacity: 0.6 - ringIdx * 0.15,
                    }}
                    animate={{ opacity: [0.2, 0.7, 0.2] }}
                    transition={{
                      duration: 2 + ringIdx,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                );
              })}
            </motion.div>
          ))}

          {/* Main SVG */}
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="absolute inset-0 w-full h-full -rotate-90"
            style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="#0f172a"
              strokeWidth="10"
            />

            {/* Tick marks */}
            {Array.from({ length: TICK_COUNT }).map((_, i) => {
              const tickAngle = (i / TICK_COUNT) * 360;
              const isLit = (i / TICK_COUNT) * 100 <= energy;
              const r1 = RING_RADIUS + 14;
              const r2 = RING_RADIUS + (isLit ? 22 : 18);
              const x1 = CENTER + r1 * Math.cos((tickAngle * Math.PI) / 180);
              const y1 = CENTER + r1 * Math.sin((tickAngle * Math.PI) / 180);
              const x2 = CENTER + r2 * Math.cos((tickAngle * Math.PI) / 180);
              const y2 = CENTER + r2 * Math.sin((tickAngle * Math.PI) / 180);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isLit ? color : '#1e293b'}
                  strokeWidth={isLit ? 1.5 : 1}
                  strokeLinecap="round"
                  opacity={isLit ? 0.9 : 0.4}
                  style={{
                    transition: 'stroke 0.3s ease, opacity 0.3s ease',
                  }}
                />
              );
            })}

            {/* Progress arc */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={dash}
              style={{
                transition: 'stroke 0.3s ease',
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />

            {/* Endpoint comet */}
            <motion.circle
              cx={endpointX}
              cy={endpointY}
              r="7"
              fill={color}
              animate={{ r: [6, 8, 6], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: `drop-shadow(0 0 10px ${color})` }}
            />

            {/* Outer halo */}
            <motion.circle
              cx={endpointX}
              cy={endpointY}
              r="14"
              fill="none"
              stroke={color}
              strokeWidth="1"
              animate={{ r: [10, 18, 10], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          </svg>

          {/* Center core readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* ✅ CHANGED: "ENERGY LEVEL" → "AI TRADING ENERGY LEVEL" */}
            <p className="text-[9px] font-mono tracking-[0.3em] text-cyan-400/50">
              AI TRADING ENERGY LEVEL
            </p>
            <p
              className="text-5xl font-bold tabular-nums mt-1"
              style={{
                color,
                textShadow: `0 0 20px ${color}80, 0 0 40px ${color}40`,
                transition: 'color 0.3s ease',
              }}
            >
              {Math.round(energy)}
            </p>
            <p className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/60 mt-0.5">
              %
            </p>
            {/* ✅ CHANGED: status now describes charging, not draining */}
            <p className="text-[9px] font-mono tracking-[0.25em] text-cyan-300/40 mt-2">
              {charged ? 'CORE CHARGED' : energy < 10 ? 'INITIALIZING' : 'CHARGING CORE'}
            </p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="text-center">
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[10px] sm:text-xs font-mono tracking-[0.4em] text-cyan-300/70"
          >
            {label}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
