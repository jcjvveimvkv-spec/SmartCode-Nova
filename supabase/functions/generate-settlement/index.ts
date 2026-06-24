// supabase/functions/generate-settlement/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer"

// The random pair list
const PAIRS = ['BTC/USDT', 'ETH/USDT', 'LTC/USDT', 'XRP/USDT', 'ADA/USDT', 'SOL/USDT', 'EUR/USD', 'GBP/USD'];

serve(async (req) => {
  console.log("🚀 24-Hour Settlement Engine Started");

  const projectUrl = Deno.env.get("PROJECT_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  const supabase = createClient(
    projectUrl ?? "",
    serviceRoleKey ?? ""
  );

  // 1. Get all active bots
  const { data: bots, error: botsError } = await supabase
    .from("active_bots")
    .select("*")
    .eq("status", "Active")
    .eq("is_deployed", true);

  if (botsError) {
    console.error("❌ Error fetching bots:", botsError);
    return new Response("Error", { status: 500 });
  }

  if (!bots || bots.length === 0) {
    console.log("⚠️ No active bots found");
    return new Response("No bots", { status: 200 });
  }

  console.log(`✅ Found ${bots.length} active bot(s)`);

  // 2. Process each bot
  for (const bot of bots) {
    await processBot(bot, supabase);
  }

  return new Response("Settlements processed", { status: 200 });
});

async function processBot(bot: any, supabase: any) {
  const now = new Date();
  const deployedAt = new Date(bot.created_at);

  // Calculate exact time since deployment (in milliseconds)
  const elapsedMs = now.getTime() - deployedAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // 3. Fetch the user's data
  const { data: userData, error: userError } = await supabase
    .from("user_balances")
    .select("*")
    .eq("user_id", bot.user_id)
    .single();

  if (userError || !userData) {
    console.error(`❌ Error fetching user for bot ${bot.id}`);
    return;
  }

  // 4. Check how many trades this bot has already completed
  const { count: tradesCompleted, error: countError } = await supabase
    .from("bot_trade_logs")
    .select("*", { count: "exact", head: true })
    .eq("bot_id", bot.id);

  if (countError) {
    console.error("❌ Error counting trades:", countError);
    return;
  }

  // 5. Check if bot has expired (2 trades = 48 hours)
  const maxTrades = 2; // 2 trades = 2 days
  if (tradesCompleted >= maxTrades) {
    // Mark bot as expired
    await supabase.from("active_bots").update({ status: "Expired" }).eq("id", bot.id);
    console.log(`✅ ${bot.bot_name} has expired (${tradesCompleted} trades completed).`);
    
    // Send expiry notification
    await sendNotification(bot, userData, "Bot Cycle Completed", `Your ${bot.bot_name} has completed its 48-hour cycle. Total profit: ${(bot.current_value_usdt - bot.invested_usdt).toFixed(2)} USDT`);
    return;
  }

  // 6. Check if 24 hours have passed since deployment
  if (elapsedHours < 24 * (tradesCompleted + 1)) {
    console.log(`⏳ ${bot.bot_name} has only been running for ${elapsedHours.toFixed(1)} hours. Waiting for 24-hour mark.`);
    return;
  }

  // 7. Settlement is due! Generate the trade
  const randomPair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const profit = bot.invested_usdt * (bot.profit_percent / 100);

  // Insert the trade
  await supabase.from("bot_trade_logs").insert({
    user_id: bot.user_id,
    bot_id: bot.id,
    pair: randomPair,
    action: "SETTLE",
    amount_usdt: bot.invested_usdt,
    profit_usdt: profit,
    executed_at: now.toISOString()
  });

  // Update bot's current value
  await supabase.from("active_bots").update({
    current_value_usdt: bot.current_value_usdt + profit
  }).eq("id", bot.id);

  // Update user's total profit
  await supabase.from("user_balances").update({
    total_profit_usdt: userData.total_profit_usdt + profit
  }).eq("user_id", bot.user_id);

  // 8. Send Notification
  await sendNotification(bot, userData, "Daily Settlement Completed", 
    `Your ${bot.bot_name} has completed a 24-hour settlement.\nPair: ${randomPair}\nProfit: +${profit.toFixed(2)} USDT`
  );

  console.log(`✅ ${bot.bot_name} settled at ${now.toLocaleTimeString()}. Profit: +${profit.toFixed(2)} USDT`);
}

// --- HELPER: Send Notification ---
async function sendNotification(bot: any, user: any, subject: string, plainText: string) {
  // Telegram
  if (user.telegram_chat_id) {
    await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.telegram_chat_id,
        text: `🤖 ${bot.bot_name}\n📊 ${subject}\n${plainText}`,
        parse_mode: "HTML"
      })
    });
  }

  // Email
  if (user.email) {
    const emailHtml = `
      <div style="background: #0b0e14; padding: 20px; color: #f3f4f6;">
        <h2 style="color: #6366f1;">${subject}</h2>
        <p>Your bot <strong>${bot.bot_name}</strong> has completed a 24-hour settlement.</p>
        <p><strong>${plainText}</strong></p>
        <p style="color: #8e96a3; font-size: 12px;">SmartCodeNova</p>
      </div>
    `;

    try {
      // Try Resend first
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "SmartCodeNova <onboarding@resend.dev>",
          to: [user.email],
          subject: subject,
          html: emailHtml
        })
      });
      if (!res.ok) throw new Error("Resend failed");
    } catch {
      // Fallback to Gmail SMTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: Deno.env.get("GMAIL_EMAIL"),
          pass: Deno.env.get("GMAIL_APP_PASSWORD")
        }
      });
      await transporter.sendMail({
        from: `SmartCodeNova <${Deno.env.get("GMAIL_EMAIL")}>`,
        to: [user.email],
        subject: subject,
        html: emailHtml
      });
    }
  }
}