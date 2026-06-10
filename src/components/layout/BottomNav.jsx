import { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

import { useLanguage } from '../../contexts/LanguageContext';
import { useUnreadMessagesCount } from '../../hooks/useDatabase';

export default function BottomNav({ role }) {
  const location = useLocation();
  const navRef = useRef(null);
  const { t } = useLanguage();
  
  // Dacă role nu e trimis, get unread va da return 0 in principiu
  const unreadCount = useUnreadMessagesCount(role || 'his');

  const navItems = [
    { to: '/',         icon: '🏠', label: t('nav.home'),        id: 'nav-home' },
    { to: '/study',    icon: '📚', label: t('nav.study'),       id: 'nav-study' },
    { to: '/calendar', icon: '📅', label: t('nav.calendar'),    id: 'nav-calendar' },
    { to: '/chat',     icon: '💬', label: t('nav.chat'),        id: 'nav-chat' },
    { to: '/cupoane',  icon: '🎟️', label: t('nav.coupons'),     id: 'nav-coupons' },
    { to: '/movies',   icon: '🍿', label: t('nav.movies'),      id: 'nav-movies' },
    { to: '/home-planner', icon: '🏡', label: t('nav.homeplanner'), id: 'nav-homeplanner' },
    { to: '/mood',     icon: '💭', label: t('nav.eu'),          id: 'nav-mood' },
    { to: '/todo',     icon: '📝', label: t('nav.todo'),        id: 'nav-todo' },
    { to: '/memories', icon: '🗺️', label: t('nav.memories'),    id: 'nav-memories' },
    { to: '/games',    icon: '💡', label: t('nav.games'),       id: 'nav-games' },
    { to: '/truth-dare', icon: '🎭', label: t('nav.truthdare'), id: 'nav-truthdare' },
    { to: '/profile',  icon: '⚙️', label: t('nav.profile'),     id: 'nav-profile' },
  ];

  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname]);

  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <nav ref={navRef} className={styles.nav} aria-label={t('nav.mainNavigation')}>
      {navItems.map(({ to, icon, label, id }) => {
        const isActive = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to);

        return (
          <NavLink
            key={to}
            to={to}
            id={id}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative' }}>
              <span className={styles.navIcon} aria-hidden="true">{icon}</span>
              {to === '/chat' && unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <span className={styles.navLabel}>{label}</span>
            {isActive && <span className={styles.activeDot} aria-hidden="true" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
