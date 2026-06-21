// supabase/functions/community-ai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS Headers (Required for browser access)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PERSONAS = [
  {
    name: 'Jeremy Arevalo',
    systemPrompt: `You are Jeremy Arevalo, an enthusiastic and energetic trader who loves SmartCodeNova. 
    You're always hyped about profits, excited about new features, and love sharing your wins. 
    You speak in a friendly, upbeat tone and often use emojis. You're the person who gets everyone excited about trading.`
  },
  {
    name: 'Kastaneer Franco',
    systemPrompt: `You are Kastaneer Franco, a seasoned veteran trader with years of experience. 
    You're wise, calm, and give practical advice about risk management and long-term strategy. 
    You speak in a measured, thoughtful tone. You believe in consistency and discipline over hype.`
  },
  {
    name: 'Margaritha Bacuna',
    systemPrompt: `You are Margaritha Bacuna, the funny one who keeps the community light and entertaining. 
    You love cracking jokes, making witty observations, and poking fun at the ups and downs of trading. 
    You speak in a humorous, sarcastic, and playful tone. You make people laugh even when the market is quiet.`
  },
  {
    name: 'Sara Caicedo',
    systemPrompt: `You are Sara Caicedo, the supportive and welcoming member who makes everyone feel at home. 
    You're warm, kind, and always ready to help new users. You ask questions, show genuine interest in others, 
    and make the community feel like family. You speak in a caring, encouraging tone.`
  }
];

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body = await req.json();
    const { user_id, message } = body;
    
    if (!user_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing user_id or message' }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // 3-5 second delay for fast testing (increase to 25-35s later)
    const delay = Math.floor(Math.random() * 2000) + 3000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Fetch recent conversation history
    const { data: history } = await supabase
      .from('community_comments')
      .select('username, message, is_ai')
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = (history || []).reverse().map(h => 
      `${h.is_ai ? 'AI' : 'User'} ${h.username}: ${h.message}`
    ).join('\n');

    // Pick a random persona
    const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `${persona.systemPrompt}
            
            You are participating in a community chat about SmartCodeNova, a trading platform with AI bots.
            Topics include: bot investments, profits, platform features, trading strategies, and community banter.
            
            Keep your response short and natural (1-2 sentences max).
            Don't mention that you're an AI.
            Stay in character as ${persona.name}.
            Respond to the latest message in the conversation: "${message}"
            
            Here's the conversation history:
            ${conversationHistory}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 80
      })
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq API error:', error);
      return new Response(JSON.stringify({ error: 'Groq API failed' }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const groqData = await groqResponse.json();
    const aiReply = groqData.choices[0]?.message?.content?.trim();

    if (!aiReply) {
      throw new Error('No AI response generated');
    }

    // Back-date timestamp by 2-5 minutes
    const randomMinutesAgo = Math.floor(Math.random() * 3) + 2;
    const backdatedTime = new Date(Date.now() - randomMinutesAgo * 60 * 1000);

    // Insert AI response into database
    const { error: insertError } = await supabase
      .from('community_comments')
      .insert({
        username: persona.name,
        message: aiReply,
        is_ai: true,
        ai_persona: persona.name,
        created_at: backdatedTime.toISOString()
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      persona: persona.name,
      reply: aiReply 
    }), { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('Community AI error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
});