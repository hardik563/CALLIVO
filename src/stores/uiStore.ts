import { create } from 'zustand';

interface UiState {
  isCommandPaletteOpen: boolean;
  isGlobalSearchOpen: boolean;
  isJoinModalOpen: boolean;
  isScheduleModalOpen: boolean;
  isKeyboardShortcutsOpen: boolean;
  isMobileMenuOpen: boolean;
  sidebarCollapsed: boolean;

  setCommandPaletteOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setScheduleModalOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCommandPaletteOpen: false,
  isGlobalSearchOpen: false,
  isJoinModalOpen: false,
  isScheduleModalOpen: false,
  isKeyboardShortcutsOpen: false,
  isMobileMenuOpen: false,
  sidebarCollapsed: false,

  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  setJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
  setScheduleModalOpen: (open) => set({ isScheduleModalOpen: open }),
  setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
