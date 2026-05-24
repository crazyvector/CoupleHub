import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../hooks/useDatabase';
import { useAuth } from '../hooks/useAuth';
import styles from './NotificationCenter.module.css';

function SwipeableNotification({ n, role, onRead, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(null);
  const isDragging = useRef(false);

  const isUnread = n.sender !== role && !(n.readBy || []).includes(role);
  const dateObj = new Date(n.timestamp);
  const isToday = dateObj.toDateString() === new Date().toDateString();
  const timeStr = isToday 
    ? dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    : dateObj.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // allow dragging left or right
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (Math.abs(translateX) > 100) {
      // Swiped enough to delete
      onDelete(n.id);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  return (
    <li 
      className={`${styles.item} ${isUnread ? styles.itemUnread : ''}`}
      onClick={() => onRead(n)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        transform: `translateX(${translateX}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease',
        opacity: Math.abs(translateX) > 100 ? 0.5 : 1
      }}
    >
      <h4 className={styles.itemTitle}>{n.title}</h4>
      <p className={styles.itemBody}>{n.body}</p>
      <span className={styles.itemTime}>{timeStr} • {n.sender === 'his' ? 'De la el' : 'De la ea'}</span>
    </li>
  );
}

export default function NotificationCenter() {
  const { role } = useAuth();
  const { notifications, markAsRead, deleteNotification } = useNotifications(role);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const location = useLocation();

  // Câte sunt necitite de userul curent?
  const unreadCount = notifications.filter(
    (n) => n.sender !== role && !(n.readBy || []).includes(role)
  ).length;

  if (location.pathname === '/coupons') return null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif) => {
    if (notif.sender !== role && !(notif.readBy || []).includes(role)) {
      await markAsRead(notif.id, role);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={styles.bellButton} 
        onClick={handleToggle}
        aria-label="Notificări"
      >
        🔔
        {unreadCount > 0 && (
          <span className={`${styles.badge} animate-scale-in`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} animate-fade-in-up`}>
          <div className={styles.header}>
            <h3>Notificări</h3>
          </div>
          {notifications.length === 0 ? (
            <div className={styles.empty}>Nu ai nicio notificare.</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <SwipeableNotification
                  key={n.id}
                  n={n}
                  role={role}
                  onRead={handleNotificationClick}
                  onDelete={deleteNotification}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
