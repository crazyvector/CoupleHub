import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ProPromoModal.module.css';

export default function ProPromoModal({ onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.iconWrapper}>
          💎
        </div>
        
        <h2 className={styles.title}>{t('proPromo.title')}</h2>
        
        <p className={styles.description}>
          {t('proPromo.desc')}
        </p>
        
        <ul className={styles.featuresList}>
          <li>{t('proPromo.feat1')}</li>
          <li>{t('proPromo.feat2')}</li>
          <li>{t('proPromo.feat3')}</li>
          <li>{t('proPromo.feat4')}</li>
        </ul>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.subscribeBtn}
            onClick={() => {
              onClose();
              navigate('/profile?tab=pro'); // Presupunem că direcționăm către profil
            }}
          >
            {t('proPromo.viewOffer')}
          </button>
          <button 
            className={styles.skipBtn}
            onClick={onClose}
          >
            {t('proPromo.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
