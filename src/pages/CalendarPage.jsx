import { useState, useMemo } from 'react';
import { useEvents } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './CalendarPage.module.css';

// Helpers
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Luni=0, Duminică=6
}

export default function CalendarPage() {
  const { events, addEvent, deleteEvent, updateEvent, loading } = useEvents();
  const { t } = useLanguage();
  
  const monthNames = t('calendar.months') || [];
  const dayNames = t('calendar.days') || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ id: null, name: '', date: '', details: '', importance: 'Medium', recurrence: 'none' });
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    
    if (newEvent.id) {
      await updateEvent(newEvent.id, newEvent);
    } else {
      await addEvent(newEvent);
    }
    setShowAddModal(false);
    setNewEvent({ id: null, name: '', date: '', details: '', importance: 'Medium', recurrence: 'none' });
  };

  const openAddForDate = (dateString) => {
    setNewEvent({ id: null, name: '', date: dateString, details: '', importance: 'Medium', recurrence: 'none' });
    setShowAddModal(true);
  };

  const openEditEvent = (ev, e) => {
    if (e) e.stopPropagation();
    setNewEvent(ev);
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(t('calendar.deleteConfirm'))) {
      await deleteEvent(id);
      setShowAddModal(false);
    }
  };

  const handleDayClick = (dateStr, dayEvents) => {
    if (dayEvents.length > 0) {
      // Deschide direct editarea pentru primul eveniment
      openEditEvent(dayEvents[0]);
    } else {
      openAddForDate(dateStr);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayEvents = events.filter(ev => {
        if (ev.date === dateStr) return true;
        if (!ev.recurrence || ev.recurrence === 'none') return false;
        
        const evDateObj = new Date(ev.date);
        const cellDateObj = new Date(year, month, d);
        
        // Nu afisam repetari inainte de data cand a fost creat evenimentul
        if (cellDateObj < evDateObj) return false;
        
        if (ev.recurrence === 'weekly') {
          const diffTime = cellDateObj - evDateObj;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays % 7 === 0;
        }
        if (ev.recurrence === 'monthly') {
          return cellDateObj.getDate() === evDateObj.getDate();
        }
        if (ev.recurrence === 'yearly') {
          return cellDateObj.getDate() === evDateObj.getDate() && cellDateObj.getMonth() === evDateObj.getMonth();
        }
        return false;
      });
      
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div 
          key={d} 
          className={`${styles.calendarDay} ${isToday ? styles.calendarToday : ''}`}
          onClick={() => handleDayClick(dateStr, dayEvents)}
        >
          <span className={styles.dayNumber}>{d}</span>
          <div className={styles.dayEvents}>
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                className={styles.dayEventDot} 
                style={{ 
                  color: ev.importance === 'High' ? '#FF6B6B' 
                       : ev.importance === 'Medium' ? '#FFD93D' 
                       : '#4D96FF'
                }}
                title={ev.name}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditEvent(ev, e);
                }}
              >
                ♥
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  if (loading) {
    return <div className={styles.page}><div className={styles.loading}>{t('calendar.loading')}</div></div>;
  }

  // Toate evenimentele din ziua curent selectata in modal
  const selectedDayEvents = newEvent.date ? events.filter(ev => ev.date === newEvent.date) : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('calendar.title')}</h1>
        <p className={styles.subtitle}>{t('calendar.subtitle')}</p>
      </header>

      <main className={styles.content}>
        <section className={styles.fullCalendarSection}>
          <div className={styles.calendarControls}>
            <button onClick={prevMonth} className={styles.calNavBtn}>‹</button>
            <h3 className={styles.calMonthTitle}>{(monthNames && monthNames.length > 0) ? monthNames[currentDate.getMonth()] : ''} {currentDate.getFullYear()}</h3>
            <button onClick={nextMonth} className={styles.calNavBtn}>›</button>
          </div>
          
          <div className={styles.calendarGrid}>
            {(dayNames && dayNames.length > 0) ? dayNames.map((d, i) => (
              <div key={i} className={styles.calDayHeader}>{d}</div>
            )) : null}
            {renderCalendar()}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
            {t('calendar.hint')}
          </p>
        </section>
      </main>

      {/* MODAL ADAUGARE/EDITARE EVENIMENT */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{newEvent.id ? t('calendar.editTitle') : t('calendar.addTitle')}</h3>
            
            {selectedDayEvents.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px', scrollbarWidth: 'none' }}>
                {selectedDayEvents.map((ev, idx) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setNewEvent(ev)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      background: newEvent.id === ev.id ? 'var(--color-rose-dark)' : '#f0f0f0',
                      color: newEvent.id === ev.id ? '#fff' : '#333',
                      border: 'none',
                      whiteSpace: 'nowrap',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {ev.name || `${t('calendar.defaultEventName')} ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {(newEvent.id || selectedDayEvents.length > 0) && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => openAddForDate(newEvent.date)}
                  style={{ background: 'none', border: 'none', color: '#FF6B6B', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {t('calendar.addAnother')}
                </button>
              </div>
            )}

            {/* Affiliate Banner for Gifts */}
            {newEvent.id && newEvent.name?.toLowerCase().includes('aniversare') && (
              <div style={{ background: '#f9f9f9', border: '1px dashed #FF6B6B', padding: '10px', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => window.open('https://www.emag.ro/cmp/cadouri-pentru-ea', '_blank')}>
                <div style={{ fontSize: '2rem' }}>🎁</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>{t('calendar.giftIdeaTitle') || 'Idei de cadouri pentru aniversare!'}</h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#666' }}>{t('calendar.giftIdeaDesc') || 'Vezi selecția de bijuterii și parfumuri pe eMAG.'}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>{t('calendar.eventNameLabel')}</label>
                <input type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} required />
              </div>
              <div className={styles.inputGroup} style={{ display: 'flex', gap: '10px', flexDirection: 'row' }}>
                <div style={{ flex: 1 }}>
                  <label>{t('calendar.dateLabel')}</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required style={{width: '100%', boxSizing: 'border-box'}}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label>{t('calendar.recurrenceLabel')}</label>
                  <select value={newEvent.recurrence || 'none'} onChange={e => setNewEvent({...newEvent, recurrence: e.target.value})} style={{width: '100%', boxSizing: 'border-box'}}>
                    <option value="none">{t('calendar.recNone')}</option>
                    <option value="weekly">{t('calendar.recWeekly')}</option>
                    <option value="monthly">{t('calendar.recMonthly')}</option>
                    <option value="yearly">{t('calendar.recYearly')}</option>
                  </select>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>{t('calendar.detailsLabel')}</label>
                <textarea 
                  value={newEvent.details || ''} 
                  onChange={e => setNewEvent({...newEvent, details: e.target.value})} 
                  placeholder={t('calendar.detailsPlaceholder')}
                  rows={3}
                  style={{width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none', fontFamily: 'inherit'}}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>{t('calendar.importanceLabel')}</label>
                <select value={newEvent.importance} onChange={e => setNewEvent({...newEvent, importance: e.target.value})}>
                  <option value="High">{t('calendar.high')}</option>
                  <option value="Medium">{t('calendar.medium')}</option>
                  <option value="Low">{t('calendar.low')}</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.deleteBtnRed} 
                  onClick={(e) => newEvent.id ? handleDeleteEvent(newEvent.id, e) : null}
                  style={{ opacity: newEvent.id ? 1 : 0.3, pointerEvents: newEvent.id ? 'auto' : 'none' }}
                >
                  {t('calendar.deleteBtn')}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>{t('calendar.cancelBtn')}</button>
                <button type="submit" className={styles.saveBtn}>{t('calendar.saveBtn')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
