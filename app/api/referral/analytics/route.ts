import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-server';

// ============================================================
// GET: Fetch Referral Analytics
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'month';

    console.log('📊 Fetching referral analytics...', { timeRange });

    // ============================================================
    // CREATE SUPABASE ADMIN CLIENT LAZILY
    // ============================================================
    console.log('🔐 Creating Supabase admin client for referral analytics...');
    const supabase = getSupabaseAdmin();
    console.log('✅ Supabase admin client created');

    // ============================================================
    // 1. Total Referrals
    // ============================================================
    const { count: totalReferrals, error: totalError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total referrals:', totalError);
    }

    // ============================================================
    // 2. Total Payouts
    // ============================================================
    const { data: totalPayouts, error: payoutError } = await supabase
      .from('referral_payouts')
      .select('amount_usdt');

    if (payoutError) {
      console.error('Error fetching payouts:', payoutError);
    }

    const totalPayoutAmount = totalPayouts?.reduce((sum: number, p: any) => sum + (p.amount_usdt || 0), 0) || 0;

    // ============================================================
    // 3. Pending Referrals
    // ============================================================
    const { count: pendingReferrals, error: pendingError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending referrals:', pendingError);
    }

    // ============================================================
    // 4. Total Clicks
    // ============================================================
    const { data: clicks, error: clicksError } = await supabase
      .from('user_referral_codes')
      .select('total_clicks');

    if (clicksError) {
      console.error('Error fetching clicks:', clicksError);
    }

    const totalClicks = clicks?.reduce((sum: number, c: any) => sum + (c.total_clicks || 0), 0) || 0;

    // ============================================================
    // 5. Total Signups (from referrals)
    // ============================================================
    const { data: signups, error: signupsError } = await supabase
      .from('user_referral_codes')
      .select('total_signups');

    if (signupsError) {
      console.error('Error fetching signups:', signupsError);
    }

    const totalSignups = signups?.reduce((sum: number, s: any) => sum + (s.total_signups || 0), 0) || 0;

    // ============================================================
    // 6. Conversion Rate
    // ============================================================
    const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : 0;

    // ============================================================
    // 7. Paid Referrals Count
    // ============================================================
    const { count: paidReferralsCount, error: paidError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid');

    if (paidError) {
      console.error('Error fetching paid referrals:', paidError);
    }

    const paidReferrals = paidReferralsCount ?? 0;

    // ============================================================
    // 8. Average Payout
    // ============================================================
    const averagePayout = paidReferrals > 0 ? (totalPayoutAmount / paidReferrals).toFixed(2) : '0.00';

    // ============================================================
    // 9. Total Bonus Distributed
    // ============================================================
    const { data: bonusData } = await supabase
      .from('user_balances')
      .select('bonus_usdt')
      .not('bonus_usdt', 'is', null);

    const totalBonusDistributed = bonusData?.reduce((sum: number, b: any) => sum + (b.bonus_usdt || 0), 0) || 0;

    // ============================================================
    // 10. Promo Code Usage Stats
    // ============================================================
    const { data: promoUsage, error: promoUsageError } = await supabase
      .from('promo_code_usage')
      .select('bonus_amount');

    if (promoUsageError) {
      console.error('Error fetching promo usage:', promoUsageError);
    }

    const totalPromoBonus = promoUsage?.reduce((sum: number, p: any) => sum + (p.bonus_amount || 0), 0) || 0;
    const totalPromoUses = promoUsage?.length || 0;

    // ============================================================
    // 11. Monthly Referrals (last 6 months)
    // ============================================================
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('referrals')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching monthly data:', monthlyError);
    }

    // Group by month
    const monthMap: Record<string, number> = {};
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    monthlyData?.forEach((r: any) => {
      const date = new Date(r.created_at);
      if (date >= sixMonthsAgo) {
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap[key] = (monthMap[key] || 0) + 1;
      }
    });

    // Fill in missing months
    const monthlyLabels: string[] = [];
    const monthlyCounts: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyLabels.push(key);
      monthlyCounts.push(monthMap[key] || 0);
    }

    // ============================================================
    // 12. Top Referrers
    // ============================================================
    const { data: referralsData } = await supabase
      .from('referrals')
      .select('referrer_id, status')
      .eq('status', 'paid');

    // Group by referrer_id and count
    const counts: Record<string, number> = {};
    referralsData?.forEach((r: any) => {
      counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
    });

    // Sort by count descending
    const sortedReferrers = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referrer_id, count]) => ({ referrer_id, count }));

    // Get user details
    const referrerUserIds = sortedReferrers.map(s => s.referrer_id);
    const { data: referrerUsers } = await supabase
      .from('user_balances')
      .select('user_id, email, full_name')
      .in('user_id', referrerUserIds);

    const referrerMap: Record<string, any> = {};
    referrerUsers?.forEach((u: any) => {
      referrerMap[u.user_id] = u;
    });

    const topReferrers = sortedReferrers.map((s: any) => ({
      ...s,
      email: referrerMap[s.referrer_id]?.email || 'Unknown',
      full_name: referrerMap[s.referrer_id]?.full_name || 'Unknown',
    }));

    // ============================================================
    // 13. Top Clickers
    // ============================================================
    const { data: topClicks } = await supabase
      .from('user_referral_codes')
      .select('user_id, total_clicks, code')
      .order('total_clicks', { ascending: false })
      .limit(5);

    // Get user details for top clicks
    const clickUserIds = topClicks?.map((c: any) => c.user_id) || [];
    const { data: clickUsers } = await supabase
      .from('user_balances')
      .select('user_id, email, full_name')
      .in('user_id', clickUserIds);

    const clickUserMap: Record<string, any> = {};
    clickUsers?.forEach((u: any) => {
      clickUserMap[u.user_id] = u;
    });

    const topClickers = topClicks?.map((c: any) => ({
      ...c,
      email: clickUserMap[c.user_id]?.email || 'Unknown',
      full_name: clickUserMap[c.user_id]?.full_name || 'Unknown',
    })) || [];

    // ============================================================
    // 14. Total Referrers (unique users who have referred someone)
    // ============================================================
    const totalReferrers = Object.keys(counts).length;

    // ============================================================
    // RETURN ALL ANALYTICS DATA
    // ============================================================
    return NextResponse.json({
      success: true,
      data: {
        // Stats Cards
        totalReferrals: totalReferrals || 0,
        totalPayouts: totalPayoutAmount,
        pendingReferrals: pendingReferrals || 0,
        conversionRate: conversionRate,
        totalClicks: totalClicks,
        totalSignups: totalSignups,
        averagePayout: averagePayout,
        totalBonusDistributed: totalBonusDistributed,
        totalPromoBonus: totalPromoBonus,
        totalPromoUses: totalPromoUses,
        paidReferrals: paidReferrals,
        totalReferrers: totalReferrers,

        // Charts
        monthlyLabels: monthlyLabels,
        monthlyCounts: monthlyCounts,

        // Top Lists
        topReferrers: topReferrers,
        topClickers: topClickers,
      }
    });

  } catch (error: any) {
    console.error('❌ Error in analytics API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch analytics',
      data: null
    }, { status: 500 });
  }
}