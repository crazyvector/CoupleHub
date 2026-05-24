import { useState, useEffect, useRef, useCallback } from 'react';
import { useSystemState } from '../hooks/useDatabase';
import { getDailyScratchCard } from '../data/scratchCards';
import styles from '../pages/MemoriesPage.module.css';

export default function ScratchCard() {
  const { systemState, setScratchRevealed } = useSystemState();
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const animFrameRef = useRef(null);

  const fallbackCard = getDailyScratchCard();
  const dailyCard = systemState.scratchCards?.customCard || fallbackCard;

  useEffect(() => {
    if (systemState.scratchCards?.revealed !== isRevealed) {
      setIsRevealed(systemState.scratchCards?.revealed || false);
    }
  }, [systemState.scratchCards]);

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
    ctx.fillText('Răzuiește aici! 💕', W / 2, H / 2 - 10);
  }, [isRevealed]);

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
        setScratchRevealed(true);
      }
    });
  }, [isRevealed, setScratchRevealed]);

  return (
    <div className={styles.scratchSection}>
      <div className={styles.scratchHeader}>
        <span className={styles.scratchIcon}>🎴</span>
        <div>
          <h3 className={styles.scratchTitle}>Surpriza Zilei</h3>
          <p className={styles.scratchSubtitle}>Un nou loz în fiecare zi!</p>
        </div>
      </div>

      <div className={styles.scratchCardWrapper}>
        <div className={`${styles.scratchReveal} ${isRevealed ? styles.scratchRevealVisible : ''}`}>
          <div className={styles.scratchPlaceholder}>
             <span style={{ fontSize: '3rem' }}>{dailyCard.emoji}</span>
             <p className={styles.scratchMessage}>{dailyCard.message}</p>
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
          <p className={styles.scratchRevealedMsg}>Revino mâine pentru un nou loz!</p>
        </div>
      )}
    </div>
  );
}
