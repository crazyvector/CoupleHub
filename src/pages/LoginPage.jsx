import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './LoginPage.module.css';

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

export default function LoginPage({ useAuthHook }) {
  const { user, userData, loginWithEmail, registerWithEmail, resetPasswordEmail, linkPartner, logout } = useAuthHook();
  const { t } = useLanguage();
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('F');
  
  const [partnerKey, setPartnerKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const res = await loginWithEmail(email, password);
    if (!res.success) setError(res.error);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setError('');
    const res = await registerWithEmail(email, password, name, gender, null);
    if (!res.success) setError(res.error);
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('login.errorEmail'));
      return;
    }
    setLoading(true);
    setError('');
    const res = await resetPasswordEmail(email);
    if (res.success) {
      setMsg(t('login.successReset'));
      setMode('login');
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleLink = async (e) => {
    e.preventDefault();
    if (!partnerKey.trim()) return;
    setLoading(true);
    setError('');
    const result = await linkPartner(partnerKey.trim().toUpperCase(), userData?.name, userData?.gender || 'M');
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const isWaiting = user && (userData?.status === 'waiting' || userData?.status === 'new');

  return (
    <div className={styles.container}>
      <FloatingParticles />
      <div className={styles.blobTop} aria-hidden="true" />
      <div className={styles.blobBottom} aria-hidden="true" />

      <div className={`${styles.card} animate-scale-in`}>
        <div className={styles.header}>
          <div className={`${styles.heartIcon} animate-float`}>
            {isWaiting ? '🔗' : (mode === 'register' ? '👋' : '💕')}
          </div>
          <h1 className={styles.title}>
            {isWaiting ? t('login.welcomeTitle') : 'Couple Hub'}
          </h1>
          <p className={styles.subtitle}>
            {isWaiting ? t('login.connectPartner') : (mode === 'register' ? t('login.createAcc') : t('login.signIn'))}
          </p>
        </div>

        {/* --- UNLOGGED FLOW: LOGIN / REGISTER / FORGOT --- */}
        {!isWaiting && (
          <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => {setMode('login'); setError(''); setMsg('');}} style={{ background: mode === 'login' ? 'var(--color-rose)' : 'transparent', color: mode === 'login' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>{t('login.loginTab')}</button>
              <button onClick={() => {setMode('register'); setError(''); setMsg('');}} style={{ background: mode === 'register' ? 'var(--color-rose)' : 'transparent', color: mode === 'register' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>{t('login.registerTab')}</button>
            </div>

            {msg && <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '10px', textAlign: 'center' }}>{msg}</p>}
            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginBottom: '10px', textAlign: 'center' }}>{error}</p>}

            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <input
                  type="email"
                  placeholder={t('login.emailLabel')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #FFB5C8', fontSize: '1rem', outline: 'none', backgroundColor: '#FFF5F7', color: '#3D2C2C' }}
                />
                <input
                  type="password"
                  placeholder={t('login.passLabel')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #FFB5C8', fontSize: '1rem', outline: 'none', backgroundColor: '#FFF5F7', color: '#3D2C2C' }}
                />
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-rose)', fontSize: '0.8rem', textAlign: 'right', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('login.forgotPass')}
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--color-rose-dark)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginTop: '5px' }}
                >
                  {loading ? '...' : t('login.enterBtn')}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <input
                  type="text"
                  placeholder={t('login.placeholderName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: `2px solid ${gender === 'M' ? '#6C5CE7' : '#FFB5C8'}`, fontSize: '1rem', outline: 'none', backgroundColor: gender === 'M' ? '#F0F0FF' : '#FFF5F7', color: '#3D2C2C' }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => setGender('F')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid #FFB5C8', backgroundColor: gender === 'F' ? '#FFB5C8' : 'white', color: gender === 'F' ? 'white' : '#3D2C2C', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('login.girl')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setGender('M')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid #6C5CE7', backgroundColor: gender === 'M' ? '#6C5CE7' : 'white', color: gender === 'M' ? 'white' : '#3D2C2C', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('login.boy')}
                  </button>
                </div>
                <input
                  type="email"
                  placeholder={t('login.emailLabel')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: `2px solid ${gender === 'M' ? '#6C5CE7' : '#FFB5C8'}`, fontSize: '1rem', outline: 'none', backgroundColor: gender === 'M' ? '#F0F0FF' : '#FFF5F7', color: '#3D2C2C', marginTop: '5px' }}
                />
                <input
                  type="password"
                  placeholder={t('login.passRules')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: `2px solid ${gender === 'M' ? '#6C5CE7' : '#FFB5C8'}`, fontSize: '1rem', outline: 'none', backgroundColor: gender === 'M' ? '#F0F0FF' : '#FFF5F7', color: '#3D2C2C' }}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: gender === 'M' ? '#6C5CE7' : 'var(--color-rose-dark)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginTop: '10px' }}
                >
                  {loading ? '...' : t('login.registerBtn')}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} style={{width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center'}}>{t('login.forgotText')}</p>
                <input
                  type="email"
                  placeholder={t('login.emailLabel')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.passwordInput}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #FFB5C8', fontSize: '1rem', outline: 'none', backgroundColor: '#FFF5F7', color: '#3D2C2C' }}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--color-rose-dark)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                >
                  {loading ? '...' : t('login.resetBtn')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('login.backToLogin')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- WAITING FOR PARTNER FLOW --- */}
        {isWaiting && (
          <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%'}}>
            
            <div style={{ background: 'rgba(255,181,200,0.1)', padding: '15px', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('login.yourKey')}</p>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '3px', color: 'var(--color-rose-dark)' }}>
                {userData?.pairKey}
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('login.sendKey')}
              </p>
            </div>

            <form onSubmit={handleLink} style={{width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {t('login.enterKey')}
              </p>
              <input
                className={`${styles.passwordInput} ${error ? 'animate-shake' : ''}`}
                type="text"
                placeholder={t('login.placeholderKey')}
                value={partnerKey}
                onChange={(e) => { setPartnerKey(e.target.value.toUpperCase()); setError(''); }}
                maxLength={10}
                style={{
                  width: '100%', padding: '15px', borderRadius: '12px',
                  border: error ? '2px solid #FF5252' : '2px solid #FFB5C8', 
                  fontSize: '1.5rem', textAlign: 'center', letterSpacing: '2px',
                  outline: 'none', backgroundColor: '#FFF5F7', color: '#3D2C2C',
                  fontFamily: 'inherit', textTransform: 'uppercase'
                }}
              />

              {error && (
                <p className={styles.errorMsg} style={{color: '#FF5252', fontSize: '0.9rem', margin: '0', textAlign: 'center'}}>
                  {error}
                </p>
              )}

              <button 
                type="submit" 
                disabled={partnerKey.length < 10 || loading}
                style={{
                  padding: '15px', borderRadius: '12px', border: 'none',
                  backgroundColor: partnerKey.length >= 10 ? 'var(--color-rose-dark)' : '#E0E0E0',
                  color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                  cursor: partnerKey.length >= 10 && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: partnerKey.length >= 10 ? '0 4px 15px rgba(255,107,145,0.4)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {loading ? t('login.connecting') : t('login.connectBtn')}
              </button>
            </form>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              {t('login.autoUpdate')}
            </p>

            <button 
              type="button" 
              onClick={async () => {
                if (window.confirm(t('login.logoutConfirm'))) {
                  await logout();
                }
              }}
              style={{
                background: 'none', border: 'none', color: '#888',
                textDecoration: 'underline', cursor: 'pointer',
                marginTop: '10px', fontSize: '0.9rem'
              }}
            >
              {t('login.logoutBtn')}
            </button>
          </div>
        )}

        {/* Footer */}
        <p className={styles.footerText}>
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
