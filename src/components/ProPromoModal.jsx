import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProPromoModal.module.css';

export default function ProPromoModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.iconWrapper}>
          💎
        </div>
        
        <h2 className={styles.title}>Treci la PRO!</h2>
        
        <p className={styles.description}>
          Susține dezvoltatorul și deblochează experiența completă CoupleHub:
        </p>
        
        <ul className={styles.featuresList}>
          <li>🚫 Fără reclame nicăieri în aplicație</li>
          <li>♾️ Swipe-uri infinite la filme, idei de date & rețete</li>
          <li>💌 Cupoane și amintiri nelimitate</li>
          <li>🎨 Teme de chat personalizabile cu fundal</li>
        </ul>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.subscribeBtn}
            onClick={() => {
              onClose();
              navigate('/profile?tab=pro'); // Presupunem că direcționăm către profil
            }}
          >
            Vezi Oferta PRO
          </button>
          <button 
            className={styles.skipBtn}
            onClick={onClose}
          >
            Poate mai târziu
          </button>
        </div>
      </div>
    </div>
  );
}
