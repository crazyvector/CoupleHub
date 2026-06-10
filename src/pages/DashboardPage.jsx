import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useProfiles, useSystemState, useNotifications, useMoods } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ScratchCard from '../components/ScratchCard';
import VirtualBaristaButton from '../components/VirtualBaristaButton';
import LiveCanvasWidget from '../components/LiveCanvasWidget';
import OnboardingTour from '../components/OnboardingTour';
import styles from './DashboardPage.module.css';

// Componentă pentru Live Timer
function LiveTimer({ startDate }) {
  const { t } = useLanguage();
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!startDate) {
      setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    
    const anniversaryDate = new Date(startDate);
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
  }, [startDate]);

  return (
    <div className={styles.timerContainer}>
      <h2 className={styles.timerTitle}>{t('dashboard.togetherSince')}</h2>
      <div className={styles.timerGrid}>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.days}</span>
          <span className={styles.timeLabel}>{t('dashboard.days')}</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.hours < 10 ? `0${time.hours}` : time.hours}</span>
          <span className={styles.timeLabel}>{t('dashboard.hours')}</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.minutes < 10 ? `0${time.minutes}` : time.minutes}</span>
          <span className={styles.timeLabel}>{t('dashboard.mins')}</span>
        </div>
        <div className={styles.timeSeparator}>:</div>
        <div className={styles.timeBox}>
          <span className={styles.timeValue}>{time.seconds < 10 ? `0${time.seconds}` : time.seconds}</span>
          <span className={styles.timeLabel}>{t('dashboard.secs')}</span>
        </div>
      </div>
    </div>
  );
}

function SortableTile({ id, extraStyle, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    touchAction: 'pan-y',
    ...extraStyle
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '10px', display: 'flex', justifyContent: 'center', marginBottom: '-15px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '40px', height: '5px', background: 'var(--text-muted)', opacity: 0.3, borderRadius: '5px' }} />
      </div>
      {children}
    </div>
  );
}

