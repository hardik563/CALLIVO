import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useMediaStream } from '../hooks/useMediaStream';
import { useAudioMeter } from '../hooks/useAudioMeter';
import {
  Sparkles,
  User as UserIcon,
  Video,
  Mic,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { AppTheme } from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();

  const [step, setStep] = useState(1);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileRole, setProfileRole] = useState(user?.role || 'Team Member');

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
    if (user?.role) setProfileRole(user.role);
  }, [user]);

  // Media stream for Camera & Mic testing steps
  const { stream, error, isUsingFallback } = useMediaStream({
    videoEnabled: step === 3,
    audioEnabled: step === 4,
  });

  const { volume, frequencies, isSpeaking } = useAudioMeter(stream);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (step === 3 && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  const handleNext = () => {
    if (step === 2) {
      updateProfile({ name: profileName, role: profileRole });
    }
    if (step < 6) {
      setStep((s) => s + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Step Indicators */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between z-10">
        <Logo size="md" clickable={false} />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-brand-500 shadow-glow-sm'
                  : s < step
                  ? 'w-4 bg-brand-700'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Wizard Content Card */}
      <div className="max-w-xl mx-auto w-full my-auto z-10 py-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-glow">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Welcome to CALLIVO
                </h1>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Let’s take 60 seconds to personalize your workspace, verify your camera and microphone,
                  and ensure you have an exceptional meeting experience.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CREATE PROFILE */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">Customize Your Profile</h2>
                <p className="text-xs text-slate-400">
                  How other meeting participants will see and identify you
                </p>
              </div>
              <div className="space-y-4 bg-surface p-6 rounded-3xl border border-slate-800">
                <Input
                  label="Display Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  placeholder="e.g. Hardik Dhamija"
                  required
                />
                <Input
                  label="Role / Title"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  placeholder="e.g. Engineering Lead, Product Designer"
                  required
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: CAMERA TEST */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">Camera Check</h2>
                <p className="text-xs text-slate-400">
                  Verifying your video input stream
                </p>
              </div>

              <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isUsingFallback ? 'Virtual HD Camera Simulation' : 'Live Camera Feed'}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: MICROPHONE TEST */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Microphone Test</h2>
                <p className="text-xs text-slate-400">
                  Speak out loud to test your audio input levels
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-surface border border-slate-800 space-y-6">
                <div className="flex items-center justify-center gap-3">
                  <div className={`p-3 rounded-2xl ${isSpeaking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'} transition-colors`}>
                    <Mic className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">
                      {isSpeaking ? 'Audio Detected!' : 'Listening for audio...'}
                    </p>
                    <p className="text-xs text-slate-400">Microphone: Default System Audio</p>
                  </div>
                </div>

                {/* Live Animated Frequency Visualizer Bars */}
                <div className="flex items-end justify-center gap-2 h-16 py-2">
                  {frequencies.map((f, i) => (
                    <motion.div
                      key={i}
                      className="w-3 rounded-full bg-gradient-to-t from-brand-600 to-indigo-400 transition-all duration-75"
                      style={{ height: `${Math.max(12, f)}%` }}
                    />
                  ))}
                </div>

                <p className="text-xs font-mono text-brand-300">
                  Level: {volume}% {volume > 15 ? '• Optimal range' : '• Try speaking a sentence'}
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 5: CHOOSE THEME */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Choose Your Theme</h2>
                <p className="text-xs text-slate-400">
                  Select your preferred visual style (can be changed anytime)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'dark' as AppTheme, label: 'Dark', icon: <Moon className="w-6 h-6 text-indigo-400" /> },
                  { id: 'light' as AppTheme, label: 'Light', icon: <Sun className="w-6 h-6 text-amber-400" /> },
                  { id: 'system' as AppTheme, label: 'System', icon: <Monitor className="w-6 h-6 text-slate-400" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                      theme === t.id
                        ? 'border-brand-500 bg-brand-500/10 shadow-glow-sm ring-2 ring-brand-500/40'
                        : 'border-slate-800 bg-surface hover:border-slate-700'
                    }`}
                  >
                    {t.icon}
                    <span className="text-xs font-semibold text-white">{t.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 6: READY */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-glow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white">You are all set!</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your profile and devices are configured. Welcome to CALLIVO.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav Buttons */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between z-10 pt-4">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          variant="glow"
          size="md"
          onClick={handleNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="shadow-glow-sm px-6"
        >
          {step === 6 ? 'Go to Dashboard' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
