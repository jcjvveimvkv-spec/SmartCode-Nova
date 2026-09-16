'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CardDisplayProps {
    cardType: string;
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv?: string;
    status?: string;
    showFlip?: boolean;
    /**
     * Set to true if your stored back-side images are saved pre-mirrored.
     * This un-mirrors the artwork and moves the CVV overlay to match.
     */
    unmirrorBack?: boolean;
}

// The design canvas. Every overlay coordinate below is authored against
// these exact dimensions, then uniformly scaled to whatever width the
// container actually gets. Desktop and mobile are the same design.
const CANVAS_W = 420;
const CANVAS_H = 260;

// The card PNGs have transparent padding on the left that the overlay
// coordinates were authored without. Shift the whole canvas left so
// number/expiry/name align with the visible artwork.
// Tune this value: -30 is a good starting point. Move more negative
// (e.g. -40) if the text is still too far right. Move less negative
// (e.g. -20) if it drifts too far left.
const OVERLAY_OFFSET_X = -30;

export default function CardDisplay({
    cardType,
    cardNumber,
    cardHolderName,
    expiryMonth,
    expiryYear,
    cvv = '***',
    status,
    showFlip = true,
    unmirrorBack = false,
}: CardDisplayProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [frontLoaded, setFrontLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [scale, setScale] = useState(1);
    const [canHover, setCanHover] = useState(true);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // ============================================================
    // CARD IMAGE URLs
    // ============================================================
    const getCardImages = (type: string) => {
        const images: Record<string, { front: string; back: string }> = {
            master_credit: {
                front: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card1mastercardF.png',
                back: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card1mastercardB.png',
            },
            visa_debit: {
                front: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card2visaF.png',
                back: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card2visaB.png',
            },
            verve_debit: {
                front: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card3verveF.png',
                back: 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/card%20display/card3verveB.png',
            },
        };
        return images[type] || images.verve_debit;
    };

    const images = getCardImages(cardType);

    // ------------------------------------------------------------
    // Uniform scaling: measure the container, derive one scale factor.
    // This is what makes mobile identical to desktop instead of clipped.
    // ------------------------------------------------------------
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const measure = () => {
            const w = el.getBoundingClientRect().width;
            if (w > 0) setScale(w / CANVAS_W);
        };

        measure();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);
            return () => window.removeEventListener('resize', measure);
        }

        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Touch devices get tap-to-flip; pointer devices keep hover-to-flip.
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        const update = () => setCanHover(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // Preload both faces
    useEffect(() => {
        setFrontLoaded(false);
        setImageError(false);

        const front = new window.Image();
        front.src = images.front;
        front.onload = () => setFrontLoaded(true);
        front.onerror = () => setImageError(true);

        const back = new window.Image();
        back.src = images.back;

        return () => {
            front.onload = null;
            front.onerror = null;
        };
    }, [images.front, images.back]);

    const formatCardNumber = (num: string) => {
        const cleaned = (num || '').replace(/\s/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : num;
    };

    const formatExpiry = (month: number, year: number) =>
        `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;

    const displayNumber = formatCardNumber(cardNumber);
    const displayExpiry = formatExpiry(expiryMonth, expiryYear);

    const getStatusLabel = (s?: string) => {
        if (!s) return 'ACTIVE';
        switch (s) {
            case 'active': return 'ACTIVE';
            case 'blocked': return 'BLOCKED';
            case 'pending': return 'UNDER REVIEW';
            case 'awaiting_payment': return 'AWAITING PAYMENT';
            case 'payment_pending': return 'PAYMENT PENDING';
            case 'payment_confirmed': return 'PAYMENT CONFIRMED';
            case 'approved': return 'APPROVED';
            default: return s.toUpperCase();
        }
    };

    const getCardTypeLabel = (type: string) => {
        switch (type) {
            case 'master_credit': return 'MASTERCARD';
            case 'visa_debit': return 'VISA';
            case 'verve_debit': return 'VERVE';
            default: return 'CARD';
        }
    };

    const getGradientFallback = () => {
        switch (cardType) {
            case 'master_credit':
                return 'bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500';
            case 'visa_debit':
                return 'bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400';
            case 'verve_debit':
                return 'bg-gradient-to-br from-green-800 via-green-600 to-green-400';
            default:
                return 'bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-500';
        }
    };

    const displayName =
        cardHolderName && cardHolderName !== 'User' && cardHolderName !== 'CARDHOLDER NAME'
            ? cardHolderName.toUpperCase()
            : 'CARDHOLDER NAME';

    const isScript = cardType === 'master_credit';

    const statusTone =
        status === 'active'
            ? 'text-green-400 border-green-400/50'
            : status === 'blocked'
            ? 'text-red-400 border-red-400/50'
            : status === 'pending' || status === 'awaiting_payment' || status === 'payment_pending'
            ? 'text-yellow-400 border-yellow-400/50'
            : 'text-blue-400 border-blue-400/50';

    const toggleFlip = useCallback(() => {
        if (showFlip) setIsFlipped((v) => !v);
    }, [showFlip]);

    // Shared style for the fixed-size overlay canvas that gets scaled.
    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: CANVAS_W,
        height: CANVAS_H,
        transform: `translateX(${OVERLAY_OFFSET_X}px) scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none',
    };

    const faceStyle: React.CSSProperties = {
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
    };

    return (
        <div
            ref={wrapperRef}
            className="relative w-full max-w-[420px] mx-auto select-none"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => canHover && showFlip && setIsFlipped(true)}
            onMouseLeave={() => canHover && showFlip && setIsFlipped(false)}
        >
            {/* Tap / keyboard target. Covers the whole card on touch devices. */}
            <div
                role={showFlip ? 'button' : undefined}
                tabIndex={showFlip ? 0 : undefined}
                aria-label={showFlip ? (isFlipped ? 'Show card front' : 'Show card back') : undefined}
                aria-pressed={showFlip ? isFlipped : undefined}
                onClick={toggleFlip}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFlip();
                    }
                }}
                className={`relative w-full outline-none rounded-2xl ${
                    showFlip ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]' : ''
                }`}
                style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, WebkitTapHighlightColor: 'transparent' }}
            >
                <div
                    className="card-flip relative w-full h-full"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {/* ============================ FRONT ============================ */}
                    <div
                        className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        style={faceStyle}
                    >
                        {!imageError && frontLoaded && (
                            <img
                                src={images.front}
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}

                        {!frontLoaded && !imageError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1a2332]">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                                    <span className="text-gray-400 text-[10px] sm:text-xs">Loading card…</span>
                                </div>
                            </div>
                        )}

                        {imageError && (
                            <div className={`absolute inset-0 ${getGradientFallback()} flex items-center justify-center`}>
                                <div className="text-white text-4xl opacity-20">💳</div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/5 z-10" />

                        {/* Scaled overlay canvas — authored at 420×260, scaled uniformly */}
                        <div style={{ ...canvasStyle, zIndex: 20 }}>
                            {/* Card number */}
                            <div
                                className="absolute font-mono text-white text-shadow-lg"
                                style={{
                                    left: 84,
                                    bottom: 72,
                                    fontSize: 20,
                                    lineHeight: '24px',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {displayNumber}
                            </div>

                            {/* Expiry + name */}
                            <div className="absolute" style={{ left: 84, bottom: 24 }}>
                                <div
                                    className="text-white/80 font-mono"
                                    style={{ fontSize: 12, lineHeight: '16px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
                                >
                                    VALID THRU {displayExpiry}
                                </div>
                                <div
                                    className={`text-white uppercase font-semibold ${isScript ? 'font-birthstone' : 'font-mono'}`}
                                    style={{
                                        fontSize: isScript ? 18 : 14,
                                        lineHeight: isScript ? '26px' : '20px',
                                        letterSpacing: '0.05em',
                                        marginTop: 2,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {displayName}
                                </div>
                            </div>

                            {/* Status badge */}
                            {status && (
                                <div
                                    className={`absolute rounded-full bg-black/40 border ${statusTone}`}
                                    style={{
                                        top: 16,
                                        right: 16,
                                        fontSize: 11,
                                        lineHeight: '14px',
                                        padding: '4px 12px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {getStatusLabel(status)}
                                </div>
                            )}

                            {/* Card type badge */}
                            <div
                                className="absolute text-white/60 uppercase font-mono"
                                style={{ top: 16, left: 16, fontSize: 10, lineHeight: '12px', letterSpacing: '0.1em' }}
                            >
                                {getCardTypeLabel(cardType)}
                            </div>
                        </div>
                    </div>

                    {/* ============================ BACK ============================ */}
                    <div
                        className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
                    >
                        {!imageError ? (
                            <img
                                src={images.back}
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={unmirrorBack ? { transform: 'scaleX(-1)' } : undefined}
                            />
                        ) : (
                            <div className={`absolute inset-0 ${getGradientFallback()} flex items-center justify-center`}>
                                <div className="text-white text-4xl opacity-20">💳</div>
                            </div>
                        )}

                        <div style={{ ...canvasStyle, zIndex: 10 }}>
                            <div
                                className="absolute font-mono text-white text-shadow-lg"
                                style={{
                                    top: 95,
                                    ...(unmirrorBack ? { left: 60 } : { right: 60 }),
                                    fontSize: 18,
                                    lineHeight: '22px',
                                    letterSpacing: '0.08em',
                                }}
                            >
                                {cvv}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Touch-only affordance: hover cards get no hint, touch cards do. */}
            {showFlip && !canHover && (
                <p className="mt-2 text-center text-[10px] text-gray-500 tracking-wide">
                    {isFlipped ? 'Tap card to see the front' : 'Tap card to see the back'}
                </p>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Birthstone&display=swap');

                .font-birthstone {
                    font-family: 'Birthstone', cursive !important;
                }
            `}</style>

            <style jsx>{`
                .text-shadow-lg {
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
                }
                .card-flip {
                    transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
                }
                @media (prefers-reduced-motion: reduce) {
                    .card-flip {
                        transition-duration: 1ms;
                    }
                }
            `}</style>
        </div>
    );
}
