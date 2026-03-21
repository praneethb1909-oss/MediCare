import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Calendar, Receipt, FileText, AlertCircle, Info, CheckCircle2, Trash2, Search, Filter, MoreVertical, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'report' | 'system' | 'alert';
  title: string;
  description: string;
  time: any;
  isRead: boolean;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <Calendar className="text-blue-500" />;
      case 'payment': return <Receipt className="text-amber-500" />;
      case 'report': return <FileText className="text-purple-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      case 'system': return <Info className="text-emerald-500" />;
      default: return <Bell className="text-slate-500" />;
    }
  };

  const markAllRead = async () => {
    try {
      const updates = notifications
        .filter(n => !n.isRead)
        .map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));
      await Promise.all(updates);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    try {
      const deletions = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
      await Promise.all(deletions);
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleUpdateSettings = () => {
    // Dispatch custom event or use navigation to go to settings notifications tab
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">You have {unreadCount} unread alerts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="btn-outline text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> Mark all as read
          </button>
          <button 
            onClick={deleteAll}
            disabled={notifications.length === 0}
            className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="card p-20 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Notifications</h3>
            <p className="text-slate-500 dark:text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`card p-6 flex items-start gap-6 transition-all duration-300 group ${
                !n.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/30 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                !n.isRead ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'
              }`}>
                {getIcon(n.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-lg font-bold truncate transition-colors ${
                    !n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap ml-4">
                    <Clock size={12} /> {formatTime(n.time)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${
                  !n.isRead ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {n.description}
                </p>
                
                <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">View Details</button>
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              
              <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200 dark:shadow-none">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
            <Bell size={40} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Notification Preferences</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 md:mb-0">
              Control how you receive alerts. Manage email, SMS, and push notification settings in your profile.
            </p>
          </div>
          <button 
            onClick={handleUpdateSettings}
            className="btn-primary bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-bold whitespace-nowrap"
          >
            Update Settings
          </button>
        </div>
      </div>
    </div>
  );
}
