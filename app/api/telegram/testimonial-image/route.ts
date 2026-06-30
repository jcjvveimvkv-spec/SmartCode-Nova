// lib/testimonial-image.ts

export interface TestimonialData {
  name: string;
  userId: string;
  country: string;
  message: string;
  botResponse: string;
  timestamp: string;
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
];

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

export function generateTelegramHTML(data: TestimonialData): string {
  const userInitial = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const botInitial = 'SN';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          background: #1e2530; 
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .screenshot {
          width: 400px;
          background: #1e2530;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .header {
          padding: 16px 20px;
          background: #1e2530;
          border-bottom: 1px solid #2a2f3a;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
        }
        .header-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
        }
        .header-status {
          color: #8e96a3;
          font-size: 12px;
        }
        .chat-area {
          padding: 12px 16px;
          min-height: 300px;
        }
        .date-divider {
          text-align: center;
          color: #8e96a3;
          font-size: 11px;
          padding: 8px 0 12px 0;
          font-weight: 500;
        }
        .message-user {
          display: flex;
          justify-content: flex-end;
          margin: 6px 0 2px 0;
        }
        .message-user .bubble {
          background: #0084ff;
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 18px 18px 4px 18px;
          max-width: 75%;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .message-bot {
          display: flex;
          justify-content: flex-start;
          margin: 6px 0 2px 0;
        }
        .message-bot .bubble {
          background: #2a2f3a;
          color: #d9dadf;
          padding: 10px 14px;
          border-radius: 18px 18px 18px 4px;
          max-width: 75%;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .message-time {
          font-size: 10px;
          color: #6b7280;
          padding: 0 10px 6px 0;
          text-align: right;
        }
        .message-time-left {
          font-size: 10px;
          color: #6b7280;
          padding: 0 0 6px 10px;
          text-align: left;
        }
        .message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 10px;
          color: white;
        }
        .message-user-avatar {
          background: #6366f1;
          margin-left: 8px;
        }
        .message-bot-avatar {
          background: linear-gradient(135deg, #10b981, #059669);
          margin-right: 8px;
        }
        .message-row {
          display: flex;
          align-items: flex-end;
        }
        .message-row-user {
          justify-content: flex-end;
        }
        .message-row-bot {
          justify-content: flex-start;
        }
        .footer {
          padding: 16px 20px;
          background: #1a1f2a;
          border-top: 1px solid #2a2f3a;
          text-align: center;
        }
        .footer-text {
          color: #8e96a3;
          font-size: 12px;
        }
        .footer-text span {
          color: #6366f1;
          font-weight: 500;
        }
        .reply-bar {
          padding: 10px 16px;
          background: #1e2530;
          border-top: 1px solid #2a2f3a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .reply-input {
          flex: 1;
          background: #2a2f3a;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          color: #d9dadf;
          font-size: 13px;
          outline: none;
        }
        .reply-send {
          color: #0084ff;
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div class="screenshot" id="screenshot">
        <div class="header">
          <div class="header-avatar">${botInitial}</div>
          <div>
            <div class="header-name">SmartCodeNova</div>
            <div class="header-status">online</div>
          </div>
        </div>

        <div class="chat-area">
          <div class="date-divider">Today</div>

          <!-- Bot Welcome Message -->
          <div class="message-row message-row-bot">
            <div class="message-bot-avatar message-avatar">${botInitial}</div>
            <div>
              <div class="message-bot">
                <div class="bubble">
                  Thank you for sharing your experience! We're glad to have you in our community. 🙌
                </div>
              </div>
              <div class="message-time-left">${data.timestamp}</div>
            </div>
          </div>

          <!-- User Message -->
          <div class="message-row message-row-user">
            <div>
              <div class="message-user">
                <div class="bubble">
                  ${data.message}
                </div>
              </div>
              <div class="message-time">${data.timestamp} ✓✓</div>
            </div>
            <div class="message-user-avatar message-avatar">${userInitial}</div>
          </div>

          <!-- Bot Reply -->
          <div class="message-row message-row-bot">
            <div class="message-bot-avatar message-avatar">${botInitial}</div>
            <div>
              <div class="message-bot">
                <div class="bubble">
                  ${data.botResponse}
                </div>
              </div>
              <div class="message-time-left">${data.timestamp}</div>
            </div>
          </div>
        </div>

        <div class="reply-bar">
          <span style="color:#6b7280;font-size:18px;">➕</span>
          <input class="reply-input" placeholder="Message" readonly />
          <span style="color:#6b7280;font-size:18px;">😊</span>
          <span class="reply-send">➤</span>
        </div>

        <div class="footer">
          <div class="footer-text">
            📝 Share your experience in the group or <span>DM us!</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}