import React from 'react';
import { Activity, ShieldCheck, Heart, Users, Target, Award } from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

export function AboutUs() {
  return (
    <div className="space-y-16 animate-fadeIn relative pb-20">
      <MedicalBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
          <Activity size={14} /> Our Mission
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
          Healthcare <span className="text-blue-600">Reimagined</span> <br/>
          for the Digital Age.
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          MediCare is a comprehensive hospital management ecosystem designed to bridge the gap between clinical excellence and patient accessibility.
        </p>
      </div>

      {/* Stats/Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Heart, title: 'Patient Centric', desc: 'Putting patient recovery and comfort at the heart of every digital interaction.', color: 'red' },
          { icon: ShieldCheck, title: 'Secure & Private', desc: 'Enterprise-grade encryption ensuring medical records remain confidential and compliant.', color: 'blue' },
          { icon: Award, title: 'Clinical Excellence', desc: 'Empowering doctors with smart tools to deliver precise and timely healthcare.', color: 'emerald' }
        ].map((item, i) => (
          <div key={i} className="card p-8 group hover:-translate-y-2 transition-all duration-500 bg-white/80 backdrop-blur-md">
            <div className={`w-14 h-14 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-2xl flex items-center justify-center text-${item.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
              <item.icon size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{item.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Vision Section */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-10 lg:p-20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Target size={300} strokeWidth={1} className="text-white" />
        </div>
        
        <div className="flex-1 space-y-8 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
            Our Vision for <br/>
            <span className="text-blue-400">Better Care.</span>
          </h2>
          <div className="space-y-6 text-slate-400 font-medium text-lg">
            <p>
              Founded with the goal of modernizing healthcare infrastructure, MediCare provides a unified platform for hospitals, practitioners, and patients. 
            </p>
            <p>
              We believe that technology should never be a barrier to health. Our smart scheduling, digital prescriptions, and clinical vault systems are built to be intuitive, fast, and reliable.
            </p>
          </div>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-black text-white">99.9%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
            </div>
            <div className="w-px h-12 bg-slate-800"></div>
            <div>
              <p className="text-3xl font-black text-white">12k+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Patients</p>
            </div>
            <div className="w-px h-12 bg-slate-800"></div>
            <div>
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Support</p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-2 gap-4 relative z-10">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center p-8 text-white shadow-xl rotate-3">
            <Activity size={60} strokeWidth={2.5} />
          </div>
          <div className="aspect-square rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center p-8 text-blue-400 shadow-xl -rotate-3 mt-12">
            <Users size={60} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
