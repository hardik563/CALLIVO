import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [digits, setDigits] = useState(['5', '2', '8', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      success('Email Verified!', 'Your account has been fully authenticated.');
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Verify Your Email</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter the 6-digit code sent to your registered email
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-surface-elevated border border-slate-700 text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="glow"
          size="md"
          isLoading={isLoading}
          className="w-full shadow-glow-sm"
        >
          Verify & Continue
        </Button>

        <p className="text-xs text-slate-400">
          Didn’t receive the code?{' '}
          <button type="button" className="text-brand-400 hover:text-brand-300 font-semibold underline">
            Resend in 42s
          </button>
        </p>
      </form>
    </div>
  );
};
