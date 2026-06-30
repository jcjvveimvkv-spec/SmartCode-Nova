// supabase/functions/screenshot-generator/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// =====================================================
// CONFIGURATION
// =====================================================
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN_NEW")!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const VERCEL_URL = "https://www.smartcodenova.online";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Name pools
const firstNames = {
  usa: ['James', 'Emily', 'Michael', 'Sarah', 'William', 'Olivia', 'Robert', 'Emma', 'David', 'Charlotte', 'John', 'Amelia', 'Richard', 'Harper', 'Joseph', 'Elizabeth', 'Thomas', 'Evelyn', 'Charles', 'Abigail'],
  uk: ['Oliver', 'Emily', 'George', 'Amelia', 'Harry', 'Isla', 'Jack', 'Mia', 'Jacob', 'Grace', 'Thomas', 'Rosie', 'William', 'Lily', 'James'],
  india: ['Rahul', 'Priya', 'Vikram', 'Ananya', 'Rohit', 'Neha', 'Amit', 'Sneha', 'Raj', 'Meera', 'Sanjay', 'Kavya', 'Arjun', 'Divya', 'Karan', 'Aisha', 'Ravi', 'Pooja', 'Mohan', 'Lakshmi', 'Kiran', 'Sunita', 'Rakesh', 'Geeta', 'Suresh'],
  pakistan: ['Ahmed', 'Fatima', 'Usman', 'Ayesha', 'Ali', 'Zainab', 'Hassan', 'Mariam', 'Bilal', 'Khadija', 'Zayan', 'Amna', 'Hamza', 'Hira', 'Imran', 'Sana', 'Salman', 'Maryam', 'Kashif', 'Saima'],
  bangladesh: ['Md', 'Jannatul', 'Abdul', 'Nusrat', 'Kamal', 'Sharmin', 'Saif', 'Taslima', 'Hasan', 'Parveen', 'Ibrahim', 'Rina', 'Mizan', 'Sumaiya', 'Rafiq'],
};

