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
      <h2 className={styles.timerTitle}>Suntem împreună de:</h2>
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
  const { profile, updateProfile } = useProfiles(role);
  
  const [localStress, setLocalStress] = useState(0);
  const [localAnger, setLocalAnger] = useState(0);

  useEffect(() => {
    if (profile) {
      setLocalStress(profile.stressLevel || 0);
      setLocalAnger(profile.angerLevel || 0);
    }
  }, [profile?.stressLevel, profile?.angerLevel]);
  
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

  // Următorul Eveniment (cu suport pentru repetare)
  const nextEvent = useMemo(() => {
    if (!events.length) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    
    let upcoming = [];
    events.forEach(e => {
      let baseDate = new Date(e.date);
      baseDate.setHours(0,0,0,0);
      
      let nextOccur = new Date(baseDate);
      if (e.recurrence === 'yearly') {
        nextOccur.setFullYear(now.getFullYear());
        if (nextOccur < now) nextOccur.setFullYear(now.getFullYear() + 1);
      } else if (e.recurrence === 'monthly') {
        nextOccur.setFullYear(now.getFullYear());
        nextOccur.setMonth(now.getMonth());
        if (nextOccur < now) nextOccur.setMonth(now.getMonth() + 1);
      } else if (e.recurrence === 'weekly') {
        if (nextOccur < now) {
          const diffTime = now.getTime() - nextOccur.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const weeksToAdd = Math.ceil(diffDays / 7);
          nextOccur.setDate(nextOccur.getDate() + weeksToAdd * 7);
        }
      }
      
      if (nextOccur >= now) {
        upcoming.push({ ...e, nextDate: nextOccur });
      }
    });
    
    upcoming.sort((a, b) => a.nextDate - b.nextDate);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [events]);

  const calculateDaysLeft = (dateObj) => {
    const now = new Date();
    now.setHours(0,0,0,0);
    const diff = dateObj - now;
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
              <span className={styles.nextEventDays}>{calculateDaysLeft(nextEvent.nextDate)} zile</span>
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
        
        {/* BUZZER */}
        <button 
          onClick={async () => {
            const buzzMsg = `🐝 Bzzzz! ${myName} îți trimite un Buzz! Bună dimineața sau... trezește-te!`;
            await addNotification('BUZZ! 🐝', buzzMsg, role);
            alert('Buzz trimis cu succes!');
          }}
          className="animate-pulse"
          style={{ 
            width: '100%', padding: '16px', borderRadius: '16px', 
            background: role === 'his' 
              ? 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-purple) 100%)' 
              : 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', 
            color: '#fff', fontWeight: '900', fontSize: '1.2rem', 
            border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '1px'
          }}
        >
          Buzzer Bună Dimineața 🐝
        </button>

        {/* STATUS SLIDERS */}
        <div style={{ background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Starea Noastră 📊</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <span>Stresul tău: {localStress}% 🤯</span>
            </label>
            <input 
              type="range" min="0" max="100" 
              value={localStress}
              onChange={(e) => setLocalStress(parseInt(e.target.value))}
              onMouseUp={() => updateProfile({ stressLevel: localStress })}
              onTouchEnd={() => updateProfile({ stressLevel: localStress })}
              style={{ width: '100%', accentColor: '#A88EFF' }}
            />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <span>Nervii tăi: {localAnger}% 😡</span>
            </label>
            <input 
              type="range" min="0" max="100" 
              value={localAnger}
              onChange={(e) => setLocalAnger(parseInt(e.target.value))}
              onMouseUp={() => updateProfile({ angerLevel: localAnger })}
              onTouchEnd={() => updateProfile({ angerLevel: localAnger })}
              style={{ width: '100%', accentColor: '#FF8FAB' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Starea lui {partnerName}:
            </p>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span>Stres 🤯</span>
                <span>{targetProfile?.stressLevel || 0}%</span>
              </div>
              <div style={{ width: '100%', background: '#eee', borderRadius: '4px', height: '8px' }}>
                <div style={{ width: `${targetProfile?.stressLevel || 0}%`, background: '#A88EFF', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span>Nervi 😡</span>
                <span>{targetProfile?.angerLevel || 0}%</span>
              </div>
              <div style={{ width: '100%', background: '#eee', borderRadius: '4px', height: '8px' }}>
                <div style={{ width: `${targetProfile?.angerLevel || 0}%`, background: '#FF8FAB', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
