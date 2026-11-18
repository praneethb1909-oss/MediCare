import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Calendar, Clock, Video, MapPin, 
  Phone, Mail, Search, Star, Award, Users, CheckCircle2, ArrowRight, 
  Building2, ChevronRight, Bed, FileText, Pill, Moon, Sun, Menu, X, 
  Shield, CheckCircle, Lock, UserCheck
} from 'lucide-react';
import { OlmeraWordmark } from './brand/OlmeraWordmark';

interface LandingPageProps {
  onOpenAuth: (role?: 'patient' | 'doctor' | 'admin') => void;
  onNavigateToView?: (view: string, data?: any) => void;
}

export function LandingPage({ onOpenAuth, onNavigateToView }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('olmera_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('olmera_theme', 'light');
    }
    setIsDarkMode(nextDark);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [sosActive, setSosActive] = useState(false);

  const specialties = [
    {
      id: 'dept-1',
      name: 'Cardiology',
      icon: Activity,
      desc: 'Coronary wellness, preventive heart care, and diagnostic ECG/Echo telemetry.',
      doctors: 8
    },
    {
      id: 'dept-2',
      name: 'Neurology',
      icon: ShieldCheck,
      desc: 'Stroke recovery, cognitive health, neuro-imaging, and clinical rehabilitation.',
      doctors: 6
    },
    {
      id: 'dept-3',
      name: 'Pediatrics',
      icon: Users,
      desc: 'Childhood development, neonatal monitoring, and preventative care.',
      doctors: 10
    },
    {
      id: 'dept-4',
      name: 'Orthopedics & Spine',
      icon: Award,
      desc: 'Joint mobility, trauma rehabilitation, and minimally invasive bone care.',
      doctors: 7
    },
    {
      id: 'dept-14',
      name: 'Maternal & Women’s Health',
      icon: Shield,
      desc: 'Comprehensive prenatal support, maternal monitoring, and wellness checkups.',
      doctors: 9
    },
    {
      id: 'dept-5',
      name: 'Internal Medicine',
      icon: UserCheck,
      desc: 'Evidence-based preventative diagnosis, diabetes wellness, and metabolic care.',
      doctors: 12
    },
    {
      id: 'dept-11',
      name: 'Oncology',
      icon: FileText,
      desc: 'Multi-disciplinary clinical screening, chemotherapy, and patient support.',
      doctors: 5
    },
    {
      id: 'telemedicine',
      name: 'Telehealth (24/7)',
      icon: Video,
      desc: 'Private high-fidelity video consultations with specialists from home.',
      doctors: 24
    }
  ];

  const networkHospitals = [
    {
      name: 'Olmera Center for Health',
      city: 'Rajam',
      address: 'Main Road, Near Bus Complex, Rajam, AP',
      phone: '+91 70321 30919',
      beds: '150 Beds',
      icu: '24 ICU Beds Active',
      badge: 'Regional Care Center',
      image: 'https://images.unsplash.com/photo-1587350859728-117622bb45ff?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Olmera Coastal Hospital',
      city: 'Visakhapatnam',
      address: 'Health City, Arilova, Visakhapatnam, AP',
      phone: '+91 891 2727272',
      beds: '350 Beds',
      icu: 'Level 1 Trauma Unit',
      badge: 'Tertiary Hub',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Olmera Care Hospital',
      city: 'Srikakulam',
      address: 'Day & Night Junction, Srikakulam, AP',
      phone: '+91 8942 222333',
      beds: '200 Beds',
      icu: 'Emergency & Stroke Unit',
      badge: 'Regional Network Hub',
      image: 'https://images.unsplash.com/photo-1586773860383-dab5f3bc1f4b?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Olmera Specialty Institute',
      city: 'Visakhapatnam',
      address: 'Waltair Main Road, Visakhapatnam, AP',
      phone: '+91 891 2555666',
      beds: '300 Beds',
      icu: 'Accredited Excellence',
      badge: 'Specialty Center',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600'
    }
  ];

  const testimonials = [
    {
      quote: "Scheduling my consultation in Vizag was completely calm and transparent. The digital prescription and diagnostic reports were available in my vault before I returned home to Rajam.",
      author: "Venkata Satyanarayana",
      location: "Rajam, Andhra Pradesh",
      role: "Patient"
    },
    {
      quote: "When my father needed hospital admission in Srikakulam, Olmera's live bed availability tracker saved us critical hours. The interface is wonderfully quiet, minimal, and respectful.",
      author: "P. Radhika",
      location: "Srikakulam, Andhra Pradesh",
      role: "Family Caregiver"
    },
    {
      quote: "The telehealth experience eliminated the exhausting commute to Visakhapatnam for our elderly relatives. The clarity of the video and the doctor's undivided attention were exemplary.",
      author: "K. Murali Krishna",
      location: "Visakhapatnam, Andhra Pradesh",
      role: "Telehealth User"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] font-ui transition-colors duration-300">
      
      {/* 1. TOP EMERGENCY & HELPLINE STRIP */}
      <div className="bg-[var(--color-primary)] text-white text-xs py-2 px-4 border-b border-black/10">
        <div className="w-full max-w-[1536px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span className="font-semibold tracking-wide uppercase text-[10px] text-[#CFE3DD]">
              Emergency Rapid Response:
            </span>
            <a href="tel:108" className="underline font-bold text-white hover:text-[#CFE3DD]">
              Dial 108
            </a>
            <span className="hidden sm:inline text-[#CFE3DD]/50">|</span>
            <span className="hidden sm:inline text-[#CFE3DD]">Olmera Careline:</span>
            <a href="tel:+917032130919" className="hidden sm:inline font-semibold text-white hover:underline">
              +91 70321 30919
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#CFE3DD]">
            <span className="hidden md:inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#CFE3DD]" /> Accredited Healthcare Network
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5">
              <Clock size={13} /> Avg. Triage Response: 8 Mins
            </span>
            <button
              onClick={() => setSosActive(!sosActive)}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] transition-colors"
            >
              {sosActive ? 'Close SOS' : 'Emergency Assistance'}
            </button>
          </div>
        </div>
      </div>

      {/* SOS Drawer if expanded */}
      {sosActive && (
        <div className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-line)] p-6 animate-fadeIn">
          <div className="w-full max-w-[1536px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-[var(--color-primary)]">
                <Bed size={22} />
                <h4 className="font-display font-semibold text-base text-[var(--color-ink)]">Ambulance GPS Dispatch</h4>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Rapid ICU paramedic team dispatched to your GPS location in Rajam, Vizag, or Srikakulam.
              </p>
              <a href="tel:108" className="btn-primary w-full text-center py-2 text-xs flex items-center justify-center gap-2">
                <Phone size={13} /> Call 108 Emergency
              </a>
            </div>

            <div className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-[var(--color-primary)]">
                <Activity size={22} />
                <h4 className="font-display font-semibold text-base text-[var(--color-ink)]">ICU & Critical Beds</h4>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Real-time monitor of ventilator, ICU, and oxygen bed capacity across our 4 network facilities.
              </p>
              <button 
                onClick={() => onNavigateToView ? onNavigateToView('hospitals') : onOpenAuth('patient')}
                className="btn-outline w-full text-center py-2 text-xs flex items-center justify-center gap-2"
              >
                View Live Bed Status
              </button>
            </div>

            <div className="card p-5 bg-[var(--color-surface)] border-[var(--color-line)] shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-[var(--color-primary)]">
                <Video size={22} />
                <h4 className="font-display font-semibold text-base text-[var(--color-ink)]">Immediate Doctor Triage</h4>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Consult with an on-call clinical physician via secure encrypted video link.
              </p>
              <button 
                onClick={() => onOpenAuth('patient')}
                className="btn-primary w-full text-center py-2 text-xs flex items-center justify-center gap-2"
              >
                Start Tele-Triage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PUBLIC HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-line)] transition-colors">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Wordmark */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <OlmeraWordmark className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[var(--color-muted)]">
            <a href="#specialties" className="hover:text-[var(--color-primary)] transition-colors">
              Specialties
            </a>
            <a href="#hospitals" className="hover:text-[var(--color-primary)] transition-colors">
              Hospitals & Wards
            </a>
            <button 
              onClick={() => onNavigateToView ? onNavigateToView('doctors') : onOpenAuth('patient')}
              className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            >
              Specialists
            </button>
            <a href="#features" className="hover:text-[var(--color-primary)] transition-colors">
              Care Architecture
            </a>
            <button 
              onClick={() => onNavigateToView ? onNavigateToView('about-us') : onOpenAuth('patient')}
              className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => onNavigateToView ? onNavigateToView('contact-us') : onOpenAuth('patient')}
              className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition-all"
              aria-label="Toggle mode"
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => onOpenAuth()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] border border-[var(--color-line)] rounded-xl transition-all hover:bg-[var(--color-surface-subtle)]"
            >
              <Lock size={13} /> Portal Sign In
            </button>

            {/* Single Signal Coral Accent CTA */}
            <button
              onClick={() => onOpenAuth('patient')}
              className="btn-accent px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Calendar size={15} /> Book Consultation
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl border border-[var(--color-line)] text-[var(--color-muted)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--color-line)] bg-[var(--color-surface)] p-6 space-y-4 animate-fadeIn">
            <nav className="flex flex-col gap-3 text-sm font-medium text-[var(--color-ink)]">
              <a href="#specialties" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-lg">
                Specialties & Clinical Care
              </a>
              <a href="#hospitals" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-lg">
                Hospitals & Bed Status
              </a>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigateToView ? onNavigateToView('doctors') : onOpenAuth('patient'); }}
                className="p-2 text-left hover:bg-[var(--color-surface-subtle)] rounded-lg"
              >
                Specialist Directory
              </button>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[var(--color-surface-subtle)] rounded-lg">
                Care Architecture
              </a>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigateToView ? onNavigateToView('about-us') : onOpenAuth('patient'); }}
                className="p-2 text-left hover:bg-[var(--color-surface-subtle)] rounded-lg"
              >
                About Olmera
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigateToView ? onNavigateToView('contact-us') : onOpenAuth('patient'); }}
                className="p-2 text-left hover:bg-[var(--color-surface-subtle)] rounded-lg"
              >
                Contact & Helplines
              </button>
            </nav>

            <div className="pt-4 border-t border-[var(--color-line)] flex flex-col gap-2.5">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                className="w-full btn-outline py-2.5 text-xs text-center font-semibold"
              >
                Sign In to Portal
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth('patient'); }}
                className="w-full btn-accent py-2.5 text-xs text-center font-semibold"
              >
                Book Consultation Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            
            {/* Left Column: Clinical Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-mist)] text-[var(--color-primary)] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                <span>Connecting Healthcare across Rajam, Vizag & Srikakulam</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[var(--color-ink)] leading-[1.15]">
                Care, quietly <br className="hidden sm:inline" />
                <span className="text-[var(--color-primary)] italic">connected.</span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--color-muted)] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-ui font-normal">
                Olmera connects hospitals, clinical specialists, diagnostic centers, and patients into a unified digital circle of care. Schedule verified consultations, access telemetry, and manage health records with calm precision.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => onOpenAuth('patient')}
                  className="w-full sm:w-auto btn-primary px-7 py-3.5 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <Calendar size={16} /> Book Consultation
                </button>
                <button
                  onClick={() => onNavigateToView ? onNavigateToView('doctors') : onOpenAuth('patient')}
                  className="w-full sm:w-auto btn-outline px-7 py-3.5 text-sm font-semibold flex items-center justify-center gap-2.5"
                >
                  <Users size={16} /> Explore Specialists
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-[var(--color-line)] grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                <div>
                  <p className="font-display text-3xl font-semibold text-[var(--color-ink)]">120+</p>
                  <p className="text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider mt-0.5 font-ui">Specialists</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-[var(--color-ink)]">4</p>
                  <p className="text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider mt-0.5 font-ui">Regional Hubs</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-[var(--color-ink)]">15k+</p>
                  <p className="text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider mt-0.5 font-ui">Patients Served</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-[var(--color-primary)]">99.4%</p>
                  <p className="text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider mt-0.5 font-ui">Care Accuracy</p>
                </div>
              </div>

            </div>

            {/* Right Column: Search Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="card p-6 sm:p-8 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
                  <div>
                    <h3 className="font-display text-lg text-[var(--color-ink)]">Find Care Nearby</h3>
                    <p className="text-xs text-[var(--color-muted)]">Verified clinical practitioners in Andhra Pradesh</p>
                  </div>
                  <span className="p-2 bg-[var(--color-mist)] text-[var(--color-primary)] rounded-xl">
                    <Search size={18} />
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block mb-1.5 font-ui">
                      District Location
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['All', 'Visakhapatnam', 'Rajam', 'Srikakulam'].map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all truncate font-ui ${
                            selectedCity === city
                              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                              : 'bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border-[var(--color-line)] hover:border-[var(--color-muted)]'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block mb-1.5 font-ui">
                      Doctor or Department
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. Cardiologist, Internal Medicine..."
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => onNavigateToView ? onNavigateToView('doctors') : onOpenAuth('patient')}
                      className="w-full btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      Search Specialists <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--color-mist)]/40 border border-[var(--color-mist)] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0"></div>
                  <p className="text-xs text-[var(--color-primary)] font-medium font-ui">
                    38 specialists currently accepting consultations and tele-visits today.
                  </p>
                </div>
              </div>

              {/* Gateway Cards */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onOpenAuth('patient')}
                  className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] transition-all text-center group"
                >
                  <Users className="mx-auto mb-1.5 text-[var(--color-primary)] group-hover:scale-105 transition-transform" size={20} />
                  <p className="font-semibold text-xs text-[var(--color-ink)] font-ui">Patient Portal</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-ui">Health Vault</p>
                </button>

                <button
                  onClick={() => onOpenAuth('doctor')}
                  className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] transition-all text-center group"
                >
                  <UserCheck className="mx-auto mb-1.5 text-[var(--color-primary)] group-hover:scale-105 transition-transform" size={20} />
                  <p className="font-semibold text-xs text-[var(--color-ink)] font-ui">Specialist</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-ui">Clinical Notes</p>
                </button>

                <button
                  onClick={() => onOpenAuth('admin')}
                  className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] transition-all text-center group"
                >
                  <Building2 className="mx-auto mb-1.5 text-[var(--color-primary)] group-hover:scale-105 transition-transform" size={20} />
                  <p className="font-semibold text-xs text-[var(--color-ink)] font-ui">Admin</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-ui">Facilities</p>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CLINICAL SPECIALTIES */}
      <section id="specialties" className="py-20 bg-[var(--color-surface)] border-y border-[var(--color-line)]">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider block mb-2 font-ui">
                Comprehensive Departments
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
                Centers of Clinical Excellence
              </h2>
              <p className="text-sm text-[var(--color-muted)] mt-2 max-w-xl font-ui">
                From preventive health to super-specialty interventions, access accredited healthcare specialists across our regional network.
              </p>
            </div>

            <button
              onClick={() => onNavigateToView ? onNavigateToView('services') : onOpenAuth('patient')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)] hover:underline font-ui"
            >
              View All 14 Specialties <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {specialties.map((spec) => {
              const IconComp = spec.icon;
              return (
                <div
                  key={spec.id}
                  onClick={() => onNavigateToView ? onNavigateToView('doctors', { department: spec.id }) : onOpenAuth('patient')}
                  className="card p-6 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-primary)] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-mist)] text-[var(--color-primary)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <IconComp size={20} />
                    </div>
                    <h3 className="font-display text-base text-[var(--color-ink)] mb-1.5 group-hover:text-[var(--color-primary)] transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed font-ui mb-4">
                      {spec.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-xs font-semibold text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors font-ui">
                    <span>{spec.doctors} Specialists</span>
                    <span className="flex items-center gap-0.5">Consult <ChevronRight size={12} /></span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. REGIONAL HOSPITAL NETWORK */}
      <section id="hospitals" className="py-20 bg-[var(--color-bg)]">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider block font-ui">
              Integrated Facilities
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
              Accredited Regional Centers
            </h2>
            <p className="text-sm text-[var(--color-muted)] font-ui">
              Olmera unites premier healthcare institutes across Visakhapatnam, Rajam, and Srikakulam with synchronized records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {networkHospitals.map((hosp, idx) => (
              <div 
                key={idx}
                className="card bg-[var(--color-surface)] border border-[var(--color-line)] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img 
                      src={hosp.image} 
                      alt={hosp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full font-ui">
                      {hosp.city}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] font-ui">
                      {hosp.badge}
                    </span>
                    <h3 className="font-display text-base text-[var(--color-ink)] leading-snug">
                      {hosp.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] flex items-start gap-1 font-ui">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-[var(--color-muted)]" />
                      <span>{hosp.address}</span>
                    </p>

                    <div className="bg-[var(--color-surface-subtle)] p-2.5 rounded-xl space-y-1 text-xs font-ui">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Capacity:</span>
                        <span className="font-semibold text-[var(--color-ink)]">{hosp.beds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Status:</span>
                        <span className="font-semibold text-[var(--color-primary)]">{hosp.icu}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => onNavigateToView ? onNavigateToView('hospitals') : onOpenAuth('patient')}
                    className="w-full btn-outline py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    View Facility & Doctors <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. DIGITAL HEALTH INFRASTRUCTURE */}
      <section id="features" className="py-20 bg-[var(--color-surface)] border-t border-[var(--color-line)]">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider block font-ui">
                Care Architecture
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] leading-tight">
                Quiet healthcare, without the waiting room.
              </h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed font-ui">
                Olmera streamlines the fragmented clinical journey into an open, secure continuum — from the first symptom check to full recovery.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    title: 'One-Click Specialist Consultations',
                    desc: 'Real-time slot availability, instant SMS/WhatsApp confirmation, and easy rescheduling.'
                  },
                  {
                    title: 'Encrypted Electronic Health Vault (EHR)',
                    desc: 'Diagnostic reports, discharge summaries, and case notes permanently organized in your patient portal.'
                  },
                  {
                    title: 'Digital Prescriptions & Direct Pharmacy Link',
                    desc: 'Doctors issue validated digital prescriptions instantly accessible to accredited pharmacies.'
                  },
                  {
                    title: 'Transparent Records & Care Coordination',
                    desc: 'Itemized clinical notes, telehealth links, and direct care line with hospital staff.'
                  }
                ].map((feat, i) => (
                  <div key={i} className="flex gap-3.5 p-3 rounded-xl bg-[var(--color-surface-subtle)]">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[var(--color-ink)] font-ui">{feat.title}</h4>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed font-ui">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="card p-8 bg-[var(--color-primary)] text-white rounded-3xl border border-[var(--color-primary)] space-y-5">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-[#CFE3DD] inline-block font-ui">
                  Privacy Charter & Security
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-white">
                  Your medical telemetry is confidential and strictly protected.
                </h3>
                <p className="text-xs text-[#CFE3DD] leading-relaxed font-ui">
                  We adhere to international healthcare data privacy standards. All medical records are encrypted at rest and in transit, accessible only by you and attending physicians.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs text-[#CFE3DD] font-ui">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[var(--color-accent)]" size={15} />
                    <span>256-Bit SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[var(--color-accent)]" size={15} />
                    <span>Clinical NABH Protocols</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[var(--color-accent)]" size={15} />
                    <span>Verified Doctor Credentials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-[var(--color-accent)]" size={15} />
                    <span>Automated Secure Backups</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onOpenAuth('patient')}
                    className="btn-accent px-6 py-2.5 text-xs font-semibold"
                  >
                    Open Free Patient Account
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. PATIENT TESTIMONIALS */}
      <section className="py-20 bg-[var(--color-bg)]">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider block font-ui">
              Patient Voices
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
              Quiet Clarity in Healthcare
            </h2>
            <p className="text-xs text-[var(--color-muted)] font-ui">
              Hear from families, caregivers, and doctors across Andhra Pradesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className="card p-6 bg-[var(--color-surface)] border border-[var(--color-line)] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex text-[var(--color-accent)] gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-ink)] leading-relaxed italic font-ui">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--color-line)] mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-mist)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs">
                    {t.author[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--color-ink)] font-ui">{t.author}</h4>
                    <p className="text-[10px] text-[var(--color-muted)] font-ui">{t.location} • {t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. CALL TO ACTION STRIP */}
      <section className="py-14 bg-[var(--color-primary)] text-white">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl text-white">
              Connect to calm, professional healthcare.
            </h2>
            <p className="text-xs text-[#CFE3DD] font-ui">
              Care, quietly connected. Serving Rajam, Visakhapatnam, and Srikakulam.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onOpenAuth('patient')}
              className="btn-accent px-6 py-3 text-xs font-semibold"
            >
              Get Started as Patient
            </button>
            <button
              onClick={() => onOpenAuth('doctor')}
              className="btn-outline px-6 py-3 text-xs font-semibold text-white border-white/30 hover:bg-white/10"
            >
              Specialist Portal
            </button>
          </div>
        </div>
      </section>

      {/* 9. PUBLIC COMPREHENSIVE FOOTER */}
      <footer className="bg-[var(--color-surface)] text-[var(--color-muted)] text-xs border-t border-[var(--color-line)] font-ui">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <OlmeraWordmark className="h-7 w-auto" />
              </div>
              <p className="text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-wider">
                Care, quietly connected.
              </p>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed max-w-sm">
                Olmera is an accredited healthcare and telemetry platform connecting clinical facilities across Rajam, Visakhapatnam, and Srikakulam, Andhra Pradesh.
              </p>
              <div className="text-xs space-y-1 pt-1">
                <p>Care Desk: <a href="tel:+917032130919" className="font-semibold text-[var(--color-ink)] hover:underline">+91 70321 30919</a></p>
                <p>Emergency Ambulance: <a href="tel:108" className="font-semibold text-[var(--color-accent)] hover:underline">108</a></p>
                <p>Email: <a href="mailto:care@olmera.health" className="hover:underline">care@olmera.health</a></p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink)]">For Patients</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={() => onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Book Consultation</button></li>
                <li><button onClick={() => onNavigateToView ? onNavigateToView('doctors') : onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Specialist Directory</button></li>
                <li><button onClick={() => onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Telehealth Visits</button></li>
                <li><button onClick={() => onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Medical Records</button></li>
                <li><button onClick={() => onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Prescriptions</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink)]">Facilities</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#hospitals" className="hover:text-[var(--color-primary)] transition-colors">Olmera Health (Rajam)</a></li>
                <li><a href="#hospitals" className="hover:text-[var(--color-primary)] transition-colors">Olmera Coastal (Vizag)</a></li>
                <li><a href="#hospitals" className="hover:text-[var(--color-primary)] transition-colors">Olmera Regional (Srikakulam)</a></li>
                <li><a href="#hospitals" className="hover:text-[var(--color-primary)] transition-colors">Olmera Institute (Vizag)</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink)]">Portal Gateway</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={() => onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Patient Sign In</button></li>
                <li><button onClick={() => onOpenAuth('doctor')} className="hover:text-[var(--color-primary)] transition-colors">Specialist Login</button></li>
                <li><button onClick={() => onOpenAuth('admin')} className="hover:text-[var(--color-primary)] transition-colors">Hospital Administrator</button></li>
                <li><button onClick={() => onNavigateToView ? onNavigateToView('about-us') : onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">About Olmera</button></li>
                <li><button onClick={() => onNavigateToView ? onNavigateToView('contact-us') : onOpenAuth('patient')} className="hover:text-[var(--color-primary)] transition-colors">Contact</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 mt-8 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
            <p>© {new Date().getFullYear()} Olmera Health. All rights reserved. Care, quietly connected.</p>
            <p className="text-[11px]">
              For life-threatening emergencies, call 108 immediately.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
