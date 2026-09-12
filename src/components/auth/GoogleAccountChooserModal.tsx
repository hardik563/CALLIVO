import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, ArrowRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export interface GoogleAccount {
  name: string;
  email: string;
  avatar?: string;
}

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: GoogleAccount) => Promise<void>;
  isLoading?: boolean;
}

const STORAGE_KEY = 'callivo_saved_google_accounts';

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isLoading = false,
}) => {
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccount[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load saved accounts from localStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAccounts(parsed);
            setIsAddingNew(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not parse saved google accounts:', e);
      }
      // If no accounts saved yet on this device, open the input form directly
      setIsAddingNew(true);
    }
  }, [isOpen]);

  const handleChoose = async (account: GoogleAccount) => {
    // Save/update account in list
    saveAccountToList(account);
    await onSelectAccount(account);
  };

  const saveAccountToList = (account: GoogleAccount) => {
    try {
      const existing = savedAccounts.filter(
        (a) => a.email.toLowerCase() !== account.email.toLowerCase()
      );
      const updated = [account, ...existing].slice(0, 5); // keep max 5
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {
      console.warn('Could not save google account to localStorage:', e);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedAccounts(updated);
    if (updated.length === 0) {
      setIsAddingNew(true);
    }
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const emailClean = newEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@') || !emailClean.includes('.')) {
      setValidationError('Please enter a valid Google email address.');
      return;
    }

    const nameClean = newName.trim() || emailClean.split('@')[0];
    const account: GoogleAccount = {
      name: nameClean,
      email: emailClean,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameClean)}&background=10B981&color=fff`,
    };

    handleChoose(account);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={isLoading ? undefined : onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[#101318] border border-slate-700/90 rounded-2xl p-6 shadow-2xl z-10 text-white"
          >
            {/* Header with Google Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span className="font-semibold text-sm text-slate-200">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-5 pb-3">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isAddingNew && savedAccounts.length === 0
                  ? 'Sign in with your Google Account'
                  : 'Choose an account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                to continue to <span className="text-emerald-400 font-semibold">CALLIVO</span>
              </p>
            </div>

            {/* Account List */}
            {!isAddingNew ? (
              <div className="space-y-2 my-3 max-h-60 overflow-y-auto">
                {savedAccounts.map((account) => (
                  <div
                    key={account.email}
                    onClick={() => !isLoading && handleChoose(account)}
                    className="group flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={account.name}
                        src={account.avatar}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{account.name}</p>
                        <p className="text-xs text-slate-400 truncate">{account.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(e, account.email)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Remove from device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Option to use another account */}
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold transition-all duration-200 mt-3"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              /* Add New Account Form */
              <form onSubmit={handleAddNewSubmit} className="space-y-4 my-3">
                {validationError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {validationError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Google Account Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Virat Kohli or Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Google Email Address <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@gmail.com or workspace@company.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {savedAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Privacy Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
              To continue, Google will share your name, email address, language preference, and profile picture with CALLIVO. Before using this app, review CALLIVO’s{' '}
              <a href="/privacy" className="text-emerald-400/80 hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="text-emerald-400/80 hover:underline">
                Terms of Service
              </a>
              .
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