function SwipeableWidget({ children }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = (e) => {
    if (!containerRef.current) return;
    const scrollLeft = e.target.scrollLeft;
    const width = containerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div 
        ref={containerRef}
        className={styles.swipeContainer}
        onScroll={handleScroll}
      >
        {React.Children.map(children, (child, idx) => (
          <div key={idx} className={styles.swipeSlide}>
            {child}
          </div>
        ))}
      </div>
      {React.Children.count(children) > 1 && (
        <div className={styles.swipeDots}>
          {React.Children.map(children, (_, idx) => (
            <div className={`${styles.swipeDot} ${idx === currentIndex ? styles.swipeDotActive : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ role }) {
  const { events, loading } = useEvents();
  const { profile, updateProfile } = useProfiles(role);
  const { t } = useLanguage();
  
  const [localStress, setLocalStress] = useState(0);
  const [localAnger, setLocalAnger] = useState(0);

  useEffect(() => {
    if (profile) {
      if (profile.stressLevel !== undefined) setLocalStress(profile.stressLevel);
      if (profile.angerLevel !== undefined) setLocalAnger(profile.angerLevel);
    }
  }, [profile]);
  
  const targetRole = role === 'her' ? 'his' : 'her';
  const { profile: targetProfile } = useProfiles(targetRole);

  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (profile && profile.hasSeenTour !== true) {
      setShowTour(true);
    }
  }, [profile]);

  const handleTourComplete = async () => {
    setShowTour(false);
    await updateProfile({ hasSeenTour: true });
  };

  const navigate = useNavigate();

  const isProfileIncomplete = profile && !profile.isConfigured;

  const { systemState, setCustomCompliment } = useSystemState();
  const { addNotification } = useNotifications();

  const { moods: targetMoods } = useMoods(targetRole);
  const { moods: myMoods } = useMoods(role);
  
  const latestTargetMood = targetMoods?.[0];
  const latestMyMood = myMoods?.[0];

  const [isWritingCompliment, setIsWritingCompliment] = useState(false);
  const [complimentText, setComplimentText] = useState('');

  const DEFAULT_ORDER = ['timer', 'compliment', 'mood', 'calendar', 'shortcuts', 'canvas', 'barista', 'scratch', 'buzzer', 'status'];
  const [tileOrder, setTileOrder] = useState(DEFAULT_ORDER);

  useEffect(() => {
    if (profile?.dashboardOrder && Array.isArray(profile.dashboardOrder)) {
      // Ensure all tiles exist in the loaded order, and no duplicates/removed tiles break it
      const loaded = profile.dashboardOrder.filter(id => DEFAULT_ORDER.includes(id));
      const missing = DEFAULT_ORDER.filter(id => !loaded.includes(id));
      setTileOrder([...loaded, ...missing]);
    }
  }, [profile?.dashboardOrder]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTileOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        updateProfile({ dashboardOrder: newOrder });
        return newOrder;
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
      const body = t('dashboard.newComplimentBody')
        .replace('{{name}}', myName)
        .replace('{{text}}', complimentText.trim());
      await addNotification(t('dashboard.newComplimentTitle'), body, role);
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
    return <div className={styles.page}><div className={styles.loading}>{t('dashboard.loading')} 💕</div></div>;
  }

  return (
    <div className={styles.page}>
      
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('nav.home')} 💕</h1>
          <p className={styles.subtitle}>{t('dashboard.welcome')}, {myName}!</p>
        </div>
      </header>

      {/* ONBOARDING PROMPT */}
      {isProfileIncomplete && (
        <div className={styles.onboardingPrompt} style={{margin: '0 var(--space-5) var(--space-4)'}}>
          <div className={styles.onboardingIcon}>👋</div>
          <div>
            <h3 style={{fontSize: '1.1rem', margin: '0 0 5px 0'}}>{t('dashboard.welcome')}!</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0}}>{t('profile.onboardingWelcome')}</p>
            <button onClick={() => navigate('/profile')} className={styles.onboardingBtn}>{t('profile.onboardingBtn')}</button>
          </div>
        </div>
      )}

      {/* DASHBOARD TILES (DRAG & DROP) */}
      <div style={{ margin: '0 var(--space-5) var(--space-4)' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tileOrder} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {tileOrder.map((id) => {
                let content = null;
                switch (id) {
                  case 'timer':
                    content = (
                      <div className={`${styles.bentoTile} ${styles.tileHero}`}>
                        <LiveTimer startDate={profile?.anniversaryDate || targetProfile?.anniversaryDate} />
                      </div>
                    );
                    break;
                  case 'compliment':
                    content = (
                      <div className={`${styles.bentoTile} ${styles.tileCompliment}`} style={{ padding: 0 }}>
                        <SwipeableWidget>
                          <div style={{ padding: 'var(--space-3)' }}>
                            <div className={styles.tileHeader}>
                              <span className={styles.tileIcon}>💌</span>
                              <span className={styles.tileTitle}>{t('dashboard.complimentTitle') || 'Compliment'}</span>
                            </div>
                            {complimentPrimit ? (
                              <>
                                <p className={styles.complimentText}>"{complimentPrimit}"</p>
                                <span className={styles.complimentAuthor}>{t('dashboard.from')} {partnerName}</span>
                              </>
                            ) : (
                              <div className={styles.noComplimentState}>
                                {t('dashboard.noCompliments') || 'Nu ai primit niciun compliment recent. 😢'}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ padding: 'var(--space-3)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>{t('dashboard.sendComplimentPrompt')}</h3>
                            {complimentScrisDeMine && (
                               <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>
                                 {t('dashboard.lastSent')} "{complimentScrisDeMine}"
                               </p>
                            )}
                            <textarea 
                              value={complimentText}
                              onChange={(e) => setComplimentText(e.target.value)}
                              placeholder={`${t('dashboard.writeNice')} ${partnerName}...`}
                              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '12px', border: '2px solid var(--border-color)', marginBottom: '10px', resize: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '1rem' }}
                            />
                            <button 
                              onClick={handleSendCompliment}
                              disabled={!complimentText.trim()}
                              style={{ width: '100%', background: 'var(--color-rose-dark)', border: 'none', padding: '12px', borderRadius: '20px', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-on-rose)', cursor: 'pointer', opacity: !complimentText.trim() ? 0.5 : 1, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                            >
                              {t('dashboard.complimentSend')}
                            </button>
                          </div>
                        </SwipeableWidget>
                      </div>
                    );
                    break;
                  case 'mood':
                    content = (
                      <div className={`${styles.bentoTile}`} style={{ background: 'var(--bg-card)', padding: 0 }}>
                        <SwipeableWidget>
                          <div style={{ padding: 'var(--space-4)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--color-rose-dark)' }}>{t('dashboard.howPartnerFeels') ? t('dashboard.howPartnerFeels').replace('{{name}}', partnerName) : `Cum se simte ${partnerName}`}:</h3>
                            {latestTargetMood ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontSize: '3rem' }}>{latestTargetMood.emoji}</span>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{latestTargetMood.label}</div>
                                  {latestTargetMood.note && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>"{latestTargetMood.note}"</div>}
                                </div>
                              </div>
                            ) : (
                              <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.noPartnerMood') ? t('dashboard.noPartnerMood').replace('{{name}}', partnerName) : `${partnerName} nu a adăugat nicio stare recentă.`}</p>
                            )}
                          </div>
                          <div style={{ padding: 'var(--space-4)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--color-rose)' }}>{t('dashboard.yourMood') || 'Starea Ta'}:</h3>
                            {latestMyMood ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontSize: '3rem' }}>{latestMyMood.emoji}</span>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{latestMyMood.label}</div>
                                  {latestMyMood.note && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>"{latestMyMood.note}"</div>}
                                </div>
                              </div>
                            ) : (
                              <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.noMyMood') || 'Nu ai adăugat nicio stare recentă.'}</p>
                            )}
                            <button 
                              onClick={() => navigate('/mood')}
                              style={{ width: '100%', marginTop: '15px', padding: '8px', borderRadius: '8px', background: 'var(--color-rose)', color: 'var(--text-on-rose)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                            >
                              {t('dashboard.updateMood') || 'Actualizează'}
                            </button>
                          </div>
                        </SwipeableWidget>
                      </div>
                    );
                    break;
                  case 'calendar':
                    content = (
                      <div className={`${styles.bentoTile} ${styles.tileCalendar}`} onClick={() => navigate('/calendar')}>
                        <div className={styles.tileHeader}>
                          <span className={styles.tileIcon}>📅</span>
                          <span className={styles.tileTitle}>{t('dashboard.upcoming')}</span>
                        </div>
                        {nextEvent ? (() => {
                          const days = calculateDaysLeft(nextEvent.nextDate);
                          return (
                            <div className={styles.nextEventPreview}>
                              <h4 className={styles.nextEventName}>{nextEvent.name}</h4>
                              <span className={styles.nextEventDays}>
                                {days === 0 
                                  ? (t('dashboard.today') || 'Azi') 
                                  : days === 1 
                                    ? (t('dashboard.oneDayLeft') || '1 zi rămasă') 
                                    : `${days} ${t('dashboard.daysLeft') || 'zile rămase'}`}
                              </span>
                            </div>
                          );
                        })() : (
                          <p className={styles.noEventsText}>{t('dashboard.noEvents')}</p>
                        )}
                        <div className={styles.openCalendarBtn}>{t('dashboard.openCalendar')}</div>
                      </div>
                    );
                    break;
                  case 'shortcuts':
                    content = (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                          onClick={() => navigate('/games')}
                          style={{ padding: '15px', background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', boxShadow: 'var(--shadow-sm)' }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>💡</span>
                          {t('dashboard.whatWeDo')}
                        </button>
                        <button 
                          onClick={() => navigate('/truth-dare')}
                          style={{ padding: '15px', background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', boxShadow: 'var(--shadow-sm)' }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>🎭</span>
                          {t('dashboard.truthDare')}
                        </button>
                      </div>
                    );
                    break;
                  case 'canvas':
                    content = <LiveCanvasWidget />;
                    break;
                  case 'barista':
                    content = <VirtualBaristaButton role={role} />;
                    break;
                  case 'scratch':
                    content = <ScratchCard compact={true} />;
                    break;
                  case 'buzzer':
                    content = (
                      <button 
                        onClick={async () => {
                          const buzzMsg = t('dashboard.buzzMsg').replace('{{name}}', myName);
                          await addNotification(t('dashboard.buzzTitle'), buzzMsg, role);
                          alert(t('dashboard.buzzSuccess'));
                        }}
                        className="animate-pulse"
                        style={{ 
                          width: '100%', padding: '16px', borderRadius: '16px', 
                          background: role === 'his' 
                            ? 'linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-dark) 100%)' 
                            : 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-purple) 100%)', 
                          color: '#fff', fontWeight: '900', fontSize: '1.2rem', 
                          border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                          textTransform: 'uppercase', letterSpacing: '1px'
                        }}
                      >
                        {t('dashboard.buzzer')}
                      </button>
                    );
                    break;
                  case 'status':
                    content = (
                      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                        <SwipeableWidget>
                          <div style={{ padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                              {t('dashboard.partnerStatus') ? t('dashboard.partnerStatus').replace('{{name}}', partnerName) : `Status ${partnerName}`}
                            </p>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>{t('dashboard.partnerStress')} 🤯</span>
                                <span>{targetProfile?.stressLevel || 0}%</span>
                              </div>
                              <div style={{ width: '100%', background: 'var(--border-color)', borderRadius: '4px', height: '8px' }}>
                                <div style={{ width: `${targetProfile?.stressLevel || 0}%`, background: 'var(--color-purple)', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>{t('dashboard.anger')} 😡</span>
                                <span>{targetProfile?.angerLevel || 0}%</span>
                              </div>
                              <div style={{ width: '100%', background: 'var(--border-color)', borderRadius: '4px', height: '8px' }}>
                                <div style={{ width: `${targetProfile?.angerLevel || 0}%`, background: '#e74c3c', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: 'var(--space-4)' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>{t('dashboard.yourStatus') || 'Statusul tău'}</h3>
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                <span>{t('dashboard.yourStress')} {localStress}% 🤯</span>
                              </label>
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={localStress} 
                                onChange={(e) => setLocalStress(Number(e.target.value))}
                                onMouseUp={() => updateProfile({ stressLevel: localStress })}
                                onTouchEnd={() => updateProfile({ stressLevel: localStress })}
                                style={{ width: '100%', accentColor: 'var(--color-purple)' }}
                              />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                <span>{t('dashboard.yourAnger')} {localAnger}% 😡</span>
                              </label>
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={localAnger} 
                                onChange={(e) => setLocalAnger(Number(e.target.value))}
                                onMouseUp={() => updateProfile({ angerLevel: localAnger })}
                                onTouchEnd={() => updateProfile({ angerLevel: localAnger })}
                                style={{ width: '100%', accentColor: '#e74c3c' }}
                              />
                            </div>
                          </div>
                        </SwipeableWidget>
                      </div>
                    );
                    break;
                  default:
                    return null;
                }

                let extraStyle = {};
                if (['compliment', 'mood', 'calendar', 'status', 'canvas', 'barista', 'scratch', 'buzzer'].includes(id)) {
                  extraStyle = { gridColumn: '1 / -1' };
                }

                return (
                  <SortableTile key={id} id={id} extraStyle={extraStyle}>
                    {content}
                  </SortableTile>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
