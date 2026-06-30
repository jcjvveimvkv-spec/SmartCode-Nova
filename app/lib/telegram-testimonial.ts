// app/lib/telegram-testimonial.ts

export interface TestimonialData {
  name: string;
  userId: string;
  country: string;
  message: string;
  botResponse: string;
  timestamp: string;
}

// Name pools for randomization
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

// Testimonial messages pool
const userMessages = [
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
  "I've recommended SmartCodeNova to all my friends. They're all seeing great results! 🌟",
  "The daily settlement feature is amazing. I wake up to profits every morning! ☀️",
  "I started with just $100 and now I'm at $2,500. Thank you SmartCodeNova! 🙏",
  "Finally a platform that actually delivers what it promises. 10/10! ⭐",
  "The NOVA-3 bot is my favorite. 15% return in 7 days is incredible! 🔥",
  "I've been in crypto for years and SmartCodeNova is the best platform I've found. 💯",
  "The community is so supportive and the team is always available to help. 🤝",
  "Just doubled my investment in 3 weeks. This is life-changing! 💪",
  "I love how easy it is to use SmartCodeNova. Even my grandma could do it! 😄",
  "The bots are so intelligent. They always make the right trades. 🧠",
  "SmartCodeNova has changed my financial future. I'm so grateful! 🙏",
  "I've never seen a platform this transparent and reliable. Truly remarkable! 👏",
  "The passive income I'm earning with SmartCodeNova is life-changing! 💵",
  "NOVA-1 bot is a money-making machine! 5% daily returns! 🤑",
  "I've referred 10 people to SmartCodeNova and they're all earning! 🎯",
  "The 24/7 support team is incredible. Always there when you need them! 🎧",
  "SmartCodeNova makes crypto trading simple and profitable. Love it! ❤️",
  "My portfolio has grown 300% since joining SmartCodeNova! 📈",
  "The best part about SmartCodeNova is the transparency. I see everything! 👀",
  "NOVA-4 bot is a beast! 30% return in 14 days is insane! 🦍",
];

// Bot responses pool
const botResponses = [
  "Thank you for sharing your experience! We're glad to have you in our community. 🙌",
  "We appreciate your feedback! It's users like you that make SmartCodeNova great. 💪",
  "Congratulations on your success! Your journey with us is just beginning. 🚀",
  "Thank you for trusting SmartCodeNova! We're here to help you grow. 🤝",
  "We're thrilled to hear about your success! Keep it up! 💎",
  "Your feedback motivates us to keep improving! Thank you! 🙏",
  "We're honored to have you as part of our family! 🌟",
  "This is exactly why we do what we do! Thank you for sharing! ❤️",
  "Your success is our success! Keep pushing forward! 💪",
  "We're so happy to hear this! The best is yet to come! 🚀",
  "Thank you for being part of our journey! 🙌",
  "We appreciate your trust in us! Let's grow together! 🌱",
];

const inspirationQuotes = [
  "💡 \"The best time to invest was yesterday. The next best time is now.\"",
  "💰 \"Wealth is not about having a lot of money; it's about having a lot of options.\"",
  "📈 \"Crypto is not just about money; it's about freedom.\"",
  "🚀 \"The future belongs to those who believe in the beauty of their dreams.\"",
  "💪 \"Success is not final, failure is not fatal: it is the courage to continue that counts.\"",
  "🌟 \"The only way to do great work is to love what you do.\"",
  "🔥 \"In the middle of difficulty lies opportunity.\"",
  "🎯 \"The secret of getting ahead is getting started.\"",
  "💎 \"Believe you can and you're halfway there.\"",
  "🦅 \"The best way to predict the future is to create it.\"",
  "📊 \"Your portfolio is not just about money, it's about your future.\"",
  "🤖 \"The robots are coming, and they're bringing profits!\"",
  "🌈 \"Every crypto journey starts with a single trade.\"",
  "⚡ \"The only limit to our realization of tomorrow is our doubts of today.\"",
  "🏆 \"Success usually comes to those who are too busy to be looking for it.\"",
  "🌅 \"The future belongs to those who prepare for it today.\"",
  "🎯 \"Focus on your goals, not your obstacles.\"",
  "💪 \"Strength does not come from winning. Your struggles develop your strengths.\"",
  "🌟 \"Success is not the key to happiness. Happiness is the key to success.\"",
  "🚀 \"Opportunities don't happen. You create them.\"",
  "📈 \"The stock market is a device for transferring money from the impatient to the patient.\"",
  "💎 \"Diamonds are made under pressure.\"",
  "🌊 \"Smooth seas do not make skillful sailors.\"",
  "🏔️ \"The only way to the top is to keep climbing.\"",
  "🔥 \"Start where you are. Use what you have. Do what you can.\"",
];

export function getRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomRegion(): keyof typeof firstNames {
  const regions = Object.keys(firstNames) as (keyof typeof firstNames)[];
  return getRandom(regions);
}

export function generateTestimonial(): TestimonialData {
  const region = getRandomRegion();
  const firstName = getRandom(firstNames[region]);
  const lastName = getRandom(lastNames[region]);
  const fullName = `${firstName} ${lastName}`;
  const userId = `${fullName.slice(0, 2).toUpperCase()}***${fullName.slice(-2).toUpperCase()}`;
  const country = countries[region] || '🌍 Unknown';
  const message = getRandom(userMessages);
  const botResponse = getRandom(botResponses);

  return {
    name: fullName,
    userId: userId,
    country: country,
    message: message,
    botResponse: botResponse,
    timestamp: new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  };
}

export function generateTestimonialMessage(data: TestimonialData): string {
  return `🗣️ NEW TESTIMONIAL SHARED 🗣️
━━━━━━━━━━━━━━━━━━
👤 ${data.name}
🌍 ${data.country}
🆔 User ID: ${data.userId}

💬 "${data.message}"

🤖 SmartCodeNova: "${data.botResponse}"
━━━━━━━━━━━━━━━━━━
📅 ${data.timestamp}

📝 Share your experience in the group or DM us!`;
}

export function generateInspirationQuote(): string {
  return getRandom(inspirationQuotes);
}

export function generateQuoteMessage(quote: string): string {
  return `💬 INSPIRATION FOR TODAY 💬
━━━━━━━━━━━━━━━━━━
${quote}
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString('en-US', { 
  month: 'short', 
  day: 'numeric', 
  year: 'numeric',
  hour: '2-digit', 
  minute: '2-digit' 
})}

🌟 SmartCodeNova - Building wealth together!`;
}