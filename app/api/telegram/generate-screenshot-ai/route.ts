import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('📝 Generating testimonial from local data');
  
  try {
    // Get the testimonial from local data
    const testimonial = getRandomTestimonial();
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });

    return NextResponse.json({
      success: true,
      testimonial: {
        ...testimonial,
        timestamp,
      },
      source: 'local'
    });
  } catch (error: any) {
    console.error('❌ Error generating testimonial:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate testimonial'
    }, { status: 500 });
  }
}

function getRandomTestimonial() {
  const testimonials = [
    {
      name: 'Rahul Sharma',
      userId: 'RA***MA',
      country: '🇮🇳 India',
      message: 'SmartCodeNova has completely changed my trading game! I\'ve been using the NOVA-1 bot for 6 months and my portfolio has grown by 40%. The platform is incredibly user-friendly and the support team is always helpful. 🚀',
      botResponse: 'Thank you Rahul! We are thrilled to have you in our community. Keep growing with SmartCodeNova! 💪'
    },
    {
      name: 'Sarah Johnson',
      userId: 'SA***ON',
      country: '🇬🇧 United Kingdom',
      message: 'I was skeptical at first, but SmartCodeNova\'s AI-powered trading bots are truly impressive. I\'ve made more profit in 3 months than I did in 2 years with traditional trading. Absolutely life-changing! 🌟',
      botResponse: 'Thank you Sarah! Your success story inspires us. We\'re committed to helping more traders achieve their financial goals! 🎯'
    },
    {
      name: 'David Kim',
      userId: 'DA***IM',
      country: '🇰🇷 South Korea',
      message: 'The automated trading features on SmartCodeNova are next-level. I\'ve been able to 2x my investment in just 4 months without actively trading. This platform is a game-changer for busy professionals! 💼',
      botResponse: 'Amazing progress David! We designed SmartCodeNova for people like you who want to grow wealth without spending hours on charts. Keep it up! 🚀'
    },
    {
      name: 'Maria Garcia',
      userId: 'MA***IA',
      country: '🇪🇸 Spain',
      message: 'I\'ve tried many trading platforms, but SmartCodeNova stands out. The NOVA-2 bot\'s performance is outstanding, and the community support is unmatched. I\'ve recommended it to all my friends! 🏆',
      botResponse: 'Thank you Maria! Word-of-mouth from satisfied users like you is our best advertisement. We appreciate your trust! 🙌'
    },
    {
      name: 'James Okafor',
      userId: 'JA***OR',
      country: '🇬🇭 Ghana',
      message: 'SmartCodeNova has been a revelation for me. The platform\'s educational resources and trading signals have helped me become a better trader. I\'m consistently making profits now! 📈',
      botResponse: 'We\'re proud of your growth James! Education is key to success in crypto, and we\'re here to support you every step of the way! 💡'
    },
    {
      name: 'Emma Thompson',
      userId: 'EM***ON',
      country: '🇦🇺 Australia',
      message: 'I\'ve been using SmartCodeNova for 8 months now, and I\'m absolutely thrilled with the results. The NOVA-3 bot\'s AI predictions are incredibly accurate, and I\'ve seen consistent growth every month! 🌊',
      botResponse: 'Thank you Emma! We love hearing success stories from our Australian traders. You\'re on the right track! 🚀'
    },
    {
      name: 'Chen Wei',
      userId: 'CH***EI',
      country: '🇸🇬 Singapore',
      message: 'SmartCodeNova is the best trading platform I\'ve ever used. The interface is clean, the bots are intelligent, and the support team is always available. I\'ve been recommending it to everyone in my network! 🎯',
      botResponse: 'Thank you Chen Wei! We\'re honored to have traders like you in our community. Keep achieving your financial goals! 💪'
    },
    {
      name: 'Lisa Anderson',
      userId: 'LI***ON',
      country: '🇨🇦 Canada',
      message: 'I\'m so glad I found SmartCodeNova! The platform is easy to use, the profits are consistent, and the community is amazing. I\'ve already referred 5 friends and they all love it! ❤️',
      botResponse: 'Thank you Lisa! Your support means the world to us. We\'re building something special together! 🚀'
    }
  ];
  
  return testimonials[Math.floor(Math.random() * testimonials.length)];
}