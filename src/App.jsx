import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { useGlobalAuth } from './contexts/AuthContext.jsx';
import { useLanguage } from './contexts/LanguageContext';
import { useMonetization } from './hooks/useMonetization';
import { useEvents, useTodos, useNotifications, useProfiles } from './hooks/useDatabase';
import BottomNav from './components/layout/BottomNav';
import NotificationCenter from './components/NotificationCenter';
import LoginPage from './pages/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';
import { query, collection, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Capacitor } from '@capacitor/core';

// Lazy loading
const AdminPage     = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CupoanePage = lazy(() => import('./pages/CupoanePage'));
const MemoriesPage  = lazy(() => import('./pages/MemoriesPage'));
const GamesPage     = lazy(() => import('./pages/GamesPage'));
const TruthDarePage = lazy(() => import('./pages/TruthDarePage'));
const MoodPage      = lazy(() => import('./pages/MoodPage'));
const ProfilePage   = lazy(() => import('./pages/ProfilePage'));
const CalendarPage  = lazy(() => import('./pages/CalendarPage'));
const MessagesPage  = lazy(() => import('./pages/MessagesPage'));
const TodoPage      = lazy(() => import('./pages/TodoPage'));
const MoviesPage = lazy(() => import('./pages/MoviesPage'));
const CoupleMatchPage = lazy(() => import('./pages/CoupleMatchPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const RecommendedMoviesPage = lazy(() => import('./pages/RecommendedMoviesPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const HomePlannerPage = lazy(() => import('./pages/HomePlannerPage'));
const StudyLobbyPage = lazy(() => import('./pages/StudyLobbyPage'));

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
import { Badge } from '@capawesome/capacitor-badge';
import { useRegisterSW } from 'virtual:pwa-register/react';

function UpdatePrompt() {
  const { t } = useLanguage();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '20px',
      right: '20px',
      background: 'var(--bg-card, #fff)',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      border: '2px solid var(--accent-primary, #ff416c)'
    }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '2rem' }}>✨</span>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary, #333)' }}>{t('update.title') || 'Actualizare nouă!'}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>{t('update.desc') || 'Avem o versiune nouă. Actualizează acum!'}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--accent-primary, #ff416c)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => updateServiceWorker(true)}
        >
          {t('update.updateBtn') || 'Actualizează'}
        </button>
        <button 
          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', color: 'var(--text-primary, #333)', border: '1px solid var(--border-color, #ccc)', fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => setNeedRefresh(false)}
        >
          {t('update.laterBtn') || 'Mai târziu'}
        </button>
      </div>
    </div>
  );
}

