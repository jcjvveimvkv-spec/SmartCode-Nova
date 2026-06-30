// app/lib/testimonial-image.ts

export interface TestimonialData {
  name: string;
  userId: string;
  country: string;
  message: string;
  botResponse: string;
  timestamp: string;
  language: string;
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

// Multilingual message pools
const languageMessages = {
  english: {
    userMessages: [
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
    ],
    botResponses: [
      "Thank you for sharing your experience! We're glad to have you in our community. 🙌",
      "We appreciate your feedback! It's users like you that make SmartCodeNova great. 💪",
      "Congratulations on your success! Your journey with us is just beginning. 🚀",
      "Thank you for trusting SmartCodeNova! We're here to help you grow. 🤝",
      "We're thrilled to hear about your success! Keep it up! 💎",
      "Your feedback motivates us to keep improving! Thank you! 🙏",
    ]
  },
  spanish: {
    userMessages: [
      "He estado usando SmartCodeNova por 3 meses y mi cartera ha crecido un 40%! ¡La mejor decisión de inversión que he tomado! 🚀",
      "¡Acabo de recibir mi primer pago de 250 USDT! Esta plataforma es legítima. 💰",
      "¡El bot NOVA-1 es increíble! Me hizo ganar un 15% en solo 48 horas. 🤖",
      "Al principio era escéptico, pero SmartCodeNova me demostró lo contrario. ¡Mi inversión de $500 ahora es $850! 💎",
      "La mejor plataforma de trading que he usado. ¡El soporte al cliente es increíble! 🙌",
      "El bot NOVA-2 me dio un 10% de ganancia en 4 días. ¡Estoy muy feliz con esta plataforma! 🎉",
    ],
    botResponses: [
      "¡Gracias por compartir tu experiencia! Nos alegra tenerte en nuestra comunidad. 🙌",
      "¡Agradecemos tus comentarios! Son usuarios como tú los que hacen grande a SmartCodeNova. 💪",
      "¡Felicitaciones por tu éxito! Tu viaje con nosotros apenas comienza. 🚀",
      "¡Gracias por confiar en SmartCodeNova! Estamos aquí para ayudarte a crecer. 🤝",
      "¡Nos encanta escuchar sobre tu éxito! ¡Sigue así! 💎",
    ]
  },
  arabic: {
    userMessages: [
      "لقد كنت أستخدم SmartCodeNova لمدة 3 أشهر ونمت محفظتي بنسبة 40%! أفضل قرار استثماري اتخذته على الإطلاق. 🚀",
      "لقد تلقيت للتو أول دفعة لي بقيمة 250 USDT! هذه المنصة شرعية. 💰",
      "روبوت NOVA-1 لا يصدق! حقق لي ربحًا بنسبة 15% في 48 ساعة فقط. 🤖",
      "كنت متشككًا في البداية، لكن SmartCodeNova أثبت خطأ ظني. استثماري البالغ $500 أصبح الآن $850! 💎",
      "أفضل منصة تداول استخدمتها على الإطلاق. دعم العملاء مذهل! 🙌",
      "روبوت NOVA-2 حقق لي ربحًا بنسبة 10% في 4 أيام. أنا سعيد جدًا بهذه المنصة! 🎉",
    ],
    botResponses: [
      "شكرًا لك على مشاركة تجربتك! نحن سعداء بوجودك في مجتمعنا. 🙌",
      "نحن نقدر ملاحظاتك! المستخدمون مثلك هم ما يجعل SmartCodeNova عظيمة. 💪",
      "تهانينا على نجاحك! رحلتك معنا قد بدأت للتو. 🚀",
      "شكرًا لك على ثقتك في SmartCodeNova! نحن هنا لمساعدتك على النمو. 🤝",
      "نحن سعداء جدًا لسماع هذا! الأفضل لم يأت بعد! 🚀",
    ]
  },
  french: {
    userMessages: [
      "J'utilise SmartCodeNova depuis 3 mois et mon portefeuille a augmenté de 40%! La meilleure décision d'investissement que j'ai jamais prise. 🚀",
      "Je viens de recevoir mon premier paiement de 250 USDT! Cette plateforme est légitime. 💰",
      "Le bot NOVA-1 est incroyable! Il m'a fait gagner 15% en seulement 48 heures. 🤖",
      "J'étais sceptique au début, mais SmartCodeNova m'a prouvé le contraire. Mon investissement de $500 est maintenant $850! 💎",
      "La meilleure plateforme de trading que j'ai utilisée. Le service client est incroyable! 🙌",
      "Le bot NOVA-2 m'a fait gagner 10% en 4 jours. Je suis tellement content de cette plateforme! 🎉",
    ],
    botResponses: [
      "Merci de partager votre expérience! Nous sommes ravis de vous avoir dans notre communauté. 🙌",
      "Nous apprécions vos commentaires! Ce sont des utilisateurs comme vous qui font la grandeur de SmartCodeNova. 💪",
      "Félicitations pour votre succès! Votre voyage avec nous ne fait que commencer. 🚀",
      "Merci de faire confiance à SmartCodeNova! Nous sommes là pour vous aider à grandir. 🤝",
      "Nous sommes ravis d'entendre cela! Le meilleur est à venir! 🚀",
    ]
  }
};

const languages = [
  { code: 'english', label: 'English', weight: 60 },
  { code: 'spanish', label: 'Spanish', weight: 15 },
  { code: 'arabic', label: 'Arabic', weight: 15 },
  { code: 'french', label: 'French', weight: 10 },
];

function getWeightedRandomLanguage(): string {
  const totalWeight = languages.reduce((sum, lang) => sum + lang.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const lang of languages) {
    random -= lang.weight;
    if (random <= 0) {
      return lang.code;
    }
  }
  return 'english';
}

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
  
