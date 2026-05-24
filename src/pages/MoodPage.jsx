import { useState, useContext, createContext, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { encryptText, decryptText } from '../hooks/useCrypto';
import { useMoods, useDiary, useNotifications } from '../hooks/useDatabase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import styles from './MoodPage.module.css';

// Context pentru passphrase (primit din App)
export const DiaryPassContext = createContext(null);

// ============================================================
// Date & constante
// ============================================================
const MOODS = [
  { id: 'angry',   emoji: '😠', label: 'Supărată',     color: '#FFB5B5', intensity: 1 },
  { id: 'awful',   emoji: '😔', label: 'Tristă',       color: '#B5C8FF', intensity: 2 },
  { id: 'meh',     emoji: '😐', label: 'Meh',          color: '#C8D8FF', intensity: 3 },
  { id: 'okay',    emoji: '🙂', label: 'Ok',            color: '#FFCBA4', intensity: 4 },
  { id: 'good',    emoji: '😊', label: 'Bine',          color: '#B5EAD7', intensity: 5 },
  { id: 'great',   emoji: '😄', label: 'Super',         color: '#FFB5C8', intensity: 6 },
  { id: 'amazing', emoji: '🥰', label: 'Îndrăgostită', color: '#C8B6FF', intensity: 7 },
  { id: 'custom',  emoji: '✍️', label: 'Altceva...',    color: '#E0E0E0', intensity: 0 },
];

const FEELINGS = [
  '😴 Obosită', '💪 Energică', '🤗 Fericită', '🥺 Sensibilă',
  '😤 Frustrată', '🌸 Relaxată', '🦋 Entuziasmată', '🥶 Frig',
  '🤒 Răcită', '💕 Îndrăgostită', '🎉 Sărbătorind', '🧘 Meditativă',
];

// ============================================================
// COMPONENTĂ PENTRU ISTORIC CU SWIPE-TO-DELETE
// ============================================================
function SwipeableMoodItem({ entry, moodDef, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(null);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (Math.abs(translateX) > 100) {
      onDelete(entry.id);
    } else {
      setTranslateX(0);
    }
  };

  const date = new Date(entry.timestamp);

  return (
    <div 
      className={styles.historyItem}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        transform: `translateX(${translateX}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease',
        opacity: Math.abs(translateX) > 100 ? 0.5 : 1
      }}
    >
      <span className={styles.historyEmoji}>{entry.emoji}</span>
      <div className={styles.historyContent}>
        <span className={styles.historyLabel}>{entry.label}</span>
        {entry.note && <p className={styles.historyNote}>"{entry.note}"</p>}
        <span className={styles.historyDate}>
          {date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div
        className={styles.historyDot}
        style={{ background: moodDef?.color || '#E0E0E0' }}
      />
    </div>
  );
}

// ============================================================
// MOOD TRACKER
// ============================================================
function MoodTracker({ role }) {
  const { moods: moodHistory, addMood, deleteMood, loading } = useMoods(role);
  const { addNotification } = useNotifications(role);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [customMoodText, setCustomMoodText] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleFeeling = (feeling) => {
    setSelectedFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const handleSend = async () => {
    if (!selectedMood) return;
    setSending(true);

    const actualMoodLabel = selectedMood.id === 'custom' ? (customMoodText || 'Stare nedefinită') : selectedMood.label;
    
    // Construiește mesajul
    const feelingsStr = selectedFeelings.length > 0
      ? `\n💭 ${selectedFeelings.join(', ')}`
      : '';
    const noteStr = note.trim() ? `\n\n📝 "${note.trim()}"` : '';
    const msg = `Sunt ${actualMoodLabel}${feelingsStr}${noteStr}`;

    // Trimite notificare In-App
    await addNotification('Stare nouă 💕', msg, role);

    // Salvează în Firebase
    await addMood({
      mood: selectedMood.id,
      emoji: selectedMood.emoji,
      label: actualMoodLabel,
      feelings: selectedFeelings,
      note: note.trim(),
    });

    setSending(false);
    setSent(true);
    setSelectedMood(null);
    setSelectedFeelings([]);
    setCustomMoodText('');
    setNote('');
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className={styles.moodSection}>
      {/* Greeting */}
      <div className={styles.moodGreeting}>
        <span className={`${styles.moodGreetingEmoji} animate-float`}>💝</span>
        <div>
          <h2 className={styles.moodTitle}>Cum te simți?</h2>
          <p className={styles.moodSubtitle}>El va primi o notificare cu starea ta ✨</p>
        </div>
      </div>

      {/* Selector mood principal */}
      <div className={styles.moodGrid} role="group" aria-label="Selectează starea de spirit">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            id={`mood-${mood.id}`}
            className={`${styles.moodBtn} ${selectedMood?.id === mood.id ? styles.moodBtnSelected : ''}`}
            style={{
              '--mood-color': mood.color,
              borderColor: selectedMood?.id === mood.id ? mood.color : 'transparent',
              background: selectedMood?.id === mood.id ? `${mood.color}30` : 'transparent',
            }}
            onClick={() => setSelectedMood(mood)}
            aria-pressed={selectedMood?.id === mood.id}
            aria-label={`Starea: ${mood.label}`}
          >
            <span className={`${styles.moodEmoji} ${selectedMood?.id === mood.id ? 'animate-heartbeat' : ''}`}>
              {mood.emoji}
            </span>
            <span className={styles.moodLabel}>{mood.label}</span>
          </button>
        ))}
      </div>

      {/* Feelings chips (vizibil după selectarea mood) */}
      {selectedMood && (
        <div className={`${styles.feelingsSection} animate-fade-in`}>
          
          {selectedMood.id === 'custom' && (
            <div className={styles.customMoodInput}>
              <label className={styles.noteLabel}>Spune-mi mai exact ce simți...</label>
              <input
                type="text"
                placeholder="Ex: Sunt foarte confuză..."
                value={customMoodText}
                onChange={e => setCustomMoodText(e.target.value)}
                className={styles.noteTextarea}
              />
            </div>
          )}

          <p className={styles.feelingsTitle}>Mai exact? <span>(opțional)</span></p>
          <div className={styles.feelingsGrid}>
            {FEELINGS.map((feeling) => (
              <button
                key={feeling}
                className={`${styles.feelingChip} ${selectedFeelings.includes(feeling) ? styles.feelingChipSelected : ''}`}
                style={{ '--mood-color': selectedMood.color }}
                onClick={() => toggleFeeling(feeling)}
                aria-pressed={selectedFeelings.includes(feeling)}
              >
                {feeling}
              </button>
            ))}
          </div>

          {/* Notă scurtă */}
          <div className={styles.noteSection}>
            <label className={styles.noteLabel} htmlFor="mood-note">
              Adaugă un mesaj pentru el:
            </label>
            <textarea
              id="mood-note"
              className={styles.noteTextarea}
              placeholder="ex: Mă gândesc la tine 🥺..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <span className={styles.noteCount}>{note.length}/200</span>
          </div>

          {/* Buton trimite */}
          <button
            id="mood-send-btn"
            className={`${styles.sendMoodBtn} ${sending ? styles.sendMoodSending : ''} ${sent ? styles.sendMoodSent : ''}`}
            onClick={handleSend}
            disabled={sending || !selectedMood || (selectedMood.id === 'custom' && !customMoodText.trim())}
          >
            {sent ? '✅ Trimis! El știe acum 💕' :
             sending ? '📲 Se trimite...' :
             `${selectedMood?.emoji} Trimite starea mea`}
          </button>
        </div>
      )}

      {/* Istoric ultimele stări din Firebase */}
      {!loading && moodHistory.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>Ultimele stări trimise</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Glisează stânga sau dreapta pentru a șterge</p>
          <div className={styles.historyList}>
            {moodHistory.slice(0, 7).map((entry, i) => {
              const moodDef = MOODS.find(m => m.id === entry.mood) || MOODS[0];
              return (
                <SwipeableMoodItem 
                  key={entry.id || i} 
                  entry={entry} 
                  moodDef={moodDef} 
                  onDelete={deleteMood} 
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// JURNAL PRIVAT — criptat AES-GCM și Firebase
// ============================================================
function PrivateDiary({ role }) {
  const { entries, addEntry, deleteEntry, loading: diaryLoading } = useDiary(role);
  const [currentText, setCurrentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [localPass, setLocalPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    if (auth.currentUser) {
      try {
        await signInWithEmailAndPassword(auth, auth.currentUser.email, localPass);
        setIsAuthenticated(true);
        setLoginError('');
      } catch (err) {
        setLoginError('Parolă incorectă!');
      }
    } else {
       setLoginError('Nu ești autentificat în cont.');
    }
  };

  const saveEntry = async () => {
    if (!currentText.trim() || !isAuthenticated) return;
    setIsSaving(true);

    try {
      const encrypted = await encryptText(currentText.trim(), localPass);
      const preview = currentText.trim().slice(0, 40) + (currentText.length > 40 ? '...' : '');
      const wordCount = currentText.trim().split(/\s+/).length;
      const obfuscatedPreview = '🔒 ' + preview.replace(/./g, '·').slice(0, 20) + '...';
      
      await addEntry(encrypted, obfuscatedPreview, wordCount);
      setCurrentText('');
    } catch (err) {
      console.error('Eroare criptare:', err);
    }
    setIsSaving(false);
  };

  const openEntry = async (entry) => {
    setSelectedEntry(entry);
    setIsDecrypting(true);
    setDecryptedContent('');

    const content = await decryptText(entry.encrypted, localPass);
    if (content === null) {
      setDecryptedContent('⚠️ Nu s-a putut decripta. Parola este greșită sau datele sunt corupte.');
    } else {
      setDecryptedContent(content);
    }
    setIsDecrypting(false);
  };

  const handleDelete = async (id) => {
    await deleteEntry(id);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setDecryptedContent('');
    }
    setDeleteConfirm(null);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.diaryNoPass}>
        <span className={`animate-float`} style={{ fontSize: '3rem' }}>🔐</span>
        <h3 className={styles.diaryNoPassTitle}>Jurnal Securizat</h3>
        <p className={styles.diaryNoPassMsg}>
          Introdu parola contului pentru a accesa și decripta jurnalul tău privat.
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <input
            type="password"
            placeholder="Parola..."
            value={localPass}
            onChange={(e) => setLocalPass(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
          {loginError && <span style={{ color: 'red', fontSize: '0.85rem' }}>{loginError}</span>}
          <button type="submit" style={{ padding: '10px', background: 'var(--color-rose-dark)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
            Deblochează
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.diarySection}>
      {/* Header */}
      <div className={styles.diaryHeader}>
        <div className={styles.diaryHeaderLeft}>
          <span className={`animate-float`} style={{ fontSize: '1.8rem' }}>📔</span>
          <div>
            <h2 className={styles.diaryTitle}>Jurnalul Meu Privat</h2>
            <p className={styles.diarySubtitle}>
              🔒 Criptat • Nimeni altcineva nu poate citi
            </p>
          </div>
        </div>
        <div className={styles.diaryStats}>
          <span className={styles.diaryStat}>{entries.length}</span>
          <span className={styles.diaryStatLabel}>intrări</span>
        </div>
      </div>

      <div className={styles.securityBadge}>
        <span>🛡️</span>
        <span>AES-256 · Salvat sigur în cloud · El vede doar "🔒 ···"</span>
      </div>

      {/* Editor intrare nouă */}
      <div className={styles.diaryEditor}>
        <div className={styles.diaryEditorHeader}>
          <span className={styles.diaryEditorDate}>
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <textarea
          className={styles.diaryTextarea}
          placeholder="Scrie gândurile tale... Doar tu le vei putea citi. 🌸"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          rows={5}
          maxLength={5000}
        />
        <div className={styles.diaryEditorFooter}>
          <span className={styles.diaryWordCount}>{currentText.split(/\s+/).filter(Boolean).length} cuvinte</span>
          <button
            className={`${styles.diarySaveBtn} ${isSaving ? styles.diarySavingBtn : ''}`}
            onClick={saveEntry}
            disabled={!currentText.trim() || isSaving}
          >
            {isSaving ? '🔒 Se criptează...' : '💾 Salvează în cloud'}
          </button>
        </div>
      </div>

      {/* Lista intrări */}
      {diaryLoading ? (
        <div className={styles.diaryLoading}>
          <span className="animate-heartbeat">📔</span> Se încarcă din cloud...
        </div>
      ) : entries.length === 0 ? (
        <div className={styles.diaryEmpty}>
          <span style={{ fontSize: '2rem' }}>🌸</span>
          <p>Prima ta intrare în jurnal te așteaptă.<br/>Scrie ceva frumos! 💕</p>
        </div>
      ) : (
        <div className={styles.diaryEntries}>
          <h3 className={styles.diaryEntriesTitle}>Intrările tale ({entries.length})</h3>
          {entries.map((entry) => {
            const date = new Date(entry.timestamp);
            const isOpen = selectedEntry?.id === entry.id;
            return (
              <div key={entry.id} className={`${styles.diaryEntry} ${isOpen ? styles.diaryEntryOpen : ''}`}>
                <button
                  className={styles.diaryEntryHeader}
                  onClick={() => isOpen ? setSelectedEntry(null) : openEntry(entry)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.diaryEntryMeta}>
                    <span className={styles.diaryEntryDate}>
                      {date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className={styles.diaryEntryTime}>
                      {date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.diaryEntryRight}>
                    <span className={styles.diaryEntryWords}>{entry.wordCount} cuv.</span>
                    <span className={styles.diaryEntryArrow}>{isOpen ? '↑' : '↓'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className={`${styles.diaryEntryContent} animate-fade-in`}>
                    {isDecrypting ? (
                      <div className={styles.diaryDecrypting}>
                        <span className="animate-heartbeat">🔓</span> Se decriptează local...
                      </div>
                    ) : (
                      <>
                        <p className={styles.diaryEntryText}>{decryptedContent}</p>
                        <div className={styles.diaryEntryActions}>
                          {deleteConfirm === entry.id ? (
                            <div className={styles.deleteConfirm}>
                              <span>Ești sigură?</span>
                              <button className={styles.deleteYes} onClick={() => handleDelete(entry.id)}>Da</button>
                              <button className={styles.deleteNo} onClick={() => setDeleteConfirm(null)}>Nu</button>
                            </div>
                          ) : (
                            <button className={styles.deleteEntryBtn} onClick={() => setDeleteConfirm(entry.id)}>
                              🗑️ Șterge
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MoodPage — pagina principală cu tabs
// ============================================================
export default function MoodPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('mood');

  const tabs = [
    { id: 'mood',  label: 'Cum mă simt',  emoji: '💭' },
    { id: 'diary', label: 'Jurnalul meu', emoji: '📔' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Spațiul Meu 🌸</h1>
        <p className={styles.subtitle}>Privat și doar pentru tine</p>
      </header>

      {/* Tab Bar */}
      <div className={styles.tabBar} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`mood-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.emoji}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.tabContent} role="tabpanel">
        {activeTab === 'mood' && (
          <div className="animate-fade-in">
            <MoodTracker role={role} />
          </div>
        )}
        {activeTab === 'diary' && (
          <div className="animate-fade-in">
            <PrivateDiary role={role} />
          </div>
        )}
      </div>
    </div>
  );
}
