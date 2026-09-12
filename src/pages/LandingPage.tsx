import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero3D } from '../components/three/Hero3D';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  Lock,
  ArrowRight,
  Headphones,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  Smile,
  Hand,
  FileText,
  Radio,
  Bot,
  Layers,
  ShieldCheck,
  Copy,
  Check,
  PhoneOff,
  Settings,
  Volume2,
  Clock,
  Star,
  PlusCircle,
  Briefcase,
  GraduationCap,
  Building2,
  Rocket,
  Layout,
  Share2,
  ChevronRight,
  Send,
  Pin,
  Maximize2,
  Activity,
} from 'lucide-react';
import { generateMeetingId } from '../lib/utils';
import { meetingsApi } from '../lib/api';
import { useMeetingStore } from '../stores/meetingStore';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { LandingSpatialRoom } from '../components/landing/LandingSpatialRoom';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveMeeting } = useMeetingStore();
  const { setJoinModalOpen } = useUiStore();
  const { isAuthenticated, logout } = useAuthStore();

  // Interactive meeting preview state
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeReactions, setActiveReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTeamCategory, setSelectedTeamCategory] = useState(0);

  // Interactive feature demo states
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [blurMode, setBlurMode] = useState<'blur' | 'virtual' | 'off'>('blur');
  const [isRecording, setIsRecording] = useState(true);
  const [screenSource, setScreenSource] = useState<'screen' | 'window' | 'tab'>('window');
  const [todoNotes, setTodoNotes] = useState([
    { id: 1, text: 'Review quarterly product roadmap deck', done: true },
    { id: 2, text: 'Finalize audio engine WebAssembly codecs', done: true },
    { id: 3, text: 'Deploy multi-region TURN relay fallback', done: false },
  ]);

  const handleStartInstant = async () => {
    try {
      const res = await meetingsApi.create({
        title: 'Instant CALLIVO Session',
        waitingRoom: false,
      });
      if (res.success && res.meeting) {
        setActiveMeeting({
          id: res.meeting.id,
          title: res.meeting.title,
          passcode: res.meeting.passcode,
          isHost: true,
        });
        navigate(`/room/${res.meeting.id}`);
        return;
      }
    } catch (err) {
      console.warn('Instant meeting creation notice:', err);
    }
    const id = generateMeetingId();
    setActiveMeeting({ id, title: 'Instant CALLIVO Session', isHost: true });
    navigate(`/room/${id}`);
  };

  const handleJoin = () => {
    setJoinModalOpen(true);
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setActiveReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  const copyMeetingInvite = () => {
    navigator.clipboard?.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const teamCategories = [
    {
      title: 'Product & Design',
      icon: Layout,
      stat: '60 FPS Canvas',
      description: 'Review interactive prototypes, run sprint critiques, and share design canvases with pixel-perfect clarity.',
      tag: 'Zero Lag',
    },
    {
      title: 'Remote Teams',
      icon: Globe,
      stat: '< 20ms Audio',
      description: 'Seamless daily standups, spontaneous huddles, and asynchronous notes that keep distributed teams in lockstep.',
      tag: 'Always Connected',
    },
    {
      title: 'High-Growth Startups',
      icon: Rocket,
      stat: '0-Click Joins',
      description: 'Fast-paced customer demos and investor calls without forcing any client software downloads.',
      tag: 'No Friction',
    },
    {
      title: 'Education & Academics',
      icon: GraduationCap,
      stat: 'Breakout Ready',
      description: 'Dynamic interactive classrooms, scheduled office hours, and automatic AI-generated study summaries.',
      tag: 'Smart Learning',
    },
    {
      title: 'Freelancers & Agencies',
      icon: Briefcase,
      stat: 'Branded Lobbies',
      description: 'Impress clients with customized meeting spaces, studio-grade audio, and instant recording links.',
      tag: 'Professional',
    },
    {
      title: 'Enterprise Teams',
      icon: Building2,
      stat: 'SOC 2 Type II',
      description: 'Strict security governance, SAML SSO directory sync, dedicated TURN relays, and HIPAA-ready compliance.',
      tag: 'Bank-Grade',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D10] text-slate-100 overflow-x-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 00 — NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-[#0B0D10]/90 backdrop-blur-xl border-b border-[#242A33] px-6 lg:px-12 h-20 flex items-center justify-between transition-colors">
        <Logo size="md" showTagline={true} />

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#meetings-experience" className="hover:text-white transition-colors">Meetings</a>
          <a href="#ai-assistant" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Assistant
          </a>
          <a href="#spatial" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Spatial 3D
          </a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-[#15191F]">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="glow"
                size="sm"
                onClick={handleStartInstant}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Start Meeting
              </Button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors px-2 py-1"
                title="Sign Out"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-[#15191F]">
                  Sign In
                </Button>
              </Link>
              <Button
                variant="glow"
                size="sm"
                onClick={handleStartInstant}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 01 — HERO WITH 3D CANVAS & WARM GRAPHITE LIGHTING */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-10 pb-20 px-6 overflow-hidden bg-[#0B0D10]">
        {/* Subtle neutral starlight glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none" />

        {/* Three.js 3D Floating Scene */}
        <Hero3D />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 pointer-events-auto">
          {/* Status Beacon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#15191F] border border-[#242A33] text-xs font-semibold text-slate-300 shadow-lg hover:border-emerald-500/40 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-slate-200">CALLIVO 2.0 Live</span>
            <span className="text-[#242A33]">•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              Ultra-HD Spatial Audio Engine <ChevronRight className="w-3 h-3" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]"
          >
            Meet. Connect.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-400">
              Collaborate.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Crystal-clear 1080p WebRTC, studio-quality noise isolation, live collaborative tools,
            and signature 3D spatial conference rooms. Designed for modern teams who respect their time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              variant="glow"
              size="lg"
              onClick={handleStartInstant}
              leftIcon={<Video className="w-5 h-5" />}
              className="text-sm px-8 shadow-glow"
            >
              Start a Meeting
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleJoin}
              leftIcon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
              className="text-sm px-8 bg-[#15191F] border-[#242A33] hover:border-slate-600 text-slate-200"
            >
              Join a Meeting
            </Button>
          </motion.div>

          {/* Live System Telemetry Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-6"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero downloads required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1080p 60 FPS WebRTC
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> &lt;20ms audio latency
            </span>
          </motion.div>
        </div>

        {/* Section transition gradient mask */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#101318] pointer-events-none" />
      </section>

      {/* 02 — BUILT FOR TEAMS THAT MEET EVERY DAY */}
      <section className="py-20 border-y border-[#242A33] bg-[#101318] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Engineered For High Performance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Built for teams that meet every day
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              From spontaneous two-person standups to global town halls, CALLIVO adapts seamlessly to your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamCategories.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedTeamCategory === idx;
              return (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedTeamCategory(idx)}
                  className={`cursor-pointer rounded-2xl p-6 bg-[#15191F] border transition-all duration-200 relative group ${
                    isSelected
                      ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'border-[#242A33] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#101318] border border-[#242A33] text-slate-300">
                      {item.stat}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#242A33]/80 text-[11px]">
                    <span className="text-slate-500 font-medium">{item.tag}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Learn workflow <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 03 — REALISTIC VIDEO-CONFERENCING PRODUCT EXPERIENCE */}
      <section id="meetings-experience" className="py-24 px-6 max-w-7xl mx-auto relative">
        {/* Soft atmospheric ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Real Meeting Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            An interface designed for actual conversation
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            No bloated menus. Crisp video tiles with dynamic active speaker emphasis, live audio visualizers,
            in-meeting chat toasts, and instant one-click host controls.
          </p>
        </div>

        {/* Hyper-Realistic Video Meeting Room Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-[#101318] border border-[#242A33] shadow-2xl overflow-hidden relative"
        >
          {/* Mockup Top Window Bar */}
          <div className="px-5 py-3.5 bg-[#0B0D10] border-b border-[#242A33] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>

              <div className="h-4 w-[1px] bg-[#242A33] mx-1" />

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#15191F] border border-[#242A33] text-xs font-mono text-slate-300">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>callivo.app/room/eng-architecture-sync</span>
                <button
                  onClick={copyMeetingInvite}
                  className="hover:text-white transition-colors text-slate-400 ml-1"
                  title="Copy Invite URL"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {copiedLink && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-fade-in">
                  Copied invite!
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REC 00:38:42
              </span>

              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#15191F] border border-[#242A33] text-slate-300 font-mono text-[11px]">
                <Activity className="w-3 h-3 text-emerald-400" /> 18ms latency • 0.0% loss
              </span>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> 1080p 60 FPS
              </span>
            </div>
          </div>

          {/* Video Grid & Meeting Stage */}
          <div className="p-4 sm:p-6 bg-[#101318] relative min-h-[460px] flex flex-col justify-between">
            {/* Active Floating Reaction Bubbles Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
              <AnimatePresence>
                {activeReactions.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 280, scale: 0.6 }}
                    animate={{ opacity: 1, y: 40, scale: 1.3 }}
                    exit={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: 2.2, ease: 'easeOut' }}
                    style={{ left: `${r.x}%` }}
                    className="absolute text-3xl filter drop-shadow-lg"
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Video Tiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Tile 1: Hardik (Active Speaker / Host) */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#15191F] border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)] group">
                <ImageWithFallback
                  src="/avatars/hardik.jpg"
                  alt="Hardik Dhamija"
                  fallbackVariant="avatar"
                  fallbackText="Hardik Dhamija"
                  className="w-full h-full object-cover"
                />

                {/* Speaker Active Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#0B0D10]/85 backdrop-blur-md border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 h-3">
                    <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                    <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                    <span className="w-1 h-3.5 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                  </span>
                  <span>Speaking</span>
                </div>

                {/* Host Nameplate */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0B0D10]/85 backdrop-blur-md border border-[#242A33] text-xs font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Hardik Dhamija (Host)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Tile 2: Elena Rostova (VP Engineering) */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#15191F] border border-[#242A33] group">
                <ImageWithFallback
                  src="/avatars/elena.jpg"
                  alt="Elena Rostova"
                  fallbackVariant="avatar"
                  fallbackText="Elena Rostova"
                  className="w-full h-full object-cover filter brightness-95"
                />

                {/* Hand Raised Banner */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 animate-bounce">
                  <span>✋</span>
                  <span>Hand Raised</span>
                </div>

                {/* Blur Active indicator */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-[#0B0D10]/70 backdrop-blur-md border border-[#242A33] text-[10px] font-mono text-slate-300">
                  AI Blur Active
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0B0D10]/85 backdrop-blur-md border border-[#242A33] text-xs font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <span>Elena Rostova</span>
                  </div>
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                </div>
              </div>

              {/* Tile 3: Marcus Vance (Product Lead) */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#15191F] border border-[#242A33] group">
                <ImageWithFallback
                  src="/avatars/marcus.jpg"
                  alt="Marcus Vance"
                  fallbackVariant="avatar"
                  fallbackText="Marcus Vance"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-[#0B0D10]/70 backdrop-blur-md border border-[#242A33] text-[10px] font-mono text-emerald-300">
                  48kHz Opus
                </div>

                {/* Reaction Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-xs">
                  🔥
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0B0D10]/85 backdrop-blur-md border border-[#242A33] text-xs font-semibold text-white">
                  <span>Marcus Vance</span>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Tile 4: Sarah Lin (Screen Presentation Preview) */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#15191F] border border-[#242A33] group">
                <ImageWithFallback
                  src="/avatars/sarah.jpg"
                  alt="Sarah Lin"
                  fallbackVariant="avatar"
                  fallbackText="Sarah Lin"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  HD 1080p
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0B0D10]/85 backdrop-blur-md border border-[#242A33] text-xs font-semibold text-white">
                  <span>Sarah Lin</span>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Live Chat Notification Toast Preview */}
            <div className="max-w-md mx-auto sm:mx-0 sm:ml-4 my-2 p-3 rounded-2xl bg-[#15191F]/90 backdrop-blur-md border border-[#242A33] shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#242A33]">
                <ImageWithFallback
                  src="/avatars/elena.jpg"
                  alt="Elena"
                  fallbackVariant="avatar"
                  fallbackText="Elena"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Elena Rostova</span>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>
                <p className="text-slate-300 truncate">
                  The WebRTC latency is under 18ms — screen share motion looks silky smooth!
                </p>
              </div>
            </div>

            {/* Interactive Bottom Meeting Control Dock */}
            <div className="mt-4 pt-4 border-t border-[#242A33] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Audio:
                </span>
                {/* Audio visualizer meter */}
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#15191F] border border-[#242A33] h-7">
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse delay-150" />
                  <span className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse delay-100" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-200" />
                </div>
              </div>

              {/* Center Control Buttons */}
              <div className="flex items-center gap-2 sm:gap-2.5 mx-auto">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    micActive
                      ? 'bg-[#15191F] border-[#242A33] text-white hover:bg-slate-800'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    cameraActive
                      ? 'bg-[#15191F] border-[#242A33] text-white hover:bg-slate-800'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}
                  title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraActive ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => triggerReaction('🚀')}
                  className="p-2.5 rounded-xl bg-[#15191F] border border-[#242A33] text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all flex items-center gap-1 text-xs"
                  title="Share Screen"
                >
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline font-medium">Share</span>
                </button>

                {/* Emoji Reactions Tray */}
                <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[#15191F] border border-[#242A33]">
                  {['👏', '❤️', '🔥', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#101318] text-sm transition-transform active:scale-125"
                      title={`Send ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                    isHandRaised
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-[#15191F] border-[#242A33] text-slate-300 hover:text-white'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised' : 'Raise'}</span>
                </button>

                <button
                  onClick={handleStartInstant}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              </div>

              {/* Host Settings */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyMeetingInvite}
                  className="px-3 py-1.5 rounded-xl bg-[#15191F] border border-[#242A33] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Invite</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 04 — SCREEN SHARING & COLLABORATION WITH FLOATING PIP */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#242A33] relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Low-Latency Screen Sharing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              60 FPS presentation with floating self-camera
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Share your entire screen, an application window, or a specific browser tab.
              Engineered with optimized motion encoding to ensure code text stays sharp and video embeds run fluidly.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#15191F] border border-[#242A33]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Full 60 FPS Motion Rendering</h4>
                  <p className="text-xs text-slate-400">Silky smooth scrolling for code reviews, wireframe walk-throughs, and video previews.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#15191F] border border-[#242A33]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Synchronized System Audio</h4>
                  <p className="text-xs text-slate-400">Transmit clear tab or app audio without echo or feedback loops.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#15191F] border border-[#242A33]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Picture-in-Picture Presenter Bubble</h4>
                  <p className="text-xs text-slate-400">Keep facial expressions and nonverbal engagement visible alongside your slides.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Share Visual Component */}
          <div className="rounded-3xl bg-[#101318] border border-[#242A33] p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#242A33] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">Sharing: Product Architecture Benchmark</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <span>60.0 FPS</span>
              </div>
            </div>

            <div className="aspect-video rounded-2xl bg-[#0B0D10] border border-[#242A33] overflow-hidden relative group">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80"
                alt="Shared Dashboard Workspace"
                fallbackVariant="media"
                fallbackText="Shared Dashboard Workspace"
                className="w-full h-full object-cover filter contrast-110"
              />

              {/* Live Annotation Marker Highlight */}
              <div className="absolute top-1/4 left-1/3 px-3 py-1 rounded-lg bg-emerald-700/90 text-white text-[11px] font-mono shadow-lg border border-emerald-400/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Hardik: &ldquo;Check API latency cliff here&rdquo;
              </div>

              {/* Floating Presenter Picture-in-Picture Tile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute bottom-4 right-4 w-36 sm:w-44 aspect-video rounded-xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-[#15191F]"
              >
                <ImageWithFallback
                  src="/avatars/hardik.jpg"
                  alt="Presenter Cam"
                  fallbackVariant="avatar"
                  fallbackText="Hardik Dhamija"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-[#0B0D10]/80 text-[10px] font-semibold text-white">
                  Hardik (Presenting)
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — EVERYTHING YOU NEED FOR BETTER MEETINGS (REPLACES PRICING ENTIRELY) */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#242A33] relative">
        {/* Soft starlight glow in background */}
        <div className="absolute top-1/4 right-10 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Complete Meeting Suite
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Everything you need for better meetings
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every tool is designed to work instantaneously without plugin bloat.
            From crystal-clear WebRTC media transmission to AI-generated summaries and granular host controls.
          </p>
        </div>

        {/* 12 Polished Interactive Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. One-click meeting join */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">One-click meeting join</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Join immediately in Chrome, Safari, Firefox, or Edge. No accounts required for guests, zero installation barriers.
              </p>
            </div>

            {/* Interactive Preview Bar */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-400 truncate text-[11px]">
                callivo.app/m/fast-sync-92
              </span>
              <button
                onClick={copyMeetingInvite}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-[#242A33] transition-colors shrink-0"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </motion.div>

          {/* 2. HD video and crystal-clear audio */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">HD video &amp; crystal audio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive 1080p 60fps WebRTC with Opus 48kHz stereo sound and machine-learning noise suppression.
              </p>
            </div>

            {/* Interactive Noise Filter Toggle */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-medium text-slate-300">
                  {noiseSuppression ? 'AI Noise Suppression: ON' : 'Raw Audio'}
                </span>
              </div>
              <button
                onClick={() => setNoiseSuppression(!noiseSuppression)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  noiseSuppression ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    noiseSuppression ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </motion.div>

          {/* 3. Screen sharing */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Native screen sharing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Present single application windows, entire displays, or browser tabs at full 60 FPS with synchronized audio.
              </p>
            </div>

            {/* Interactive Screen Tab Selector */}
            <div className="p-1 rounded-xl bg-[#101318] border border-[#242A33] flex text-[11px]">
              {(['window', 'screen', 'tab'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScreenSource(mode)}
                  className={`flex-1 py-1 rounded-lg font-medium capitalize transition-colors ${
                    screenSource === mode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 4. Meeting chat */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-time meeting chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                In-meeting threaded chat with file attachments, link previews, code snippets, and persistent history.
              </p>
            </div>

            {/* Interactive Chat Mini-Message */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-300 truncate">
                  <span className="font-semibold text-white">Elena:</span> Sent the Figma prototype link 📎
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono shrink-0">New</span>
            </div>
          </motion.div>

          {/* 5. Live reactions */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Live emoji reactions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Give instant feedback without interrupting the speaker with animated floating reaction bubbles.
              </p>
            </div>

            {/* Clickable Reactions Bar */}
            <div className="p-2 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-around">
              {['👏', '❤️', '🔥', '🎉', '🚀'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="p-1.5 rounded-lg hover:bg-[#15191F] text-sm transition-transform active:scale-125"
                  title={`Click to send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 6. Raise hand */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Hand className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Speaker hand raise queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organized speaker ordering with automatic positioning, time tracking, and gentle host notifications.
              </p>
            </div>

            {/* Interactive Hand Queue Status */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">✋</span>
                <span className="text-[11px] text-slate-300">
                  {isHandRaised ? 'You are #1 in speaker queue' : 'Queue empty • Raise to speak'}
                </span>
              </div>
              <button
                onClick={() => setIsHandRaised(!isHandRaised)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                  isHandRaised ? 'bg-amber-500/20 text-amber-300' : 'bg-[#15191F] text-slate-400 hover:text-white'
                }`}
              >
                {isHandRaised ? 'Lower' : 'Raise'}
              </button>
            </div>
          </motion.div>

          {/* 7. Meeting notes */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Collaborative notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live markdown scratchpad synchronized across all attendees with instant Notion and Slack export.
              </p>
            </div>

            {/* Interactive Checklist Item */}
            <div className="space-y-1.5 p-2.5 rounded-xl bg-[#101318] border border-[#242A33] text-[11px]">
              {todoNotes.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setTodoNotes((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, done: !n.done } : n))
                    )
                  }
                  className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      item.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-600'
                    }`}
                  >
                    {item.done && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className={item.done ? 'line-through text-slate-500 truncate' : 'text-slate-300 truncate'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 8. Calendar scheduling */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Calendar synchronization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect Google Calendar and Outlook with two-way sync, time zone smart scheduling, and auto-generated links.
              </p>
            </div>

            {/* Upcoming meeting preview */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white text-[11px]">Sprint Retrospective</p>
                <p className="text-[10px] text-slate-400">Today • 3:30 PM (in 18m)</p>
              </div>
              <Link to="/schedule">
                <span className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300">
                  Open →
                </span>
              </Link>
            </div>
          </motion.div>

          {/* 9. Participant controls */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Granular host controls</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mute on entry, lock meeting room, waiting room vetting, screen share permissions, and co-host delegation.
              </p>
            </div>

            {/* Interactive host quick toggles */}
            <div className="p-2 rounded-xl bg-[#101318] border border-[#242A33] grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded-lg bg-[#15191F] text-center text-slate-300 font-medium">
                Mute All: Active
              </div>
              <div className="p-1.5 rounded-lg bg-[#15191F] text-center text-emerald-400 font-medium">
                Lock: Secured
              </div>
            </div>
          </motion.div>

          {/* 10. Background blur & virtual backgrounds */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hardware-accelerated blur</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                On-device WebGL background blurring and custom backdrop replacement without GPU overheating.
              </p>
            </div>

            {/* Interactive blur mode picker */}
            <div className="p-1 rounded-xl bg-[#101318] border border-[#242A33] flex text-[11px]">
              {(['blur', 'virtual', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBlurMode(mode)}
                  className={`flex-1 py-1 rounded-lg font-medium capitalize transition-colors ${
                    blurMode === mode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 11. Recording */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Cloud &amp; local recording</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-tap recording with instant MP4 downloads, encrypted cloud storage, and timestamped speaker chapters.
              </p>
            </div>

            {/* Interactive Recording Bar */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-mono text-[11px] text-slate-300">
                  {isRecording ? 'REC 00:24:18' : 'Ready to record'}
                </span>
              </div>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {isRecording ? 'Pause' : 'Start'}
              </button>
            </div>
          </motion.div>

          {/* 12. AI meeting assistance */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] flex items-center justify-center text-emerald-400 mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI meeting intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live transcription, automatic key decisions extraction, and assigned action items delivered to your email.
              </p>
            </div>

            {/* Interactive Action Item Detection */}
            <div className="p-3 rounded-xl bg-[#101318] border border-[#242A33] text-[11px] text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Detected action: Elena to deploy cluster TURN</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 06 — AI MEETING ASSISTANT & REAL-TIME INTELLIGENCE */}
      <section id="ai-assistant" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#242A33] relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* AI Intelligence Live Card */}
          <div className="rounded-3xl bg-[#101318] border border-[#242A33] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242A33]">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Real-time AI Transcript &amp; Actions
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Inference
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#15191F] border border-[#242A33]">
                <p className="font-semibold text-white mb-1">Key Decision Reached:</p>
                <p className="text-slate-400 leading-relaxed">
                  Adopted Opus 48kHz audio codec and configured WebGL spatial rendering buffer to 60fps globally.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#15191F] border border-[#242A33] space-y-2.5">
                <p className="font-semibold text-white">Action Items Assigned:</p>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hardik: Finalize spatial conference room shader pipeline</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Elena: Validate Frankfurt TURN server cluster redundancy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              AI Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Instant transcripts, summaries, and smart action items
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Never worry about missing a detail during intense technical discussions.
              CALLIVO’s on-device AI assistant transcribes speech with industry-leading precision, extracts decisions,
              and generates clean executive summaries ready for your team repository.
            </p>
            <div className="pt-2">
              <Link to="/schedule">
                <Button variant="primary" size="md" leftIcon={<CalendarIcon className="w-4 h-4" />}>
                  Explore Smart Meetings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 07 — 3D SPATIAL MEETINGS (SIGNATURE INNOVATION) */}
      <section id="spatial" className="py-24 px-6 bg-gradient-to-b from-[#0B0D10] via-[#101318] to-[#0B0D10] border-t border-[#242A33] relative">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              SPATIAL CONFERENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Meet in a space, not just a grid.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Step beyond flat 2D tile galleries. Experience a virtual conference environment powered by Three.js
              with floating video panels, active speaker acoustic pulses, and interactive 3D camera controls.
            </p>
          </div>

          {/* Interactive Three.js 3D Conference Room Stage */}
          <LandingSpatialRoom />
        </div>
      </section>

      {/* 08 — ENTERPRISE SECURITY & PRIVACY */}
      <section id="security" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#242A33] relative">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Enterprise Grade Security
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Zero-compromise privacy &amp; data governance
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Engineered from day one for strict compliance frameworks and high-assurance privacy requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">AES-256 WebRTC Encryption</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All real-time audio and video frames are encrypted in transit with dynamic session keys. No unencrypted relay logs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">SOC 2 Type II Certified</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audited by independent security examiners for data privacy, confidentiality, system redundancy, and continuous uptime.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#15191F] border border-[#242A33] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101318] border border-[#242A33] text-teal-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">GDPR &amp; HIPAA Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compliant infrastructure with dedicated enterprise data residency options across North America, Europe, and Asia.
            </p>
          </div>
        </div>
      </section>

      {/* 09 — TESTIMONIALS */}
      <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#242A33] relative">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Verified Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Loved by leaders who value polish and speed
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#15191F] border border-[#242A33] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &ldquo;CALLIVO completely changed how our global product teams collaborate. The 3D spatial mode makes
                multi-timezone sprint reviews feel genuinely engaging, and zero downloads means zero friction for guests.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[#242A33]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                alt="Elena"
                fallbackVariant="avatar"
                fallbackText="Elena Rostova"
                className="w-9 h-9 rounded-full object-cover border border-[#242A33]"
              />
              <div>
                <p className="text-xs font-semibold text-white">Elena Rostova</p>
                <p className="text-[10px] text-slate-400">VP Engineering, ScaleWorks</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#15191F] border border-[#242A33] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &ldquo;The audio noise cancellation is phenomenal. Even working from busy airport lounges, my voice
                remains crisp and isolated. Truly Apple-level polish with instantaneous join speed.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[#242A33]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Marcus"
                fallbackVariant="avatar"
                fallbackText="Marcus Vance"
                className="w-9 h-9 rounded-full object-cover border border-[#242A33]"
              />
              <div>
                <p className="text-xs font-semibold text-white">Marcus Vance</p>
                <p className="text-[10px] text-slate-400">Principal Architect, DesignFlow</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#15191F] border border-[#242A33] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &ldquo;Zero downloads, immediate browser launch, and blazing fast startup speed. Our company dumped traditional
                legacy meeting tools in favor of CALLIVO and never looked back.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[#242A33]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
                alt="Sarah"
                fallbackVariant="avatar"
                fallbackText="Sarah Lin"
                className="w-9 h-9 rounded-full object-cover border border-[#242A33]"
              />
              <div>
                <p className="text-xs font-semibold text-white">Sarah Lin</p>
                <p className="text-[10px] text-slate-400">Head of Product, Apex Robotics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 — FINAL CALL TO ACTION */}
      <section className="py-24 px-6 border-t border-[#242A33] bg-gradient-to-b from-[#0B0D10] to-[#101318] relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Your next conversation starts here.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Experience the new benchmark in video conferencing. Launch an instant room in 2 seconds.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="glow"
              size="lg"
              onClick={handleStartInstant}
              leftIcon={<Video className="w-5 h-5" />}
              className="text-sm px-8 shadow-glow"
            >
              Start Free Meeting Now
            </Button>
            <Link to="/signup">
              <Button variant="secondary" size="lg" className="text-sm px-8 bg-[#15191F] border-[#242A33] text-slate-200 hover:border-slate-600">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11 — REALISTIC FOOTER */}
      <footer className="border-t border-[#242A33] py-12 px-6 lg:px-12 bg-[#101318] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <Logo size="md" showTagline={true} />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              CALLIVO is a modern video-conferencing product engineered for professional teams with ultra-low latency,
              signature 3D spatial conference rooms, and zero-download accessibility.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><a href="#meetings-experience" className="hover:text-white transition-colors">Video Meetings</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Feature Suite</a></li>
              <li><a href="#ai-assistant" className="hover:text-white transition-colors">AI Assistant</a></li>
              <li><a href="#spatial" className="hover:text-white transition-colors">3D Spatial Mode</a></li>
              <li><Link to="/schedule" className="hover:text-white transition-colors">Calendar Sync</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Security</h4>
            <ul className="space-y-2">
              <li><a href="#security" className="hover:text-white transition-colors">AES-256 Encryption</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">SOC 2 Type II</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">GDPR Compliance</a></li>
              <li><Link to="/settings/security" className="hover:text-white transition-colors">Security Settings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/onboarding" className="hover:text-white transition-colors">Onboarding Guide</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#242A33]/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CALLIVO Inc. All rights reserved. Meet. Connect. Collaborate.</p>
          <div className="flex items-center gap-6">
            <Link to="/help" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/help" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/help" className="hover:text-white transition-colors">Status Page</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
