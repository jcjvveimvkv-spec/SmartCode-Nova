// ============================================================
// CARD UTILITY FUNCTIONS
// ============================================================

// Luhn Algorithm - Generate valid card number
export function generateCardNumber(type: 'master_credit' | 'visa_debit' | 'verve_debit'): string {
    let prefix = '';
    const length = 16;

    switch (type) {
        case 'master_credit':
            prefix = ['52', '53', '54', '55'][Math.floor(Math.random() * 4)];
            break;
        case 'visa_debit':
            prefix = '4';
            break;
        case 'verve_debit':
            prefix = '5060';
            break;
        default:
            prefix = '4';
    }

    // Generate remaining digits
    let cardNumber = prefix;
    const remainingLength = length - prefix.length - 1;
    
    for (let i = 0; i < remainingLength; i++) {
        cardNumber += Math.floor(Math.random() * 10);
    }

    // Calculate check digit using Luhn algorithm
    const checkDigit = calculateLuhnCheckDigit(cardNumber);
    cardNumber += checkDigit;

    return cardNumber;
}

// Luhn Algorithm - Calculate check digit
function calculateLuhnCheckDigit(number: string): string {
    let sum = 0;
    let alternate = true;
    
    // Process from right to left
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number[i]);
        
        if (alternate) {
            digit *= 2;
            if (digit > 9) {
                digit = digit - 9;
            }
        }
        sum += digit;
        alternate = !alternate;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
}

// Luhn Algorithm - Validate card number
export function isValidCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    let sum = 0;
    let alternate = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);
        
        if (alternate) {
            digit *= 2;
            if (digit > 9) {
                digit = digit - 9;
            }
        }
        sum += digit;
        alternate = !alternate;
    }
    
    return sum % 10 === 0;
}

// Format card number for display
export function formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const parts = [];
    for (let i = 0; i < cleanNumber.length; i += 4) {
        parts.push(cleanNumber.substring(i, i + 4));
    }
    return parts.join(' ');
}

// Mask card number (show only last 4 digits)
export function maskCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const last4 = cleanNumber.slice(-4);
    return `**** **** **** ${last4}`;
}

// Generate CVV
export function generateCVV(): string {
    return Math.floor(100 + Math.random() * 900).toString();
}

// Generate expiry date (3 years from now)
export function generateExpiryDate(): { month: number; year: number; date: Date } {
    const now = new Date();
    const expiryYear = now.getFullYear() + 3;
    const expiryMonth = now.getMonth() + 1;
    const expiryDate = new Date(expiryYear, expiryMonth, 0);
    
    return {
        month: expiryMonth,
        year: expiryYear,
        date: expiryDate,
    };
}

// Get card details by type
export function getCardDetails(type: string) {
    const cards = {
        master_credit: {
            name: 'Master Credit Card',
            type: 'master_credit',
            fee: 500,
            dailyLimit: 10000,
            monthlyLimit: 50000,
            prefix: ['52', '53', '54', '55'],
            icon: '💳',
            color: '#FF5F00',
            bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        },
        visa_debit: {
            name: 'Visa Debit Card',
            type: 'visa_debit',
            fee: 300,
            dailyLimit: 5000,
            monthlyLimit: 25000,
            prefix: ['4'],
            icon: '💳',
            color: '#1A1F71',
            bgGradient: 'linear-gradient(135deg, #0a1628 0%, #1a237e 50%, #283593 100%)',
        },
        verve_debit: {
            name: 'Verve Debit Card',
            type: 'verve_debit',
            fee: 200,
            dailyLimit: 2000,
            monthlyLimit: 10000,
            prefix: ['5060'],
            icon: '💳',
            color: '#00A651',
            bgGradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)',
        },
    };
    
    return cards[type as keyof typeof cards] || null;
}

// Get card status display
export function getCardStatusDisplay(status: string) {
    const statuses: Record<string, { label: string; color: string; icon: string }> = {
        pending: { label: 'Pending', color: '#f59e0b', icon: '🟡' },
        awaiting_payment: { label: 'Awaiting Payment', color: '#f59e0b', icon: '🟡' },
        payment_pending: { label: 'Payment Pending', color: '#f59e0b', icon: '🟡' },
        payment_confirmed: { label: 'Payment Confirmed', color: '#10b981', icon: '🟢' },
        approved: { label: 'Approved', color: '#10b981', icon: '🟢' },
        issued: { label: 'Issued', color: '#10b981', icon: '🟢' },
        shipped: { label: 'Shipped', color: '#3b82f6', icon: '🔵' },
        not_activated: { label: 'Not Activated', color: '#f59e0b', icon: '🟡' },
        active: { label: 'Active', color: '#10b981', icon: '🟢' },
        blocked: { label: 'Blocked', color: '#ef4444', icon: '🔴' },
        rejected: { label: 'Rejected', color: '#ef4444', icon: '🔴' },
        expired: { label: 'Expired', color: '#6b7280', icon: '⚫' },
    };
    
    return statuses[status] || { label: status, color: '#6b7280', icon: '⚪' };
}

// Generate random card color for display
export function getCardColor(name: string): string {
    const colors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e', '#e17055', '#00cec9', '#fd79a8', '#a29bfe'];
    const index = name.length % colors.length;
    return colors[index];
}

// Get card type from number
export function getCardTypeFromNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) {
        return 'visa_debit';
    } else if (cleanNumber.startsWith('5060')) {
        return 'verve_debit';
    } else if (cleanNumber.match(/^5[2-5]/)) {
        return 'master_credit';
    }
    
    return 'unknown';
}

// Get card issuer name
export function getCardIssuer(cardNumber: string): string {
    const type = getCardTypeFromNumber(cardNumber);
    const details = getCardDetails(type);
    return details?.name || 'Unknown';
}

// Format expiry for display (MM/YY)
export function formatExpiry(month: number, year: number): string {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${monthStr}/${yearStr}`;
}

// Check if card is expired
export function isCardExpired(month: number, year: number): boolean {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    return false;
}

// Calculate remaining days until expiry
export function daysUntilExpiry(month: number, year: number): number {
    const expiryDate = new Date(year, month - 1, 1);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}