import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, Globe, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

export function ContactUs() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for reaching out. Our clinical support team will contact you shortly.');
  };

  return (
    <div className="space-y-12 animate-fadeIn relative pb-20">
      <MedicalBackground />
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 pt-10">
        {/* Contact Info Card */}
        <div className="w-full lg:w-[400px] space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Get in <span className="text-blue-600">Touch.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Have questions about our clinical workstation or patient portal? We're here to help you 24/7.
            </p>
          </div>

          <div className="space-y-4">
            <a href="mailto:praneethb1909@gmail.com" className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">praneethb1909@gmail.com</p>
              </div>
            </a>

            <a href="tel:+917032130919" className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Hotline</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">+91 7032130919</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regional Node</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Rajam, Andhra Pradesh, IN</p>
              </div>
            </div>
          </div>

          {/* Social Media Placeholders */}
          <div className="space-y-4 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Connect with us</p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, color: 'hover:text-pink-500' },
                { icon: Twitter, color: 'hover:text-blue-400' },
                { icon: Linkedin, color: 'hover:text-blue-700' },
                { icon: Facebook, color: 'hover:text-blue-600' }
              ].map((social, i) => (
                <button key={i} className={`w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-slate-200 ${social.color} hover:-translate-y-1`}>
                  <social.icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="flex-1">
          <div className="card p-8 lg:p-12 bg-white/80 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageCircle size={200} strokeWidth={1} />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input type="text" placeholder="John Doe" className="input-field py-4" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input type="email" placeholder="john@example.com" className="input-field py-4" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry Type</label>
                <select className="input-field py-4 appearance-none">
                  <option>General Support</option>
                  <option>Clinical Partnership</option>
                  <option>Technical Issue</option>
                  <option>Feedback</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                <textarea 
                  rows={5} 
                  placeholder="How can our clinical team assist you today?" 
                  className="input-field py-4 min-h-[150px] resize-none"
                  required
                ></textarea>
              </div>

              <button type="submit" className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
                Dispatch Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
