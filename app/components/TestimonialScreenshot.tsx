// app/components/TestimonialScreenshot.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface TestimonialData {
  name: string;
  userId: string;
  country: string;
  message: string;
  botResponse: string;
  timestamp: string;
}

interface TestimonialScreenshotProps {
  testimonial: TestimonialData;
  onImageGenerated?: (imageData: string) => void;
}

export default function TestimonialScreenshot({ testimonial, onImageGenerated }: TestimonialScreenshotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  const userInitial = testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const botInitial = 'SN';

  useEffect(() => {
    generateImage();
  }, []);

  const generateImage = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#1e2530',
        useCORS: true,
        logging: false,
      });

      const imageDataUrl = canvas.toDataURL('image/png');
      setImageData(imageDataUrl);
      
      if (onImageGenerated) {
        onImageGenerated(imageDataUrl);
      }
    } catch (error) {
      console.error('Error generating screenshot:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Hidden container for rendering */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '400px',
          background: '#1e2530',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#1e2530', borderBottom: '1px solid #2a2f3a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: 'white' }}>
            {botInitial}
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>SmartCodeNova</div>
            <div style={{ color: '#8e96a3', fontSize: '12px' }}>online</div>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ padding: '12px 16px', minHeight: '300px' }}>
          <div style={{ textAlign: 'center', color: '#8e96a3', fontSize: '11px', padding: '8px 0 12px 0', fontWeight: 500 }}>Today</div>

          {/* Bot Welcome */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', marginBottom: '6px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '10px', color: 'white', marginRight: '8px', flexShrink: 0 }}>
              {botInitial}
            </div>
            <div>
              <div style={{ background: '#2a2f3a', color: '#d9dadf', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.5', wordWrap: 'break-word' }}>
                Thank you for sharing your experience! We're glad to have you in our community. 🙌
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', padding: '0 0 6px 10px', textAlign: 'left' }}>{testimonial.timestamp}</div>
            </div>
          </div>

          {/* User Message */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <div>
              <div style={{ background: '#0084ff', color: '#ffffff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.5', wordWrap: 'break-word' }}>
                {testimonial.message}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', padding: '0 10px 6px 0', textAlign: 'right' }}>{testimonial.timestamp} ✓✓</div>
            </div>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '10px', color: 'white', marginLeft: '8px', flexShrink: 0 }}>
              {userInitial}
            </div>
          </div>

          {/* Bot Reply */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '10px', color: 'white', marginRight: '8px', flexShrink: 0 }}>
              {botInitial}
            </div>
            <div>
              <div style={{ background: '#2a2f3a', color: '#d9dadf', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.5', wordWrap: 'break-word' }}>
                {testimonial.botResponse}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', padding: '0 0 6px 10px', textAlign: 'left' }}>{testimonial.timestamp}</div>
            </div>
          </div>
        </div>

        {/* Reply Bar */}
        <div style={{ padding: '10px 16px', background: '#1e2530', borderTop: '1px solid #2a2f3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#6b7280', fontSize: '18px' }}>➕</span>
          <input style={{ flex: 1, background: '#2a2f3a', border: 'none', borderRadius: '20px', padding: '8px 16px', color: '#d9dadf', fontSize: '13px', outline: 'none' }} placeholder="Message" readOnly />
          <span style={{ color: '#6b7280', fontSize: '18px' }}>😊</span>
          <span style={{ color: '#0084ff', fontSize: '20px' }}>➤</span>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', background: '#1a1f2a', borderTop: '1px solid #2a2f3a', textAlign: 'center' }}>
          <div style={{ color: '#8e96a3', fontSize: '12px' }}>
            📝 Share your experience in the group or <span style={{ color: '#6366f1', fontWeight: 500 }}>DM us!</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {isGenerating && <p>Generating image...</p>}
      {imageData && (
        <div>
          <img src={imageData} alt="Testimonial Screenshot" style={{ maxWidth: '400px', borderRadius: '16px' }} />
        </div>
      )}
    </div>
  );
}