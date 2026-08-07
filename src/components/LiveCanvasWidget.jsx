import React, { useRef, useState, useEffect } from 'react';
import { useGlobalAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDrawings, useMemories, useNotifications } from '../hooks/useDatabase';
import styles from './LiveCanvasWidget.module.css';

export default function LiveCanvasWidget() {
  const { t } = useLanguage();
  const { role } = useGlobalAuth();
  const { drawings, sendDrawing, deleteDrawing } = useDrawings();
  const { addMemory } = useMemories();
  const { addNotification } = useNotifications();

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [color, setColor] = useState('#ffb5c8');
  const [isSending, setIsSending] = useState(false);

  // Check inbox for me
  const incomingDrawings = drawings.filter(d => d.target === role);
  const pendingDrawing = incomingDrawings.length > 0 ? incomingDrawings[0] : null;

  // Load context on mount
  useEffect(() => {
    if (pendingDrawing) return; // nu randa canvas daca avem inbox plin
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 4;
      setCtx(context);
    }
  }, [pendingDrawing]);

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSend = async () => {
    if (!canvasRef.current) return;
    setIsSending(true);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const targetRole = role === 'her' ? 'his' : 'her';
    await sendDrawing(dataUrl, role, targetRole);
    await addNotification(t('dashboard.drawSomething') , 'Ai primit un desen nou pe ecranul principal!', role);
    clearCanvas();
    setIsSending(false);
    alert(t('alerts.drawingSent'));
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      ctx.closePath();
    }
  };

  const handleSaveToMemories = async () => {
    if (!pendingDrawing) return;
    await addMemory({
      title: t('memories.newPhoto') ,
      description: t('dashboard.drawingReceivedDesc'),
      imagePath: pendingDrawing.image,
      category: 'love',
      date: new Date().toISOString()
    });
    await deleteDrawing(pendingDrawing.id);
    alert(t('alerts.drawingSaved'));
  };

  const handleDiscard = async () => {
    if (!pendingDrawing) return;
    await deleteDrawing(pendingDrawing.id);
  };

  if (pendingDrawing) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.canvasHeader}>
          <h3 className={styles.canvasTitle}>{t('dashboard.receivedDrawing')}</h3>
        </div>
        <div style={{ padding: '10px', background: 'white', borderRadius: '12px', marginBottom: '10px' }}>
          <img src={pendingDrawing.image} alt={t('dashboard.drawingAlt')} style={{ width: '100%', borderRadius: '8px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDiscard} style={{ flex: 1, padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
            {t('dashboard.deleteBtn')}
          </button>
          <button onClick={handleSaveToMemories} style={{ flex: 2, padding: '10px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
            {t('dashboard.saveMemoriesBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.canvasHeader}>
        <h3 className={styles.canvasTitle}>{t('dashboard.drawSomething')}</h3>
        <button className={styles.clearBtn} onClick={clearCanvas}>{t('dashboard.clearBtn')}</button>
      </div>
      
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.drawCanvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className={styles.tools}>
        {['#ffb5c8', '#4facfe', '#000000', '#2ecc71', '#e74c3c'].map(c => (
          <button
            key={c}
            className={`${styles.colorBtn} ${color === c ? styles.activeColor : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
        <button 
          onClick={handleSend} 
          disabled={isSending}
          style={{ marginLeft: 'auto', padding: '5px 15px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold' }}
        >
          {isSending ? '...' : t('dashboard.sendBtn')}
        </button>
      </div>
    </div>
  );
}
