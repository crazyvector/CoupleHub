import { useState, useEffect, useRef, useCallback } from 'react';
import { useSystemState, useDailyQuote } from '../hooks/useDatabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import styles from '../pages/MemoriesPage.module.css';

export default function ScratchCard() {
  const { role } = useAuth();
  const { t, lang } = useLanguage();
  const { systemState, setScratchRevealed } = useSystemState();
  const { quote, loading } = useDailyQuote(lang);
  
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const animFrameRef = useRef(null);

  const customCard = systemState.scratchCards?.customCard;
  const dailyMessage = customCard ? customCard.message : (quote || t('dashboard.scratchLoading'));
  const dailyEmoji = customCard ? customCard.emoji : "💌";

  useEffect(() => {
    const revealedForRole = systemState.scratchCards?.[role]?.revealed;
    if (revealedForRole !== isRevealed) {
      setIsRevealed(revealedForRole || false);
    }
  }, [systemState.scratchCards, role]);

  useEffect(() => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#E8D5E8');
    gradient.addColorStop(0.5, '#DDD0EE');
    gradient.addColorStop(1, '#E8D5E8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(180, 140, 180, 0.7)';
    ctx.font = `bold ${Math.floor(W / 12)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('dashboard.scratchHere'), W / 2, H / 2 - 10);
  }, [isRevealed, t]);

  const scratch = useCallback((e) => {
    if (!isDrawingRef.current || isRevealed) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      for (let i = 3; i < imageData.data.length; i += 4 * 8) {
        if (imageData.data[i] === 0) transparent++;
      }
      const percent = Math.round((transparent / ((imageData.data.length / 4) / 8)) * 100);
      setScratchPercent(percent);

      if (percent >= 60) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsRevealed(true);
        setScratchRevealed(role, true);
      }
    });
  }, [isRevealed, setScratchRevealed, role]);

  return (
    <div className={styles.scratchSection}>
      <div className={styles.scratchHeader}>
        <span className={styles.scratchIcon}>🎴</span>
        <div>
          <h3 className={styles.scratchTitle}>{t('dashboard.scratchTitle')}</h3>
          <p className={styles.scratchSubtitle}>{t('dashboard.scratchSubtitle')}</p>
        </div>
      </div>

      <div className={styles.scratchCardWrapper}>
        <div className={`${styles.scratchReveal} ${isRevealed ? styles.scratchRevealVisible : ''}`}>
          <div className={styles.scratchPlaceholder}>
             <span style={{ fontSize: '3rem' }}>{dailyEmoji}</span>
             <p className={styles.scratchMessage}>{dailyMessage}</p>
          </div>
        </div>

        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className={styles.scratchCanvas}
            onMouseDown={(e) => { isDrawingRef.current = true; scratch(e); }}
            onMouseMove={scratch}
            onMouseUp={() => { isDrawingRef.current = false; }}
            onMouseLeave={() => { isDrawingRef.current = false; }}
            onTouchStart={(e) => { isDrawingRef.current = true; scratch(e); }}
            onTouchMove={scratch}
            onTouchEnd={() => { isDrawingRef.current = false; }}
          />
        )}
      </div>

      {isRevealed && (
        <div className={styles.scratchRevealed}>
          <p className={styles.scratchRevealedMsg}>{t('dashboard.scratchComeBack')}</p>
        </div>
      )}
    </div>
  );
}
