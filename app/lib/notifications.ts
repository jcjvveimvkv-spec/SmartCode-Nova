// In the signup handler
const handleSignup = async (e: React.FormEvent) => {
  // ... existing signup code ...

  // After successful user creation
  if (data.user) {
    // Send welcome notification (use userId instead of email)
    await notifyUserWelcome(
      data.user.id,
      fullName,
      referralCode
    );

    // Handle referral bonus if applicable
    if (referralCodeParam) {
      // ... existing referral logic ...
      
      // Notify referrer about the new referral
      if (referrerUserId) {
        // Get referrer's info
        const { data: referrer } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', referrerUserId)
          .single();

        if (referrer) {
          // Get total referrals count
          const { count } = await supabaseAdmin
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', referrerUserId)
            .eq('status', 'approved');

          await notifyUserReferralBonus(
            referrerUserId,
            referrer.full_name || 'User',
            data.user.email || 'New User',
            7,
            count || 0
          );
        }
      }
    }
  }
};