'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

interface CardDisplayProps {
    cardType: string;
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv?: string;
    status?: string;
    showFlip?: boolean;
}

export default function CardDisplay({ 
    cardType, 
    cardNumber, 
    cardHolderName, 
    expiryMonth, 
    expiryYear,
    cvv = '***',
    status,
    showFlip = true
}: CardDisplayProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

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

    // Format card number with spaces
    const formatCardNumber = (num: string) => {
        const cleaned = num.replace(/\s/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : num;
    };

    // Format expiry
    const formatExpiry = (month: number, year: number) => {
        return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
    };

    const displayNumber = formatCardNumber(cardNumber);
    const displayExpiry = formatExpiry(expiryMonth, expiryYear);

    // Get status label
    const getStatusLabel = (status?: string) => {
        if (!status) return 'ACTIVE';
        switch (status) {
            case 'active': return 'ACTIVE';
            case 'blocked': return 'BLOCKED';
            case 'pending': return 'UNDER REVIEW';
            case 'awaiting_payment': return 'AWAITING PAYMENT';
            case 'payment_pending': return 'PAYMENT PENDING';
            case 'payment_confirmed': return 'PAYMENT CONFIRMED';
            case 'approved': return 'APPROVED';
            default: return status.toUpperCase();
        }
    };

    // Get card type label
    const getCardTypeLabel = (type: string) => {
        switch (type) {
            case 'master_credit': return 'MASTERCARD';
            case 'visa_debit': return 'VISA';
            case 'verve_debit': return 'VERVE';
            default: return 'CARD';
        }
    };

    // Get font for cardholder name based on card type
    const getCardHolderFont = (type: string) => {
        if (type === 'master_credit') {
            return 'font-birthstone';
        }
        return 'font-mono';
    };

    // Preload images
    useEffect(() => {
        const img = new Image();
        img.src = images.front;
        img.onload = () => {
            console.log('✅ Card image loaded:', images.front);
            setImageLoaded(true);
        };
        img.onerror = () => {
            console.warn('❌ Image load failed:', images.front);
            setImageError(true);
        };
    }, [images.front]);

    // Fallback gradient
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

    // Get the actual cardholder name
    const displayName = cardHolderName && cardHolderName !== 'User' && cardHolderName !== 'CARDHOLDER NAME'
        ? cardHolderName.toUpperCase()
        : 'CARDHOLDER NAME';

    const nameFontClass = getCardHolderFont(cardType);

    return (
        <div 
            className="relative w-full max-w-[420px] mx-auto"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => showFlip && setIsFlipped(true)}
            onMouseLeave={() => showFlip && setIsFlipped(false)}
        >
            <div 
                className="relative w-full transition-transform duration-600"
                style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* FRONT SIDE */}
                <div 
                    className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        aspectRatio: '420/260',
                    }}
                >
                    {/* Card Image */}
                    {!imageError && imageLoaded && (
                        <img 
                            src={images.front}
                            alt="Card Front"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Loading / Error State */}
                    {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1a2332]">
                            <div className="animate-pulse flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
                                <span className="text-gray-400 text-xs">Loading card...</span>
                            </div>
                        </div>
                    )}

                    {imageError && (
                        <div className={`absolute inset-0 ${getGradientFallback()} flex items-center justify-center`}>
                            <div className="text-white text-4xl opacity-20">💳</div>
                        </div>
                    )}

                    {/* Overlay for text readability */}
                    <div className="absolute inset-0 bg-black/5 z-10"></div>
                    
                    {/* FRONT TEXT OVERLAY */}
                    <div className="absolute inset-0 z-20">
                        {/* Card Number */}
                        <div className="absolute bottom-[72px] left-[84px] font-mono text-white text-xl tracking-wider text-shadow-lg">
                            {displayNumber}
                        </div>
                        
                        {/* Footer: Expiry + Name */}
                        <div className="absolute bottom-[24px] left-[84px]">
                            <div className="text-white/80 text-xs tracking-wider font-mono">
                                VALID THRU {displayExpiry}
                            </div>
                            <div className={`text-white text-sm uppercase tracking-wider font-semibold mt-0.5 ${nameFontClass}`}>
                                {displayName}
                            </div>
                        </div>

                        {/* Status Badge */}
                        {status && (
                            <div className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-black/40 border ${
                                status === 'active' ? 'text-green-400 border-green-400/50' :
                                status === 'blocked' ? 'text-red-400 border-red-400/50' :
                                status === 'pending' || status === 'awaiting_payment' || status === 'payment_pending' ? 'text-yellow-400 border-yellow-400/50' :
                                'text-blue-400 border-blue-400/50'
                            }`}>
                                {getStatusLabel(status)}
                            </div>
                        )}

                        {/* Card Type Badge */}
                        <div className="absolute top-4 left-4 text-white/60 text-[10px] uppercase tracking-wider font-mono">
                            {getCardTypeLabel(cardType)}
                        </div>
                    </div>
                </div>

                {/* BACK SIDE WITH CVV OVERLAY */}
                <div 
                    className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        aspectRatio: '420/260',
                    }}
                >
                    {/* Back Image */}
                    {!imageError && imageLoaded ? (
                        <img 
                            src={images.back}
                            alt="Card Back"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className={`w-full h-full ${getGradientFallback()} flex items-center justify-center`}>
                            <div className="text-white text-4xl opacity-20">💳</div>
                        </div>
                    )}

                    {/* CVV OVERLAY ON BACK */}
                    <div className="absolute inset-0 z-10">
                        <div className="absolute right-[60px] top-[95px] font-mono text-white text-lg tracking-wider text-shadow-lg">
                            {cvv}
                        </div>
                    </div>
                </div>

            </div>

            {/* Birthstone Font Import */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Birthstone&display=swap');
                
                .font-birthstone {
                    font-family: 'Birthstone', cursive !important;
                    font-size: 18px;
                    letter-spacing: 1px;
                }
            `}</style>

            <style jsx>{`
                .text-shadow-lg {
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
                }
                .duration-600 {
                    transition-duration: 600ms;
                }
            `}</style>
        </div>
    );
}