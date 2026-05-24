import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import BottomNav from './components/layout/BottomNav';
import NotificationCenter from './components/NotificationCenter';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

// Lazy loading
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
import CupoanePage from './pages/CupoanePage';
const MemoriesPage  = lazy(() => import('./pages/MemoriesPage'));
const GamesPage     = lazy(() => import('./pages/GamesPage'));
const TruthDarePage = lazy(() => import('./pages/TruthDarePage'));
const MoodPage      = lazy(() => import('./pages/MoodPage'));
const ProfilePage   = lazy(() => import('./pages/ProfilePage'));
const CalendarPage  = lazy(() => import('./pages/CalendarPage'));

// Loading fallback
function PageLoader() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      background: 'var(--bg-primary)',
    }}>
      <span className="animate-heartbeat">💕</span>
    </div>
  );
}

import { LocalNotifications } from '@capacitor/local-notifications';
import { useEvents } from './hooks/useDatabase';

// Manager pentru notificări locale (sincronizare cu Calendarul)
function LocalNotificationManager() {
  const { events } = useEvents();

  useEffect(() => {
    async function syncNotifications() {
      if (!events || events.length === 0) return;
      
      try {
        // Solicităm permisiuni
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') return;

        // Ștergem toate notificările locale programate (pentru a le recrea actualizate)
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const now = new Date();
        const notificationsToSchedule = [];

        events.forEach(event => {
          if (!event.date) return;
          const [year, month, day] = event.date.split('-');
          const eventDate = new Date(year, month - 1, day, 9, 0, 0); // 9:00 AM în ziua evenimentului
          const oneDayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

          // ID-uri unice bazate pe timestamp pentru a programa
          const hashId = (str) => {
            let h = 0;
            for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
            return Math.abs(h);
          };
          
          const eventIdNum = hashId(event.id);

          if (oneDayBefore > now) {
            notificationsToSchedule.push({
              title: `🗓️ Mâine: ${event.name}`,
              body: 'Nu uita de evenimentul de mâine!',
              id: eventIdNum + 1,
              schedule: { at: oneDayBefore },
              smallIcon: 'ic_stat_icon_config_sample',
            });
          }

          if (eventDate > now) {
            notificationsToSchedule.push({
              title: `🗓️ Astăzi: ${event.name}`,
              body: 'Azi e ziua cea mare!',
              id: eventIdNum + 2,
              schedule: { at: eventDate },
              smallIcon: 'ic_stat_icon_config_sample',
            });
          }
        });

        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsToSchedule });
        }
      } catch (e) {
        console.error("Local Notifications error:", e);
      }
    }

    syncNotifications();
  }, [events]);

  return null;
}

// Aplicația principală (autentificată ca 'her' sau 'his')
function MainApp({ role, getDiaryPassphrase }) {
  const passphrase = getDiaryPassphrase();
  useEffect(() => {
    document.body.className = `theme-${role}`;
    return () => { document.body.className = ''; };
  }, [role]);

  return (
    <BrowserRouter>
      <LocalNotificationManager />
      <div className="app-background" aria-hidden="true" />
      <NotificationCenter role={role} />
      
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"         element={<DashboardPage role={role} />} />
            <Route path="/cupoane"  element={<CupoanePage />} />
            <Route path="/memories" element={<MemoriesPage role={role} />} />
            <Route path="/mood"     element={<MoodPage passphrase={passphrase} role={role} />} />
            <Route path="/games"      element={<GamesPage role={role} />} />
            <Route path="/truth-dare"  element={<TruthDarePage role={role} />} />
            <Route path="/calendar" element={<CalendarPage role={role} />} />
            <Route path="/profile"  element={<ProfilePage role={role} />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <BottomNav role={role} />
    </BrowserRouter>
  );
}

// Panoul de admin
function AdminApp({ onLogout }) {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh' }}>
      <AdminPage onLogout={onLogout} />
    </div>
  );
}

// Root logic
function AppContent() {
  const { isAuthenticated, isAdmin, isLoading, login, logout, role, getDiaryPassphrase, resetPassword } = useAuth();

  if (isLoading) return <PageLoader />;

  // Admin logat → Panou admin (fără BottomNav, fără acces la app-ul normal)
  if (isAdmin) {
    return <AdminApp onLogout={logout} />;
  }

  // Ea/El logat → Aplicația principală
  if (isAuthenticated) {
    return <MainApp role={role} getDiaryPassphrase={getDiaryPassphrase} />;
  }

  // Nelogat → Ecran de login
  return <LoginPage onSuccess={login} onResetPassword={resetPassword} />;
}

export default function App() {
  return <AppContent />;
}
