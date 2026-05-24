import { useState, useRef, useEffect, useCallback } from 'react';
import { useWheelItems } from '../hooks/useDatabase';
import styles from './GamesPage.module.css';

// ============================================================
// Roata Norocului — Canvas-based
// ============================================================

const drawWheel = (canvas, rotation, items) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) - 4;

  ctx.clearRect(0, 0, W, H);

  if (!items || items.length === 0) {
    ctx.font = '20px Nunito';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Nicio opțiune', cx, cy);
    return;
  }

  const ITEM_COUNT = items.length;
  const ARC = (2 * Math.PI) / ITEM_COUNT;

  // Desenează fiecare segment
  items.forEach((item, i) => {
    const startAngle = rotation + i * ARC;
    const endAngle = startAngle + ARC;
    const midAngle = startAngle + ARC / 2;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = item.color || '#FFB5C8';
    ctx.fill();

    // Border segment
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text pe segment
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#3D2C2C';
    const rawFontSize = Math.floor(R / (ITEM_COUNT * 0.8));
    const fontSize = Math.max(12, Math.min(24, rawFontSize));
    ctx.font = `bold ${fontSize}px Nunito, sans-serif`;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 3;
    const maxWidth = R - 30; // Leave some padding
    ctx.fillText(item.label, R - 12, 5, maxWidth);
    ctx.restore();
  });

  // Cerc central
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,181,200,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emoji central
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText('💕', cx, cy);

  // Cerc exterior decorativ
  ctx.beginPath();
  ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,181,200,0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function SpinWheel({ items, title, subtitle, onAddItem, onDeleteItem }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemColor, setNewItemColor] = useState('#FFB5C8');

  const dpr = window.devicePixelRatio || 1;
  const SIZE = Math.min(window.innerWidth - 48, 340);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawWheel(canvas, rotationRef.current, items);
  }, [items, SIZE, dpr]);

  const spin = useCallback(() => {
    if (isSpinning || !items || items.length === 0) return;
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const ITEM_COUNT = items.length;
    const ARC = (2 * Math.PI) / ITEM_COUNT;

    // Rotație totală: 5-8 ture + offset random
    const extraRotation = Math.random() * 2 * Math.PI;
    const totalRotation = (5 + Math.random() * 3) * 2 * Math.PI + extraRotation;
    const duration = 4000 + Math.random() * 1000; // 4-5 secunde
    const startTime = performance.now();
    const startRotation = rotationRef.current;

    // Easing out cubic
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      rotationRef.current = startRotation + totalRotation * easedProgress;
      drawWheel(canvasRef.current, rotationRef.current, items);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Calculează câștigătorul (indicatorul e sus, la 270 grade / 1.5 PI)
        const finalRotation = rotationRef.current % (2 * Math.PI);
        const relativeAngle = (1.5 * Math.PI - finalRotation + 2 * Math.PI) % (2 * Math.PI);
        const winnerIndex = Math.floor(relativeAngle / ARC) % ITEM_COUNT;
        setResult(items[winnerIndex]);
        setIsSpinning(false);
        setTimeout(() => setShowResult(true), 200);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isSpinning, items]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;
    onAddItem({ label: newItemLabel.trim(), color: newItemColor });
    setNewItemLabel('');
    setShowAddModal(false);
  };

  return (
    <div className={styles.wheelSection}>
      <div className={styles.wheelHeader}>
        <h2 className={styles.wheelTitle}>{title}</h2>
        <p className={styles.wheelSubtitle}>{subtitle}</p>
      </div>

      {/* Roata + pin indicator */}
      <div className={styles.wheelWrapper}>
        <div className={styles.wheelPin} aria-hidden="true">▼</div>
        <canvas
          ref={canvasRef}
          className={`${styles.wheelCanvas} ${isSpinning ? styles.wheelSpinning : ''}`}
          aria-label="Roata norocului"
        />
      </div>

      {/* Buton spin */}
      <button
        id="wheel-spin-btn"
        className={`${styles.spinBtn} ${isSpinning ? styles.spinBtnSpinning : ''}`}
        onClick={spin}
        disabled={isSpinning || !items || items.length === 0}
        aria-label="Învârte roata"
      >
        {isSpinning ? (
          <><span className={styles.spinBtnIcon}>⏳</span> Se învârte...</>
        ) : (
          <><span className={styles.spinBtnIcon}>🎲</span> Învârte!</>
        )}
      </button>

      {/* Rezultat */}
      {showResult && result && (
        <div className={`${styles.resultCard} animate-bounce-in`}>
          <div className={styles.resultEmoji}>🎉</div>
          <p className={styles.resultLabel}>Decizia finală:</p>
          <div
            className={styles.resultItem}
            style={{ background: `${result.color}30`, borderColor: `${result.color}80` }}
          >
            {result.label}
          </div>
          <button
            className={styles.spinAgainBtn}
            onClick={() => { setShowResult(false); setTimeout(spin, 200); }}
          >
            🔄 Încearcă din nou
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`${styles.modalContent} animate-scale-in`} onClick={e => e.stopPropagation()} style={{padding: '20px', borderRadius: '15px'}}>
            <h3 style={{marginBottom: '15px'}}>Adaugă Opțiune Nouă</h3>
            <form onSubmit={handleAddSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input 
                type="text" 
                placeholder="Ex: Pizza" 
                value={newItemLabel} 
                onChange={e => setNewItemLabel(e.target.value)}
                style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
                maxLength={20}
                required
              />
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <label style={{fontSize: '0.9rem', color: '#666'}}>Culoare fundal:</label>
                <input 
                  type="color" 
                  value={newItemColor} 
                  onChange={e => setNewItemColor(e.target.value)}
                  style={{width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px'}}
                />
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '8px'}}>Anulează</button>
                <button type="submit" style={{flex: 1, padding: '10px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold'}}>Adaugă</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de opțiuni editabila */}
      <div className={styles.itemsList}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <p className={styles.itemsTitle} style={{marginBottom: 0}}>Opțiunile de azi:</p>
          <button onClick={() => setShowAddModal(true)} style={{background: 'none', border: 'none', color: 'var(--color-rose-dark)', fontWeight: 'bold', fontSize: '0.9rem'}}>+ Adaugă</button>
        </div>
        <div className={styles.itemsGrid}>
          {items.map((item) => (
            <div
              key={item.id}
              className={styles.itemChip}
              style={{ background: `${item.color}25`, borderColor: `${item.color}60`, position: 'relative', paddingRight: '30px' }}
            >
              {item.label}
              <button 
                onClick={() => onDeleteItem(item.id)}
                style={{position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#D32F2F', fontSize: '1.2rem', padding: '0 5px'}}
              >
                ×
              </button>
            </div>
          ))}
          {items.length === 0 && <p style={{fontSize: '0.8rem', color: '#999'}}>Nicio opțiune. Adaugă câteva!</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GamesPage
// ============================================================
export default function GamesPage() {
  const [activeTab, setActiveTab] = useState('food'); // 'food' | 'date'
  
  const foodHook = useWheelItems('food');
  const dateHook = useWheelItems('date');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Idei & Mâncare 💡</h1>
        <p className={styles.subtitle}>Lasă soarta să decidă pentru voi</p>
      </header>

      <div style={{display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '20px'}}>
        <button 
          onClick={() => setActiveTab('food')}
          style={{flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', background: activeTab === 'food' ? 'var(--color-rose-dark)' : '#f0f0f0', color: activeTab === 'food' ? 'white' : '#666'}}
        >
          🍔 Mâncare
        </button>
        <button 
          onClick={() => setActiveTab('date')}
          style={{flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', background: activeTab === 'date' ? 'var(--color-rose-dark)' : '#f0f0f0', color: activeTab === 'date' ? 'white' : '#666'}}
        >
          🌹 Date-uri
        </button>
      </div>

      <main className={styles.content}>
        <div className="animate-fade-in-up">
          {activeTab === 'food' ? (
            foodHook.loading ? <p style={{textAlign: 'center'}}>Încărcare...</p> :
            <SpinWheel 
              items={foodHook.items} 
              title="Ce mâncăm deseară? 🍽️" 
              subtitle="Apasă roata și lasă soarta să decidă!" 
              onAddItem={foodHook.addItem}
              onDeleteItem={foodHook.deleteItem}
            />
          ) : (
            dateHook.loading ? <p style={{textAlign: 'center'}}>Încărcare...</p> :
            <SpinWheel 
              items={dateHook.items} 
              title="Ce facem azi? 🌹" 
              subtitle="O idee perfectă de date!" 
              onAddItem={dateHook.addItem}
              onDeleteItem={dateHook.deleteItem}
            />
          )}
        </div>
      </main>
    </div>
  );
}
