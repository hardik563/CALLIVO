import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toastError('Invalid Link', 'Password reset token is missing or expired.');
      return;
    }
    if (newPassword.length < 8) {
      toastError('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.resetPassword({ token, newPassword });
      if (res.success) {
        setIsSubmitted(true);
        success('Password Reset', 'Your password has been reset successfully.');
      }
    } catch (err: any) {
      toastError('Reset Failed', err.message || 'Token may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Create New Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter a strong, unique password for your CALLIVO account
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">Password updated</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            You can now sign in to CALLIVO with your new credentials.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Proceed to Login
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              No reset token found in URL. Please use the exact link sent to your email.
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            placeholder="At least 8 characters"
            required
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            placeholder="Repeat new password"
            required
          />

          <Button
            type="submit"
            variant="glow"
            size="md"
            isLoading={isLoading}
            disabled={!token}
            className="w-full shadow-glow-sm"
          >
            Reset Password
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
