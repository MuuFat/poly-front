'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageSquare, Calendar, Clock, ArrowRight, Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { chatService, Conversation } from '@/services/chatService';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist?.hasHydrated?.() ?? false);
  
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist?.hasHydrated?.()) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    const fetchConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [hasHydrated, isAuthenticated, router]);

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDelete = async (id: string) => {
    const ok = confirm('Delete this conversation? This action cannot be undone.');
    if (!ok) return;
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      alert('Conversation deleted');
    } catch (err) {
      console.error('Failed to delete conversation', err);
      // Show response details when available to aid debugging
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = err;
      const details = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
      alert('Failed to delete conversation: ' + details);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-zinc-500 animate-pulse">Loading your history...</p>
      </div>
    );
  } else if (filteredConversations.length === 0) {
    content = (
      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8 text-zinc-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No conversations found</h3>
          <p className="text-zinc-500">Start a new tutor session to begin your language practice.</p>
        </div>
        <button 
          onClick={() => router.push('/chat')}
          className="px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all font-medium"
        >
          Start Chatting
        </button>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-4">
        {filteredConversations.map((conv, idx) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:bg-zinc-800/80 hover:border-primary/30 transition-all backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {conv.title || 'New conversation'}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
                    {conv.language}
                  </span>
                </div>

                <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                  {conv.lastMessage?.content || "No messages yet."}
                </p>

                <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest pt-2">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    {conv.messageCount} Messages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => router.replace(`/chat?id=${conv.id}`)}
                  aria-label={`Open conversation ${conv.title || 'conversation'}`}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-primary group-hover:text-white transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conv.id);
                  }}
                  aria-label={`Delete conversation ${conv.title || 'conversation'}`}
                  className="p-2 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading history...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
                <button 
              onClick={() => router.replace('/chat')}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Chat</span>
            </button>
            <h1 className="text-4xl font-bold tracking-tight">Conversation History</h1>
            <p className="text-zinc-500">Newest conversations appear first.</p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
            <button
              onClick={async () => {
                const ok = confirm('Delete ALL conversations? This cannot be undone.');
                if (!ok) return;
                try {
                  setIsDeletingAll(true);
                  await chatService.deleteAllConversations();
                  setConversations([]);
                } catch (err) {
                  console.error('Failed to delete all conversations', err);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const e: any = err;
                  const details = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
                  alert('Failed to delete conversations: ' + details);
                } finally {
                  setIsDeletingAll(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 text-white shadow-lg shadow-red-700/20 hover:scale-105 transition-all font-medium"
            >
              {isDeletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete All'}
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all backdrop-blur-sm"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        {content}

        <footer className="pt-12 text-center">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.3em]">
            PolyLingo &copy; 2026 &bull; AI Language Tutor
          </p>
        </footer>
      </div>
    </div>
  );
}