  const languageCode = getWeightedRandomLanguage();
  const langData = languageMessages[languageCode as keyof typeof languageMessages];
  
  const message = getRandom(langData.userMessages);
  const botResponse = getRandom(langData.botResponses);

  const languageLabels: Record<string, string> = {
    english: 'English 🇬🇧',
    spanish: 'Spanish 🇪🇸',
    arabic: 'Arabic 🇸🇦',
    french: 'French 🇫🇷'
  };

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
      minute: '2-digit',
      hour12: true
    }),
    language: languageLabels[languageCode] || 'English 🇬🇧',
  };
}

export function generateTelegramHTML(data: TestimonialData, theme: 'dark' | 'light' = 'dark'): string {
  const userInitial = data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const logoUrl = 'https://texuzrwyjecjxkrnemeg.supabase.co/storage/v1/object/public/logo/logo.png';

  // Theme colors
  const colors = theme === 'dark' ? {
    bg: '#17212b',
    headerBg: '#1f2a36',
    border: '#2b3a4a',
    text: '#ffffff',
    textSecondary: '#7d8b9b',
    senderBubble: '#2b5278',
    senderText: '#ffffff',
    recipientBubble: '#1f2a36',
    recipientText: '#e8edf3',
    replyBg: '#1f2a36',
    replyText: '#ffffff',
    footerBg: '#17212b',
    footerText: '#7d8b9b',
    onlineColor: '#4fc3f7',
    inputBg: '#1f2a36',
    seenColor: '#4fc3f7',
    senderAvatarBg: 'transparent',
    recipientAvatarBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  } : {
    bg: '#e8edf3',
    headerBg: '#ffffff',
    border: '#d5dce3',
    text: '#000000',
    textSecondary: '#6b7280',
    senderBubble: '#0084ff',
    senderText: '#ffffff',
    recipientBubble: '#ffffff',
    recipientText: '#1a1a1a',
    replyBg: '#ffffff',
    replyText: '#1a1a1a',
    footerBg: '#e8edf3',
    footerText: '#6b7280',
    onlineColor: '#4fc3f7',
    inputBg: '#f0f0f0',
    seenColor: '#4fc3f7',
    senderAvatarBg: 'transparent',
    recipientAvatarBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Telegram Chat</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          background: #0f0f0f; 
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .telegram-container {
          max-width: 420px;
          width: 100%;
          background: ${colors.bg};
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        }
        .telegram-header {
          background: ${colors.headerBg};
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid ${colors.border};
        }
        .back-btn {
          color: ${colors.textSecondary};
          font-size: 20px;
          cursor: pointer;
          background: none;
          border: none;
        }
        .back-btn:hover { color: ${colors.text}; }
        .avatar-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          flex-shrink: 0;
          background: ${colors.recipientAvatarBg};
        }
        .chat-info { flex: 1; }
        .chat-name {
          font-size: 16px;
          font-weight: 600;
          color: ${colors.text};
          line-height: 1.2;
        }
        .chat-status {
          font-size: 12px;
          color: ${colors.textSecondary};
        }
        .chat-status.online {
          color: ${colors.onlineColor};
        }
        .header-actions {
          display: flex;
          gap: 16px;
          color: ${colors.textSecondary};
          font-size: 18px;
        }
        .header-actions i { cursor: pointer; }
        .header-actions i:hover { color: ${colors.text}; }
        .telegram-body {
          padding: 12px 16px 8px;
          min-height: 400px;
          max-height: 550px;
          overflow-y: auto;
          background: ${colors.bg};
          position: relative;
        }
        .telegram-body::-webkit-scrollbar { width: 4px; }
        .telegram-body::-webkit-scrollbar-track { background: transparent; }
        .telegram-body::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 4px; }
        .date-divider {
          text-align: center;
          padding: 8px 0 12px;
        }
        .date-divider span {
          background: ${colors.headerBg};
          color: ${colors.textSecondary};
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 6px;
        }
        .message {
          display: flex;
          margin-bottom: 4px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.sent { justify-content: flex-end; }
        .message.received { justify-content: flex-start; }
        .bubble {
          max-width: 78%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          position: relative;
        }
        .bubble.sent-bubble {
          background: ${colors.senderBubble};
          color: ${colors.senderText};
          border-bottom-right-radius: 4px;
        }
        .bubble.received-bubble {
          background: ${colors.recipientBubble};
          color: ${colors.recipientText};
          border-bottom-left-radius: 4px;
        }
        .bubble .time {
          font-size: 10px;
          color: ${colors.textSecondary};
          margin-top: 2px;
          text-align: right;
          display: block;
        }
        .bubble.sent-bubble .time { color: ${colors.textSecondary}; }
        .avatar-small {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          flex-shrink: 0;
          margin-top: 2px;
          overflow: hidden;
        }
        .avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-small.sender-avatar {
          background: ${colors.senderAvatarBg};
          margin-left: 8px;
          order: 1;
        }
        .avatar-small.recipient-avatar {
          background: ${colors.recipientAvatarBg};
          margin-right: 8px;
        }
        .message.received .avatar-small { margin-right: 8px; }
        .message.sent .avatar-small { margin-left: 8px; order: 1; }
        .seen-indicator {
          text-align: right;
          font-size: 10px;
          color: ${colors.seenColor};
          padding: 4px 8px 8px 0;
          letter-spacing: 0.5px;
        }
        .reply-bar {
          padding: 8px 12px 12px;
          background: ${colors.bg};
          border-top: 1px solid ${colors.border};
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .reply-bar input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 20px;
          border: none;
          background: ${colors.inputBg};
          color: ${colors.replyText};
          font-size: 14px;
          outline: none;
        }
        .reply-bar input::placeholder {
          color: ${colors.textSecondary};
        }
        .reply-bar .emoji-btn,
        .reply-bar .send-btn {
          background: none;
          border: none;
          color: ${colors.textSecondary};
          font-size: 20px;
          cursor: pointer;
          padding: 4px 6px;
        }
        .reply-bar .send-btn { color: ${colors.onlineColor}; }
        .reply-bar .send-btn:hover { color: #81d4fa; }
        .reply-bar .emoji-btn:hover { color: ${colors.text}; }
        .footer {
          padding: 12px 16px;
          background: ${colors.headerBg};
          border-top: 1px solid ${colors.border};
          text-align: center;
        }
        .footer-text {
          color: ${colors.textSecondary};
          font-size: 12px;
        }
        .footer-text span {
          color: #6366f1;
          font-weight: 500;
        }
        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div class="telegram-container" id="screenshot">
        <!-- Header -->
        <div class="telegram-header">
          <button class="back-btn"><i class="fas fa-arrow-left"></i></button>
          <div class="avatar-group">
            <div class="avatar">${userInitial}</div>
            <div class="chat-info">
              <div class="chat-name">${data.name}</div>
              <div class="chat-status online"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i>Online</div>
            </div>
          </div>
          <div class="header-actions">
            <i class="fas fa-phone"></i>
            <i class="fas fa-video"></i>
            <i class="fas fa-ellipsis-v"></i>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="telegram-body">
          <div class="date-divider"><span>Today</span></div>

          <!-- SENDER: SmartCodeNova sends message -->
          <div class="message sent">
            <div class="bubble sent-bubble">
              ${data.botResponse}
              <span class="time">${data.timestamp}</span>
            </div>
            <div class="avatar-small sender-avatar">
              <img src="${logoUrl}" alt="SmartCodeNova" class="logo-img" />
            </div>
          </div>

          <!-- RECIPIENT: User replies -->
          <div class="message received">
            <div class="avatar-small recipient-avatar">${userInitial}</div>
            <div class="bubble received-bubble">
              ${data.message}
              <span class="time">${data.timestamp}</span>
            </div>
          </div>

          <!-- SENDER: SmartCodeNova replies -->
          <div class="message sent">
            <div class="bubble sent-bubble">
              ${data.botResponse}
              <span class="time">${data.timestamp}</span>
            </div>
            <div class="avatar-small sender-avatar">
              <img src="${logoUrl}" alt="SmartCodeNova" class="logo-img" />
            </div>
          </div>

          <!-- Seen Indicator -->
          <div class="seen-indicator">
            <i class="fas fa-check-double"></i> Seen ${data.timestamp}
          </div>
        </div>

        <!-- Reply Bar -->
        <div class="reply-bar">
          <button class="emoji-btn"><i class="fas fa-smile"></i></button>
          <input type="text" placeholder="Message..." readonly />
          <button class="emoji-btn"><i class="fas fa-paperclip"></i></button>
          <button class="send-btn"><i class="fas fa-paper-plane"></i></button>
        </div>

        <!-- Footer -->
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