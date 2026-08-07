import { useState, useContext, createContext, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { encryptText, decryptText } from '../hooks/useCrypto';
import { useMoods, useDiary, useNotifications, useProfiles } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import styles from './MoodPage.module.css';

// Context pentru passphrase (primit din App)
export const DiaryPassContext = createContext(null);

// ============================================================
// Date & constante
// ============================================================
const getMoods = (role, t) => {
  const isAna = role === 'her';
  return [
    { id: 'angry',   emoji: '😠', label: isAna ? t('mood.moodAngryHer') : t('mood.moodAngryHis'),     color: '#FFB5B5', intensity: 1 },
    { id: 'awful',   emoji: '😔', label: isAna ? t('mood.moodSadHer') : t('mood.moodSadHis'),       color: '#B5C8FF', intensity: 2 },
    { id: 'meh',     emoji: '😐', label: t('mood.moodMeh'),          color: '#C8D8FF', intensity: 3 },
    { id: 'okay',    emoji: '🙂', label: t('mood.moodOkay'),            color: '#FFCBA4', intensity: 4 },
    { id: 'good',    emoji: '😊', label: t('mood.moodGood'),          color: '#B5EAD7', intensity: 5 },
    { id: 'great',   emoji: '😄', label: t('mood.moodGreat'),         color: '#FFB5C8', intensity: 6 },
    { id: 'amazing', emoji: '🥰', label: isAna ? t('mood.moodInLoveHer') : t('mood.moodInLoveHis'), color: '#C8B6FF', intensity: 7 },
    { id: 'custom',  emoji: '✍️', label: t('mood.moodCustom'),    color: '#E0E0E0', intensity: 0 },
  ];
};

const getFeelings = (role, t) => {
  const isAna = role === 'her';
  return [
    isAna ? t('mood.feelTiredHer') : t('mood.feelTiredHis'), 
    isAna ? t('mood.feelEnergeticHer') : t('mood.feelEnergeticHis'), 
    isAna ? t('mood.feelHappyHer') : t('mood.feelHappyHis'), 
    isAna ? t('mood.feelSensitiveHer') : t('mood.feelSensitiveHis'),
    isAna ? t('mood.feelFrustratedHer') : t('mood.feelFrustratedHis'), 
    isAna ? t('mood.feelRelaxedHer') : t('mood.feelRelaxedHis'), 
    isAna ? t('mood.feelExcitedHer') : t('mood.feelExcitedHis'), 
    t('mood.feelCold'),
    isAna ? t('mood.feelSickHer') : t('mood.feelSickHis'), 
    isAna ? t('mood.feelInLoveHer') : t('mood.feelInLoveHis'), 
    t('mood.feelCelebrating'), 
    isAna ? t('mood.feelMeditativeHer') : t('mood.feelMeditativeHis'),
  ];
};

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
  const { t } = useLanguage();
  const { moods: moodHistory, addMood, deleteMood, loading } = useMoods(role);
  const { addNotification } = useNotifications(role);
  const { profile } = useProfiles(role); // Profile of current user
  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: partnerProfile } = useProfiles(partnerRole);
  
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [customMoodText, setCustomMoodText] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const roleMoods = getMoods(role, t);
  const roleFeelings = getFeelings(role, t);

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

    const myName = profile?.name || (role === 'her' ? 'Ana' : 'Andrei');
    const actualMoodLabel = selectedMood.id === 'custom' ? (customMoodText || 'Stare nedefinită') : selectedMood.label;
    
    // Construiește mesajul
    const feelingsStr = selectedFeelings.length > 0
      ? `\n💭 ${selectedFeelings.join(', ')}`
      : '';
    const noteStr = note.trim() ? `\n\n📝 "${note.trim()}"` : '';
    const msg = `Sunt ${actualMoodLabel.toLowerCase()}${feelingsStr}${noteStr}`;
    const notificationTitle = `${myName} și-a actualizat starea 💕`;

    // Trimite notificare In-App
    await addNotification(notificationTitle, msg, role);

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
          <h2 className={styles.moodTitle}>{t('mood.title')}</h2>
          <p className={styles.moodSubtitle}>{(partnerProfile?.name || (role === 'her' ? 'Andrei' : 'Ana'))} {t('mood.subtitle')}</p>
        </div>
      </div>

      {/* Selector mood principal */}
      <div className={styles.moodGrid} role="group" aria-label="Selectează starea de spirit">
        {roleMoods.map((mood) => (
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
              <label className={styles.noteLabel}>{t('mood.more')}</label>
              <input
                type="text"
                placeholder={role === 'her' ? t('mood.moodCustomPlaceholderHer') : t('mood.moodCustomPlaceholderHis')}
                value={customMoodText}
                onChange={e => setCustomMoodText(e.target.value)}
                className={styles.noteTextarea}
              />
            </div>
          )}

          <p className={styles.feelingsTitle}>{t('mood.more')}</p>
          <div className={styles.feelingsGrid}>
            {roleFeelings.map((feeling) => (
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
              {role === 'her' ? t('mood.addMessageHer') : t('mood.addMessageHis')}
            </label>
            <textarea
              id="mood-note"
              className={styles.noteTextarea}
              placeholder={t('mood.notePlaceholder')}
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
            {sent ? t('mood.sentMsg') :
             sending ? t('mood.sending') :
             `${selectedMood?.emoji} ${t('mood.send')}`}
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
              const moodDef = roleMoods.find(m => m.id === entry.mood) || roleMoods[0];
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
  const { t } = useLanguage();
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (localPass.length < 3) {
      setLoginError('Parola trebuie să aibă minim 3 caractere.');
      return;
    }
    // We just set authenticated. Decryption will fail if it's the wrong pass.
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.diaryNoPass}>
        <span className={`animate-float`} style={{ fontSize: '3rem' }}>🔐</span>
        <h3 className={styles.diaryNoPassTitle}>{t('mood.diaryTitle')}</h3>
        <p className={styles.diaryNoPassMsg}>
          {t('mood.diaryUnlockMsg')}
          <br/><br/>
          <span style={{ fontSize: '0.85rem', color: '#ff4d4d' }}>{t('mood.diaryWarning')}</span>
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <input
            type="password"
            placeholder={t('login.passLabel') || 'Parola'}
            value={localPass}
            onChange={(e) => setLocalPass(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
          {loginError && <span style={{ color: 'red', fontSize: '0.85rem' }}>{loginError}</span>}
          <button type="submit" style={{ padding: '10px', background: 'var(--color-rose-dark)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
            {t('mood.diaryUnlockBtn')}
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
            <h2 className={styles.diaryTitle}>{t('mood.privateDiary') || 'Jurnalul Meu Privat'}</h2>
            <p className={styles.diarySubtitle}>
              {t('mood.encrypted') || '🔒 Criptat • Nimeni altcineva nu poate citi'}
            </p>
          </div>
        </div>
        <div className={styles.diaryStats}>
          <span className={styles.diaryStat}>{entries.length}</span>
          <span className={styles.diaryStatLabel}>{t('mood.entries') || 'intrări'}</span>
        </div>
      </div>

      <div className={styles.securityBadge}>
        <span>🛡️</span>
        <span>AES-256 · {t('mood.savedSafe') || 'Salvat sigur în cloud'}</span>
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
          placeholder={t('mood.diaryPlaceholder')}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          rows={5}
          maxLength={5000}
        />
        <div className={styles.diaryEditorFooter}>
          <span className={styles.diaryWordCount}>{currentText.split(/\s+/).filter(Boolean).length} {t('mood.words')}</span>
          <button
            className={`${styles.diarySaveBtn} ${isSaving ? styles.diarySavingBtn : ''}`}
            onClick={saveEntry}
            disabled={!currentText.trim() || isSaving}
          >
            {isSaving ? t('mood.encrypting') : t('mood.saveCloud')}
          </button>
        </div>
      </div>

      {/* Lista intrări */}
      {diaryLoading ? (
        <div className={styles.diaryLoading}>
          <span className="animate-heartbeat">📔</span> {t('mood.diaryLoading')}
        </div>
      ) : entries.length === 0 ? (
        <div className={styles.diaryEmpty}>
          <span style={{ fontSize: '2rem' }}>🌸</span>
          <p>{t('mood.diaryEmptyText')}</p>
        </div>
      ) : (
        <div className={styles.diaryEntries}>
          <h3 className={styles.diaryEntriesTitle}>{t('mood.yourEntries')} ({entries.length})</h3>
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
                        <span className="animate-heartbeat">🔓</span> {t('mood.decrypting')}
                      </div>
                    ) : (
                      <>
                        <p className={styles.diaryEntryText}>{decryptedContent}</p>
                        <div className={styles.diaryEntryActions}>
                          {deleteConfirm === entry.id ? (
                            <div className={styles.deleteConfirm}>
                              <span>{t('mood.areYouSure')}</span>
                              <button className={styles.deleteYes} onClick={() => handleDelete(entry.id)}>{t('mood.yes')}</button>
                              <button className={styles.deleteNo} onClick={() => setDeleteConfirm(null)}>{t('mood.no')}</button>
                            </div>
                          ) : (
                            <button className={styles.deleteEntryBtn} onClick={() => setDeleteConfirm(entry.id)}>
                              {t('mood.deleteBtn')}
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('mood');

  const tabs = [
    { id: 'mood',  label: t('mood.tabMood'),  emoji: '💭' },
    { id: 'diary', label: t('mood.tabDiary'), emoji: '📔' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('mood.pageTitle')}</h1>
        <p className={styles.subtitle}>{t('mood.pageSubtitle')}</p>
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
