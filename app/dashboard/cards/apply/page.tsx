'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    // ✅ Enhancement: derive step state for the progress indicator
    const step1Done = !!selectedCard;
    const step2Done = !!selectedCardData && !!acceptedTerms && !!signatureData;
    const step3Done = step2Done && !!paymentMethod;
    const isSubmitting = loading || submitStatus === 'submitting';

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm break-words">
                    ⚠️ {error}
                </div>
                <div className="bg-[#1a2332] rounded-xl border border-white/5 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Apply for Card</h2>
                    <p className="text-gray-400 text-sm">Unable to load the application. Please try again later.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto overflow-x-hidden">

            {/* Header */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="text-gray-400 hover:text-white transition p-1 shrink-0 mt-0.5 sm:mt-0"
                >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Apply for a Card</h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                        Choose your card type and complete the application
                    </p>
                </div>
            </div>

            {/* ✅ Enhancement: Progress Steps — dynamic state, hides labels on mobile */}
            <div className="flex items-center justify-between w-full max-w-2xl mx-auto gap-2">
                {/* Step 1 */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                        step1Done ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                    }`}>
                        {step1Done ? <Check className="w-3.5 h-3.5" /> : '1'}
                    </div>
                    <span className="text-white text-xs sm:text-sm whitespace-nowrap hidden sm:inline">
                        Select Card
                    </span>
                </div>
                <div className={`flex-1 h-0.5 min-w-[12px] transition-colors ${step1Done ? 'bg-green-500/60' : 'bg-purple-500/30'}`} />

                {/* Step 2 */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                        step2Done ? 'bg-green-500 text-white'
                            : step1Done ? 'bg-purple-500 text-white'
                            : 'bg-gray-600 text-white'
                    }`}>
                        {step2Done ? <Check className="w-3.5 h-3.5" /> : '2'}
                    </div>
                    <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${step1Done ? 'text-white' : 'text-gray-400'}`}>
                        Details
                    </span>
                </div>
                <div className={`flex-1 h-0.5 min-w-[12px] transition-colors ${step2Done ? 'bg-green-500/60' : 'bg-purple-500/30'}`} />

                {/* Step 3 */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                        step3Done ? 'bg-green-500 text-white'
                            : step2Done ? 'bg-purple-500 text-white'
                            : 'bg-gray-600 text-white'
                    }`}>
                        {step3Done ? <Check className="w-3.5 h-3.5" /> : '3'}
                    </div>
                    <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${step2Done ? 'text-white' : 'text-gray-400'}`}>
                        Payment
                    </span>
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
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

                    {/* Submit / Cancel — ✅ mobile stacks, submit on top */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full sm:flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            title={isSubmitting ? 'Please wait...' : undefined}
                            className={`w-full sm:flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                                isSubmitting
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                    <span>{paymentMethod === 'internal' ? 'Processing...' : 'Submitting...'}</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5 shrink-0" />
                                    <span>{paymentMethod === 'internal' ? 'Pay & Submit' : 'Submit Application'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence>
                        {submitStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg overflow-hidden"
                            >
                                <p className="text-green-400 text-xs sm:text-sm flex items-start gap-2">
                                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Application submitted successfully! Redirecting...</span>
                                </p>
                            </motion.div>
                        )}

                        {submitStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden"
                            >
                                <p className="text-red-400 text-xs sm:text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>There was an error submitting your application. Please try again.</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
