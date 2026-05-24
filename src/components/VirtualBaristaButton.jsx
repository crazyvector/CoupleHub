import { useState } from 'react';
import { useSystemState, useNotifications } from '../hooks/useDatabase';
import styles from './VirtualBaristaButton.module.css';

export default function VirtualBaristaButton({ role }) {
  const { systemState, incrementBaristaCount } = useSystemState();
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState('idle');

  // Determinam numarul de apasari de astazi pentru acest utilizator
  const today = new Date().toDateString();
  const userBaristaData = systemState?.barista?.[role];
  const pressCount = (userBaristaData?.date === today) ? (userBaristaData?.count || 0) : 0;

  const baristaMessages = [
    { label: '☕ Cafea', emoji: '☕', msg: 'Alertează! Am nevoie urgentă de o cafea! 🏃‍♂️' },
    { label: '⚠️ Atenție', emoji: '⚠️', msg: 'Misiune importantă: am nevoie de atenție! 💕' },
    { label: '🫂 Îmbrățișare', emoji: '🫂', msg: 'Am nevoie de o îmbrățișare ACUM! 💕' },
    { label: '💆 Masaj', emoji: '💆‍♀️', msg: 'Sunt stresat/ă, am nevoie de un masaj magic! ✨' },
  ];

  const [selectedAction, setSelectedAction] = useState(0);

  const handleSend = async () => {
    if (status === 'sending') return;
    setStatus('sending');

    await incrementBaristaCount(role);
    await addNotification('Virtual Barista ⚡', baristaMessages[selectedAction].msg, role);
    setStatus('sent');

    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className={styles.baristaSection}>
      <div className={styles.barista}>
        <div className={styles.baristaHeader}>
          <span className={styles.baristaIcon}>⚡</span>
          <div>
            <h3 className={styles.baristaTitle}>Virtual Barista</h3>
            <p className={styles.baristaSubtitle}>Trimite o cerere instant către partener</p>
          </div>
        </div>

        <div className={styles.baristaActions}>
          {baristaMessages.map((action, idx) => (
            <button
              key={idx}
              id={`barista-action-${idx}`}
              className={`${styles.baristaChip} ${selectedAction === idx ? styles.baristaChipActive : ''}`}
              onClick={() => setSelectedAction(idx)}
              aria-pressed={selectedAction === idx}
            >
              {action.emoji} {action.label}
            </button>
          ))}
        </div>

        <button
          id="barista-send-btn"
          className={`${styles.baristaBtn} ${status === 'sending' ? styles.baristaSending : ''} ${status === 'sent' ? styles.baristaSent : ''}`}
          onClick={handleSend}
          disabled={status === 'sending'}
          aria-live="polite"
        >
          {status === 'idle' && (
            <><span className={styles.baristaBtnIcon}>📲</span> Trimite cerere!</>
          )}
          {status === 'sending' && (
            <><span className={styles.loadingSpinner} /> Se trimite...</>
          )}
          {status === 'sent' && (
            <><span>✅</span> Trimis! A primit! 💕</>
          )}
        </button>

        {pressCount > 0 && (
          <p className={styles.baristaSentCount}>
            Ai trimis {pressCount} {pressCount === 1 ? 'cerere' : 'cereri'} azi 💕
          </p>
        )}
      </div>
    </div>
  );
}
