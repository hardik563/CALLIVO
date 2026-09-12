import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { usersApi } from '../lib/api';
import {
  User as UserIcon,
  Mail,
  Phone,
  Camera,
  Clock,
  Trash2,
  UploadCloud,
  Loader2,
} from 'lucide-react';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+05:30) - India Standard Time' },
  { value: 'UTC', label: 'UTC (GMT+00:00) - Universal Time Coordinated' },
  { value: 'America/New_York', label: 'America/New_York (GMT-05:00) - Eastern Time' },
  { value: 'America/Chicago', label: 'America/Chicago (GMT-06:00) - Central Time' },
  { value: 'America/Denver', label: 'America/Denver (GMT-07:00) - Mountain Time' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-08:00) - Pacific Time' },
  { value: 'Europe/London', label: 'Europe/London (GMT+00:00 / +01:00) - GMT / BST' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+01:00 / +02:00) - Central European Time' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+04:00) - Gulf Standard Time' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+08:00) - Singapore Time' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+09:00) - Japan Standard Time' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10:00 / +11:00) - AEST' },
];

import { AvatarCropModal } from '../components/profile/AvatarCropModal';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { success, error } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 ');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [status, setStatus] = useState(user?.status || 'online');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '+91 ');
      setTimezone(user.timezone || 'Asia/Kolkata');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setStatus(user.status || 'online');
    }
  }, [user]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      error('Invalid File Type', 'Please choose a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('File Too Large', 'Maximum image file size is 5MB.');
      return;
    }

    setSelectedImageFile(file);
    setIsCropModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveCroppedAvatar = async (croppedDataUrl: string) => {
    try {
      setUploadingAvatar(true);
      const res = await usersApi.uploadAvatar(croppedDataUrl);
      if (res.success && res.avatar) {
        setAvatar(res.avatar);
        await updateProfile({ avatar: res.avatar });
        success('Avatar Updated', 'Your profile picture has been updated.');
      } else {
        throw new Error('Avatar upload was not successful.');
      }
    } catch (err: any) {
      error('Upload Failed', err.message || 'Could not upload avatar image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await usersApi.deleteAvatar();
      setAvatar('');
      await updateProfile({ avatar: '' });
      success('Avatar Removed', 'Reverted to your name initials badge.');
    } catch (err: any) {
      error('Failed to Remove', err.message || 'Could not remove avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        timezone,
        bio: bio.trim(),
        avatar,
        status,
      });
      setIsEditing(false);
      success('Profile Saved', 'Your user information has been saved successfully.');
    } catch (err: any) {
      error('Save Failed', err.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.name || name || 'User';
  const displayEmail = user?.email || email || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Personal Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity, avatar, contact details, and meeting presence
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {/* Profile Header Block */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="relative group">
            <Avatar name={displayName} src={avatar} size="2xl" status={status} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-medium p-1"
              title="Click to upload profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 text-xs font-semibold border border-brand-500/30">
                {user?.role || 'Member'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{displayEmail}</p>
            {bio ? (
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg leading-relaxed pt-1">
                {bio}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">No bio added yet.</p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                    Upload Photo
                  </>
                )}
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove Photo
                </Button>
              )}
            </div>
          </div>

          <div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address (Account ID)"
              type="email"
              value={email}
              disabled={true}
              helperText="Email is associated with your unique account."
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase select-none mb-1.5">
                Timezone
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full bg-surface-elevated/70 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-60 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-surface text-slate-900 dark:text-white">
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase select-none mb-1.5">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditing}
              placeholder="Tell others a little bit about yourself, your role, or what you're working on..."
              className="w-full bg-surface-elevated/70 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 disabled:opacity-60 resize-none transition-colors"
            />
          </div>

          {/* Status selector */}
          {isEditing && (
            <div className="pt-2">
              <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase select-none mb-1.5">
                Current Availability
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'online', label: 'Online' },
                  { id: 'in_meeting', label: 'In Meeting' },
                  { id: 'offline', label: 'Offline' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(s.id as typeof status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      status === s.id
                        ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/40'
                        : 'bg-surface-elevated text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" size="sm" disabled={isSaving} className="shadow-glow-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Save Profile Changes'
                )}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageFile={selectedImageFile}
        initialImageUrl={avatar}
        onSave={handleSaveCroppedAvatar}
      />
    </div>
  );
};
