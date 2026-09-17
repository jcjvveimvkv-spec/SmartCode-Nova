'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// NEURAL LINK LOADER
// A central AI node connects outward to N satellite bot nodes
// via light beams. Beams draw one-by-one, then the whole
// network pulses alive. Ends with a "BOTS ONLINE" count.
// ============================================================

const CANVAS = 320;
const CENTER = CANVAS / 2;
const HUB_RADIUS = 22;
const SATELLITE_RADIUS = 7;
const ORBIT_R = 120;

const BOT_COUNT = 10;

export default function NeuralLinkLoader({
  duration = 2600,
  label = 'CONNECTING',
  botCount = BOT_COUNT,
}: {
  duration?: number;
  label?: string;
  botCount?: number;
}) {
  const [progress, setProgress] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [allConnected, setAllConnected] = useState(false);

  // Pre-compute satellite positions
  const satellites = Array.from({ length: botCount }).map((_, i) => {
    const angle = (i / botCount) * 360 - 90; // start at top
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      angle,
      x: CENTER + ORBIT_R * Math.cos(rad),
      y: CENTER + ORBIT_R * Math.sin(rad),
    };
  });

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const p = 100 * eased;

      setProgress(p);
      setConnectedCount(Math.floor((p / 100) * botCount));

      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setConnectedCount(botCount);
        setAllConnected(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, botCount]);

  const isNodeConnected = (i: number) => i < connectedCount;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050a18] overflow-hidden">

      {/* Radial + grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, rgba(5, 10, 24, 1) 65%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
          <defs>
            <pattern id="neural-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-4"
      >

        {/* Top label */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-mono tracking-[0.4em] text-blue-300/70">
            NEURAL LINK
          </p>
          <p className="text-[9px] font-mono tracking-[0.3em] text-blue-400/40 mt-0.5">
            AI BOT NETWORK · v1.0
          </p>
        </div>

        {/* SVG network */}
        <div className="relative" style={{ width: CANVAS, height: CANVAS }}>

          {/* Rotating outer ring */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} className="w-full h-full">
              <circle
                cx={CENTER}
                cy={CENTER}
                r={ORBIT_R + 30}
                fill="none"
                stroke="#3b82f6"
                strokeOpacity="0.15"
                strokeWidth="1"
                strokeDasharray="3 6"
              />
            </svg>
          </motion.div>

          {/* Counter-rotating middle ring */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} className="w-full h-full">
              <circle
                cx={CENTER}
                cy={CENTER}
                r={ORBIT_R + 14}
                fill="none"
                stroke="#6366f1"
                strokeOpacity="0.12"
                strokeWidth="1"
                strokeDasharray="2 8"
              />
            </svg>
          </motion.div>

          {/* Main static SVG — nodes and beams */}
          <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} className="absolute inset-0 w-full h-full">

            {/* Beams from hub to each satellite */}
            {satellites.map((sat, i) => {
              const connected = isNodeConnected(i);
              return (
                <motion.line
                  key={`beam-${i}`}
                  x1={CENTER}
                  y1={CENTER}
                  x2={sat.x}
                  y2={sat.y}
                  stroke={connected ? '#10b981' : '#1e293b'}
                  strokeWidth={connected ? 1.5 : 1}
                  strokeOpacity={connected ? 0.7 : 0.3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: connected ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              );
            })}

            {/* Traveling pulse on each connected beam */}
            {satellites.map((sat, i) => {
              const connected = isNodeConnected(i);
              if (!connected) return null;
              return (
                <motion.circle
                  key={`pulse-${i}`}
                  r="2"
                  fill="#10b981"
                  initial={{ cx: CENTER, cy: CENTER, opacity: 1 }}
                  animate={{
                    cx: [CENTER, sat.x],
                    cy: [CENTER, sat.y],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    delay: i * 0.1,
                    ease: 'easeOut',
                  }}
                  style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
                />
              );
            })}

            {/* Hub — central AI node */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={HUB_RADIUS + 8}
              fill="none"
              stroke={allConnected ? '#10b981' : '#3b82f6'}
              strokeOpacity="0.3"
              strokeWidth="1"
              style={{ transition: 'stroke 0.4s ease' }}
            />
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={HUB_RADIUS}
              fill={allConnected ? '#10b98120' : '#3b82f620'}
              stroke={allConnected ? '#10b981' : '#3b82f6'}
              strokeWidth="2"
              animate={{ r: [HUB_RADIUS, HUB_RADIUS + 2, HUB_RADIUS] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                filter: `drop-shadow(0 0 12px ${allConnected ? '#10b981' : '#3b82f6'})`,
                transition: 'fill 0.4s ease, stroke 0.4s ease',
              }}
            />
            {/* Core dot */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r="4"
              fill={allConnected ? '#10b981' : '#3b82f6'}
              style={{ transition: 'fill 0.4s ease' }}
            />
          </svg>

          {/* Satellite nodes as HTML for easier styling */}
          {satellites.map((sat, i) => {
            const connected = isNodeConnected(i);
            return (
              <motion.div
                key={`sat-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: sat.x, top: sat.y }}
                animate={connected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              >
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: SATELLITE_RADIUS * 2,
                    height: SATELLITE_RADIUS * 2,
                    backgroundColor: connected ? '#10b981' : '#1e293b',
                    border: `2px solid ${connected ? '#10b981' : '#334155'}`,
                    boxShadow: connected ? '0 0 12px #10b981aa' : 'none',
                  }}
                />
              </motion.div>
            );
          })}

          {/* Hub center icon — a small AI glyph */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[10px] font-mono tracking-widest"
              style={{ color: allConnected ? '#10b981' : '#3b82f6' }}
            >
              AI
            </motion.div>
          </div>
        </div>

        {/* Status footer */}
        <div className="text-center min-h-[52px]">

          {/* Count */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{
                color: allConnected ? '#10b981' : '#3b82f6',
                textShadow: `0 0 16px ${allConnected ? '#10b98180' : '#3b82f680'}`,
                transition: 'color 0.3s ease',
              }}
            >
              {connectedCount}
            </span>
            <span className="text-sm font-mono text-blue-300/60 tracking-widest">
              / {botCount} BOTS
            </span>
          </div>

          <motion.p
            key={allConnected ? 'online' : 'linking'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] font-mono tracking-[0.25em]"
            style={{ color: allConnected ? '#10b981' : '#6366f1' }}
          >
            {allConnected ? 'ALL BOTS ONLINE' : 'ESTABLISHING LINK...'}
          </motion.p>
        </div>

        {/* Bottom label */}
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[10px] font-mono tracking-[0.4em] text-blue-300/60"
        >
          {label}
        </motion.p>
      </motion.div>
    </div>
  );
}
