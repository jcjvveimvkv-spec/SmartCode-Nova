'use client';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Users, MessageCircle, 
  Loader2, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';

export default function CommunityPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  
  const [comments, setComments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Fetch comments and user
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      
      setCurrentUser(user);

      const { data: commentsData } = await supabase
        .from('community_comments')
        .select('*')
        .order('created_at', { ascending: true });

      setComments(commentsData || []);
      setLoading(false);

      // PREVENT DUPLICATE SUBSCRIPTIONS (THE FIX)
      if (!subscriptionRef.current) {
        subscriptionRef.current = supabase
          .channel('community-comments')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'community_comments' 
          }, (payload) => {
            setComments(prev => [...prev, payload.new]);
            if (scrolledToBottom) {
              setTimeout(() => scrollToBottom(), 100);
            }
          })
          .subscribe();
      }
    }

    fetchData();

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [supabase, router, scrolledToBottom]);

  // Auto-scroll to bottom on load
  useEffect(() => {
    if (!loading && comments.length > 0) {
      scrollToBottom();
    }
  }, [loading, comments.length]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setScrolledToBottom(isBottom);
      setShowScrollButtons(!isBottom);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const message = newMessage.trim();
    setNewMessage('');

    try {
      // Insert user comment
      const { error } = await supabase
        .from('community_comments')
        .insert({
          user_id: currentUser.id,
          username: currentUser.email?.split('@')[0] || 'User',
          message: message,
          is_ai: false
        });

      if (error) throw error;

      // Trigger AI response
      setAiTyping(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/community-ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: currentUser.id,
            message: message 
          })
        }
      );

      if (!response.ok) {
        console.error('AI trigger failed:', await response.text());
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
      setAiTyping(false);
    }
  };

  const getAvatarColor = (username: string) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0b0e14] text-white min-h-screen max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-[#6366f1]" size={24} />
            Community
          </h1>
          <p className="text-[#8e96a3] text-sm">Connect with traders, share insights, and join the conversation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Join Telegram Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6 text-center"
          >
            <div className="w-20 h-20 bg-[#6366f1]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#6366f1]/30">
              <Users className="text-[#6366f1]" size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Join Our Telegram</h3>
            <p className="text-[#8e96a3] text-sm mb-6">
              Get real-time updates, trading tips, and connect with other SmartCodeNova users.
            </p>
            <a 
              href="https://t.me/+v7AFedbnFdc3Nzg8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0088cc] hover:bg-[#0077b5] transition text-white rounded-xl font-bold"
            >
              <ExternalLink size={18} />
              Join Telegram Group
            </a>
            <p className="text-xs text-[#8e96a3] mt-4">500+ members already joined</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6"
          >
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-[#6366f1]" />
              Community Stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8e96a3]">Total Comments</span>
                <span className="font-bold">{comments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8e96a3]">Active Users</span>
                <span className="font-bold">{new Set(comments.filter(c => !c.is_ai).map(c => c.username)).size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8e96a3]">AI Personas</span>
                <span className="font-bold text-[#6366f1]">4</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Community Feed */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#141a24] border border-white/5 rounded-2xl p-6 flex flex-col h-[700px] relative"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <MessageCircle size={18} className="text-[#6366f1]" />
                Community Feed
              </h3>
              {aiTyping && (
                <div className="flex items-center gap-2 text-xs text-[#6366f1]">
                  <Loader2 className="animate-spin" size={14} />
                  AI is thinking...
                </div>
              )}
            </div>

            {/* Scroll Container */}
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
            >
              {comments.length === 0 ? (
                <div className="text-center py-12 text-[#8e96a3]">
                  <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    className="flex gap-3 bg-[#0b0e14] border border-white/5 rounded-xl p-4"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(comment.username) }}
                    >
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{comment.username}</span>
                        <span className="text-xs text-[#8e96a3] ml-auto">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{comment.message}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Scroll Buttons */}
            <AnimatePresence>
              {showScrollButtons && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-6 bottom-24 flex flex-col gap-2 z-10"
                >
                  <button onClick={scrollToTop} className="p-2 bg-[#6366f1]/20 border border-[#6366f1]/30 rounded-full text-[#6366f1] hover:bg-[#6366f1]/30 transition shadow-lg">
                    <ChevronUp size={20} />
                  </button>
                  <button onClick={scrollToBottom} className="p-2 bg-[#6366f1]/20 border border-[#6366f1]/30 rounded-full text-[#6366f1] hover:bg-[#6366f1]/30 transition shadow-lg">
                    <ChevronDown size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-white/5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6366f1]"
                  disabled={sending || aiTyping}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || aiTyping}
                  className="px-6 py-3 bg-[#6366f1] hover:bg-[#6366f1]/90 transition text-white rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Custom Scrollbar CSS */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0b0e14; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
      `}</style>
    </div>
  );
}