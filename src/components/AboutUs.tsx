import React from 'react';
import { Activity, ShieldCheck, Users, Target, Award } from 'lucide-react';
import { MedicalBackground } from './MedicalBackground';

export function AboutUs() {
  return (
    <div className="space-y-16 animate-fadeIn relative pb-20 font-ui text-[var(--color-ink)]">
      <MedicalBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-subtle)] rounded-full text-[var(--color-primary)] text-xs font-semibold uppercase tracking-widest border border-[var(--color-line)]">
          <Activity size={14} /> Our Mission
        </div>
        <h1 className="text-4xl lg:text-6xl font-display font-semibold text-[var(--color-ink)] tracking-tight leading-[1.15]">
          Care, <span className="text-[var(--color-primary)]">quietly connected.</span>
        </h1>
        <p className="text-[var(--color-muted)] text-lg lg:text-xl font-normal max-w-2xl mx-auto leading-relaxed font-ui">
          Olmera is a refined healthcare platform designed to bridge clinical excellence with patient peace of mind across Andhra Pradesh.
        </p>
      </div>

      {/* Stats/Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Users, title: 'Patient-First Focus', desc: 'Crafting thoughtful digital touchpoints that reduce patient anxiety and preserve dignity.' },
          { icon: ShieldCheck, title: 'Private & Secure', desc: 'Compliant architecture ensuring your clinical reports and records remain confidential.' },
          { icon: Award, title: 'Clinical Rigor', desc: 'Empowering specialists and hospital staff with high-fidelity telemetry and scheduling.' }
        ].map((item, i) => (
          <div key={i} className="card p-8 group hover:-translate-y-1 transition-all duration-300 bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm">
            <div className="w-12 h-12 bg-[var(--color-surface-subtle)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center mb-6 border border-[var(--color-line)] group-hover:scale-105 transition-transform">
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-display font-semibold text-[var(--color-ink)] mb-3">{item.title}</h3>
            <p className="text-[var(--color-muted)] text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Vision Section */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 bg-[var(--color-primary)] text-white rounded-3xl p-8 lg:p-16 overflow-hidden border border-[var(--color-line)] shadow-sm">
        <div className="flex-1 space-y-6 relative z-10">
          <h2 className="text-3xl lg:text-4xl font-display font-semibold text-white leading-tight">
            Quiet Innovation for <br/>
            <span className="text-[var(--color-mist)]">Modern Healthcare.</span>
          </h2>
          <div className="space-y-4 text-[var(--color-mist)] font-normal text-base leading-relaxed">
            <p>
              Founded to modernize regional clinical infrastructure, Olmera unifies hospitals, medical practitioners, and patients into a calm, interconnected ecosystem.
            </p>
            <p>
              We believe technology should dissolve barriers rather than create friction. From intelligent scheduling to biometric vaults, every feature is built to be intuitive, serene, and dependable.
            </p>
          </div>
          <div className="flex gap-8 pt-4 border-t border-white/10">
            <div>
              <p className="text-2xl font-display font-semibold text-white">99.9%</p>
              <p className="text-xs text-[var(--color-mist)] uppercase tracking-wider mt-1">Platform Uptime</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div>
              <p className="text-2xl font-display font-semibold text-white">12k+</p>
              <p className="text-xs text-[var(--color-mist)] uppercase tracking-wider mt-1">Patients Connected</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div>
              <p className="text-2xl font-display font-semibold text-white">24/7</p>
              <p className="text-xs text-[var(--color-mist)] uppercase tracking-wider mt-1">Care Coordination</p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-2 gap-4 relative z-10">
          <div className="aspect-square rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center p-8 text-[var(--color-mist)]">
            <Activity size={54} strokeWidth={2} />
          </div>
          <div className="aspect-square rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center p-8 text-white mt-8">
            <Users size={54} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
