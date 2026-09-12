import React from 'react';
import { Modal } from '../components/ui/Modal';
import { useUiStore } from '../stores/uiStore';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isKeyboardShortcutsOpen, setKeyboardShortcutsOpen } = useUiStore();

  const shortcuts = [
    { key: '⌘ / Ctrl + K', description: 'Open Global Command Palette' },
    { key: 'M', description: 'Toggle Microphone Mute / Unmute' },
    { key: 'V', description: 'Toggle Camera On / Off' },
    { key: '?', description: 'Open Keyboard Shortcuts Guide' },
    { key: 'Space', description: 'Push to talk (while held)' },
    { key: 'Esc', description: 'Close modals, drawers, and overlays' },
  ];

  return (
    <Modal
      isOpen={isKeyboardShortcutsOpen}
      onClose={() => setKeyboardShortcutsOpen(false)}
      title="Keyboard Shortcuts"
      description="Navigate CALLIVO at high speed using built-in keyboard hotkeys."
      maxWidth="md"
    >
      <div className="divide-y divide-slate-800 pt-2">
        {shortcuts.map((s) => (
          <div key={s.key} className="flex items-center justify-between py-2.5 text-xs">
            <span className="text-slate-300 font-medium">{s.description}</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-slate-700 text-slate-200 font-mono text-[11px] shadow-sm">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
};
