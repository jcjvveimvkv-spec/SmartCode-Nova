'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Camera, 
  Copy, 
  Share2, 
  Download, 
  RefreshCw,
  User,
  Clock,
  MessageSquare,
  Check,
  X,
  Sparkles,
  Image as ImageIcon,
  Send,
  Loader2
} from 'lucide-react';

// Sample message templates
const messageTemplates = [
  { 
    name: 'Deposit Success', 
    sender: 'SmartCodeNova Bot',
    message: '✅ Deposit of 500 USDT has been successfully credited to your wallet!',
    time: '10:32 AM',
    isSystem: false
  },
  { 
    name: 'Withdrawal Alert', 
    sender: 'SmartCodeNova Bot',
    message: '📤 Withdrawal request of 200 USDT has been approved and sent to your wallet.',
    time: '09:15 AM',
    isSystem: false
  },
  { 
    name: 'Trade Alert', 
    sender: 'SmartCodeNova Bot',
    message: '📊 Your AI Bot "Quantum Pro" just closed a trade with +45 USDT profit!',
    time: '08:45 AM',
    isSystem: false
  },
  { 
    name: 'Referral Bonus', 
    sender: 'SmartCodeNova Bot',
    message: '🎉 You earned 7 USDT referral bonus! JohnDoe signed up using your link.',
    time: 'Yesterday at 11:20 PM',
    isSystem: false
  },
  { 
    name: 'Welcome Message', 
    sender: 'SmartCodeNova Bot',
    message: '🚀 Welcome to SmartCodeNova! Start trading with our AI bots and earn passive income.',
    time: 'Yesterday at 10:00 AM',
    isSystem: false
  },
  { 
    name: 'System Notification', 
    sender: 'System',
    message: '🔔 System Update: New trading pairs available. Check the exchange for details.',
    time: '2 hours ago',
    isSystem: true
  },
];

// Sample testimonial templates
const testimonialTemplates = [
  {
    name: 'John Doe - USA',
    message: '🚀 SmartCodeNova is a game-changer! I made 200% profit in my first month. The AI bots are incredible!',
    time: '3:45 PM'
  },
  {
    name: 'Sarah Smith - UK',
    message: '💰 Finally a platform that delivers! Withdrew 500 USDT in 10 minutes. Highly recommend!',
    time: '2:30 PM'
  },
  {
    name: 'Michael Chen - Singapore',
    message: '🤖 The automation is top-notch. My bot runs 24/7 and I wake up to profits every day.',
    time: '1:15 PM'
  },
  {
    name: 'Emma Wilson - Australia',
    message: '🌟 Best decision I made this year. The referral program is amazing - earned 100 USDT already!',
    time: 'Yesterday at 9:00 PM'
  },
  {
    name: 'David Kim - South Korea',
    message: '💎 SmartCodeNova is the future of trading. The UI is clean and the support is 10/10.',
    time: 'Yesterday at 6:30 PM'
  },
];

