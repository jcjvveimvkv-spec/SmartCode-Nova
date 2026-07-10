'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { notifyAdminNewSignup, notifyUserWelcome, notifyUserReferralBonus } from '@/app/lib/notifications';

// Dynamically import Select with NO SSR
const Select = dynamic(
  () => import('react-select').then(mod => mod.default),
  { ssr: false }
);

// ============================================================
// FULL COUNTRY LIST (A-Z)
// ============================================================
const countryOptions = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Albania', label: 'Albania' },
  { value: 'Algeria', label: 'Algeria' },
  { value: 'Andorra', label: 'Andorra' },
  { value: 'Angola', label: 'Angola' },
  { value: 'Antigua and Barbuda', label: 'Antigua and Barbuda' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Armenia', label: 'Armenia' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Azerbaijan', label: 'Azerbaijan' },
  { value: 'Bahamas', label: 'Bahamas' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Barbados', label: 'Barbados' },
  { value: 'Belarus', label: 'Belarus' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Belize', label: 'Belize' },
  { value: 'Benin', label: 'Benin' },
  { value: 'Bhutan', label: 'Bhutan' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina' },
  { value: 'Botswana', label: 'Botswana' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Brunei', label: 'Brunei' },
  { value: 'Bulgaria', label: 'Bulgaria' },
  { value: 'Burkina Faso', label: 'Burkina Faso' },
  { value: 'Burundi', label: 'Burundi' },
  { value: 'Cabo Verde', label: 'Cabo Verde' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Cameroon', label: 'Cameroon' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Central African Republic', label: 'Central African Republic' },
  { value: 'Chad', label: 'Chad' },
  { value: 'Chile', label: 'Chile' },
  { value: 'China', label: 'China' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Comoros', label: 'Comoros' },
  { value: 'Congo', label: 'Congo' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'Croatia', label: 'Croatia' },
  { value: 'Cuba', label: 'Cuba' },
  { value: 'Cyprus', label: 'Cyprus' },
  { value: 'Czech Republic', label: 'Czech Republic' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Djibouti', label: 'Djibouti' },
  { value: 'Dominica', label: 'Dominica' },
  { value: 'Dominican Republic', label: 'Dominican Republic' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Equatorial Guinea', label: 'Equatorial Guinea' },
  { value: 'Eritrea', label: 'Eritrea' },
  { value: 'Estonia', label: 'Estonia' },
  { value: 'Eswatini', label: 'Eswatini' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Fiji', label: 'Fiji' },
  { value: 'Finland', label: 'Finland' },
  { value: 'France', label: 'France' },
  { value: 'Gabon', label: 'Gabon' },
  { value: 'Gambia', label: 'Gambia' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Grenada', label: 'Grenada' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Guinea', label: 'Guinea' },
  { value: 'Guinea-Bissau', label: 'Guinea-Bissau' },
  { value: 'Guyana', label: 'Guyana' },
  { value: 'Haiti', label: 'Haiti' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Hungary', label: 'Hungary' },
  { value: 'Iceland', label: 'Iceland' },
  { value: 'India', label: 'India' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Iraq', label: 'Iraq' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Jamaica', label: 'Jamaica' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Jordan', label: 'Jordan' },
  { value: 'Kazakhstan', label: 'Kazakhstan' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Kiribati', label: 'Kiribati' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Kyrgyzstan', label: 'Kyrgyzstan' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Latvia', label: 'Latvia' },
  { value: 'Lebanon', label: 'Lebanon' },
  { value: 'Lesotho', label: 'Lesotho' },
  { value: 'Liberia', label: 'Liberia' },
  { value: 'Libya', label: 'Libya' },
  { value: 'Liechtenstein', label: 'Liechtenstein' },
  { value: 'Lithuania', label: 'Lithuania' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Madagascar', label: 'Madagascar' },
  { value: 'Malawi', label: 'Malawi' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Maldives', label: 'Maldives' },
  { value: 'Mali', label: 'Mali' },
  { value: 'Malta', label: 'Malta' },
  { value: 'Marshall Islands', label: 'Marshall Islands' },
  { value: 'Mauritania', label: 'Mauritania' },
  { value: 'Mauritius', label: 'Mauritius' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Micronesia', label: 'Micronesia' },
  { value: 'Moldova', label: 'Moldova' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Mongolia', label: 'Mongolia' },
  { value: 'Montenegro', label: 'Montenegro' },
  { value: 'Morocco', label: 'Morocco' },
  { value: 'Mozambique', label: 'Mozambique' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Namibia', label: 'Namibia' },
  { value: 'Nauru', label: 'Nauru' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Niger', label: 'Niger' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'North Korea', label: 'North Korea' },
  { value: 'North Macedonia', label: 'North Macedonia' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Palau', label: 'Palau' },
  { value: 'Panama', label: 'Panama' },
  { value: 'Papua New Guinea', label: 'Papua New Guinea' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Peru', label: 'Peru' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Romania', label: 'Romania' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Saint Kitts and Nevis', label: 'Saint Kitts and Nevis' },
  { value: 'Saint Lucia', label: 'Saint Lucia' },
  { value: 'Saint Vincent', label: 'Saint Vincent' },
  { value: 'Samoa', label: 'Samoa' },
  { value: 'San Marino', label: 'San Marino' },
  { value: 'Sao Tome and Principe', label: 'Sao Tome and Principe' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Senegal', label: 'Senegal' },
  { value: 'Serbia', label: 'Serbia' },
  { value: 'Seychelles', label: 'Seychelles' },
  { value: 'Sierra Leone', label: 'Sierra Leone' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Slovakia', label: 'Slovakia' },
  { value: 'Slovenia', label: 'Slovenia' },
  { value: 'Solomon Islands', label: 'Solomon Islands' },
  { value: 'Somalia', label: 'Somalia' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  { value: 'Sudan', label: 'Sudan' },
  { value: 'Suriname', label: 'Suriname' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Syria', label: 'Syria' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'Tajikistan', label: 'Tajikistan' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Togo', label: 'Togo' },
  { value: 'Tonga', label: 'Tonga' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago' },
  { value: 'Tunisia', label: 'Tunisia' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Turkmenistan', label: 'Turkmenistan' },
  { value: 'Tuvalu', label: 'Tuvalu' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Ukraine', label: 'Ukraine' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Vanuatu', label: 'Vanuatu' },
  { value: 'Vatican City', label: 'Vatican City' },
  { value: 'Venezuela', label: 'Venezuela' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Yemen', label: 'Yemen' },
  { value: 'Zambia', label: 'Zambia' },
  { value: 'Zimbabwe', label: 'Zimbabwe' }
];

// Custom styling for the country select dropdown
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    background: '#0a0a2a',
    borderColor: state.isFocused ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': { borderColor: '#3b82f6' },
    color: '#fff'
  }),
  menu: (base: any) => ({
    ...base,
    background: '#1a1a3e',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  }),
  singleValue: (base: any) => ({ ...base, color: '#fff' }),
  input: (base: any) => ({ ...base, color: '#fff' }),
  option: (base: any, state: any) => ({
    ...base,
    background: state.isFocused ? '#2563eb' : '#1a1a3e',
    color: '#fff',
    '&:hover': { background: '#2563eb' }
  }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
};

// ============================================================
// Helper function to generate referral code
// ============================================================
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// ADMIN SUPABASE CLIENT (bypasses RLS) - WITH ENV FALLBACK
// ============================================================
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleHV6cnd5amVjanhrcm5lbWVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYyMzc1OSwiZXhwIjoyMDk3MTk5NzU5fQ.joJjQ7kBlmvj8fkyLfSvfRhqTuT-ktR4sH7iArETrg4';
  return createClient(url, key);
}

export default function Signup() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Get referral code from URL
  const referralCode = searchParams.get('ref');

  // ============================================================
  // TRACK REFERRAL CLICK
  // ============================================================
  useEffect(() => {
    const trackClick = async () => {
      const ref = searchParams.get('ref');
      if (ref) {
        try {
          await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'track-click',
              referral_code: ref 
            }),
          });
          console.log('✅ Referral click tracked for code:', ref);
        } catch (error) {
          console.error('Error tracking referral click:', error);
        }
      }
    };
    trackClick();
  }, [searchParams]);

  const [formData, setFormData] = useState({
    fullName: '',
    state: '',
    country: null as any,
    phone: '',
    dob: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    telegram: ''
  });

  // Real-time validation states
  const [emailMatch, setEmailMatch] = useState<boolean | null>(null);
  const [passMatch, setPassMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (formData.confirmEmail) {
      setEmailMatch(formData.email === formData.confirmEmail);
    } else {
      setEmailMatch(null);
    }
  }, [formData.email, formData.confirmEmail]);

  useEffect(() => {
    if (formData.confirmPassword) {
      setPassMatch(formData.password === formData.confirmPassword);
    } else {
      setPassMatch(null);
    }
  }, [formData.password, formData.confirmPassword]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (selectedOption: any) => {
    setFormData({ ...formData, country: selectedOption });
  };

  const triggerCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // ============================================================
    // VALIDATE COUNTRY IS SELECTED
    // ============================================================
    if (!formData.country || !formData.country.value) {
      setError('Please select a country.');
      return;
    }

    // Validate emails match
    if (formData.email !== formData.confirmEmail) {
      setError('Emails do not match.');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    // ============================================================
    // 1. CREATE USER IN SUPABASE AUTH
    // ============================================================
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('429')) {
        setError('Too many signup attempts. Please wait 60 seconds and try a new email.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    const newUserId = data.user.id;

    // ============================================================
    // 2. INSERT INTO USER_BALANCES (WITH EMAIL)
    // ============================================================
    const { error: dbError } = await supabase.from('user_balances').insert([
      { 
        user_id: newUserId,
        funding_balance: 0, 
        total_profit_usdt: 0,
        full_name: formData.fullName,
        state: formData.state,
        country: formData.country?.value || '',
        phone: formData.phone,
        date_of_birth: formData.dob,
        telegram_username: formData.telegram || null,
        email: formData.email
      }
    ]);

    if (dbError) {
      setError('Profile save failed: ' + dbError.message);
      setLoading(false);
      return;
    }

    // ============================================================
    // 3. CREATE REFERRAL CODE FOR THE NEW USER (ALWAYS)
    // ============================================================
    let newUserReferralCode = '';
    let referralCodeCreated = false;

    try {
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        newUserReferralCode = generateReferralCode();
        attempts++;
        
        const { data: existingCode, error: checkError } = await getSupabaseAdmin()
          .from('user_referral_codes')
          .select('code')
          .eq('code', newUserReferralCode)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking code uniqueness:', checkError);
          break;
        }
        
        if (!existingCode) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        newUserReferralCode = 'USR' + Date.now().toString(36).toUpperCase();
      }

      const { data: newCodeData, error: codeError } = await getSupabaseAdmin()
        .from('user_referral_codes')
        .insert({
          user_id: newUserId,
          code: newUserReferralCode,
          total_clicks: 0,
          total_signups: 0,
          total_earned_usdt: 0,
          share_count: 0
        })
        .select()
        .single();

      if (codeError) {
        console.error('❌ Error creating referral code for new user:', codeError);
      } else {
        referralCodeCreated = true;
        console.log('✅ Referral code created for new user:', newUserReferralCode);
        
        // ============================================================
        // NEW: SEND WELCOME NOTIFICATION
        // ============================================================
        try {
          await notifyUserWelcome(
            formData.email,
            formData.fullName,
            newUserReferralCode,
            newUserId
          );
          console.log('✅ Welcome notification sent');
        } catch (welcomeError) {
          console.error('❌ Welcome notification error:', welcomeError);
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error creating referral code:', err);
    }

    // ============================================================
    // 4. RECORD REFERRAL (IF A REFERRAL CODE WAS USED)
    // ============================================================
    let referralId: number | null = null;

    if (referralCode) {
      console.log('🔍 Referral code used during signup:', referralCode);
      
      try {
        const { data: referrerData, error: referrerError } = await getSupabaseAdmin()
          .from('user_referral_codes')
          .select('user_id')
          .eq('code', referralCode)
          .single();

        if (referrerError) {
          console.log('⚠️ Referral code not found:', referralCode);
        } else if (referrerData) {
          console.log('✅ Referrer found:', referrerData.user_id);
          
          const { data: existingReferral, error: checkRefError } = await getSupabaseAdmin()
            .from('referrals')
            .select('id')
            .eq('referrer_id', referrerData.user_id)
            .eq('referred_user_id', newUserId)
            .maybeSingle();

          if (checkRefError) {
            console.error('Error checking existing referral:', checkRefError);
          }

          if (existingReferral) {
            console.log('⚠️ Referral already exists, skipping duplicate');
            referralId = existingReferral.id;
          } else {
            const { data: referralRecord, error: referralInsertError } = await getSupabaseAdmin()
              .from('referrals')
              .insert({
                referrer_id: referrerData.user_id,
                referred_user_id: newUserId,
                referral_code: referralCode,
                status: 'pending',
                amount_usdt: 7.00,
                is_read: false,
              })
              .select()
              .single();

            if (referralInsertError) {
              console.error('❌ Error creating referral record:', referralInsertError);
            } else {
              referralId = referralRecord.id;
              console.log('✅ Referral record created for code:', referralCode);
              
              // 4a. UPDATE REFERRER'S SIGNUP COUNT
              const { data: currentCode, error: fetchCodeError } = await getSupabaseAdmin()
                .from('user_referral_codes')
                .select('total_signups')
                .eq('code', referralCode)
                .single();

              if (fetchCodeError) {
                console.error('Error fetching current signup count:', fetchCodeError);
              } else if (currentCode) {
                const newCount = (currentCode.total_signups || 0) + 1;
                await getSupabaseAdmin()
                  .from('user_referral_codes')
                  .update({ total_signups: newCount })
                  .eq('code', referralCode);
                console.log('✅ Signup count updated to:', newCount);
              }

              // 4b. CREDIT THE REFERRER'S BONUS
              const { data: referrerBalance, error: balanceError } = await getSupabaseAdmin()
                .from('user_balances')
                .select('bonus_usdt, email, full_name')
                .eq('user_id', referrerData.user_id)
                .single();

              if (balanceError) {
                console.error('Error fetching referrer balance:', balanceError);
              } else {
                const currentBonus = referrerBalance?.bonus_usdt || 0;
                const newBonus = currentBonus + 7;

                await getSupabaseAdmin()
                  .from('user_balances')
                  .update({ 
                    bonus_usdt: newBonus,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', referrerData.user_id);

                console.log('✅ Referrer bonus credited: 7 USDT');
                
                // Update referral status to paid
                await getSupabaseAdmin()
                  .from('referrals')
                  .update({ 
                    status: 'paid', 
                    paid_at: new Date().toISOString()
                  })
                  .eq('id', referralId);

                // Create payout record
                const { data: existingPayout } = await getSupabaseAdmin()
                  .from('referral_payouts')
                  .select('*')
                  .eq('user_id', referrerData.user_id)
                  .eq('referral_id', referralId)
                  .maybeSingle();

                if (!existingPayout) {
                  await getSupabaseAdmin()
                    .from('referral_payouts')
                    .insert({
                      user_id: referrerData.user_id,
                      referral_id: referralId,
                      amount_usdt: 7.00,
                      status: 'approved',
                      paid_at: new Date().toISOString(),
                    });
                  console.log('✅ Payout record created');
                }

                // ============================================================
                // NEW: SEND REFERRAL BONUS NOTIFICATION
                // ============================================================
                try {
                  const { data: totalRefs, count } = await getSupabaseAdmin()
                    .from('referrals')
                    .select('id', { count: 'exact', head: true })
                    .eq('referrer_id', referrerData.user_id);

                  await notifyUserReferralBonus(
                    referrerBalance?.email || '',
                    referrerBalance?.full_name || 'User',
                    formData.email,
                    7,
                    count || 0,
                    referrerData.user_id
                  );
                  console.log('✅ Referral bonus notification sent');
                } catch (bonusError) {
                  console.error('❌ Referral bonus notification error:', bonusError);
                }

                // Create in-app notification for referrer
                try {
                  await getSupabaseAdmin()
                    .from('user_notifications')
                    .insert({
                      user_id: referrerData.user_id,
                      type: 'referral_bonus',
                      title: '🎉 New Referral!',
                      message: `${formData.fullName} signed up using your referral link! You earned 7 USDT.`,
                      data: {
                        referred_user: formData.email,
                        bonus_amount: 7,
                        referral_code: referralCode,
                      },
                      is_read: false,
                    });
                  console.log('✅ In-app notification created');
                } catch (inAppError) {
                  console.error('Error creating in-app notification:', inAppError);
                }
              }
            }
          }
        }
      } catch (refError) {
        console.error('❌ Error processing referral:', refError);
      }
    }

    // ============================================================
    // 5. NOTIFY ADMIN ABOUT NEW SIGNUP
    // ============================================================
    await notifyAdminNewSignup(formData.email, formData.fullName);
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a2a] flex items-center justify-center px-4 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#1a1a3e] rounded-2xl border border-blue-500/20 p-8 shadow-2xl"
      >
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
          <p className="text-gray-400">Fill in your details to start trading with SmartCodeNova</p>
          
          {referralCode && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                🎉 You were referred! You'll both receive a <strong>7 USDT</strong> bonus!
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Referral Code: <span className="font-mono font-bold text-blue-400">{referralCode}</span>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
              <Select
                options={countryOptions}
                styles={customSelectStyles}
                placeholder="Search country..."
                isSearchable
                value={formData.country}
                onChange={handleCountryChange}
                className="text-white"
                classNamePrefix="select"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="+44 800 000 0000"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth *</label>
              <div className="relative flex items-center">
                <input
                  ref={dateInputRef}
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="button" 
                  onClick={triggerCalendar}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  <Calendar size={20} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telegram Username <span className="text-gray-500 text-xs">(Optional - For bot notifications)</span></label>
            <input
              type="text"
              name="telegram"
              value={formData.telegram}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="@yourusername"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Email *</label>
              <input
                type="email"
                name="confirmEmail"
                required
                value={formData.confirmEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-10"
                placeholder="you@example.com"
              />
              <div className="absolute right-3 top-[38px]">
                {emailMatch === true && <CheckCircle2 className="text-green-500" size={20} />}
                {emailMatch === false && <XCircle className="text-red-500" size={20} />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a2a] border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <div className="absolute right-3 top-[70px]">
                {passMatch === true && <CheckCircle2 className="text-green-500" size={20} />}
                {passMatch === false && <XCircle className="text-red-500" size={20} />}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 rounded-lg text-white font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition">
            Sign in here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}