// Manager pentru notificări locale (Calendar + To-Do) și In-App (Clopoțel)
function AppNotificationManager({ role }) {
  const { events } = useEvents();
  const { todos, updateTodo } = useTodos(role);
  const { addNotification } = useNotifications(role);
  const { t, lang } = useLanguage();

  useEffect(() => {
    async function syncNotifications() {
      if (!events || events.length === 0) return;
      try {
        // Solicităm permisiuni
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') return;

        // Ștergem toate notificările locale programate
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const notificationsToSchedule = [];
        const now = new Date();

        // 1. Sincronizare Evenimente din Calendar
        if (events && events.length > 0) {
          events.forEach(event => {
            const [year, month, day] = event.date.split('-');
            const eventDate = new Date(year, month - 1, day, 9, 0, 0); // 9:00 AM
            const oneDayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

            const hashId = (str) => {
              let h = 0;
              for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
              return Math.abs(h) % 100000000;
            };
            const eventIdNum = hashId(event.id);

            if (oneDayBefore > now) {
              notificationsToSchedule.push({
                title: t('notifications.eventTomorrowTitle').replace('{title}', event.name),
                body: t('notifications.eventTomorrowBody'),
                id: eventIdNum + 1,
                schedule: { at: oneDayBefore },
                smallIcon: 'ic_stat_icon_config_sample',
              });
            }

            if (eventDate > now) {
              notificationsToSchedule.push({
                title: t('notifications.eventTodayTitle').replace('{title}', event.name),
                body: t('notifications.eventTodayBody'),
                id: eventIdNum + 2,
                schedule: { at: eventDate },
                smallIcon: 'ic_stat_icon_config_sample',
              });
            }
          });
        }

        // 2. Sincronizare To-Do List (Deadline-uri)
        if (todos && todos.length > 0) {
          for (const todo of todos) {
            if (todo.isCompleted || !todo.deadline) continue;
            
            const dlDate = new Date(todo.deadline);
            if (isNaN(dlDate.getTime())) continue;

            const hashId = (str) => {
              let h = 0;
              for(let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
              return (Math.abs(h) % 100000000) + 100000000; // Offset for todos
            };
            const todoIdNum = hashId(todo.id);

            // A) Notificare pe telefon (Push)
            // Dimineața în ziua deadline-ului (dacă deadline-ul e mai târziu de ora 09:00)
            const morningOf = new Date(dlDate.getFullYear(), dlDate.getMonth(), dlDate.getDate(), 9, 0, 0);
            if (morningOf > now && dlDate > morningOf) {
              const timeString = dlDate.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ro-RO', {hour: '2-digit', minute:'2-digit'});
              notificationsToSchedule.push({
                title: t('notifications.taskTodayTitle').replace('{title}', todo.title),
                body: t('notifications.taskTodayBody').replace('{time}', timeString),
                id: todoIdNum + 1,
                schedule: { at: morningOf },
                smallIcon: 'ic_stat_icon_config_sample',
              });
            }

            // Cu 1 oră înainte
            const oneHourBefore = new Date(dlDate.getTime() - 60 * 60 * 1000);
            if (oneHourBefore > now) {
              notificationsToSchedule.push({
                title: t('notifications.taskSoonTitle').replace('{title}', todo.title),
                body: t('notifications.taskSoonBody'),
                id: todoIdNum + 2,
                schedule: { at: oneHourBefore },
                smallIcon: 'ic_stat_icon_config_sample',
              });
            }

            // B) Notificare în aplicație (Clopoțel)
            // Doar dacă e în viitor, ca să nu dăm notificare pentru ceva deja expirat
            if (dlDate > now) {
              // Verificăm ziua de azi
              const isToday = dlDate.toDateString() === now.toDateString();
              const isWithinHour = (dlDate - now) <= 60 * 60 * 1000;

              // Notificare dimineața sau la deschiderea app dacă e ziua deadline-ului
              if (isToday && !todo.inAppNotifiedToday) {
                const timeString = dlDate.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ro-RO', {hour: '2-digit', minute:'2-digit'});
                await addNotification(
                  t('notifications.inAppTaskTodayTitle').replace('{title}', todo.title), 
                  t('notifications.inAppTaskTodayBody').replace('{time}', timeString), 
                  role, role
                );
                await updateTodo(todo.id, { inAppNotifiedToday: true });
              }

              // Notificare cu 1 oră înainte (dacă a intrat în app în acest interval)
              if (isWithinHour && !todo.inAppNotified1Hour) {
                await addNotification(
                  t('notifications.inAppTaskSoonTitle').replace('{title}', todo.title), 
                  t('notifications.inAppTaskSoonBody'), 
                  role, role
                );
                await updateTodo(todo.id, { inAppNotified1Hour: true });
              }
            }
          }
        }

        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsToSchedule });
        }
      } catch (e) {
        console.error("Local Notifications error:", e);
      }
    }

    const timerId = setTimeout(() => {
      syncNotifications();
    }, 1000);

    return () => clearTimeout(timerId);
  }, [events, todos]);

  return null;
}

function ChatNotificationManager({ role }) {
  const [lastMessageId, setLastMessageId] = useState(null);
  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: partnerProfile } = useProfiles(partnerRole);
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('sender', '==', partnerRole),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        docs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const newMsg = docs[0];
        const newMsgId = newMsg.id;
        
        // Dacă e un mesaj nou pe care nu l-am notificat deja și NU suntem pe pagina de chat
        if (lastMessageId !== newMsgId && window.location.pathname !== '/chat') {
          setLastMessageId(newMsgId);
          
          try {
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display === 'granted') {
              const partnerName = partnerProfile?.name || (role === 'his' ? 'Ana' : 'Andrei');
              await LocalNotifications.schedule({
                notifications: [{
                  title: t('notifications.chatNewMessageTitle').replace('{name}', partnerName),
                  body: newMsg.text,
                  id: Math.floor(Math.random() * 100000),
                  schedule: { at: new Date(Date.now() + 1000) },
                  smallIcon: 'ic_stat_icon_config_sample'
                }]
              });
            }
          } catch (e) {
            console.error("Chat push notif error:", e);
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [role, lastMessageId, partnerRole, partnerProfile]);

  return null;
}

