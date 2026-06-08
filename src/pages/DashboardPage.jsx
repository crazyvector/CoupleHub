import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useProfiles, useSystemState, useNotifications } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ScratchCard from '../components/ScratchCard';
import VirtualBaristaButton from '../components/VirtualBaristaButton';
import LiveCanvasWidget from '../components/LiveCanvasWidget';
import styles from './DashboardPage.module.css';

// Componentă pentru Live Timer
function LiveTimer({ startDate }) {
  const { t } = useLanguage();
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const anniversaryDate = startDate ? new Date(startDate) : new Date('2025-03-26T00:00:00');
    
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

  const navigate = useNavigate();

  const isProfileIncomplete = profile && !profile.isConfigured;

  const { systemState, setCustomCompliment } = useSystemState();
  const { addNotification } = useNotifications();
  const [isWritingCompliment, setIsWritingCompliment] = useState(false);
  const [complimentText, setComplimentText] = useState('');

  const DEFAULT_ORDER = ['timer', 'compliment', 'calendar', 'shortcuts', 'canvas', 'barista', 'scratch', 'buzzer', 'status'];
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
                      <div className={`${styles.bentoTile} ${styles.tileCompliment}`} onClick={() => setIsWritingCompliment(!isWritingCompliment)}>
                        <div className={styles.tileHeader}>
                          <span className={styles.tileIcon}>💌</span>
                          <span className={styles.tileTitle}>Compliment</span>
                        </div>
                        {complimentPrimit ? (
                          <>
                            <p className={styles.complimentText}>"{complimentPrimit}"</p>
                            <span className={styles.complimentAuthor}>{t('dashboard.from')} {partnerName}</span>
                          </>
                        ) : (
                          <p className={styles.complimentText} style={{ opacity: 0.6 }}>
                            Nu ai primit niciun compliment recent. 😢
                          </p>
                        )}
                        <div className={styles.openCalendarBtn} style={{marginTop: '10px'}}>{isWritingCompliment ? t('dashboard.complimentCancel') : t('dashboard.complimentWrite')}</div>
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
                        {nextEvent ? (
                          <div className={styles.nextEventPreview}>
                            <h4 className={styles.nextEventName}>{nextEvent.name}</h4>
                            <span className={styles.nextEventDays}>{calculateDaysLeft(nextEvent.nextDate)} {t('dashboard.daysLeft')}</span>
                          </div>
                        ) : (
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
                            ? 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-purple) 100%)' 
                            : 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', 
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
                              {targetProfile?.gender === 'F' ? t('dashboard.partnerStateLabel') : t('dashboard.partnerStateLabel')}, {partnerName}:
                            </p>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>{t('dashboard.partnerStress')} 🤯</span>
                                <span>{targetProfile?.stressLevel || 0}%</span>
                              </div>
                              <div style={{ width: '100%', background: '#eee', borderRadius: '4px', height: '8px' }}>
                                <div style={{ width: `${targetProfile?.stressLevel || 0}%`, background: 'var(--color-purple)', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>{t('dashboard.anger')} 😡</span>
                                <span>{targetProfile?.angerLevel || 0}%</span>
                              </div>
                              <div style={{ width: '100%', background: '#eee', borderRadius: '4px', height: '8px' }}>
                                <div style={{ width: `${targetProfile?.angerLevel || 0}%`, background: '#e74c3c', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: 'var(--space-4)' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>{t('dashboard.yourState') || 'Starea Ta'}</h3>
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
                if (['compliment', 'calendar', 'status', 'canvas', 'barista', 'scratch', 'buzzer'].includes(id)) {
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
      
      {/* CUSTOM COMPLIMENT INPUT */}
      {isWritingCompliment && (
        <div className="animate-fade-in" style={{ margin: 'var(--space-4) var(--space-5)', background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{t('dashboard.sendComplimentPrompt')}</h3>
          {complimentScrisDeMine && (
             <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px'}}>
               {t('dashboard.lastSent')} "{complimentScrisDeMine}"
             </p>
          )}
          <textarea 
            value={complimentText}
            onChange={(e) => setComplimentText(e.target.value)}
            placeholder={`${t('dashboard.writeNice')} ${partnerName}...`}
            style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '12px', border: '2px solid var(--border-color)', marginBottom: '10px', resize: 'none', background: '#ffffff', color: '#000000', fontSize: '1rem' }}
          />
          <button 
            onClick={handleSendCompliment}
            disabled={!complimentText.trim()}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--primary-color)', color: role === 'her' ? '#000000' : '#ffffff', fontWeight: 'bold', border: 'none', opacity: !complimentText.trim() ? 0.5 : 1 }}
          >
            {t('dashboard.complimentSend')}
          </button>
        </div>
      )}
    </div>
  );
}
