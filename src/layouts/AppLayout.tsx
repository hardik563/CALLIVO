import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { JoinMeetingModal } from '../components/dashboard/JoinMeetingModal';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';
import { useKeybindings } from '../hooks/useKeybindings';
import { useAuthStore } from '../stores/authStore';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Activate global keyboard listeners (Ctrl+K, M, V, etc.)
  useKeybindings();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100 flex overflow-x-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Mobile Slide-out Menu Drawer */}
      <MobileSidebarDrawer />

      {/* Global Overlays & Modals */}
      <CommandPalette />
      <GlobalSearchModal />
      <NotificationsDrawer />
      <KeyboardShortcutsModal />
      <JoinMeetingModal />
    </div>
  );
};
