import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCustomCoupons, useNotifications, useProfiles } from '../hooks/useDatabase';
import styles from './CupoanePage.module.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonetization } from '../hooks/useMonetization';

// ============================================================
// Confetti Burst component (canvas-based)
// ============================================================
function ConfettiBurst({ active, originX, originY }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FFB5C8', '#C8B6FF', '#FFCBA4', '#B5EAD7', '#FFD7BA', '#B5D8EB'];
    const emojis = ['💕', '✨', '🌸', '💫', '🩷'];

    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: originX || canvas.width / 2,
      y: originY || canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: Math.random() > 0.7 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      life: 1,
      decay: Math.random() * 0.015 + 0.008,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particlesRef.current.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.emoji) {
          ctx.font = `${p.size * 2}px serif`;
          ctx.fillText(p.emoji, -p.size, p.size / 2);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });

      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, originX, originY]);

  if (!active) return null;
  return <canvas ref={canvasRef} className={styles.confettiCanvas} aria-hidden="true" />;
}

// ============================================================
// Modal de confirmare rascumpărare cupon
// ============================================================
function RedeemModal({ coupon, onConfirm, onCancel, isLoading }) {
  const [note, setNote] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Confirmare răscumpărare cupon">
      <div className={`${styles.modal} animate-scale-in`}>
        <div className={styles.modalEmoji}>{coupon.emoji}</div>
        <h3 className={styles.modalTitle}>{t('coupons.useCoupon')}</h3>
        <div className={styles.modalCouponPreview} style={{ '--coupon-color': coupon.color }}>
          <strong>{coupon.title}</strong>
          <p>{coupon.description}</p>
        </div>

        <div className={styles.modalNoteWrapper}>
          <label className={styles.noteLabel} htmlFor="coupon-note">
            {t('coupons.addNote')}
          </label>
          <input
            id="coupon-note"
            className={styles.noteInput}
            type="text"
            placeholder={t('coupons.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('coupons.later')}
          </button>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}
            onClick={() => onConfirm(note)}
            disabled={isLoading}
          >
            {isLoading ? <span className={styles.loadingSpinner} /> : t('coupons.useIt')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Modal Creare Cupon Nou
// ============================================================
function CreateCouponModal({ onConfirm, onCancel, isLoading, authorRole }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎟️');
  const [color, setColor] = useState('#FFB5C8');
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onConfirm({ title, description, emoji, color });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Creează un cupon">
      <div className={`${styles.modal} animate-scale-in`} style={{ padding: '20px' }}>
        <h3 className={styles.modalTitle}>{t('coupons.createCoupon')}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '15px' }}>
          {t('coupons.canBeUsedBy')}{authorRole === 'her' ? 'Andrei' : 'Ana'}.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <input
            className={styles.noteInput}
            type="text"
            placeholder={t('coupons.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
          />
          <textarea
            className={styles.noteInput}
            placeholder={t('coupons.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            rows={2}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className={styles.noteInput}
              type="text"
              placeholder={t('coupons.emojiPlaceholder')}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              style={{ width: '80px', textAlign: 'center' }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '45px', height: '45px', padding: 0, border: 'none', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('coupons.cancel')}
          </button>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !description.trim()}
          >
            {isLoading ? <span className={styles.loadingSpinner} /> : t('coupons.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Modal de sugestie cupon
// ============================================================
function SuggestionModal({ onConfirm, onCancel, isLoading }) {
  const [suggestion, setSuggestion] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Sugerează un cupon">
      <div className={`${styles.modal} animate-scale-in`}>
        <div className={styles.modalEmoji}>💡</div>
        <h3 className={styles.modalTitle}>{t('coupons.suggestCoupon')}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '15px' }}>
          {t('coupons.whatCouponWant')}
        </p>

        <div className={styles.modalNoteWrapper}>
          <input
            id="coupon-suggestion"
            className={styles.noteInput}
            type="text"
            placeholder={t('coupons.suggestPlaceholder')}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('coupons.cancel')}
          </button>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}
            onClick={() => onConfirm(suggestion)}
            disabled={isLoading || !suggestion.trim()}
          >
            {isLoading ? <span className={styles.loadingSpinner} /> : t('coupons.sendSuggestion')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Card Cupon individual
// ============================================================
function CouponCard({ coupon, isUsed, usedAt, onRedeem, canRedeem, onDelete }) {
  const { t } = useLanguage();
  const usedDate = usedAt
    ? new Date(usedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div
      className={`${styles.couponCard} ${isUsed ? styles.couponUsed : styles.couponAvailable}`}
      style={{ '--coupon-color': coupon.color }}
      onClick={() => { if (canRedeem && !isUsed) onRedeem(coupon); }}
      role={isUsed || !canRedeem ? 'article' : 'button'}
      aria-label={isUsed ? `Cupon ${coupon.title} - folosit` : `Cupon: ${coupon.title}`}
      tabIndex={isUsed || !canRedeem ? -1 : 0}
    >
      {onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(coupon.id); }}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', zIndex: 10, cursor: 'pointer', padding: '5px' }}
        >
          🗑️
        </button>
      )}

      <div className={styles.couponNotchLeft} aria-hidden="true" />
      <div className={styles.couponNotchRight} aria-hidden="true" />
      <div className={styles.couponDivider} aria-hidden="true" />

      <div className={styles.couponLeft}>
        <span
          className={`${styles.couponEmoji} ${isUsed ? '' : 'animate-float'}`}
          style={{ animationDelay: `${Math.random() * 2}s` }}
        >
          {isUsed ? '✅' : coupon.emoji}
        </span>
      </div>

      <div className={styles.couponRight}>
        <div className={styles.couponMeta}>
          <span
            className={styles.couponStatus}
            style={{
              background: isUsed ? '#E8F8EE' : `${coupon.color}33`,
              color: isUsed ? '#2D7D46' : `${coupon.color}`,
              filter: isUsed ? 'none' : 'brightness(0.7)',
            }}
          >
            {isUsed ? t('coupons.usedStatus') : t('coupons.availableStatus')}
          </span>
        </div>
        <h3 className={`${styles.couponTitle} ${isUsed ? styles.couponTitleUsed : ''}`}>
          {coupon.title}
        </h3>
        <p className={`${styles.couponDescription} ${isUsed ? styles.couponDescUsed : ''}`}>
          {coupon.description}
        </p>
        {isUsed && usedDate && (
          <p className={styles.couponUsedDate}>
            {t('coupons.usedOn')}{usedDate}
          </p>
        )}
        {!isUsed && canRedeem && (
          <div className={styles.couponTap}>
            {t('coupons.tapToUse')}
          </div>
        )}
      </div>

      {isUsed && <div className={styles.usedOverlay} aria-hidden="true" />}
    </div>
  );
}

// ============================================================
// CupoanePage — pagina principală
// ============================================================
export default function CupoanePage() {
  const { role } = useAuth();
  const { coupons, addCoupon, useCoupon, deleteCoupon, loading } = useCustomCoupons();
  const { addNotification } = useNotifications();
  const { profile } = useProfiles(role);
  const { t } = useLanguage();
  const { isPro } = useMonetization();
  
  const [activeTab, setActiveTab] = useState('received'); // 'received' sau 'created'
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confetti, setConfetti] = useState({ active: false, x: 0, y: 0 });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const receivedCoupons = coupons.filter(c => c.target === role);
  const createdCoupons = coupons.filter(c => c.author === role);

  const handleConfirmRedeem = async (note) => {
    if (!selectedCoupon) return;
    setIsRedeeming(true);
    
    try {
      const myName = profile?.name || (role === 'her' ? 'Ana' : 'Andrei');
      const targetRoleForNotif = selectedCoupon.author;
      const msg = `${myName}${t('coupons.usedCouponText')}"${selectedCoupon.title}"!` + (note ? `\n${t('coupons.noteLabel')}"${note}"` : '');
      
      if (targetRoleForNotif) {
        // addNotification(title, body, sender, customTargetRole)
        await addNotification(t('coupons.couponUsedTitle'), msg, role, targetRoleForNotif);
      }
      
      await useCoupon(selectedCoupon.id, note);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setConfetti({ active: true, x: cx, y: cy });
      setTimeout(() => setConfetti({ active: false, x: 0, y: 0 }), 3000);

      showToast(`${t('coupons.couponPrefix')}${selectedCoupon.title}${t('coupons.usedSuccess')}`);
    } catch (e) {
      console.error(e);
      showToast(t('coupons.useError'), 'error');
    }

    setIsRedeeming(false);
    setSelectedCoupon(null);
  };

  const handleCreateCoupon = async (data) => {
    if (!isPro && createdCoupons.length >= 3) {
      alert("Ai atins limita de 3 cupoane active! Treci la Premium pentru cupoane nelimitate sau șterge din cele existente.");
      return;
    }

    setIsRedeeming(true);
    try {
      await addCoupon({
        ...data,
        author: role,
        target: role === 'her' ? 'his' : 'her'
      });
      showToast(t('coupons.createSuccess'));
      setIsCreating(false);
    } catch (e) {
      console.error(e);
      showToast(t('coupons.createError'), 'error');
    }
    setIsRedeeming(false);
  };

  const handleConfirmSuggestion = async (suggestionText) => {
    if (!suggestionText.trim()) return;
    setIsRedeeming(true);
    
    try {
      const myName = profile?.name || (role === 'her' ? 'Ana' : 'Andrei');
      const targetRole = role === 'her' ? 'his' : 'her';
      const msg = `"${suggestionText.trim()}"`;
      
      await addNotification(t('coupons.newSuggestionTitle'), `${t('coupons.hey')}${myName}${t('coupons.wouldLikeCouponFor')}${msg}`, role, targetRole);
      await addNotification(t('coupons.newSuggestionTitle'), `${myName}${t('coupons.proposedCoupon')}${msg}`, role, 'admin');
      
      showToast(t('coupons.suggestSuccess'));
    } catch (e) {
      console.error(e);
      showToast(t('coupons.suggestError'), 'error');
    }

    setIsRedeeming(false);
    setIsSuggesting(false);
  };

  const handleLoadDefaults = async () => {
    if (!isPro) {
      alert("Ai nevoie de Premium pentru a încărca toate cupoanele implicite, deoarece limita gratuită este de 3 cupoane active.");
      return;
    }

    setIsRedeeming(true);
    const defaults = [
      { title: t('coupons.defaultMassage'), description: t('coupons.defaultMassageDesc'), emoji: '💆‍♀️', color: '#B5EAD7' },
      { title: t('coupons.defaultMovie'), description: t('coupons.defaultMovieDesc'), emoji: '🍿', color: '#FFCBA4' },
      { title: t('coupons.defaultOuting'), description: t('coupons.defaultOutingDesc'), emoji: '🍽️', color: '#FFB5C8' },
      { title: t('coupons.defaultFood'), description: t('coupons.defaultFoodDesc'), emoji: '🍔', color: '#FFD7BA' },
      { title: t('coupons.defaultCuddle'), description: t('coupons.defaultCuddleDesc'), emoji: '🫂', color: '#C8B6FF' },
      { title: t('coupons.defaultChore'), description: t('coupons.defaultChoreDesc'), emoji: '🧹', color: '#B5D8EB' },
    ];
    try {
      for (const c of defaults) {
        await addCoupon({ ...c, author: role, target: role === 'her' ? 'his' : 'her' });
      }
      showToast(t('coupons.addDefaultsSuccess'));
    } catch (e) {
      console.error(e);
      showToast(t('coupons.addDefaultsError'), 'error');
    }
    setIsRedeeming(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <span className="animate-heartbeat" style={{ fontSize: '2rem' }}>💕</span>
      </div>
    );
  }

  const currentList = activeTab === 'received' ? receivedCoupons : createdCoupons;

  return (
    <div className={styles.page}>
      <ConfettiBurst active={confetti.active} originX={confetti.x} originY={confetti.y} />

      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]} animate-fade-in-up`}>
          {toast.message}
        </div>
      )}

      {selectedCoupon && (
        <RedeemModal
          coupon={selectedCoupon}
          onConfirm={handleConfirmRedeem}
          onCancel={() => setSelectedCoupon(null)}
          isLoading={isRedeeming}
        />
      )}

      {isCreating && (
        <CreateCouponModal
          authorRole={role}
          onConfirm={handleCreateCoupon}
          onCancel={() => setIsCreating(false)}
          isLoading={isRedeeming}
        />
      )}

      {isSuggesting && (
        <SuggestionModal
          onConfirm={handleConfirmSuggestion}
          onCancel={() => setIsSuggesting(false)}
          isLoading={isRedeeming}
        />
      )}

      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{t('coupons.pageTitle')}</h1>
          <p className={styles.subtitle}>{t('coupons.pageSubtitle')}</p>
        </div>
        <div className={styles.statsRow}>
          <button 
            className={styles.suggestionBtn} 
            onClick={() => setIsSuggesting(true)}
            aria-label="Sugerează un cupon"
            style={{ flex: 1 }}
          >
            <span className={styles.suggestionBtnIcon}>💡</span> {t('coupons.suggestBtn')}
          </button>
          <button 
            className={styles.suggestionBtn} 
            onClick={() => setIsCreating(true)}
            style={{ flex: 1, background: 'var(--color-rose-dark)', color: 'white' }}
          >
            <span className={styles.suggestionBtnIcon}>✨</span> {t('coupons.createBtn')}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('received')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 'bold',
            background: activeTab === 'received' ? 'var(--color-rose-dark)' : 'var(--bg-card)',
            color: activeTab === 'received' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'received' ? 'none' : '1px solid var(--border-color)',
            boxShadow: activeTab === 'received' ? 'var(--shadow-md)' : 'none'
          }}
        >
          {t('coupons.received')} ({receivedCoupons.filter(c => !c.isUsed).length})
        </button>
        <button
          onClick={() => setActiveTab('created')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 'bold',
            background: activeTab === 'created' ? 'var(--color-rose-dark)' : 'var(--bg-card)',
            color: activeTab === 'created' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'created' ? 'none' : '1px solid var(--border-color)',
            boxShadow: activeTab === 'created' ? 'var(--shadow-md)' : 'none'
          }}
        >
          {t('coupons.created')} ({createdCoupons.length})
        </button>
      </div>

      <section className={styles.couponsList}>
        {currentList.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            <p style={{ marginBottom: '15px' }}>
              {activeTab === 'received' 
                ? t('coupons.noReceived') 
                : t('coupons.noCreated')}
            </p>
            {activeTab === 'created' && (
              <button 
                onClick={handleLoadDefaults}
                disabled={isRedeeming}
                style={{ padding: '10px 20px', background: 'var(--color-rose-dark)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}
              >
                {isRedeeming ? t('coupons.adding') : t('coupons.loadDefaults')}
              </button>
            )}
          </div>
        )}
        
        {currentList.map((coupon, idx) => (
          <div
            key={coupon.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <CouponCard
              coupon={coupon}
              isUsed={coupon.isUsed}
              usedAt={coupon.usedAt}
              canRedeem={activeTab === 'received'}
              onRedeem={(c) => setSelectedCoupon(c)}
              onDelete={activeTab === 'created' ? deleteCoupon : null}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
