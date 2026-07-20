// /app/lib/notification-export.ts
// Central export file for all notification functions

// Export from notifications.ts (original)
export {
    sendAdminTelegram,
    sendTelegram,
    sendEmail,
    getUserTelegramChatId,
    createInAppNotification,
    notifyAdminNewSignup,
    notifyAdminNewDeposit,
    notifyAdminNewWithdrawal,
    notifyAdminNewBotPurchase,
    notifyAdminNewCardApplication,
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

// Export from simple-notifications.ts
export {
    notifyAdminNewSignup as simpleNotifyAdminNewSignup,
    notifyUserWelcome as simpleNotifyUserWelcome,
    notifyUserReferralBonus as simpleNotifyUserReferralBonus,
} from './simple-notifications';

// Export from notification-helper.ts
export {
    markNotificationRead,
    markAllNotificationsRead,
    getUserNotifications,
    getUnreadNotificationCount,
    deleteNotification,
} from './notification-helper';