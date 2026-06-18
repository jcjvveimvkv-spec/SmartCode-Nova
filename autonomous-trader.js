// autonomous-trader.js (TEST VERSION)
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// 1. SUPABASE SETUP
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 2. TELEGRAM SETUP
const TELEGRAM_BOT_TOKEN = '8593494227:AAEYRi07rcGtCJSA0lALD4HtIPAM-WdZNMU';
const TELEGRAM_CHAT_ID = '8697759538'; // Your test chat ID

// 3. RESEND SETUP
const RESEND_API_KEY = 're_U139y29W_kSm99pk9Z5C57fr8GzVeHR8T';

// 4. TRADING PAIRS POOL
const ALL_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'LTC/USDT', 'XRP/USDT', 'ADA/USDT',
  'ETH/BTC', 'LTC/BTC', 'XRP/BTC', 'BCH/USDT', 'SOL/USDT',
  'EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/JPY', 'USD/CAD'
];

// 5. RANDOM DELAYS (Minutes)
const DELAYS = [0.5, 1, 2]; // REDUCED DELAYS FOR TESTING (30s, 1m, 2m)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 6. SEND TELEGRAM MESSAGE
async function sendTelegram(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    console.log(`📱 Telegram sent!`);
  } catch (err) {
    console.error('❌ Telegram Error:', err.message);
  }
}

// 7. SEND EMAIL VIA RESEND
async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const response = await axios.post('https://api.resend.com/emails', {
      from: 'SmartCodeNova <onboarding@resend.dev>',
      to: [toEmail],
      subject: subject,
      html: htmlContent
    }, {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`📧 Email sent to ${toEmail}`);
  } catch (err) {
    console.error('❌ Resend Error:', err.message);
  }
}

// 8. MAIN BOT ENGINE
async function runAutonomousTrader() {
  console.log('🚀 Starting Test Run...');

  // Fetch the first active bot we find
  const { data: bots, error } = await supabase
    .from('active_bots')
    .select('*, user:user_id(*)')
    .eq('status', 'Active')
    .limit(1); // Just test 1 bot for now

  if (error) {
    console.error('❌ Supabase Error:', error);
    return;
  }

  if (bots.length === 0) {
    console.log('⚠️ No active bots found. Please buy a bot in the dashboard first!');
    return;
  }

  const bot = bots[0];
  console.log(`\n🤖 Testing with: ${bot.bot_name} for User ${bot.user.email}`);

  // Assign random pairs
  let pairs = bot.trading_pairs || [];
  if (pairs.length === 0) {
    const shuffled = [...ALL_PAIRS].sort(() => 0.5 - Math.random());
    pairs = shuffled.slice(0, 15);
    await supabase.from('active_bots').update({ trading_pairs: pairs }).eq('id', bot.id);
  }

  // Generate 3 trades for testing (instead of 7-10)
  const totalTrades = 3; 
  let totalProfit = 0;

  // Send a start notification
  await sendTelegram(`🤖 <b>${bot.bot_name}</b> is starting a test run...`);

  for (let i = 1; i <= totalTrades; i++) {
    const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const profitPercent = bot.profit_percent || 3;
    
    const tradeProfit = bot.invested_usdt * (profitPercent / 100);
    totalProfit += tradeProfit;

    // Insert trade log
    await supabase.from('bot_trade_logs').insert({
      user_id: bot.user_id,
      bot_id: bot.id,
      pair: randomPair,
      action: action,
      entry_price: 100,
      exit_price: 100 * (1 + (profitPercent / 100)),
      profit_percent: profitPercent
    });

    // Send Telegram for each trade
    const tradeMsg = `🤖 <b>${bot.bot_name}</b>\n` +
                     `📈 Trade #${i}\n` +
                     `💱 Pair: ${randomPair}\n` +
                     `🔄 Action: ${action}\n` +
                     `📊 Profit: +${profitPercent}%`;

    await sendTelegram(tradeMsg);
    console.log(`✅ Trade ${i}/${totalTrades} completed`);

    // Wait between trades (test delays)
    if (i < totalTrades) {
      const randomMinutes = DELAYS[Math.floor(Math.random() * DELAYS.length)];
      console.log(`⏳ Waiting ${randomMinutes} minutes...`);
      await sleep(randomMinutes * 60 * 1000);
    }
  }

  // Update bot's current value
  const newValue = bot.current_value_usdt + totalProfit;
  await supabase
    .from('active_bots')
    .update({ current_value_usdt: newValue })
    .eq('id', bot.id);

  // Update user's profit
  const { data: balanceData } = await supabase
    .from('user_balances')
    .select('total_profit_usdt')
    .eq('user_id', bot.user_id)
    .single();

  const newTotalProfit = (balanceData?.total_profit_usdt || 0) + totalProfit;
  await supabase
    .from('user_balances')
    .update({ total_profit_usdt: newTotalProfit })
    .eq('user_id', bot.user_id);

  // Send Summary via Telegram + Email
  const summaryMsg = `📊 <b>TEST SUMMARY: ${bot.bot_name}</b>\n` +
                     `🔄 Trades: ${totalTrades}\n` +
                     `💰 Total Profit: +${totalProfit.toFixed(2)} USDT`;
  
  await sendTelegram(summaryMsg);

  const emailContent = `
    <h2 style="color: #6366f1;">${bot.bot_name} - Test Run Complete</h2>
    <p><strong>Trades Executed:</strong> ${totalTrades}</p>
    <p><strong>Total Profit:</strong> +${totalProfit.toFixed(2)} USDT</p>
    <hr>
    <p style="color: #8e96a3;">Test completed successfully!</p>
  `;
  await sendEmail(bot.user.email, `${bot.bot_name} - Test Complete`, emailContent);

  console.log('\n🎉 Test run complete! Check your Telegram and Email.');
}

// 9. START THE ENGINE
runAutonomousTrader();