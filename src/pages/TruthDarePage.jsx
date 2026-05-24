import { useState, useRef, useEffect, useCallback } from 'react';
import { useWheelItems } from '../hooks/useDatabase';
import styles from './GamesPage.module.css'; // ← exact același CSS ca GamesPage

// ============================================================
// drawWheel — identic cu GamesPage, doar accent colors diferite
// ============================================================
function drawWheel(canvas, rotation, items, centerEmoji = '🎭', defaultColor = '#A78BFA') {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
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

  items.forEach((item, i) => {
    const startAngle = rotation + i * ARC;
    const endAngle = startAngle + ARC;
    const midAngle = startAngle + ARC / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = item.color || defaultColor;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(R / (ITEM_COUNT * 0.8))}px Nunito, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    const label = item.label.length > 16 ? item.label.slice(0, 14) + '…' : item.label;
    ctx.fillText(label, R - 12, 5);
    ctx.restore();
  });

  // Cerc central
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = defaultColor + '80';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emoji central
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText(centerEmoji, cx, cy);

  // Cerc exterior decorativ
  ctx.beginPath();
  ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = defaultColor + '60';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// ============================================================
// SpinWheel — identic cu GamesPage
// ============================================================
function SpinWheel({ items, title, subtitle, onAddItem, onDeleteItem, centerEmoji, defaultColor, addColor, placeholder }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemColor, setNewItemColor] = useState(defaultColor);

  const dpr = window.devicePixelRatio || 1;
  const SIZE = Math.min(window.innerWidth - 48, 340);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawWheel(canvas, rotationRef.current, items, centerEmoji, defaultColor);
  }, [items, SIZE, dpr, centerEmoji, defaultColor]);

  const spin = useCallback(() => {
    if (isSpinning || !items || items.length === 0) return;
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const ITEM_COUNT = items.length;
    const ARC = (2 * Math.PI) / ITEM_COUNT;
    const extraRotation = Math.random() * 2 * Math.PI;
    const totalRotation = (5 + Math.random() * 3) * 2 * Math.PI + extraRotation;
    const duration = 4000 + Math.random() * 1000;
    const startTime = performance.now();
    const startRotation = rotationRef.current;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      rotationRef.current = startRotation + totalRotation * easedProgress;
      drawWheel(canvasRef.current, rotationRef.current, items, centerEmoji, defaultColor);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const finalRotation = rotationRef.current % (2 * Math.PI);
        const normalizedAngle = (2 * Math.PI - finalRotation) % (2 * Math.PI);
        const winnerIndex = Math.floor(normalizedAngle / ARC) % ITEM_COUNT;
        setResult(items[winnerIndex]);
        setIsSpinning(false);
        setTimeout(() => setShowResult(true), 200);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [isSpinning, items, centerEmoji, defaultColor]);

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

      <div className={styles.wheelWrapper}>
        <div className={styles.wheelPin} aria-hidden="true">▼</div>
        <canvas
          ref={canvasRef}
          className={`${styles.wheelCanvas} ${isSpinning ? styles.wheelSpinning : ''}`}
          aria-label="Roata norocului"
        />
      </div>

      <button
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

      {showResult && result && (
        <div className={`${styles.resultCard} animate-bounce-in`}>
          <div className={styles.resultEmoji}>🎉</div>
          <p className={styles.resultLabel}>Provocarea ta este:</p>
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
          <div className={`${styles.modalContent} animate-scale-in`} onClick={e => e.stopPropagation()} style={{ padding: '20px', borderRadius: '15px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Adaugă o întrebare</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <textarea
                placeholder={placeholder}
                value={newItemLabel}
                onChange={e => setNewItemLabel(e.target.value)}
                maxLength={80}
                rows={3}
                required
                autoFocus
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Culoare fundal:</label>
                <input
                  type="color"
                  value={newItemColor}
                  onChange={e => setNewItemColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>Anulează</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: addColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Adaugă</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista opțiuni */}
      <div className={styles.itemsList}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p className={styles.itemsTitle} style={{ marginBottom: 0 }}>Întrebările disponibile:</p>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'none', border: 'none', color: addColor, fontWeight: 'bold', fontSize: '0.9rem' }}>+ Adaugă</button>
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
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#D32F2F', fontSize: '1.2rem', padding: '0 5px' }}
              >
                ×
              </button>
            </div>
          ))}
          {items.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nicio opțiune. Adaugă câteva!</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Default items
// ============================================================
const DEFAULT_TRUTHS = [
  { label: 'Care e cel mai mare secret al tău?', color: '#A78BFA' },
  { label: 'Ce te sperie cel mai mult în viață?', color: '#8B5CF6' },
  { label: 'Care e momentul de care îți e cel mai rușine?', color: '#7C3AED' },
  { label: 'Dacă ai putea schimba ceva la tine, ce ar fi?', color: '#C4B5FD' },
  { label: 'Care e cel mai mare vis al tău neîmplinit?', color: '#DDD6FE' },
  { label: 'Ce calitate apreciezi cel mai mult la mine?', color: '#A78BFA' },
  { label: 'Care e amintirea ta preferată cu noi?', color: '#8B5CF6' },
  { label: 'Ce te-a atras prima dată la mine?', color: '#7C3AED' },
  { label: 'Cel mai mare secret pe care nu l-ai spus nimănui?', color: '#C4B5FD' },
  { label: 'Cum îți imaginezi viața noastră peste 10 ani?', color: '#A78BFA' },
];

const DEFAULT_DARES = [
  { label: 'Mimează personajul preferat din filme!', color: '#FB923C' },
  { label: 'Cântă 30s din melodia ta preferată!', color: '#F97316' },
  { label: 'Fă 10 flotări acum!', color: '#EA580C' },
  { label: 'Spune 3 lucruri pe care le admiri la mine!', color: '#FDBA74' },
  { label: 'Dansează 1 minut fără muzică!', color: '#FED7AA' },
  { label: 'Vorbește cu accent 2 minute!', color: '#F97316' },
  { label: 'Fă o poză haioasă și trimite-mi-o!', color: '#FB923C' },
  { label: 'Imită 3 emoji-uri diferite!', color: '#EA580C' },
  { label: 'Spune cât mai multe cuvinte în 30 secunde!', color: '#FDBA74' },
  { label: 'Fă o glumă (bună sau proastă)!', color: '#F97316' },
];

// ============================================================
// TruthDarePage
// ============================================================
export default function TruthDarePage() {
  const [activeTab, setActiveTab] = useState('truth');

  const truthHook = useWheelItems('truth');
  const dareHook = useWheelItems('dare');

  // Auto-seed la primul load
  useEffect(() => {
    if (!truthHook.loading && truthHook.items.length === 0) {
      DEFAULT_TRUTHS.forEach(item => truthHook.addItem(item));
    }
  }, [truthHook.loading]);

  useEffect(() => {
    if (!dareHook.loading && dareHook.items.length === 0) {
      DEFAULT_DARES.forEach(item => dareHook.addItem(item));
    }
  }, [dareHook.loading]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Truth or Dare 🎭</h1>
        <p className={styles.subtitle}>Cine cutează... câștigă 😈</p>
      </header>

      <div style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('truth')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 'bold',
            background: activeTab === 'truth' ? '#7C3AED' : 'var(--bg-card)',
            color: activeTab === 'truth' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'truth' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          🤍 Truth
        </button>
        <button
          onClick={() => setActiveTab('dare')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 'bold',
            background: activeTab === 'dare' ? '#EA580C' : 'var(--bg-card)',
            color: activeTab === 'dare' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'dare' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          🔥 Dare
        </button>
      </div>

      <main className={styles.content}>
        <div className="animate-fade-in-up">
          {activeTab === 'truth' ? (
            truthHook.loading ? <p style={{ textAlign: 'center' }}>Încărcare...</p> :
            <SpinWheel
              items={truthHook.items}
              title="Truth 🤍"
              subtitle="Roata alege întrebarea. Nu poți minți!"
              onAddItem={truthHook.addItem}
              onDeleteItem={truthHook.deleteItem}
              centerEmoji="🤍"
              defaultColor="#8B5CF6"
              addColor="#7C3AED"
              placeholder="Ex: Care e cel mai mare secret al tău?"
            />
          ) : (
            dareHook.loading ? <p style={{ textAlign: 'center' }}>Încărcare...</p> :
            <SpinWheel
              items={dareHook.items}
              title="Dare 🔥"
              subtitle="Roata alege provocarea. Curaj!"
              onAddItem={dareHook.addItem}
              onDeleteItem={dareHook.deleteItem}
              centerEmoji="🔥"
              defaultColor="#F97316"
              addColor="#EA580C"
              placeholder="Ex: Fă 10 genuflexiuni acum!"
            />
          )}
        </div>
      </main>
    </div>
  );
}
