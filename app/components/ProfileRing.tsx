'use client';
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface ProfileRingProps {
  src?: string | null;
  size?: number; // in pixels
  className?: string;
}

export default function ProfileRing({ src, size = 40, className = '' }: ProfileRingProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const triggerRing = () => {
      setActive(true);
      setTimeout(() => setActive(false), 2000); // matches animation duration
    };

    // Trigger every 5 minutes
    const interval = setInterval(triggerRing, 5 * 60 * 1000);
    
    // Trigger once on mount (after a short delay)
    const timeout = setTimeout(triggerRing, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div 
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Avatar Image */}
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/10 bg-[#0b0e14] flex items-center justify-center">
        {src ? (
          <img src={src} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-1/2 h-1/2 text-[#8e96a3]" />
        )}
      </div>

      {/* Laser Sweep Ring */}
      <div
        className={`absolute -inset-[3px] rounded-full pointer-events-none transition-opacity duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `conic-gradient(from 0deg, #00e5ff 0%, rgba(0, 229, 255, 0.4) 40%, transparent 60%)`,
          maskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '2px',
          animation: active ? 'laserSweep 2s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
        }}
      />

      <style jsx>{`
        @keyframes laserSweep {
          0% {
            transform: rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}