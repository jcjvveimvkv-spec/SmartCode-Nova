import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🖼️ WhatsApp UI Screenshot API called');
  
  try {
    const body = await request.json();
    const { testimonial } = body;

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Missing testimonial data' },
        { status: 400 }
      );
    }

    console.log('📝 Generating WhatsApp UI for:', testimonial.name);

    // Generate the WhatsApp UI HTML
    const html = generateWhatsAppUI(testimonial);
    
    // Convert to base64 data URL
    const base64HTML = Buffer.from(html).toString('base64');
    const imageUrl = `data:text/html;base64,${base64HTML}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      format: 'html'
    });

  } catch (error: any) {
    console.error('❌ Error generating screenshot:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate screenshot' 
      },
      { status: 500 }
    );
  }
}

function generateWhatsAppUI(testimonial: any): string {
  const { name, userId, country, message, botResponse, timestamp } = testimonial;
  
  // Generate avatar color based on name
  const colors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e', '#e17055', '#00cec9', '#fd79a8', '#a29bfe'];
  const colorIndex = name.length % colors.length;
  const avatarColor = colors[colorIndex];
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  // Current time
  const currentTime = timestamp || new Date().toLocaleString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WhatsApp Chat - ${name}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
    <style>
        /* ===== Base WhatsApp Styles ===== */
        :root {
            --bg-img: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjQyNDI0Ii8+PHJlY3QgeD0iNDAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzJhMmEyYSIvPjwvc3ZnPg==');
            --msg-s-bg-color: #d9fdd3;
            --msg-r-bg-color: #ffffff;
            --msg-text-color: #111b21;
            --msg-time-color: rgba(0, 0, 0, 0.45);
            --rec-msg-time-color: rgba(0, 0, 0, 0.45);
            --android-header-color: #075e54;
            --gray-black: #667781;
            --input-bar: #ffffff;
            --icon-color: #54656f;
            --dark-color: #000000;
            --green-color: #128C7E;
            --light-green-color: #d9fdd3;
            --dark-green-color: #005c4b;
            --light-bg-color: #ffffff;
            --dark-bg-color: #202c33;
            --light-color: #e9edef;
            --gary-color: #667781;
            --gary-dark-color: #2a3942;
            --icon-light-color: #aebac1;
            --icon-dark-color: #54656f;
            --new-bg-light: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMmY1Ii8+PHJlY3QgeD0iNDAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2U4ZWJlZCIvPjwvc3ZnPg==');
            --new-bg-dark: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjQyNDI0Ii8+PHJlY3QgeD0iNDAiIHdpZHRoPSI0MCIgaGVpZHRoPSI0MCIgZmlsbD0iIzJhMmEyYSIvPjwvc3ZnPg==');
            --link-color: #1b8feb;
            --ios-link-color: #10ad50;
            --edit-delete-bg: rgba(0, 0, 0, 0.45);
            --reply-bg: rgba(216, 216, 216, 0.259);
            --rec-reply-bg: rgba(216, 216, 216, 0.259);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
            outline: none !important;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            background: #0a0a0a !important;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        /* WhatsApp Container */
        .whatsapp-container {
            max-width: 420px;
            width: 100%;
            background-color: #0a0a0a;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }

        /* Chat Background */
        .whatsapp-body {
            padding: 10px 12px 8px;
            min-height: 500px;
            max-height: 600px;
            overflow-y: auto;
            background-image: var(--new-bg-light);
            background-size: cover;
            background-position: center;
            position: relative;
        }

        .whatsapp-body::-webkit-scrollbar {
            width: 4px;
        }

        .whatsapp-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .whatsapp-body::-webkit-scrollbar-thumb {
            background: #2b3a4a;
            border-radius: 4px;
        }

        /* Header */
        .whatsapp-header {
            background-color: #075e54;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid #054740;
        }

        .back-btn {
            color: #ffffff;
            font-size: 18px;
            cursor: pointer;
            background: none;
            border: none;
            transition: color 0.3s;
        }

        .back-btn:hover {
            color: #d1d1d1;
        }

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
        }

        .avatar-user {
            background: ${avatarColor};
        }

        .chat-info {
            flex: 1;
        }

        .chat-name {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            line-height: 1.2;
        }

        .chat-status {
            font-size: 12px;
            color: #a0a0a0;
        }

        .chat-status.online {
            color: #4fc3f7;
        }

        .header-actions {
            display: flex;
            gap: 14px;
            color: #ffffff;
            font-size: 18px;
        }

        .header-actions i {
            cursor: pointer;
            transition: color 0.3s;
        }

        .header-actions i:hover {
            color: #d1d1d1;
        }

        /* Date Divider */
        .date-divider {
            text-align: center;
            padding: 8px 0 12px;
        }

        .date-divider span {
            background-color: rgba(0, 0, 0, 0.1);
            color: #667781;
            font-size: 12px;
            padding: 4px 14px;
            border-radius: 6px;
        }

        /* Message Bubbles */
        .message {
            display: flex;
            margin-bottom: 2px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.sent {
            justify-content: flex-end;
        }

        .message.received {
            justify-content: flex-start;
        }

        .bubble {
            max-width: 78%;
            padding: 7px 10px 8px 10px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            position: relative;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.13);
        }

        .bubble.sent-bubble {
            background-color: #d9fdd3;
            color: #111b21;
            border-bottom-right-radius: 4px;
        }

        .bubble.received-bubble {
            background-color: #ffffff;
            color: #111b21;
            border-bottom-left-radius: 4px;
        }

        .bubble .time {
            font-size: 11px;
            color: rgba(0, 0, 0, 0.45);
            margin-top: 2px;
            text-align: right;
            display: block;
            line-height: 1.2;
        }

        .bubble .time i {
            font-size: 12px;
            margin-left: 3px;
            color: #53bdeb;
        }

        .message .avatar-small {
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
        }

        .message.received .avatar-small {
            margin-right: 8px;
        }

        .message.sent .avatar-small {
            margin-left: 8px;
            order: 1;
        }

        /* Seen indicator */
        .seen-indicator {
            text-align: right;
            font-size: 11px;
            color: #667781;
            padding: 4px 8px 8px 0;
            letter-spacing: 0.3px;
        }

        .seen-indicator i {
            color: #53bdeb;
            margin-right: 2px;
        }

        /* Reply Bar */
        .reply-bar {
            padding: 6px 10px 10px;
            background-color: #f0f0f0;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .reply-bar input {
            flex: 1;
            padding: 8px 14px;
            border-radius: 20px;
            border: none;
            background-color: #ffffff;
            color: #111b21;
            font-size: 14px;
            outline: none;
        }

        .reply-bar input::placeholder {
            color: #8a8a8a;
        }

        .reply-bar .emoji-btn,
        .reply-bar .send-btn {
            background: none;
            border: none;
            color: #54656f;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 6px;
            transition: color 0.3s;
        }

        .reply-bar .send-btn {
            color: #075e54;
        }

        .reply-bar .send-btn:hover {
            color: #054740;
        }

        .reply-bar .emoji-btn:hover {
            color: #111b21;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .whatsapp-container {
                border-radius: 12px;
            }
            .bubble {
                font-size: 13px;
                padding: 6px 9px;
                max-width: 82%;
            }
            .chat-name {
                font-size: 14px;
            }
            .whatsapp-body {
                padding: 8px 10px 6px;
            }
        }

        /* System message style */
        .system-message {
            text-align: center;
            padding: 4px 0 8px;
        }
        .system-message span {
            background-color: rgba(0, 0, 0, 0.08);
            color: #667781;
            font-size: 12px;
            padding: 4px 14px;
            border-radius: 6px;
            display: inline-block;
        }
    </style>
</head>
<body>

    <div class="whatsapp-container">
        <!-- Header -->
        <div class="whatsapp-header">
            <button class="back-btn"><i class="fas fa-arrow-left"></i></button>
            <div class="avatar-group">
                <div class="avatar avatar-user">${initials}</div>
                <div class="chat-info">
                    <div class="chat-name">${escapeHtml(name)}</div>
                    <div class="chat-status online"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px; color: #4fc3f7;"></i>${escapeHtml(country)}</div>
                </div>
            </div>
            <div class="header-actions">
                <i class="fas fa-video"></i>
                <i class="fas fa-phone"></i>
                <i class="fas fa-ellipsis-v"></i>
            </div>
        </div>

        <!-- Chat Body -->
        <div class="whatsapp-body">
            <!-- Date Divider -->
            <div class="date-divider">
                <span>Today</span>
            </div>

            <!-- System Message: Testimonial Announcement -->
            <div class="system-message">
                <span>🗣️ New Testimonial Shared</span>
            </div>

            <!-- Received Message: User Testimonial -->
            <div class="message received">
                <div class="avatar-small avatar-user">${initials}</div>
                <div class="bubble received-bubble">
                    ${escapeHtml(message)}
                    <span class="time">${currentTime}</span>
                </div>
            </div>

            <!-- Sent Message: Bot Response -->
            <div class="message sent">
                <div class="bubble sent-bubble">
                    🤖 ${escapeHtml(botResponse)}
                    <span class="time">${currentTime} <i class="fas fa-check-double"></i></span>
                </div>
                <div class="avatar-small" style="background: #00b894;">🤖</div>
            </div>

            <!-- Seen Indicator -->
            <div class="seen-indicator">
                <i class="fas fa-check-double"></i> Seen ${currentTime}
            </div>
        </div>

        <!-- Reply Bar -->
        <div class="reply-bar">
            <button class="emoji-btn"><i class="fas fa-smile"></i></button>
            <input type="text" placeholder="Type a message" />
            <button class="emoji-btn"><i class="fas fa-paperclip"></i></button>
            <button class="send-btn"><i class="fas fa-microphone"></i></button>
        </div>
    </div>

</body>
</html>`;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}