export default function TelegramScreenshotPage() {
  const [senderName, setSenderName] = useState('SmartCodeNova Bot');
  const [message, setMessage] = useState(messageTemplates[0].message);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  const [selectedTemplate, setSelectedTemplate] = useState(messageTemplates[0]);
  const [isSystem, setIsSystem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'testimonials'>('messages');
  const [sharing, setSharing] = useState(false);
  
  const screenshotRef = useRef<HTMLDivElement>(null);

  // Apply template
  const applyTemplate = (template: any) => {
    setSelectedTemplate(template);
    setSenderName(template.sender || 'SmartCodeNova Bot');
    setMessage(template.message);
    setTimestamp(template.time || new Date().toLocaleTimeString());
    setIsSystem(template.isSystem || false);
  };

  // Apply testimonial template
  const applyTestimonial = (template: any) => {
    setSelectedTemplate(template);
    setSenderName(template.name);
    setMessage(template.message);
    setTimestamp(template.time || new Date().toLocaleTimeString());
    setIsSystem(false);
  };

  // Generate AI Testimonial
  const generateAITestimonial = async () => {
    try {
      setIsGenerating(true);
      setScreenshotUrl(null);
      
      toast.info('🤖 Generating AI testimonial...');
      
      const response = await fetch('/api/telegram/generate-screenshot-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'testimonial' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.testimonial) {
        const t = data.testimonial;
        setSenderName(t.name);
        setMessage(t.message);
        setTimestamp(t.timestamp || new Date().toLocaleTimeString());
        setIsSystem(false);
        toast.success('✅ AI testimonial generated!');
      } else {
        toast.error(data.error || 'Failed to generate AI testimonial');
      }
    } catch (error) {
      console.error('Error generating AI testimonial:', error);
      toast.error('Failed to generate AI testimonial');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate screenshot
  const generateScreenshot = async () => {
    setIsGenerating(true);
    setScreenshotUrl(null);

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;

      const element = screenshotRef.current;
      if (!element) {
        toast.error('Screenshot element not found');
        setIsGenerating(false);
        return;
      }

      toast.info('📸 Generating screenshot...');

      // Capture the element
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1);
      });

      // Upload to Supabase Storage
      const fileName = `screenshot_${Date.now()}.png`;
      const filePath = `telegram-screenshots/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: use data URL
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotUrl(dataUrl);
        toast.success('✅ Screenshot generated (local copy)');
        setIsGenerating(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || '';

      setScreenshotUrl(publicUrl);
      toast.success('✅ Screenshot generated and uploaded!');
    } catch (error: any) {
      console.error('Error generating screenshot:', error);
      toast.error('Failed to generate screenshot: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!screenshotUrl) {
      toast.error('No screenshot to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(screenshotUrl);
      setCopied(true);
      toast.success('✅ Image URL copied!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Download image
  const downloadImage = () => {
    if (!screenshotUrl) {
      toast.error('No screenshot to download');
      return;
    }

    const link = document.createElement('a');
    link.href = screenshotUrl;
    link.download = `telegram-screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('✅ Image downloaded!');
  };

  // Share to Telegram
  const shareToTelegram = async () => {
    if (!screenshotUrl) {
      toast.error('No screenshot to share');
      return;
    }

    setSharing(true);

    try {
      const caption = `📸 New Screenshot Share\n━━━━━━━━━━━━━━━━━━\n📝 ${message}\n\n👤 ${senderName}\n📅 ${timestamp}\n━━━━━━━━━━━━━━━━━━\n📱 SmartCodeNova`;

      const response = await fetch('/api/telegram/share-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: screenshotUrl,
          caption 
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Screenshot sent to Telegram groups!');
      } else {
        toast.error(data.error || 'Failed to send to Telegram');
      }
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      toast.error('Failed to share to Telegram');
    } finally {
      setSharing(false);
    }
  };

  // Reset all
  const resetAll = () => {
    setScreenshotUrl(null);
    setCopied(false);
    setMessage(messageTemplates[0].message);
    setSenderName('SmartCodeNova Bot');
    setTimestamp(new Date().toLocaleTimeString());
    setSelectedTemplate(messageTemplates[0]);
    setIsSystem(false);
    toast.info('🔄 Reset complete');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📸 Telegram Screenshot Generator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create realistic Telegram-style screenshots for marketing and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📋 Templates</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeTab === 'messages'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab('testimonials')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeTab === 'testimonials'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Testimonials
                </button>
              </div>
            </div>

            {/* AI Generate Button */}
            <button
              onClick={generateAITestimonial}
              disabled={isGenerating}
              className="w-full mb-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Testimonial
                </>
              )}
            </button>

            {/* Message Templates */}
            {activeTab === 'messages' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {messageTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className={`p-3 text-left rounded-lg border transition-colors text-sm ${
                      selectedTemplate === template
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.message.substring(0, 60)}...
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Testimonial Templates */}
            {activeTab === 'testimonials' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {testimonialTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTestimonial(template)}
                    className={`p-3 text-left rounded-lg border transition-colors text-sm ${
                      selectedTemplate === template
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.message.substring(0, 60)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Message Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">✏️ Custom Message</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., SmartCodeNova Bot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timestamp</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 10:32 AM"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSystem}
                    onChange={(e) => setIsSystem(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm text-gray-500">System Message (gray background)</span>
              </div>

              <button
                onClick={generateScreenshot}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Generate Screenshot
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Output */}
        <div className="space-y-6">
          {/* Screenshot Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">🖼️ Screenshot Preview</h3>
            
            {/* The actual screenshot element */}
            <div ref={screenshotRef} className="bg-[#0b0e14] rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{senderName}</div>
                  <div className="text-gray-400 text-xs">{timestamp}</div>
                </div>
                <div className="text-gray-500 text-xs">✓✓</div>
              </div>
              <div className={`p-3 rounded-lg ${isSystem ? 'bg-gray-800/50' : 'bg-blue-600/20'} max-w-[90%]`}>
                <p className="text-white text-sm leading-relaxed">{message}</p>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-right">Telegram</div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              {isGenerating ? '⏳ Generating...' : '📱 This is what the screenshot will look like'}
            </div>
          </div>

          {/* Actions */}
          {screenshotUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">📤 Share & Download</h3>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>

                <button
                  onClick={downloadImage}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                <button
                  onClick={shareToTelegram}
                  disabled={sharing}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sharing ? 'Sharing...' : 'Share to Telegram'}
                </button>
              </div>

              {screenshotUrl && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 truncate">📎 {screenshotUrl}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">💡 How to Use</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 mt-1">
              <li>• Select a template or use "Generate AI Testimonial" for random user testimonial</li>
              <li>• Customize the sender name, message, and timestamp</li>
              <li>• Click "Generate Screenshot" to create the image</li>
              <li>• Use "Copy URL", "Download", or "Share to Telegram"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}