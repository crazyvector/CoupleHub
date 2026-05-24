import { useState, useRef, useEffect } from 'react';
import styles from './LoginPage.module.css';

// Particulele animate din background
function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 10,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 4 + 4,
    emoji: ['💕', '🌸', '✨', '💫', '🩷', '🌺', '🫶', '💖'][Math.floor(Math.random() * 8)],
  }));

  return (
    <div className={styles.particles} aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.15 + Math.random() * 0.3,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

export default function LoginPage({ onSuccess, onResetPassword }) {
  const [selectedAccount, setSelectedAccount] = useState(null); // 'her', 'his', 'admin'
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetStatus, setResetStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'
  const inputRef = useRef(null);

  // Focus pe input când se selectează un cont
  useEffect(() => {
    if (selectedAccount) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [selectedAccount]);

  const handleAccountSelect = (acc) => {
    setSelectedAccount(acc);
    setPassword('');
    setError(false);
  };

  const handleBack = () => {
    setSelectedAccount(null);
    setPassword('');
    setError(false);
    setResetStatus('');
  };

  const handleResetPassword = async () => {
    if (!onResetPassword || selectedAccount === 'admin') return;
    setResetStatus('sending');
    const success = await onResetPassword(selectedAccount);
    setResetStatus(success ? 'sent' : 'error');
    setTimeout(() => {
      if (success) setResetStatus('');
    }, 4000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password) return;

    // onSuccess acum returnează rolul obținut ('her', 'his', 'admin') sau false
    const result = await onSuccess(password, selectedAccount);
    
    // Verificăm dacă a reușit
    if (result) {
      setIsSuccess(true);
    } else {
      setError(true);
      setAttempts((a) => a + 1);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  const getWelcomeMessage = () => {
    if (selectedAccount === 'her') return { title: 'Bine ai venit Ana 🌸', subtitle: 'Introdu parola contului tău.' };
    if (selectedAccount === 'his') return { title: 'Bine ai venit Andrei 💙', subtitle: 'Introdu parola contului tău.' };
    if (selectedAccount === 'admin') return { title: 'Panou Admin 🛠️', subtitle: 'Introdu parola de securitate.' };
    return { title: 'Bine ai venit! 💕', subtitle: 'Alege profilul tău' };
  };

  const msg = getWelcomeMessage();

  return (
    <div className={`${styles.container} ${isSuccess ? styles.containerSuccess : ''}`}>
      <FloatingParticles />

      {/* Blob-uri decorative */}
      <div className={styles.blobTop} aria-hidden="true" />
      <div className={styles.blobBottom} aria-hidden="true" />

      <div className={`${styles.card} animate-scale-in`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={`${styles.heartIcon} ${isSuccess ? 'animate-heartbeat' : 'animate-float'}`}>
            {isSuccess ? '💖' : '🔐'}
          </div>
          <h1 className={styles.title}>
            {isSuccess ? 'Ne conectăm... 💕' : msg.title}
          </h1>
          <p className={styles.subtitle}>
            {isSuccess ? 'Așteaptă un moment' : msg.subtitle}
          </p>
        </div>

        {/* PASUL 1: SELECȚIE CONT */}
        {!selectedAccount && !isSuccess && (
          <div className={styles.accountGrid}>
            <button className={styles.accountBtn} onClick={() => handleAccountSelect('her')}>
              <span className={styles.accountEmoji}>👩</span>
              <span className={styles.accountName}>Pentru Ea</span>
            </button>
            <button className={styles.accountBtn} onClick={() => handleAccountSelect('his')}>
              <span className={styles.accountEmoji}>👨</span>
              <span className={styles.accountName}>Pentru El</span>
            </button>
            <button className={styles.accountBtnAdmin} onClick={() => handleAccountSelect('admin')}>
              <span className={styles.accountEmojiSmall}>🛠️</span>
              <span className={styles.accountNameSmall}>Sistem Admin</span>
            </button>
          </div>
        )}

        {/* PASUL 2: INTRODUCERE PAROLĂ */}
        {selectedAccount && !isSuccess && (
          <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            
            <form onSubmit={handleSubmit} style={{width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input
                ref={inputRef}
                className={`${styles.passwordInput} ${error ? 'animate-shake' : ''}`}
                type="password"
                placeholder="Introdu parola..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  border: error ? '2px solid #FF5252' : '2px solid #FFB5C8',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  outline: 'none',
                  backgroundColor: '#FFF5F7',
                  color: '#3D2C2C',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
              />

              {/* Mesaj eroare */}
              {error && (
                <p className={styles.errorMsg} style={{color: '#FF5252', fontSize: '0.9rem', margin: '0', textAlign: 'center'}}>
                  {attempts >= 3
                    ? 'Parolă greșită. Verifică cu atenție! 🤫'
                    : 'Parolă greșită. Mai încearcă! 🥺'}
                </p>
              )}

              <button 
                type="submit" 
                disabled={!password || password.length < 6}
                style={{
                  padding: '15px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: password && password.length >= 6 ? 'var(--color-rose-dark)' : '#E0E0E0',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  cursor: password && password.length >= 6 ? 'pointer' : 'not-allowed',
                  boxShadow: password && password.length >= 6 ? '0 4px 10px rgba(255,107,143,0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                Intră în aplicație
              </button>
            </form>

            {selectedAccount !== 'admin' && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                {resetStatus === 'sending' && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Se trimite link-ul...</p>}
                {resetStatus === 'sent' && <p style={{ fontSize: '0.85rem', color: '#1A6640', background: '#D4F5E9', padding: '5px 10px', borderRadius: '8px' }}>✅ Link de resetare trimis pe adresa ta reală de email!</p>}
                {resetStatus === 'error' && <p style={{ fontSize: '0.85rem', color: '#FF5252' }}>Eroare la trimitere! Poate contul nu e complet configurat.</p>}
                {!resetStatus && (
                  <button 
                    onClick={handleResetPassword}
                    style={{ background: 'none', border: 'none', color: 'var(--color-rose)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Ai uitat parola?
                  </button>
                )}
              </div>
            )}

            <button 
              onClick={handleBack}
              style={{
                marginTop: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Alege alt profil
            </button>
          </div>
        )}

        {/* Footer */}
        <p className={styles.footerText}>
          Făcut cu <span className={styles.heart}>💕</span> pentru voi
        </p>
      </div>
    </div>
  );
}
