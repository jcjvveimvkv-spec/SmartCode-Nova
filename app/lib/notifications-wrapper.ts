// /app/lib/notifications-wrapper.ts
// This is a simple bridge file to fix the build error

// Import ONLY the 3 functions your signup page needs
import { 
    notifyAdminNewSignup,
    notifyUserWelcome,
    notifyUserReferralBonus
} from './notifications';

// Re-export them
export {
    notifyAdminNewSignup,
    notifyUserWelcome,
    notifyUserReferralBonus
};