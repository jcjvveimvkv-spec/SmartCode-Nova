'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  Copy, Users, DollarSign, TrendingUp, Gift, RefreshCw, Tag,
  Share2, Send, Mail, Link2, MessageCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// SOCIAL MEDIA SVG ICONS
// ============================================================

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface Referral {
  id: number;
  referred_user_id: string;
  status: string;
  amount_usdt: number;
  created_at: string;
  paid_at: string | null;
  is_read?: boolean;
}

interface ReferralPayout {
  id: number;
  amount_usdt: number;
  status: string;
  created_at: string;
  type: 'referral' | 'promo';
  description: string;
}

export default function ReferralPage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    pendingBonus: 0,
    totalClicks: 0,
    bonusBalance: 0,
    promoEarned: 0,
    referralEarned: 0,
  });
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadReferralData();
  }, []);

  // ============================================================
  // MARK REFERRALS AS READ
  // ============================================================
  const markReferralsAsRead = async (userId: string) => {
    try {
      await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mark-read',
          user_id: userId 
        }),
      });
      console.log('✅ Referrals marked as read');
    } catch (error) {
      console.error('Error marking referrals as read:', error);
    }
  };

  // ============================================================
  // LOAD REFERRAL DATA
  // ============================================================
  const loadReferralData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      const user = session.user;
      setUserEmail(user.email || '');

      console.log('🔍 Fetching referral data for user:', user.id);

      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'stats',
          user_id: user.id 
        }),
      });

      if (!response.ok) {
        console.error('❌ API Error:', response.status);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      if (result.success && result.data) {
        const data = result.data;
        
        if (data.code && data.code.code) {
          console.log('✅ Setting referral code to:', data.code.code);
          setReferralCode(data.code.code);
        } else {
          console.log('⚠️ No referral code found');
          setReferralCode('');
        }
        
        setStats({
          totalReferrals: data.total_referrals || 0,
          totalEarned: data.total_earned || 0,
          pendingBonus: data.pending_payouts || 0,
          totalClicks: data.code?.total_clicks || 0,
          bonusBalance: data.bonus_balance || 0,
          promoEarned: data.promo_earned || 0,
          referralEarned: data.referral_earned || 0,
        });
        
        setReferrals(data.referrals || []);
        
        // ============================================================
        // BUILD BONUS HISTORY: Referrals + Promo Codes
        // ============================================================
        const historyItems: ReferralPayout[] = [];
        
        (data.payouts || []).forEach((p: any) => {
          historyItems.push({
            id: p.id,
            amount_usdt: p.amount_usdt || 7,
            status: p.status || 'completed',
            created_at: p.paid_at || p.created_at,
            type: 'referral',
            description: p.description || 'Referral bonus'
          });
        });

        const { data: promoUsage, error: promoError } = await supabase
          .from('promo_code_usage')
          .select('*, promo_codes(code, description)')
          .eq('user_id', user.id)
          .order('claimed_at', { ascending: false });

        if (promoError) {
          console.error('Error fetching promo usage:', promoError);
        }

        (promoUsage || []).forEach((p: any) => {
          historyItems.push({
            id: p.id,
            amount_usdt: p.bonus_amount,
            status: 'completed',
            created_at: p.claimed_at,
            type: 'promo',
            description: `Promo: ${p.promo_codes?.code || 'Unknown'}`
          });
        });

        historyItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPayouts(historyItems);

        // Mark referrals as read
        await markReferralsAsRead(user.id);
      }

    } catch (error) {
      console.error('❌ Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // APPLY PROMO CODE
  // ============================================================

  const applyPromoCode = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert('Please log in to apply a promo code');
      return;
    }

    if (!promoInput.trim()) {
      setPromoMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    setApplyingPromo(true);
    setPromoMessage(null);

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'apply-promo',
          user_id: session.user.id,
          promo_code: promoInput.trim().toUpperCase(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPromoMessage({ 
          type: 'success', 
          text: result.data.message || `✅ ${result.data.bonus_amount} USDT added!` 
        });
        setPromoInput('');
        await loadReferralData();
      } else {
        setPromoMessage({ type: 'error', text: result.error || 'Invalid promo code' });
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      setPromoMessage({ type: 'error', text: 'Error applying promo code. Please try again.' });
    } finally {
      setApplyingPromo(false);
    }
  };

  // ============================================================
  // REFERRAL LINK HELPERS
  // ============================================================

  const getReferralLink = () => {
    return `${window.location.origin}/auth/signup?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setShowShareMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  // ============================================================
  // SHARE ON SOCIAL MEDIA
  // ============================================================

  const shareOnSocial = (platform: string) => {
    const link = getReferralLink();
    const text = `🚀 Join SmartCodeNova and earn 7 USDT bonus! Use my referral code: ${referralCode}`;
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      email: `mailto:?subject=${encodeURIComponent('Join SmartCodeNova!')}&body=${encodeURIComponent(text + '\n\n' + link)}`,
      copy: link,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
    setShowShareMenu(false);
  };

  // ============================================================
  // CLAIM BONUS
  // ============================================================

  const claimBonus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    setClaiming(true);
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'claim-bonus',
          user_id: session.user.id 
        }),
      });
      const result = await response.json();
      if (result.success) {
        await loadReferralData();
        alert(`🎉 Successfully claimed ${result.data.total_amount} USDT!`);
      } else {
        alert(result.error || 'No pending referrals to claim.');
      }
    } catch (error) {
      console.error('Error claiming bonus:', error);
      alert('Error claiming bonus. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  // ============================================================
  // PAGINATION FOR HISTORY
  // ============================================================

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayouts = payouts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payouts.length / itemsPerPage);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🚀 Referral Program</h1>
        <p className="text-gray-400 mt-2">Earn 7 USDT for every friend who joins SmartCodeNova!</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 p-6 rounded-xl border border-purple-500/20">
          <p className="text-gray-400 text-sm">💰 Bonus Balance</p>
          <p className="text-3xl font-bold text-purple-400">{stats.bonusBalance} USDT</p>
          <p className="text-xs text-gray-500 mt-1">Total combined bonus</p>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 p-6 rounded-xl border border-green-500/20">
          <p className="text-gray-400 text-sm">🎁 Promo Earned</p>
          <p className="text-3xl font-bold text-green-400">{stats.promoEarned} USDT</p>
          <p className="text-xs text-gray-500 mt-1">From promo codes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-green-500">{stats.totalEarned} USDT</p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Bonus</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingBonus} USDT</p>
            </div>
            <Gift className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-2xl font-bold text-blue-500">{stats.totalClicks}</p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* ============================================================
          REFERRAL LINK
          ============================================================ */}
      <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Your Referral Link</h2>
        
        {referralCode ? (
          <div>
            {/* Full Referral Link */}
            <div className="mb-3 p-4 bg-[#0b0e14] rounded-lg border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Your Referral Link</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-purple-400 break-all flex-1">
                  {getReferralLink()}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="text-gray-400 hover:text-white transition flex-shrink-0"
                  title="Copy link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="mb-3 p-4 bg-[#0b0e14] rounded-lg border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-purple-400">
                  {referralCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-gray-400 hover:text-white transition flex-shrink-0"
                  title="Copy code"
                >
                  <Copy size={18} />
                </button>
                {copied && <span className="text-xs text-green-400">Copied!</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyReferralLink}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition"
              >
                <Copy size={18} />
                Copy Link
              </button>
              
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="mt-4 p-4 bg-[#0b0e14] rounded-lg border border-white/10">
                <p className="text-sm text-gray-400 mb-3">Share via:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => shareOnSocial('whatsapp')}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                  <button
                    onClick={() => shareOnSocial('telegram')}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Send size={16} /> Telegram
                  </button>
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <TwitterIcon /> Twitter
                  </button>
                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <FacebookIcon /> Facebook
                  </button>
                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <LinkedInIcon /> LinkedIn
                  </button>
                  <button
                    onClick={() => shareOnSocial('email')}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Mail size={16} /> Email
                  </button>
                  <button
                    onClick={() => shareOnSocial('copy')}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Link2 size={16} /> Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400">No referral code found. Please contact support.</p>
          </div>
        )}
      </div>

      {/* Promo Code Section */}
      <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Tag size={20} className="text-yellow-400" />
          Apply Promo Code
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder="Enter promo code..."
            className="flex-1 bg-[#0b0e14] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-yellow-500 focus:outline-none transition"
          />
          <button
            onClick={applyPromoCode}
            disabled={applyingPromo || !promoInput.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyingPromo ? '⏳ Applying...' : 'Apply Code'}
          </button>
        </div>

        {promoMessage && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            promoMessage.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
              : 'bg-red-500/20 text-red-400 border border-red-500/20'
          }`}>
            {promoMessage.text}
          </div>
        )}
      </div>

      {/* Claim Bonus */}
      {stats.pendingBonus > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-xl border border-purple-500/30 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">🎉 You have pending bonuses!</h3>
              <p className="text-gray-400">Claim your 7 USDT bonus for each referral</p>
            </div>
            <button
              onClick={claimBonus}
              disabled={claiming}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {claiming ? '⏳ Claiming...' : `💰 Claim ${stats.pendingBonus} USDT`}
            </button>
          </div>
        </div>
      )}

      {/* Bonus History */}
      <div className="bg-[#1a2332] p-6 rounded-xl border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Bonus History</h2>
          <button
            onClick={loadReferralData}
            className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        
        {payouts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPayouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-white/5">
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payout.type === 'referral' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {payout.type === 'referral' ? 'Referral' : 'Promo'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300 text-sm">{payout.description}</td>
                      <td className="py-3 text-green-400 font-medium">+{payout.amount_usdt} USDT</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================================
                VIEW ALL BUTTON - ADDED HERE
                ============================================================ */}
            {payouts.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Link
                  href="/dashboard/bonus-history"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition text-sm border border-purple-400/30 hover:border-purple-400/60 px-4 py-2 rounded-lg"
                >
                  View All History
                  <ExternalLink size={16} />
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-4">
                <span className="text-sm text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, payouts.length)} of {payouts.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-[#0b0e14] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No rewards yet. Start referring friends and earn bonuses!
          </p>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-[#1a2332] p-6 rounded-xl border border-white/5">
        <h3 className="text-white font-semibold mb-2">📖 How It Works</h3>
        <ul className="text-gray-400 space-y-2 text-sm">
          <li>1️⃣ Share your unique referral link with friends</li>
          <li>2️⃣ When they sign up, you earn 7 USDT</li>
          <li>3️⃣ Track all your referrals and earnings in real-time</li>
          <li>4️⃣ Claim your bonus when ready</li>
          <li>5️⃣ Enter promo codes for extra bonuses 🎁</li>
          <li>💰 Unlimited referrals - the more you share, the more you earn!</li>
        </ul>
      </div>
    </div>
  );
}