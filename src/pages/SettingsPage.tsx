import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AvatarCropModal } from '../components/profile/AvatarCropModal';
import { usersApi, authApi, settingsApi } from '../lib/api';
import {
  User,
  Shield,
  Video,
  Mic,
  Volume2,
  Bell,
  Palette,
  Camera,
  Trash2,
  Lock,
  Smartphone,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'account';

  const { user, updateProfile } = useAuthStore();
  const {
    noiseSuppression,
    setNoiseSuppression,
    echoCancellation,
    spatialAudio,
    setSpatialAudio,
    mirrorVideo,
    setMirrorVideo,
    hdVideo,
    setHdVideo,
    muteOnJoin,
    setMuteOnJoin,
    cameraOffOnJoin,
    setCameraOffOnJoin,
    reducedMotion,
    setReducedMotion,
  } = useSettingsStore();

  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setTimezone(user.timezone || 'Asia/Kolkata');
    }
  }, [user]);

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'meeting', label: 'Meeting', icon: <Video className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Mic className="w-4 h-4" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  ];

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        timezone,
      });
      success('Profile Updated', 'Your account profile changes have been saved.');
    } catch (err: any) {
      toastError('Update Failed', err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Avatar crop save
  const handleSaveCroppedAvatar = async (croppedDataUrl: string) => {
    try {
      const res = await usersApi.uploadAvatar(croppedDataUrl);
      if (res.success && res.avatar) {
        await updateProfile({ avatar: res.avatar });
        success('Avatar Updated', 'Your new profile avatar is now live across CALLIVO.');
      }
    } catch (err: any) {
      toastError('Avatar Upload Failed', err.message);
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    try {
      await usersApi.deleteAvatar();
      await updateProfile({ avatar: '' });
      success('Avatar Removed', 'Profile picture reset to name initials.');
    } catch (err: any) {
      toastError('Failed to Remove Avatar', err.message);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError('Invalid Password', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        success('Password Changed', 'Your account credentials have been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toastError('Password Change Failed', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Preferences & Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage profile details, security, meeting defaults, audio pipeline, and system themes
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      <Card className="p-6 sm:p-8">
        {/* ================= ACCOUNT TAB ================= */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Profile & Identity</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your real name, verified email, circular 1:1 avatar, and default time zone.
              </p>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-surface border border-slate-700/80">
              <div className="relative group">
                <Avatar name={user?.name || 'User'} src={user?.avatar} size="xl" />
                <button
                  onClick={() => setIsCropModalOpen(true)}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Change avatar photo"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-2 min-w-0">
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-semibold text-white">{user?.name || 'Your Name'}</h4>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-mono">
                    ✓ Verified Account • India Default (IST)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCropModalOpen(true)}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                    className="text-xs h-8"
                  >
                    Adjust / Crop Photo
                  </Button>
                  {user?.avatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs h-8 text-rose-400 hover:bg-rose-500/10"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hardik Dhamija"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  helperText="Primary authentication email cannot be altered directly."
                />

                <Input
                  label="Phone Number (India +91 Default)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-xs bg-surface border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - Indian Standard Time)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingProfile}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ================= SECURITY TAB ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Password & Security</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update credentials and view encryption parameters.
              </p>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4 p-5 rounded-2xl bg-surface border border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Lock className="w-4 h-4 text-brand-400" />
                <span>Change Account Password</span>
              </div>

              <div className="space-y-3">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>

            {/* Active Session & Encryption Info */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-indigo-300">
                <Shield className="w-4 h-4" />
                <span>Server-Authoritative Session Security</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                All WebRTC peer connections employ DTLS-SRTP encryption with 256-bit AES cipher suites.
                Sessions are strictly isolated across multiple devices using cryptographically signed JWTs.
              </p>
            </div>
          </div>
        )}

        {/* ================= MEETING PREFERENCES TAB ================= */}
        {activeTab === 'meeting' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Default Meeting Behaviors</h3>
            <div className="divide-y divide-slate-800">
              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Mute microphone when joining</p>
                  <p className="text-[11px] text-slate-400">Join silently without transmitting background room audio</p>
                </div>
                <input
                  type="checkbox"
                  checked={muteOnJoin}
                  onChange={(e) => setMuteOnJoin(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Turn off camera when joining</p>
                  <p className="text-[11px] text-slate-400">Join with video preview disabled by default</p>
                </div>
                <input
                  type="checkbox"
                  checked={cameraOffOnJoin}
                  onChange={(e) => setCameraOffOnJoin(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Enable 3D Spatial Audio</p>
                  <p className="text-[11px] text-slate-400">Directional audio panning in 3D spatial conference rooms</p>
                </div>
                <input
                  type="checkbox"
                  checked={spatialAudio}
                  onChange={(e) => setSpatialAudio(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* ================= AUDIO TAB ================= */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Microphone & Sound Pipeline</h3>
            <div className="divide-y divide-slate-800">
              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">AI Dynamic Noise Suppression</p>
                  <p className="text-[11px] text-slate-400">Removes background chatter, keyboard clicks, and fan noise</p>
                </div>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Hardware Echo Cancellation</p>
                  <p className="text-[11px] text-slate-400">Prevents audio feedback between speakers and microphone</p>
                </div>
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  readOnly
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* ================= VIDEO TAB ================= */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Camera & Video Rendering</h3>
            <div className="divide-y divide-slate-800">
              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Mirror My Video</p>
                  <p className="text-[11px] text-slate-400">Horizontally flips your self-view camera feed</p>
                </div>
                <input
                  type="checkbox"
                  checked={mirrorVideo}
                  onChange={(e) => setMirrorVideo(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between py-3 text-xs text-slate-300 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Ultra HD 1080p Stream Transmission</p>
                  <p className="text-[11px] text-slate-400">Delivers maximum fidelity when network bandwidth permits</p>
                </div>
                <input
                  type="checkbox"
                  checked={hdVideo}
                  onChange={(e) => setHdVideo(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* ================= NOTIFICATIONS TAB ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Alerts & Reminders</h3>
            <div className="divide-y divide-slate-800">
              <div className="flex items-center justify-between py-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-white">Meeting Start Reminders</p>
                  <p className="text-[11px] text-slate-400">Notify 10 minutes prior to scheduled calendar sessions</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-white">Direct Message Toasts</p>
                  <p className="text-[11px] text-slate-400">Popup notification when a colleague messages you</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= APPEARANCE TAB ================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Theme & Display</h3>
            <p className="text-xs text-slate-400">
              Switch dynamically between authentic dark mode, crisp light mode, or system automatic matching.
            </p>
            <div className="pt-3">
              <ThemeToggle />
            </div>
          </div>
        )}
      </Card>

      {/* Avatar Crop & Pan Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        initialImageUrl={user?.avatar}
        onSave={handleSaveCroppedAvatar}
      />
    </div>
  );
};
