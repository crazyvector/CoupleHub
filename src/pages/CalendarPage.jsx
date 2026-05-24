import { useState, useMemo } from 'react';
import { useEvents } from '../hooks/useDatabase';
import styles from './CalendarPage.module.css';

// Helpers
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Luni=0, Duminică=6
}

const monthNames = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export default function CalendarPage() {
  const { events, addEvent, deleteEvent, updateEvent, loading } = useEvents();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ id: null, name: '', date: '', details: '', importance: 'Medium' });
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
    setNewEvent({ id: null, name: '', date: '', details: '', importance: 'Medium' });
  };

  const openAddForDate = (dateString) => {
    setNewEvent({ id: null, name: '', date: dateString, details: '', importance: 'Medium' });
    setShowAddModal(true);
  };

  const openEditEvent = (ev, e) => {
    e.stopPropagation();
    setNewEvent(ev);
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Sigur vrei să ștergi acest eveniment?")) {
      await deleteEvent(id);
      setShowAddModal(false);
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
      const dayEvents = events.filter(ev => ev.date === dateStr);
      
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div 
          key={d} 
          className={`${styles.calendarDay} ${isToday ? styles.calendarToday : ''}`}
          onClick={() => openAddForDate(dateStr)}
        >
          <span className={styles.dayNumber}>{d}</span>
          <div className={styles.dayEvents}>
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                className={styles.dayEventTag} 
                style={{ backgroundColor: ev.importance === 'High' ? 'var(--color-rose)' : ev.importance === 'Medium' ? 'var(--color-sky)' : 'var(--color-lavender)' }}
                onClick={(e) => openEditEvent(ev, e)}
              >
                {ev.name}
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
    return <div className={styles.page}><div className={styles.loading}>Se încarcă Calendarul...</div></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendar 📅</h1>
        <p className={styles.subtitle}>Zilele noastre speciale</p>
      </header>

      <main className={styles.content}>
        <section className={styles.fullCalendarSection}>
          <div className={styles.calendarControls}>
            <button onClick={prevMonth} className={styles.calNavBtn}>‹</button>
            <h3 className={styles.calMonthTitle}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button onClick={nextMonth} className={styles.calNavBtn}>›</button>
          </div>
          
          <div className={styles.calendarGrid}>
            <div className={styles.calDayHeader}>L</div>
            <div className={styles.calDayHeader}>M</div>
            <div className={styles.calDayHeader}>M</div>
            <div className={styles.calDayHeader}>J</div>
            <div className={styles.calDayHeader}>V</div>
            <div className={styles.calDayHeader}>S</div>
            <div className={styles.calDayHeader}>D</div>
            {renderCalendar()}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
            💡 Apasă pe orice zi pentru a adăuga un eveniment. Apasă pe un eveniment pentru a-l edita.
          </p>
        </section>
      </main>

      {/* MODAL ADAUGARE/EDITARE EVENIMENT */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{newEvent.id ? 'Editează Eveniment ✏️' : 'Adaugă Eveniment ✨'}</h3>
            <form onSubmit={handleSaveEvent} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nume Eveniment</label>
                <input type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Data</label>
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Importanță</label>
                <select value={newEvent.importance} onChange={e => setNewEvent({...newEvent, importance: e.target.value})}>
                  <option value="High">Mare ❤️</option>
                  <option value="Medium">Medie 💛</option>
                  <option value="Low">Mică 💙</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                {newEvent.id && (
                  <button type="button" className={styles.deleteBtnRed} onClick={(e) => handleDeleteEvent(newEvent.id, e)}>Șterge</button>
                )}
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Anulează</button>
                <button type="submit" className={styles.saveBtn}>Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
