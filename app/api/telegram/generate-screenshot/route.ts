import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testimonial } = body;

    if (!testimonial) {
      return NextResponse.json(
        { error: 'No testimonial provided' },
        { status: 400 }
      );
    }

    // For now, return a mock image URL
    // In production, you'd use html2canvas or a similar library
    const mockImageUrl = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <rect width="400" height="300" fill="#f0f0f0"/>
        <text x="20" y="40" font-family="Arial" font-size="16" fill="#333">
          📱 Telegram Testimonial
        </text>
        <text x="20" y="70" font-family="Arial" font-size="14" fill="#555">
          👤 ${testimonial.name}
        </text>
        <text x="20" y="95" font-family="Arial" font-size="12" fill="#777">
          🆔 ${testimonial.userId}
        </text>
        <text x="20" y="120" font-family="Arial" font-size="12" fill="#777">
          🌍 ${testimonial.country}
        </text>
        <text x="20" y="160" font-family="Arial" font-size="13" fill="#444">
          💬 "${testimonial.message.substring(0, 80)}..."
        </text>
        <text x="20" y="200" font-family="Arial" font-size="12" fill="#666">
          🤖 ${testimonial.botResponse}
        </text>
        <text x="20" y="230" font-family="Arial" font-size="11" fill="#999">
          📅 ${testimonial.timestamp || new Date().toLocaleString()}
        </text>
      </svg>
    `)}`;

    return NextResponse.json({
      success: true,
      imageUrl: mockImageUrl
    });

  } catch (error: any) {
    console.error('❌ Error generating screenshot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate screenshot' },
      { status: 500 }
    );
  }
}