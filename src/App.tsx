import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyPage } from './pages/VerifyPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { MeetingLobbyPage } from './pages/MeetingLobbyPage';
import { MeetingRoomPage } from './pages/MeetingRoomPage';
import { ScheduleMeetingPage } from './pages/ScheduleMeetingPage';
import { CalendarPage } from './pages/CalendarPage';
import { ContactsPage } from './pages/ContactsPage';
import { MessagesPage } from './pages/MessagesPage';
import { RecordingsPage } from './pages/RecordingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

// Ensures CALLIVO branding and title persist across client-side route transitions
const RouteHeadHandler: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Preserve canonical browser branding
    document.title = 'CALLIVO — Meet. Connect. Collaborate.';

    // Ensure favicon links are intact
    let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon'][type='image/svg+xml']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.type = 'image/svg+xml';
      iconLink.href = '/favicon.svg';
      document.head.appendChild(iconLink);
    } else if (iconLink.getAttribute('href') !== '/favicon.svg') {
      iconLink.setAttribute('href', '/favicon.svg');
    }
  }, [location]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <RouteHeadHandler />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Flows */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify" element={<VerifyPage />} />
          </Route>

          {/* Onboarding Wizard */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Standalone Meeting Fullscreen Rooms */}
          <Route path="/meetings/:id/lobby" element={<MeetingLobbyPage />} />
          <Route path="/lobby/:id" element={<MeetingLobbyPage />} />
          <Route path="/meetings/:id/room" element={<MeetingRoomPage />} />
          <Route path="/room/:id" element={<MeetingRoomPage />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/schedule" element={<ScheduleMeetingPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/recordings" element={<RecordingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/account" element={<SettingsPage />} />
            <Route path="/settings/security" element={<SettingsPage />} />
            <Route path="/settings/meeting" element={<SettingsPage />} />
            <Route path="/settings/audio" element={<SettingsPage />} />
            <Route path="/settings/video" element={<SettingsPage />} />
            <Route path="/settings/notifications" element={<SettingsPage />} />
            <Route path="/settings/appearance" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
