import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaPlayCircle, FaCrown, FaTimes } from 'react-icons/fa';

export default function RewardModal({ 
  isOpen, 
  onClose, 
  onWatchAd, 
  onGoPro, 
  title, 
  description, 
  rewardText, 
  loading 
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>
          <FaTimes />
        </button>
        
        <div style={styles.iconContainer}>
          <span style={{ fontSize: '3rem' }}>🎁</span>
        </div>
        
        <h3 style={styles.title}>{title || t('reward.title')}</h3>
        <p style={styles.desc}>
          {description || t('reward.desc')}
        </p>

        <div style={styles.buttonsContainer}>
          <button 
            style={{...styles.adBtn, opacity: loading ? 0.7 : 1}} 
            onClick={onWatchAd}
            disabled={loading}
          >
            <FaPlayCircle size={18} />
            {loading ? t('common.loading') : (rewardText || t('reward.watchAd'))}
          </button>
          
          <div style={styles.orText}>{t('common.or') || 'SAU'}</div>

          <button style={styles.proBtn} onClick={onGoPro}>
            <FaCrown size={18} color="#f1c40f" />
            {t('reward.goPro') || 'Treci la Premium (Nelimitat)'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '24px',
    padding: '30px 20px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '5px'
  },
  iconContainer: {
    background: 'rgba(255, 107, 107, 0.1)',
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 15px',
  },
  title: {
    margin: '0 0 10px',
    color: 'var(--text-primary)',
    fontSize: '1.4rem'
  },
  desc: {
    margin: '0 0 25px',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.5
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  adBtn: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
  },
  proBtn: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '14px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  orText: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  }
};
