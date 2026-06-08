import { useState } from 'react';
import { useSystemState, useNotifications } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './VirtualBaristaButton.module.css';

export default function VirtualBaristaButton({ role }) {
  const { systemState, incrementBaristaCount } = useSystemState();
  const { addNotification } = useNotifications();
  const { t } = useLanguage();
  const [status, setStatus] = useState('idle');

  // Determinam numarul de apasari de astazi pentru acest utilizator
  const today = new Date().toDateString();
  const userBaristaData = systemState?.barista?.[role];
  const pressCount = (userBaristaData?.date === today) ? (userBaristaData?.count || 0) : 0;

  const baristaMessages = [
    { label: t('dashboard.baristaCoffeeLabel'), emoji: '☕', msg: t('dashboard.baristaCoffeeMsg') },
    { label: t('dashboard.baristaAttentionLabel'), emoji: '⚠️', msg: t('dashboard.baristaAttentionMsg') },
    { label: t('dashboard.baristaHugLabel'), emoji: '🫂', msg: t('dashboard.baristaHugMsg') },
    { label: t('dashboard.baristaMassageLabel'), emoji: '💆‍♀️', msg: t('dashboard.baristaMassageMsg') },
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
            <h3 className={styles.baristaTitle}>{t('dashboard.baristaTitle')}</h3>
            <p className={styles.baristaSubtitle}>{t('dashboard.baristaSubtitle')}</p>
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
            <><span className={styles.baristaBtnIcon}>📲</span> {t('dashboard.baristaSendBtn')}</>
          )}
          {status === 'sending' && (
            <><span className={styles.loadingSpinner} /> {t('dashboard.baristaSending')}</>
          )}
          {status === 'sent' && (
            <><span>✅</span> {t('dashboard.baristaSent')}</>
          )}
        </button>

        {pressCount > 0 && (
          <p className={styles.baristaSentCount}>
            {t('dashboard.baristaCountOne')} {pressCount} {pressCount === 1 ? t('dashboard.baristaCountSingular') : t('dashboard.baristaCountPlural')} {t('dashboard.baristaCountToday')}
          </p>
        )}
      </div>
    </div>
  );
}
