'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface TermsAndConditionsProps {
    accepted: boolean;
    onChange: (accepted: boolean) => void;
}

export default function TermsAndConditions({ accepted, onChange }: TermsAndConditionsProps) {
    const [showTerms, setShowTerms] = useState(false);

    const TermsContent = () => (
        <div className="space-y-4 text-gray-300 text-sm">
            <h3 className="text-lg font-semibold text-white">Terms & Conditions</h3>
            
            <p><strong>1. Card Usage</strong><br />
            The card is issued for personal use only. You agree to use the card in accordance with applicable laws and regulations.</p>
            
            <p><strong>2. Fees</strong><br />
            Application fees are non-refundable. The fee will be deducted from your funding balance (Internal) or paid via external crypto wallet (External).</p>
            
            <p><strong>3. Activation</strong><br />
            Your card must be activated at any ATM within 30 days of receipt. Follow the on-screen instructions to set your PIN.</p>
            
            <p><strong>4. Limits</strong><br />
            Daily and monthly spending limits apply. Limit increases may be requested and are subject to approval.</p>
            
            <p><strong>5. Blocking</strong><br />
            You may block your card at any time via the dashboard. Blocked cards cannot be used for transactions.</p>
            
            <p><strong>6. Expiry</strong><br />
            Cards expire after 3 years. A new card will be issued upon expiration.</p>
            
            <p><strong>7. Liability</strong><br />
            You are responsible for the security of your card. Report lost or stolen cards immediately.</p>
            
            <p><strong>8. Delivery</strong><br />
            Physical cards are delivered to the shipping address provided during application.</p>
            
            <p><strong>9. Data Protection</strong><br />
            Your personal data will be processed in accordance with our Privacy Policy.</p>
            
            <p><strong>10. Governing Law</strong><br />
            These terms are governed by the laws of the jurisdiction of issuance.</p>
        </div>
    );

    return (
        <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Terms & Conditions
            </h2>
            
            <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
            >
                {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showTerms ? 'Hide Terms' : 'View Terms & Conditions'}
            </button>
            
            {showTerms && (
                <div className="mt-4 p-4 bg-[#0b0e14] rounded-lg max-h-60 overflow-y-auto">
                    <TermsContent />
                </div>
            )}
            
            <div className="mt-4 flex items-center gap-3">
                <input
                    type="checkbox"
                    id="terms"
                    checked={accepted}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="terms" className="text-gray-300 text-sm">
                    I have read and agree to the Terms & Conditions
                </label>
            </div>
        </div>
    );
}