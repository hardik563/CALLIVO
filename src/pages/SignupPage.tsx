import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { User as UserIcon, Mail, Phone, Lock, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { GoogleAccountChooserModal, GoogleAccount } from '../components/auth/GoogleAccountChooserModal';

const COUNTRY_DIAL_CODES = [
  { code: '+91', country: 'India 🇮🇳', name: 'India' },
  { code: '+1', country: 'United States 🇺🇸', name: 'United States' },
  { code: '+44', country: 'United Kingdom 🇬🇧', name: 'United Kingdom' },
  { code: '+971', country: 'UAE 🇦🇪', name: 'United Arab Emirates' },
  { code: '+65', country: 'Singapore 🇸🇬', name: 'Singapore' },
  { code: '+49', country: 'Germany 🇩🇪', name: 'Germany' },
  { code: '+61', country: 'Australia 🇦🇺', name: 'Australia' },
  { code: '+1', country: 'Canada 🇨🇦', name: 'Canada' },
];

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const generateDefaultStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setConfirmPassword(res);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the terms of service.');
      return;
    }

    const fullPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : undefined;

    try {
      setIsLoading(true);
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: fullPhone,
      });

      success('Account Created!', `Welcome to CALLIVO, ${name.trim()}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toastError('Signup Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (account: GoogleAccount) => {
    setErrorMessage(null);
    try {
      setIsLoading(true);
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        avatar: account.avatar,
      });
      setIsGoogleModalOpen(false);
      success('Welcome to CALLIVO!', `Signed in as ${account.name} (${account.email}).`);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
        <p className="text-xs text-slate-400 mt-1">Start hosting high-fidelity video meetings</p>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => setIsGoogleModalOpen(true)}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all duration-200 shadow-sm active:scale-[0.99]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-surface px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          or sign up with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrorMessage(null);
          }}
          leftIcon={<UserIcon className="w-4 h-4" />}
          placeholder="e.g. Rahul Sharma"
          required
        />

        <Input
          label="Business Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrorMessage(null);
          }}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="name@company.com"
          required
        />

        {/* International Phone Input with Indian Default */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Phone Number (Optional)
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-[#15191F] border border-[#242A33] rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              {COUNTRY_DIAL_CODES.map((c) => (
                <option key={c.code + c.name} value={c.code}>
                  {c.country} ({c.code})
                </option>
              ))}
            </select>
            <div className="flex-1">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                placeholder="73950 07338"
              />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="••••••••"
              required
            />
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMessage(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
            placeholder="••••••••"
            required
          />
        </div>

        {/* Password Strength Meter & Auto-Generate Helper */}
        {password && (
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[#101318] border border-[#242A33]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Password Strength:
              </span>
              <span
                className={`font-semibold ${
                  strength.label === 'Strong'
                    ? 'text-emerald-400'
                    : strength.label === 'Medium'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {strength.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 h-1.5">
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 1 ? strength.color : 'bg-slate-800'
                }`}
              />
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 2 ? strength.color : 'bg-slate-800'
                }`}
              />
              <div
                className={`rounded-full transition-colors ${
                  strength.score >= 3 ? strength.color : 'bg-slate-800'
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={generateDefaultStrongPassword}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3 h-3" />
            Generate Strong Password
          </button>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
        )}

        <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5"
          />
          <span>
            I agree to the <Link to="/help" className="text-brand-400 underline">Terms of Service</Link> and{' '}
            <Link to="/help" className="text-brand-400 underline">Privacy Policy</Link>.
          </span>
        </label>

        <Button
          type="submit"
          variant="glow"
          size="md"
          isLoading={isLoading}
          className="w-full shadow-glow-sm"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Free Account
        </Button>
      </form>

      <div className="text-center pt-2 text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
          Log in
        </Link>
      </div>

      <GoogleAccountChooserModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
        isLoading={isLoading}
      />
    </div>
  );
};