const lastNames = {
  usa: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'],
  uk: ['Smith', 'Jones', 'Taylor', 'Williams', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts'],
  india: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Gupta', 'Joshi', 'Verma', 'Choudhury', 'Malhotra', 'Mehta', 'Desai', 'Shah', 'Kapoor', 'Aggarwal', 'Arora', 'Nair', 'Menon', 'Iyer', 'Rao'],
  pakistan: ['Khan', 'Ali', 'Hussain', 'Chaudhry', 'Malik', 'Butt', 'Siddiqui', 'Sheikh', 'Memon', 'Qureshi', 'Iqbal', 'Raza', 'Anwar', 'Hashmi', 'Abbas'],
  bangladesh: ['Rahman', 'Islam', 'Khan', 'Hossain', 'Ahmed', 'Ali', 'Hasan', 'Chowdhury', 'Kabir', 'Karim'],
};

const countries = {
  usa: '🇺🇸 United States',
  uk: '🇬🇧 United Kingdom',
  india: '🇮🇳 India',
  pakistan: '🇵🇰 Pakistan',
  bangladesh: '🇧🇩 Bangladesh',
};

const testimonialMessages = [
  "I've been using SmartCodeNova for 3 months and my portfolio has grown 40%! Best investment decision I've ever made. 🚀",
  "Just received my first payout of 250 USDT! This platform is legit. 💰",
  "The NOVA-1 bot is incredible! It made me 15% profit in just 48 hours. 🤖",
  "I was skeptical at first, but SmartCodeNova proved me wrong. My $500 investment is now $850! 💎",
  "Best trading platform I've ever used. The customer support is amazing! 🙌",
  "NOVA-2 bot just made me 10% profit in 4 days. I'm so happy with this platform! 🎉",
  "SmartCodeNova is the only platform I trust with my crypto. 100% reliable. 🔒",
  "Just withdrew 1,500 USDT. Process was smooth and fast! ✅",
  "The transparency of SmartCodeNova is unmatched. I can see every trade clearly. 👀",
  "NOVA-4 bot is a game changer! 30% return in 14 days! 🚀",
];

const botResponses = [
  "Thank you for sharing your experience! We're glad to have you in our community. 🙌",
  "We appreciate your feedback! It's users like you that make SmartCodeNova great. 💪",
  "Congratulations on your success! Your journey with us is just beginning. 🚀",
  "Thank you for trusting SmartCodeNova! We're here to help you grow. 🤝",
  "We're thrilled to hear about your success! Keep it up! 💎",
  "Your feedback motivates us to keep improving! Thank you! 🙏",
];

function getRandomRegion(): keyof typeof firstNames {
  const regions = Object.keys(firstNames) as (keyof typeof firstNames)[];
  return getRandom(regions);
}

function generateTestimonial() {
  const region = getRandomRegion();
  const firstName = getRandom(firstNames[region]);
  const lastName = getRandom(lastNames[region]);
  const fullName = `${firstName} ${lastName}`;
  const userId = `${fullName.slice(0, 2).toUpperCase()}***${fullName.slice(-2).toUpperCase()}`;
  const country = countries[region] || '🌍 Unknown';
  const message = getRandom(testimonialMessages);
  const botResponse = getRandom(botResponses);

  return {
    name: fullName,
    userId: userId,
    country: country,
    message: message,
    botResponse: botResponse,
  };
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
}

// =====================================================
// GENERATE SCREENSHOT IMAGE
// =====================================================

async function generateScreenshotImage(testimonial: any): Promise<string | null> {
  try {
    console.log(`🟡 Calling Vercel API at: ${VERCEL_URL}/api/telegram/generate-screenshot-image`);
    
    const response = await fetch(`${VERCEL_URL}/api/telegram/generate-screenshot-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testimonial }),
    });

    console.log(`🟡 Vercel API Response Status: ${response.status}`);

    if (!response.ok) {
      console.error('Screenshot generation failed:', response.status);
      const text = await response.text();
      console.error('Response body:', text);
      return null;
    }

    const data = await response.json();
    console.log('🟡 Vercel API Response:', data);
    
    return data.imageData || null;
  } catch (error) {
    console.error('Error generating screenshot:', error);
    return null;
  }
}

// =====================================================
// TELEGRAM FUNCTIONS
// =====================================================

async function getActiveGroupChatIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('telegram_groups')
    .select('chat_id')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return data.map(row => row.chat_id);
}

async function sendTelegramPhoto(photoData: string, chatId: string, caption: string): Promise<boolean> {
  try {
    // Convert base64 to blob
    const blob = await fetch(photoData).then(res => res.blob());
    
    const formData = new FormData();
    formData.append('photo', blob, 'screenshot.png');
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram photo:', error);
    return false;
  }
}

async function sendTelegramMessage(message: string, chatId: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_notification: false,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const cronSecret = url.searchParams.get('secret');
    
    if (cronSecret !== Deno.env.get('TELEGRAM_CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🟢 Screenshot Generator Started');

    // Generate testimonial
    const testimonial = generateTestimonial();
    testimonial.timestamp = formatTimestamp();

    console.log('🟢 Testimonial generated:', testimonial.name);

    // Get active groups
    const groups = await getActiveGroupChatIds();
    
    if (groups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No active groups found' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🟢 Active groups:', groups);

    // Generate the screenshot image
    const imageData = await generateScreenshotImage(testimonial);
    
    if (imageData) {
      console.log('🟢 Image generated successfully');
      
      const caption = `🗣️ NEW TESTIMONIAL SHARED 🗣️
━━━━━━━━━━━━━━━━━━
👤 ${testimonial.name}
🌍 ${testimonial.country}
🆔 User ID: ${testimonial.userId}
━━━━━━━━━━━━━━━━━━
📅 ${testimonial.timestamp}

📝 Share your experience in the group or DM us!`;

      for (const chatId of groups) {
        await sendTelegramPhoto(imageData, chatId, caption);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Screenshot image sent successfully',
          data: {
            testimonial: testimonial,
            groups: groups,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('🔴 Failed to generate image, sending text fallback');
      
      const message = `🗣️ NEW TESTIMONIAL SHARED 🗣️
━━━━━━━━━━━━━━━━━━
👤 ${testimonial.name}
🌍 ${testimonial.country}
🆔 User ID: ${testimonial.userId}

💬 "${testimonial.message}"

🤖 SmartCodeNova: "${testimonial.botResponse}"
━━━━━━━━━━━━━━━━━━
📅 ${testimonial.timestamp}

📝 Share your experience in the group or DM us!`;

      for (const chatId of groups) {
        await sendTelegramMessage(message, chatId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Testimonial sent as text (image generation failed)',
          data: {
            testimonial: testimonial,
            groups: groups,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});