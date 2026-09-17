'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';

// ============================================================
// LIVE TRADE GRID
// A full-width animated visualization of a global trading network.
// Nodes pulse, beams travel between them, live counters tick.
// ============================================================

// Grid layout — 12 nodes positioned as a % of the container
const NODES = [
  { id: 0, x: 8, y: 25 },
  { id: 1, x: 22, y: 55 },
  { id: 2, x: 15, y: 80 },
  { id: 3, x: 38, y: 20 },
  { id: 4, x: 42, y: 70 },
  { id: 5, x: 55, y: 42 },
  { id: 6, x: 62, y: 82 },
  { id: 7, x: 72, y: 15 },
  { id: 8, x: 78, y: 52 },
  { id: 9, x: 85, y: 78 },
  { id: 10, x: 92, y: 30 },
  { id: 11, x: 50, y: 92 },
];

// Connection pairs (node id → node id)
const EDGES = [
  [0, 1], [0, 3], [1, 4], [1, 2], [3, 5], [3, 7],
  [4, 5], [4, 6], [5, 8], [5, 11], [7, 8], [7, 10],
  [8, 9], [8, 10], [6, 9], [2, 11], [11, 6], [10, 9],
];

const CITY_LABELS = [
  'New York', 'London', 'Singapore', 'Tokyo', 'Dubai', 'Lagos',
  'Berlin', 'Zurich', 'Sydney', 'Toronto', 'Hong Kong', 'São Paulo',
];

export default function LiveTradeGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(2_400_000);
  const [trades, setTrades] = useState(18_472);
  const [activeEdge, setActiveEdge] = useState<number | null>(null);
  const [lastPair, setLastPair] = useState('BTC/USDT');

  const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT', 'ADA/USDT', 'LTC/USDT'];
  const NODE_LABELS = ['NY', 'LON', 'SGP', 'TKY', 'DXB', 'LAG', 'BER', 'ZRH', 'SYD', 'TOR', 'HKG', 'SAO'];

  // Tick counters + beam animation loop
  useEffect(() => {
    const beamInterval = setInterval(() => {
      setActiveEdge(Math.floor(Math.random() * EDGES.length));
      setLastPair(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
    }, 700);

    const counterInterval = setInterval(() => {
      setVolume((v) => v + Math.floor(Math.random() * 45_000));
      setTrades((t) => t + Math.floor(Math.random() * 8) + 1);
    }, 250);

    return () => {
      clearInterval(beamInterval);
      clearInterval(counterInterval);
    };
  }, []);

  const formatVolume = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n}`;
  };

  return (
    <section className="relative w-full py-10 sm:py-16 px-4 bg-[#0a0a2a] overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
              <span className="truncate">Global Trading Network</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Real-time execution across our AI trading infrastructure
            </p>
          </div>

          {/* LIVE badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto shrink-0">
            <span className="relative flex items-center justify-center w-2 h-2">
              <motion.span
                className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 2.6, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Live counters */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-[#0f1235] border border-blue-500/20 rounded-xl p-3 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">24h Volume</p>
            <p className="text-base sm:text-2xl font-bold text-white tabular-nums truncate mt-1">
              {formatVolume(volume)}
            </p>
          </div>
          <div className="bg-[#0f1235] border border-blue-500/20 rounded-xl p-3 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Trades Today</p>
            <p className="text-base sm:text-2xl font-bold text-emerald-400 tabular-nums truncate mt-1">
              {trades.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#0f1235] border border-blue-500/20 rounded-xl p-3 sm:p-4 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider truncate">Last Pair</p>
            <p className="text-base sm:text-2xl font-bold text-blue-400 tabular-nums truncate mt-1 font-mono">
              {lastPair}
            </p>
          </div>
        </div>

        {/* The grid visualization */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl bg-gradient-to-br from-[#0a0a2a] via-[#0d0d3a] to-[#0a0a2a] border border-blue-500/20 overflow-hidden"
        >
          {/* Subtle grid background */}
          <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeOpacity="0.08" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>

          {/* Edges + Beams + Nodes — all inside one SVG viewBox 0-100 x 0-100 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Static connection lines */}
            {EDGES.map(([a, b], i) => {
              const n1 = NODES[a];
              const n2 = NODES[b];
              return (
                <line
                  key={`edge-${i}`}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="#3b82f6"
                  strokeWidth="0.15"
                  strokeOpacity="0.25"
                />
              );
            })}

            {/* Animated beams — one beam travels along the active edge */}
            {activeEdge !== null && (() => {
              const [a, b] = EDGES[activeEdge];
              const n1 = NODES[a];
              const n2 = NODES[b];
              return (
                <>
                  <motion.line
                    key={`beam-${activeEdge}-${Date.now()}`}
                    x1={n1.x}
                    y1={n1.y}
                    x2={n2.x}
                    y2={n2.y}
                    stroke="#10b981"
                    strokeWidth="0.4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0.9 }}
                    animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                  <motion.circle
                    key={`dot-${activeEdge}-${Date.now()}`}
                    r="0.9"
                    fill="#10b981"
                    initial={{ cx: n1.x, cy: n1.y, opacity: 1 }}
                    animate={{ cx: n2.x, cy: n2.y, opacity: [1, 1, 0] }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                  />
                </>
              );
            })()}
          </svg>

          {/* Nodes — HTML overlay so labels can use Tailwind text */}
          {NODES.map((node, i) => (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              >
                <span className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md" />
                <span className="relative block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border border-emerald-300/60" />
              </motion.div>
              <span className="text-[8px] sm:text-[10px] font-mono text-blue-300/70 whitespace-nowrap">
                {NODE_LABELS[i]}
              </span>
            </div>
          ))}

          {/* Bottom-left caption */}
          <div className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4 flex items-center gap-2 text-[10px] sm:text-xs text-blue-300/70 font-mono">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>AI execution engine · 24/7</span>
          </div>
        </div>

        {/* City labels footer — subtle */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-gray-500">
          {CITY_LABELS.map((city) => (
            <span key={city} className="whitespace-nowrap">
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400/60 mr-1.5 align-middle" />
              {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
