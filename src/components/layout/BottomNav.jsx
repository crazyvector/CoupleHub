import { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/',         icon: '🏠', label: 'Acasă',    id: 'nav-home' },
  { to: '/cupoane',  icon: '🎟️', label: 'Cupoane',  id: 'nav-coupons' },
  { to: '/mood',     icon: '💭', label: 'Eu',        id: 'nav-mood' },
  { to: '/memories', icon: '🗺️', label: 'Amintiri', id: 'nav-memories' },
  { to: '/games',      icon: '💡', label: 'Idei',     id: 'nav-games' },
  { to: '/truth-dare', icon: '🎭', label: 'T or D',   id: 'nav-truthdare' },
  { to: '/profile',  icon: '⚙️', label: 'Profil',   id: 'nav-profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname]);

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
            <span className={styles.navIcon} aria-hidden="true">{icon}</span>
            <span className={styles.navLabel}>{label}</span>
            {isActive && <span className={styles.activeDot} aria-hidden="true" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
