// /app/lib/notification-helpers.ts
// This file re-exports notification functions from the original notifications.ts
// ONLY includes functions that ACTUALLY exist in the file

import {
    // Core functions
    sendAdminTelegram,
    sendTelegram,
    sendEmail,
    getUserTelegramChatId,
    createInAppNotification,
    
    // Admin notifications
    notifyAdminNewSignup,
    notifyAdminNewDeposit,
    notifyAdminNewWithdrawal,
    notifyAdminNewBotPurchase,
    notifyAdminNewCardApplication,
    
    // User notifications
    notifyUserWelcome,
    notifyUserReferralBonus,
    notifyUserDepositProcessing,
    notifyUserDepositApproved,
    notifyUserWithdrawalRequested,
    notifyUserPromoClaim,
    notifyUserCardApplication,
    notifyUserCardApproved,
    notifyUserCardShipped,
    notifyUserCardActivated,
    
    // Email templates
    welcomeEmailTemplate,
    referralBonusEmailTemplate,
    promoClaimEmailTemplate,
    depositInitiatedUserEmail,
    depositApprovedUserEmail,
    adminDepositAlert,
    cardApplicationSubmittedEmailTemplate,
    cardApprovedEmailTemplate,
    cardShippedEmailTemplate,
} from './notifications';

// Re-export everything
export {
    // Core functions
    sendAdminTelegram,
    sendTelegram,
    sendEmail,
    getUserTelegramChatId,
    createInAppNotification,
    
    // Admin notifications
    notifyAdminNewSignup,
    notifyAdminNewDeposit,
    notifyAdminNewWithdrawal,
    notifyAdminNewBotPurchase,
    notifyAdminNewCardApplication,
    
    // User notifications
    notifyUserWelcome,
    notifyUserReferralBonus,
    notifyUserDepositProcessing,
    notifyUserDepositApproved,
    notifyUserWithdrawalRequested,
    notifyUserPromoClaim,
    notifyUserCardApplication,
    notifyUserCardApproved,
    notifyUserCardShipped,
    notifyUserCardActivated,
    
    // Email templates
    welcomeEmailTemplate,
    referralBonusEmailTemplate,
    promoClaimEmailTemplate,
    depositInitiatedUserEmail,
    depositApprovedUserEmail,
    adminDepositAlert,
    cardApplicationSubmittedEmailTemplate,
    cardApprovedEmailTemplate,
    cardShippedEmailTemplate,
};