// Global Badge Manager
function GlobalBadgeManager({ role }) {
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    if (!role || role === 'admin') return;
    const partnerRole = role === 'his' ? 'her' : 'his';
    
    // Listen to Unread Messages
    const qMsg = query(
      collection(db, 'messages'),
      where('sender', '==', partnerRole),
      where('read', '==', false)
    );
    const unMsg = onSnapshot(qMsg, (snap) => setUnreadMsg(snap.docs.length));

    // Listen to Unread Notifications
    const qNotif = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unNotif = onSnapshot(qNotif, (snap) => {
      const all = snap.docs.map(doc => doc.data());
      const mine = all.filter(n => !n.targetRole || n.targetRole === role);
      const unreadCount = mine.filter(n => !n.readBy?.includes(role)).length;
      setUnreadNotif(unreadCount);
    });

    return () => { unMsg(); unNotif(); };
  }, [role]);

  useEffect(() => {
    const updateBadge = async () => {
      try {
        // Capacitor-badge requires checking if supported and requesting permissions
        const support = await Badge.isSupported();
        if (!support.isSupported) return;
        
        let perm = await Badge.checkPermissions();
        if (perm.display !== 'granted') {
          perm = await Badge.requestPermissions();
        }
        
        if (perm.display === 'granted') {
          await Badge.set({ count: unreadMsg + unreadNotif });
        }
      } catch (e) {
        console.error("Badge update error", e);
      }
    };
    
    if (Capacitor.isNativePlatform()) {
      updateBadge();
    }
  }, [unreadMsg, unreadNotif]);

  return null;
}

function AppUrlListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      const slug = event.url.split('couplehub://app').pop();
      if (slug) {
        navigate(slug);
      }
    });
    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
  return null;
}

// Aplicația principală (autentificată ca 'her' sau 'his')
function MainApp({ role, gender, getDiaryPassphrase }) {
  const passphrase = getDiaryPassphrase();
  const { showBanner, hideBanner } = useMonetization();

  useEffect(() => {
    document.body.className = `theme-${gender === 'F' ? 'her' : 'his'}`;
    return () => { document.body.className = ''; };
  }, [gender]);

  // Afișează banner-ul reclamelor pentru userii non-Pro
  useEffect(() => {
    showBanner();
    return () => hideBanner();
  }, [showBanner, hideBanner]);

  return (
    <BrowserRouter>
      <AppUrlListener />
      <GlobalBadgeManager role={role} />
      <div className="app-background" aria-hidden="true" />
      <NotificationCenter role={role} />
      <UpdatePrompt />
      
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            
            <Route path="/" element={<DashboardPage role={role} />} />
            <Route path="/cupoane" element={<CupoanePage role={role} />} />
            <Route path="/memories" element={<MemoriesPage role={role} />} />
            <Route path="/games" element={<GamesPage role={role} />} />
            <Route path="/truth-dare" element={<TruthDarePage role={role} />} />
            <Route path="/mood" element={<MoodPage role={role} />} />
            <Route path="/profile" element={<ProfilePage role={role} />} />
            <Route path="/calendar" element={<CalendarPage role={role} />} />
            <Route path="/chat" element={<MessagesPage role={role} />} />
            <Route path="/todo" element={<TodoPage role={role} />} />
            <Route path="/movies" element={<MoviesPage role={role} />} />
            <Route path="/movies/match" element={<CoupleMatchPage role={role} />} />
            <Route path="/movies/library" element={<LibraryPage role={role} />} />
            <Route path="/movies/recommended" element={<RecommendedMoviesPage role={role} />} />
            <Route path="/movies/catalog" element={<CatalogPage role={role} />} />
            <Route path="/home-planner" element={<HomePlannerPage role={role} />} />
            <Route path="/study" element={<StudyLobbyPage role={role} />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {role && role !== 'admin' && <BottomNav role={role} />}
      {role && role !== 'admin' && <AppNotificationManager role={role} />}
      {role && role !== 'admin' && <ChatNotificationManager role={role} />}
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
  const authState = useGlobalAuth();
  const { isAuthenticated, isAdmin, isLoading, role, gender, logout, getDiaryPassphrase } = authState;

  if (isLoading) return <PageLoader />;

  // Admin logat → Panou admin (fără BottomNav, fără acces la app-ul normal)
  if (isAdmin) {
    return <AdminApp onLogout={logout} />;
  }

  // Ea/El logat → Aplicația principală
  if (isAuthenticated) {
    return <MainApp role={role} gender={gender} getDiaryPassphrase={getDiaryPassphrase} />;
  }

  // Nelogat → Ecran de login
  return <LoginPage useAuthHook={useGlobalAuth} />;
}

import { LanguageProvider } from './contexts/LanguageContext.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
