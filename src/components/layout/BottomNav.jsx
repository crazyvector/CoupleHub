import { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/',         icon: '🏠', label: 'Acasă',    id: 'nav-home' },
  { to: '/chat',     icon: '💬', label: 'Mesaje',   id: 'nav-chat' },
  { to: '/cupoane',  icon: '🎟️', label: 'Cupoane',  id: 'nav-coupons' },
  { to: '/movies',   icon: '🍿', label: 'Filme',    id: 'nav-movies' },
  { to: '/mood',     icon: '💭', label: 'Eu',       id: 'nav-mood' },
  { to: '/todo',     icon: '📝', label: 'To-Do',    id: 'nav-todo' },
  { to: '/memories', icon: '🗺️', label: 'Amintiri', id: 'nav-memories' },
  { to: '/games',    icon: '💡', label: 'Idei',     id: 'nav-games' },
  { to: '/truth-dare', icon: '🎭', label: 'T or D', id: 'nav-truthdare' },
  { to: '/profile',  icon: '⚙️', label: 'Profil',   id: 'nav-profile' },
];

import { useUnreadMessagesCount } from '../../hooks/useDatabase';

export default function BottomNav({ role }) {
  const location = useLocation();
  const navRef = useRef(null);
  
  // Dacă role nu e trimis, get unread va da return 0 in principiu
  const unreadCount = useUnreadMessagesCount(role || 'his');

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
    <nav ref={navRef} className={styles.nav} aria-label="Navigare principală">
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
