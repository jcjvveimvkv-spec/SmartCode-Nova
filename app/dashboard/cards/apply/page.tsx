'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PaymentModal from '@/app/components/PaymentModal';

// Components
import CardSelection from './components/CardSelection';
import PersonalInfo from './components/PersonalInfo';
import ShippingAddress from './components/ShippingAddress';
import SignaturePad from './components/SignaturePad';
import TermsAndConditions from './components/TermsAndConditions';
import PaymentMethod from './components/PaymentMethod';

// Hook
import { useCardApplication } from './hooks/useCardApplication';

// Types & Constants
import { countryOptions } from './constants/countries';

export default function ApplyCardPage() {
    const router = useRouter();
    
    const {
        user,
        cardTypes,
        selectedCard,
        selectedCardData,
        paymentMethod,
        submitStatus,
        loading,
        pageLoading,
        error,
        showPaymentModal,
        applicationId,
        signatureData,
        acceptedTerms,
        formData,
        internalAvailable,
        externalAvailable,
        totalBalance,
        fee,
        hasSufficientBalance,
        network,
        walletAddress,
        qrCodeUrl,
        loadData,
        handleSubmit,
        handleInputChange,
        handleSignatureChange,
        handleTermsChange,
        handlePaymentMethodChange,
        handleCardSelect,
        closePaymentModal,
        handlePaymentSuccess,
        setShowTerms,
    } = useCardApplication();

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4">
                    ⚠️ {error}
                </div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Apply for Card</h2>
                    <p className="text-gray-400 text-sm">Unable to load the application. Please try again later.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Apply for a Card</h1>
                    <p className="text-gray-400 text-sm">Choose your card type and complete the application</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <span className="text-white text-sm">Select Card</span>
                </div>
                <div className="flex-1 h-0.5 bg-purple-500/30"></div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <span className="text-white text-sm">Details</span>
                </div>
                <div className="flex-1 h-0.5 bg-purple-500/30"></div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                    <span className="text-gray-400 text-sm">Payment</span>
                </div>
            </div>

            {/* Card Selection */}
            <CardSelection
                cardTypes={cardTypes}
                selectedCard={selectedCard}
                onSelect={handleCardSelect}
            />

            {/* Application Form */}
            {selectedCardData && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <PersonalInfo
                        user={user}
                        formData={formData}
                        onChange={handleInputChange}
                    />

                    {/* Shipping Address */}
                    <ShippingAddress
                        formData={formData}
                        onChange={handleInputChange}
                        countryOptions={countryOptions}
                    />

                    {/* Signature */}
                    <SignaturePad onSignatureChange={handleSignatureChange} />

                    {/* Terms & Conditions */}
                    <TermsAndConditions
                        accepted={acceptedTerms}
                        onChange={handleTermsChange}
                    />

                    {/* Payment Method */}
                    <PaymentMethod
                        paymentMethod={paymentMethod}
                        onChange={handlePaymentMethodChange}
                        internalAvailable={internalAvailable}
                        externalAvailable={externalAvailable}
                        fee={fee}
                        totalBalance={totalBalance}
                        hasSufficientBalance={hasSufficientBalance}
                    />

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || submitStatus === 'submitting'}
                            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                                loading || submitStatus === 'submitting'
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                            }`}
                        >
                            {loading || submitStatus === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {paymentMethod === 'internal' ? 'Processing Payment...' : 'Submitting...'}
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    {paymentMethod === 'internal' ? 'Pay & Submit' : 'Submit Application'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg animate-fadeIn">
                            <p className="text-green-400 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Application submitted successfully! Redirecting...
                            </p>
                        </div>
                    )}
                    
                    {submitStatus === 'error' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-fadeIn">
                            <p className="text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                There was an error submitting your application. Please try again.
                            </p>
                        </div>
                    )}
                </form>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={closePaymentModal}
                onSuccess={handlePaymentSuccess}
                amount={fee}
                network={network}
                walletAddress={walletAddress}
                qrCodeUrl={qrCodeUrl}
                applicationId={applicationId}
            />
        </div>
    );
}