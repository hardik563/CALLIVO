import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useMeetingStore } from '../stores/meetingStore';

export function useKeybindings() {
  const { setCommandPaletteOpen, isCommandPaletteOpen, setKeyboardShortcutsOpen, isKeyboardShortcutsOpen } = useUiStore();
  const { toggleMute, toggleCamera } = useMeetingStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Keyboard shortcuts dialog (? or Shift+/)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setKeyboardShortcutsOpen(!isKeyboardShortcutsOpen);
        return;
      }

      // Inside inputs, don't trigger meeting hotkeys
      if (isInput) return;

      // Toggle Mute (M)
      if (e.key.toLowerCase() === 'm') {
        toggleMute();
      }

      // Toggle Camera (V)
      if (e.key.toLowerCase() === 'v') {
        toggleCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    isKeyboardShortcutsOpen,
    setCommandPaletteOpen,
    setKeyboardShortcutsOpen,
    toggleMute,
    toggleCamera,
  ]);
}
