import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemState, useMoods, useEvents, useCustomCoupons } from '../hooks/useDatabase';
import config from '../config';

export default function AdminPage({ onLogout }) {
  const { t } = useLanguage();
  const { systemState, resetCoupons, setScratchRevealed, resetBaristaCounts, setCustomScratchCard } = useSystemState();
  const { moods } = useMoods();
  const { events } = useEvents();
  const { coupons, addCoupon, deleteCoupon } = useCustomCoupons();
  
  const [newCoupon, setNewCoupon] = useState({ title: '', description: '', emoji: '🎟️', color: '#FFB5C8' });
  const [customCard, setCustomCard] = useState({ emoji: '🎁', message: '' });

  const usedCoupons = systemState.coupons || {};
  const usedCount = Object.keys(usedCoupons).filter(k => usedCoupons[k]).length;
  
  const handleResetCoupons = async () => {
    if (window.confirm('Ești sigur că vrei să resetezi toate cupoanele folosite astăzi?')) {
      await resetCoupons();
      alert(t('alerts.couponsReset'));
    }
  };

  const handleResetScratch = async () => {
    if (window.confirm('Ești sigur că vrei să acoperi la loc lozurile răzuite?')) {
      await setScratchRevealed(null, false);
      alert(t('alerts.scratchesReset'));
    }
  };

  const handleResetBarista = async () => {
    if (window.confirm('Ești sigur că vrei să resetezi cererile Barista de azi pentru ambii utilizatori?')) {
      await resetBaristaCounts();
      alert(t('alerts.baristaReset'));
    }
  };

  const handleSetCustomScratchCard = async (e) => {
    e.preventDefault();
    if (!customCard.message.trim()) return;
    await setCustomScratchCard(customCard);
    alert(t('alerts.scratchSet'));
    setCustomCard({ emoji: '🎁', message: '' });
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    await addCoupon(newCoupon);
    setNewCoupon({ title: '', description: '', emoji: '🎟️', color: '#FFB5C8' });
  };

  const handleLoadDefaults = async () => {
    if (window.confirm('Vrei să încarci cupoanele originale? Asta le va adăuga în baza de date peste cele existente.')) {
      const defaultCoupons = config.coupons || [];
      for (const coupon of defaultCoupons) {
        // Oferim cupoanele Anei
        await addCoupon({
          title: coupon.title,
          description: coupon.description,
          emoji: coupon.emoji,
          color: coupon.color || '#FFB5C8',
          author: 'his',
          target: 'her'
        });
        // Oferim cupoanele lui Andrei
        await addCoupon({
          title: coupon.title,
          description: coupon.description,
          emoji: coupon.emoji,
          color: coupon.color || '#FFB5C8',
          author: 'her',
          target: 'his'
        });
      }
      alert(t('alerts.couponsAdded'));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-dark)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🛠️ Panou de Administrare</h2>
        <button 
          onClick={onLogout}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-rose)', borderRadius: '20px', color: 'var(--color-rose)' }}
        >
          Deconectare
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* STATISTICI LIVE */}
        <section style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
          <h3>{t('admin.statsTitle')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
            <li><strong>{t('admin.couponsToday')}</strong> {usedCount} / {coupons.length}</li>
            <li><strong>{t('admin.scratchToday')}</strong> {systemState.scratchCards?.revealed ? t('admin.yes') : t('admin.no')}</li>
            <li><strong>{t('admin.totalEvents')}</strong> {events.length}</li>
            <li><strong>{t('admin.lastMood')}</strong> {moods[0]?.emoji || t('admin.noMood')}</li>
          </ul>
        </section>

        {/* ACTIUNI RAPIDE */}
        <section style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
          <h3>{t('admin.quickActions')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={handleResetCoupons}
              style={{ padding: '10px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '8px' }}
            >
              🔄 Resetează Cupoane Folosite
            </button>
            
            <button 
              onClick={handleResetScratch}
              style={{ padding: '10px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '8px' }}
            >
              🔄 Ascunde Lozul Răzuit
            </button>
            <button 
              onClick={handleResetBarista}
              style={{ padding: '10px', background: 'var(--color-rose-dark)', color: 'white', border: 'none', borderRadius: '8px' }}
            >
              🔄 Resetează Cereri Barista
            </button>
          </div>
        </section>

        {/* ADMINISTRARE SURPRIZA ZILEI */}
        <section style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
          <h3>{t('admin.setSurprise')}</h3>
          <form onSubmit={handleSetCustomScratchCard} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={customCard.emoji} 
                onChange={e => setCustomCard({...customCard, emoji: e.target.value})}
                placeholder={t('admin.emojiPlaceholder')} 
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', width: '80px', textAlign: 'center' }}
                required 
              />
              <input 
                type="text" 
                value={customCard.message} 
                onChange={e => setCustomCard({...customCard, message: e.target.value})}
                placeholder={t('admin.messagePlaceholder')} 
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                required 
              />
            </div>
            <button type="submit" style={{ padding: '10px', background: 'var(--color-sky)', color: '#333', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              Setează Lozul 🎁
            </button>
          </form>
          {systemState.scratchCards?.customCard && (
            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'green' }}>
              Loz activ curent: {systemState.scratchCards.customCard.emoji} {systemState.scratchCards.customCard.message}
            </p>
          )}
        </section>

        {/* ADMINISTRARE CUPOANE */}
        <section style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #eee', gridColumn: '1 / -1' }}>
          <h3>{t('admin.manageCoupons')}</h3>
          
          <button 
            onClick={handleLoadDefaults}
            style={{ marginBottom: '15px', padding: '10px', background: 'var(--color-sky)', color: 'var(--text-dark)', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            📥 Încarcă Cupoanele Predefinite (Din Cod)
          </button>
          
          <form onSubmit={handleAddCoupon} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input required type="text" placeholder={t('admin.titlePlaceholder')} value={newCoupon.title} onChange={e=>setNewCoupon({...newCoupon, title: e.target.value})} style={{ padding: '8px', flex: 1 }} />
            <input required type="text" placeholder={t('admin.descPlaceholder')} value={newCoupon.description} onChange={e=>setNewCoupon({...newCoupon, description: e.target.value})} style={{ padding: '8px', flex: 2 }} />
            <input required type="text" placeholder={t('admin.emojiShort')} value={newCoupon.emoji} onChange={e=>setNewCoupon({...newCoupon, emoji: e.target.value})} style={{ padding: '8px', width: '60px' }} />
            <input type="color" value={newCoupon.color} onChange={e=>setNewCoupon({...newCoupon, color: e.target.value})} style={{ padding: '0', width: '40px', height: '40px' }} />
            <button type="submit" style={{ padding: '8px 16px', background: 'var(--color-rose)', color: 'white', border: 'none', borderRadius: '8px' }}>+ Adaugă</button>
          </form>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {coupons.map(c => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <div>
                  <strong>{c.emoji} {c.title}</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{c.description}</p>
                </div>
                <button onClick={() => deleteCoupon(c.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Șterge</button>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
}
