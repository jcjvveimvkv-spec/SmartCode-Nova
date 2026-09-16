'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick-start prompts for empty state
  const QUICK_PROMPTS = useMemo(() => ([
    'Say hi to the community 👋',
    'How do I deploy my first bot?',
    'What are the best trading pairs right now?',
  ]), []);

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

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [supabase, router, scrolledToBottom]);

  useEffect(() => {
    if (!loading && comments.length > 0) {
      scrollToBottom();
    }
  }, [loading, comments.length]);

  // Auto-grow textarea (max 3 lines)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 3 + 16;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, [newMessage]);

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

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || sending || !currentUser) return;

    setSending(true);
    setAiTyping(true);

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          user_id: currentUser.id,
          username: currentUser.email?.split('@')[0] || 'User',
          message: messageText.trim(),
          is_ai: false
        });

      if (error) throw error;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/community-ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            message: messageText.trim()
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = newMessage.trim();
    if (!message) return;
    setNewMessage('');
    await sendMessage(message);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setNewMessage('');
    await sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = newMessage.trim();
      if (!message) return;
      setNewMessage('');
      sendMessage(message);
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

  const activeUsers = new Set(comments.filter(c => !c.is_ai).map(c => c.username)).size;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] bg-[#0b0e14] text-white overflow-hidden">

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Users className="text-[#6366f1] shrink-0" size={22} />
            <span className="truncate">Community</span>
          </h1>
          <p className="text-[#8e96a3] text-xs sm:text-sm mt-0.5 line-clamp-1">
            Connect with traders, share insights, and join the conversation.
          </p>
        </div>

        {/* Telegram button — compact on mobile, full on desktop */}
        <motion.a
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          href="https://t.me/+v7AFedbnFdc3Nzg8"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] transition text-white rounded-xl shadow-lg shadow-blue-500/20 text-xs sm:text-sm font-medium"
          aria-label="Join Telegram"
        >
          <Users size={16} className="shrink-0" />
          <span className="hidden sm:inline">Join Telegram</span>
          <ExternalLink size={14} className="opacity-70 shrink-0 hidden sm:inline" />
        </motion.a>
      </div>

      {/* Chat feed — fills remaining viewport */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#141a24] border border-white/5 rounded-2xl overflow-hidden relative">

        {/* Feed header */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={16} className="text-[#6366f1] shrink-0" />
            <span className="text-sm font-medium truncate">Community Feed</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] sm:text-xs text-[#8e96a3]">
              {comments.length} {comments.length === 1 ? 'message' : 'messages'}
            </span>
            <AnimatePresence>
              {aiTyping && (
                <motion.div
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#6366f1]"
                >
                  <Loader2 className="animate-spin shrink-0" size={12} />
                  <span>AI is thinking…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages scroll area */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 custom-scrollbar"
        >
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                <MessageCircle size={32} className="text-[#6366f1] opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-white">No messages yet</p>
                <p className="text-xs sm:text-sm text-[#8e96a3] max-w-xs">
                  Start the conversation — pick a prompt below or type your own.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={sending || aiTyping}
                    className="text-left text-xs sm:text-sm bg-[#0b0e14] border border-white/5 hover:border-[#6366f1]/40 rounded-xl px-3 py-2.5 text-[#8e96a3] hover:text-white transition disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className="flex gap-2 sm:gap-3"
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base"
                  style={{ backgroundColor: getAvatarColor(comment.username) }}
                >
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {comment.username}
                    </span>
                    {comment.is_ai && (
                      <span className="text-[9px] sm:text-[10px] bg-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        AI
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-[#8e96a3] shrink-0">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-xl px-3 py-2 max-w-[92%] sm:max-w-[85%]">
                    <p className="text-xs sm:text-sm text-gray-300 whitespace-pre-wrap break-words">
                      {comment.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Floating scroll buttons — only when not at bottom */}
        <AnimatePresence>
          {showScrollButtons && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-3 sm:right-4 bottom-24 flex flex-col gap-2 z-10"
            >
              <button
                onClick={scrollToTop}
                aria-label="Scroll to top"
                className="p-2 bg-[#6366f1]/20 border border-[#6366f1]/30 rounded-full text-[#6366f1] hover:bg-[#6366f1]/30 transition shadow-lg backdrop-blur-sm"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                className="p-2 bg-[#6366f1]/20 border border-[#6366f1]/30 rounded-full text-[#6366f1] hover:bg-[#6366f1]/30 transition shadow-lg backdrop-blur-sm"
              >
                <ChevronDown size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <form
          onSubmit={handleSendMessage}
          className="shrink-0 px-3 sm:px-4 py-3 border-t border-white/5 bg-[#141a24]"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              rows={1}
              className="flex-1 min-w-0 bg-[#0b0e14] border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1] resize-none overflow-y-auto custom-scrollbar leading-6"
              disabled={sending || aiTyping}
              style={{ minHeight: '40px', maxHeight: '88px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || aiTyping}
              aria-label="Send message"
              className="shrink-0 h-10 w-10 sm:w-auto sm:px-5 sm:h-10 bg-[#6366f1] hover:bg-[#6366f1]/90 transition text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={18} />
                  <span className="hidden sm:inline font-medium">Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Stats — below the chat, desktop shows inline, mobile compact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="shrink-0 mt-3 grid grid-cols-3 gap-2 sm:gap-3"
      >
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-[#8e96a3] truncate">Total</p>
          <p className="text-sm sm:text-lg font-bold text-white tabular-nums truncate">{comments.length}</p>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-[#8e96a3] truncate">Users</p>
          <p className="text-sm sm:text-lg font-bold text-white tabular-nums truncate">{activeUsers}</p>
        </div>
        <div className="bg-[#141a24] border border-white/5 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-[#8e96a3] truncate">AI Personas</p>
          <p className="text-sm sm:text-lg font-bold text-[#6366f1] tabular-nums truncate">4</p>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
      `}</style>
    </div>
  );
}
