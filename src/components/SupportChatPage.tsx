import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, UserCircle, Search, MoreVertical, Phone, Video, Paperclip, Smile, ShieldCheck, CheckCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'support';
  text: string;
  time: any;
  status: 'sent' | 'delivered' | 'read';
}

export function SupportChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'support_chats'),
      where('user_id', '==', user.uid),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText;
    setText('');

    try {
      await addDoc(collection(db, 'support_chats'), {
        user_id: user.uid,
        sender: 'user',
        text: text,
        time: serverTimestamp(),
        status: 'sent'
      });

      // Simulate auto-reply for demo if it's the first message or something
      if (messages.length === 0) {
        setTimeout(async () => {
          await addDoc(collection(db, 'support_chats'), {
            user_id: user.uid,
            sender: 'support',
            text: "Thanks for reaching out! Our support team will be with you shortly.",
            time: serverTimestamp(),
            status: 'delivered'
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-fadeIn">
      <div className="flex-1 flex overflow-hidden card border-none shadow-xl">
        {/* Sidebar - Chat List */}
        <div className="hidden md:flex w-80 border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search chats..." className="input-field pl-9 py-2 text-xs" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-3 cursor-pointer">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">MediCare Support</h4>
                  <span className="text-[10px] font-bold text-blue-600">Active</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Typing...</p>
              </div>
            </div>
            
            {[1, 2].map(i => (
              <div key={i} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer transition-colors group">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Archive Dept</h4>
                    <span className="text-[10px] font-medium text-slate-400">Feb 28</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Your request #123 has been closed.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {/* Chat Header */}
          <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">MediCare Support Agent</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Online Now</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Phone size={18} /></button>
              <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Video size={18} /></button>
              <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><MoreVertical size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Today, March 01</span>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {formatTime(msg.time)}
                        </span>
                        {msg.sender === 'user' && (
                          <CheckCheck size={12} className={msg.status === 'read' ? 'text-blue-500' : 'text-slate-300'} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button type="button" className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Paperclip size={20} /></button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message..." 
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm dark:text-white" 
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500"><Smile size={18} /></button>
              </div>
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
