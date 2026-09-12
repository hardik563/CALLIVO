import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { Mic, Video, Volume2, Shield } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedMic,
    selectedCamera,
    selectedSpeaker,
    setSelectedMic,
    setSelectedCamera,
    setSelectedSpeaker,
    noiseSuppression,
    setNoiseSuppression,
    echoCancellation,
  } = useSettingsStore();

  const { success } = useToast();

  const [availableMics, setAvailableMics] = useState<{ value: string; label: string }[]>([
    { value: 'default', label: 'Default Microphone (System Audio Input)' },
    { value: 'mic-1', label: 'Studio USB Condenser Microphone' },
    { value: 'mic-2', label: 'Headset Hands-Free Audio' },
  ]);

  const [availableCameras, setAvailableCameras] = useState<{ value: string; label: string }[]>([
    { value: 'default', label: 'Integrated High Definition WebCam (1080p)' },
    { value: 'cam-1', label: 'Ultra-Wide 4K Conference Camera' },
    { value: 'cam-2', label: 'Virtual OBS Video Source' },
  ]);

  const [availableSpeakers, setAvailableSpeakers] = useState<{ value: string; label: string }[]>([
    { value: 'default', label: 'Default Speakers (High Definition Audio)' },
    { value: 'spk-1', label: 'External Studio Audio Interface' },
  ]);

  // Read actual system devices if supported
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const mics = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d, i) => ({ value: d.deviceId || `mic-${i}`, label: d.label || `Microphone ${i + 1}` }));
        const cams = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d, i) => ({ value: d.deviceId || `cam-${i}`, label: d.label || `Camera ${i + 1}` }));
        const spks = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d, i) => ({ value: d.deviceId || `spk-${i}`, label: d.label || `Speaker ${i + 1}` }));

        if (mics.length > 0) setAvailableMics(mics);
        if (cams.length > 0) setAvailableCameras(cams);
        if (spks.length > 0) setAvailableSpeakers(spks);
      }).catch(() => {
        // use default mock fallback lists
      });
    }
  }, []);

  const handleSave = () => {
    success('Device Settings Updated', 'Audio and video device preferences saved.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audio & Video Settings"
      description="Configure your input devices, hardware acceleration, and audio filters."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Camera Select */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-brand-400 mt-6">
            <Video className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Select
              label="Camera Device"
              options={availableCameras}
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
            />
          </div>
        </div>

        {/* Microphone Select */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 mt-6">
            <Mic className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Select
              label="Microphone Device"
              options={availableMics}
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
            />
          </div>
        </div>

        {/* Speaker Select */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-purple-400 mt-6">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Select
              label="Speaker / Output Device"
              options={availableSpeakers}
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
            />
          </div>
        </div>

        {/* AI Audio Filters */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 space-y-2 mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span>AI Noise Cancellation & Audio Enhancement</span>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-1">
            <span>Dynamic Background Noise Suppression</span>
            <input
              type="checkbox"
              checked={noiseSuppression}
              onChange={(e) => setNoiseSuppression(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 bg-slate-800 border-slate-700 w-4 h-4"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
