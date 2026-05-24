import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useProfiles } from '../hooks/useDatabase';
import ScratchCard from '../components/ScratchCard';
import VirtualBaristaButton from '../components/VirtualBaristaButton';
import { useSystemState, useNotifications } from '../hooks/useDatabase';
import styles from './DashboardPage.module.css';

// Componentă pentru Live Timer
function LiveTimer() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const anniversaryDate = new Date('2025-03-26T00:00:00');
    
    const updateTime = () => {
      const diff = Math.max(0, new Date() - anniversaryDate);
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTime({ days, hours, minutes, seconds });
    };

    updateTime(); // initial call
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className={styles.timerContainer}>
      <h2 className={styles.timerTitle}>Sărbătorim împreună de:</h2>
      <div className={styles.timerGrid}>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.days}</span>
          <span className={styles.timeLabel}>Zile</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.hours < 10 ? `0${time.hours}` : time.hours}</span>
          <span className={styles.timeLabel}>Ore</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.minutes < 10 ? `0${time.minutes}` : time.minutes}</span>
          <span className={styles.timeLabel}>Min</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.seconds < 10 ? `0${time.seconds}` : time.seconds}</span>
          <span className={styles.timeLabel}>Sec</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ role }) {
  const { events, loading } = useEvents();
  const { profile } = useProfiles(role);
  
  const targetRole = role === 'her' ? 'his' : 'her';
  const { profile: targetProfile } = useProfiles(targetRole);

  const navigate = useNavigate();

  const isProfileIncomplete = profile && !profile.isConfigured;

  const { systemState, setCustomCompliment } = useSystemState();
  const { addNotification } = useNotifications();
  const [isWritingCompliment, setIsWritingCompliment] = useState(false);
  const [complimentText, setComplimentText] = useState('');

  // Numele din profile
  const myName = profile?.name || (role === 'her' ? 'Ana' : 'Andrei');
  const partnerName = targetProfile?.name || (targetRole === 'her' ? 'Ana' : 'Andrei');

  // Complimentul zilei (fallback)
  const compliments = [
    "Ai un zâmbet minunat! 😊",
    "Ești cea mai bună parte din ziua mea! 💕",
    "Mă faci fericit(ă) doar existând. 🌸",
    "Ești absolut superb(ă) astăzi! ✨",
    "Lumea e mai frumoasă cu tine în ea. 🌎"
  ];
  const complimentZilei = compliments[new Date().getDay() % compliments.length];

  const customCompliments = systemState?.customCompliments || {};
  const complimentPrimit = customCompliments[role];
  const complimentScrisDeMine = customCompliments[targetRole];

  const handleSendCompliment = async () => {
    if (!complimentText.trim()) return;
    await setCustomCompliment(targetRole, complimentText.trim());
    if (role) {
      await addNotification('Compliment Nou 💌', `Auzi, ${myName} a vrut să îți spună ceva frumos: "${complimentText.trim()}"`, role);
    }
    setComplimentText('');
    setIsWritingCompliment(false);
  };

  // Următorul Eveniment
  const nextEvent = useMemo(() => {
    if (!events.length) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const futureEvents = events.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    return futureEvents.length > 0 ? futureEvents[0] : null;
  }, [events]);

  const calculateDaysLeft = (dateString) => {
    const diff = new Date(dateString) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return <div className={styles.page}><div className={styles.loading}>Se încarcă Acasă... 💕</div></div>;
  }

  return (
    <div className={styles.page}>
      
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Acasă 💕</h1>
          <p className={styles.subtitle}>Bine ai venit, {myName}!</p>
        </div>
      </header>

      {/* ONBOARDING PROMPT */}
      {isProfileIncomplete && (
        <div className={styles.onboardingPrompt} style={{margin: '0 var(--space-5) var(--space-4)'}}>
          <div className={styles.onboardingIcon}>👋</div>
          <div>
            <h3 style={{fontSize: '1.1rem', margin: '0 0 5px 0'}}>Bine ai venit!</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0}}>Se pare că profilul tău nu este complet. Hai să adăugăm o poză!</p>
            <button onClick={() => navigate('/profile')} className={styles.onboardingBtn}>Completează Profilul</button>
          </div>
        </div>
      )}

      {/* BENTO GRID LAYOUT */}
      <div className={styles.bentoGrid}>
        
        {/* TILE 1: TIMER (Full Width) */}
        <div className={`${styles.bentoTile} ${styles.tileHero}`}>
          <LiveTimer />
        </div>

        {/* TILE 2: COMPLIMENT (Half Width) */}
        <div className={`${styles.bentoTile} ${styles.tileCompliment}`} onClick={() => setIsWritingCompliment(!isWritingCompliment)}>
          <div className={styles.tileIcon}>{complimentPrimit ? '💌' : '✨'}</div>
          <p className={styles.complimentText}>
            "{complimentPrimit || complimentZilei}"
          </p>
          {complimentPrimit && <span className={styles.complimentAuthor}>De la {partnerName}</span>}
          <div className={styles.openCalendarBtn} style={{marginTop: '10px'}}>{isWritingCompliment ? 'Anulează' : 'Scrie-i tu ceva ›'}</div>
        </div>

        {/* TILE 3: CALENDAR PREVIEW (Half Width) */}
        <div className={`${styles.bentoTile} ${styles.tileCalendar}`} onClick={() => navigate('/calendar')}>
          <div className={styles.tileHeader}>
            <span className={styles.tileIcon}>📅</span>
            <span className={styles.tileTitle}>Urmează</span>
          </div>
          {nextEvent ? (
            <div className={styles.nextEventPreview}>
              <h4 className={styles.nextEventName}>{nextEvent.name}</h4>
              <span className={styles.nextEventDays}>{calculateDaysLeft(nextEvent.date)} zile</span>
            </div>
          ) : (
            <p className={styles.noEventsText}>Niciun eveniment programat.</p>
          )}
          <div className={styles.openCalendarBtn}>Deschide Calendarul ›</div>
        </div>

      </div>
      
      {/* CUSTOM COMPLIMENT INPUT */}
      {isWritingCompliment && (
        <div className="animate-fade-in" style={{ margin: '0 var(--space-5) var(--space-4)', background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Trimite-i un compliment:</h3>
          {complimentScrisDeMine && (
             <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px'}}>
               Ultimul trimis: "{complimentScrisDeMine}"
             </p>
          )}
          <textarea 
            value={complimentText}
            onChange={(e) => setComplimentText(e.target.value)}
            placeholder={`Scrie ceva frumos pentru ${partnerName}...`}
            style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '12px', border: '2px solid var(--border-color)', marginBottom: '10px', resize: 'none', background: '#ffffff', color: '#000000', fontSize: '1rem' }}
          />
          <button 
            onClick={handleSendCompliment}
            disabled={!complimentText.trim()}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--primary-color)', color: role === 'her' ? '#000000' : '#ffffff', fontWeight: 'bold', border: 'none', opacity: !complimentText.trim() ? 0.5 : 1 }}
          >
            Trimite Complimentul 💌
          </button>
        </div>
      )}

      {/* FULL WIDTH TILES */}
      <div style={{ margin: '0 var(--space-5) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <VirtualBaristaButton role={role} />
        <ScratchCard compact={true} />
      </div>
    </div>
  );
}
