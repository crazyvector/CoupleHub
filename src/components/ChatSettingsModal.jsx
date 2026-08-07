import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonetization } from '../hooks/useMonetization';
import RewardModal from './RewardModal';
import { FaTimes, FaImage, FaCrown, FaLock } from 'react-icons/fa';

export const CHAT_THEMES = [
  { id: 'default', background: 'var(--bg-app)', isGradient: false, isPremium: false },
  { id: 'pink', background: '#ffe6ea', isGradient: false, isPremium: true },
  { id: 'blue', background: '#e6f0ff', isGradient: false, isPremium: true },
  { id: 'purple', background: '#f0e6ff', isGradient: false, isPremium: true },
  { id: 'green', background: '#e6ffe6', isGradient: false, isPremium: true },
  { id: 'yellow', background: '#fffae6', isGradient: false, isPremium: true },
  { id: 'dark', background: '#1a1a2e', isGradient: false, isPremium: true },
  { id: 'grad-sunset', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', isGradient: true, isPremium: true },
  { id: 'grad-ocean', background: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', isGradient: true, isPremium: true },
  { id: 'grad-love', background: 'linear-gradient(to top, #ff0844 0%, #ffb199 100%)', isGradient: true, isPremium: true }
];

export default function ChatSettingsModal({ isOpen, onClose, currentTheme, onThemeSelect, onImageUpload }) {
  const { t } = useLanguage();
  const { isPro, showRewardedAd } = useMonetization();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);
  const [rewardLoading, setRewardLoading] = useState(false);

  if (!isOpen) return null;

  const handleThemeClick = (theme) => {
    if (!theme.isPremium || isPro) {
      onThemeSelect({ backgroundColor: theme.background, isGradient: theme.isGradient, backgroundImage: null });
    } else {
      setPendingTheme(theme);
      setShowRewardModal(true);
    }
  };

  const handleWatchAd = async () => {
    setRewardLoading(true);
    await showRewardedAd(() => {
      onThemeSelect({ backgroundColor: pendingTheme.background, isGradient: pendingTheme.isGradient, backgroundImage: null });
      setShowRewardModal(false);
      setPendingTheme(null);
    });
    setRewardLoading(false);
  };

  const handleImageChange = (e) => {
    if (!isPro) {
      alert(t('alerts.proRequired'));
      window.location.href = '/profile';
      return;
    }
    const file = e.target.files[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>
          <FaTimes />
        </button>
        
        <h3 style={styles.title}>{t('chat.settingsTitle') }</h3>
        <p style={styles.subtitle}>{t('chat.settingsDesc') }</p>
        
        <div style={styles.grid}>
          {CHAT_THEMES.map(theme => {
            const isSelected = !currentTheme.backgroundImage && currentTheme.backgroundColor === theme.background;
            return (
              <button 
                key={theme.id}
                style={{
                  ...styles.themeCircle,
                  background: theme.background,
                  border: isSelected ? '3px solid var(--text-primary)' : '2px solid var(--border-color)',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                }}
                onClick={() => handleThemeClick(theme)}
              >
                {theme.isPremium && !isPro && <FaLock style={styles.lockIcon} />}
              </button>
            );
          })}
        </div>

        <div style={styles.divider}></div>

        <div style={styles.uploadSection}>
          <label style={styles.uploadBtn}>
            <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageChange} />
            <div style={styles.uploadBtnContent}>
              <FaImage size={24} />
              <div style={styles.uploadBtnText}>
                <strong>{t('chat.customImage') }</strong>
                {!isPro && <span style={styles.proTag}><FaCrown size={12}/> PRO</span>}
              </div>
            </div>
          </label>
        </div>

        {currentTheme.backgroundImage && (
          <button style={styles.removeImageBtn} onClick={() => onThemeSelect({ backgroundColor: 'var(--bg-app)', isGradient: false, backgroundImage: null })}>
            {t('chat.removeImage') }
          </button>
        )}
      </div>

      <RewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)}
        onWatchAd={handleWatchAd}
        onGoPro={() => window.location.href='/profile'}
        loading={rewardLoading}
        title={t('reward.title')}
        description={t('chat.unlockThemeDesc') }
        rewardText={t('chat.unlockThemeBtn') }
      />
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '24px',
    padding: '30px 20px',
    maxWidth: '400px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
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
  title: {
    margin: '0 0 5px',
    color: 'var(--text-primary)',
    fontSize: '1.4rem',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 20px',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '15px',
    marginBottom: '20px',
    justifyItems: 'center'
  },
  themeCircle: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s'
  },
  lockIcon: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: '14px',
    filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))'
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '20px 0'
  },
  uploadSection: {
    display: 'flex',
    justifyContent: 'center'
  },
  uploadBtn: {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '2px dashed var(--border-color)',
    borderRadius: '16px',
    padding: '15px',
    cursor: 'pointer',
    display: 'block',
    transition: 'all 0.2s',
  },
  uploadBtnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    color: 'var(--text-primary)'
  },
  uploadBtnText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  proTag: {
    background: '#f1c40f',
    color: '#000',
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 'bold',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  removeImageBtn: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#e74c3c',
    fontWeight: 'bold',
    marginTop: '15px',
    padding: '10px',
    cursor: 'pointer'
  }
};
