import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function OnboardingTour({ onComplete }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: t('onboarding.slide1Title'),
      desc: t('onboarding.slide1Desc'),
      icon: '🏠'
    },
    {
      title: t('onboarding.slide2Title'),
      desc: t('onboarding.slide2Desc'),
      icon: '🖱️'
    },
    {
      title: t('onboarding.slide3Title'),
      desc: t('onboarding.slide3Desc'),
      icon: '💖'
    },
    {
      title: t('onboarding.slide4Title'),
      desc: t('onboarding.slide4Desc'),
      icon: '🎮'
    },
    {
      title: t('onboarding.slide5Title'),
      desc: t('onboarding.slide5Desc'),
      icon: '🏡'
    },
    {
      title: t('onboarding.slide6Title'),
      desc: t('onboarding.slide6Desc'),
      icon: '👑',
      isPremium: true
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleGoPremium = () => {
    onComplete();
    navigate('/profile');
  };

  return (
    <div style={overlayStyle} className="animate-fade-in">
      <div style={modalStyle}>
        <div style={iconStyle}>
          {slides[currentSlide].icon}
        </div>
        
        <h2 style={titleStyle}>{slides[currentSlide].title}</h2>
        <p style={descStyle}>{slides[currentSlide].desc}</p>

        <div style={dotsContainerStyle}>
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              style={{
                ...dotStyle,
                opacity: idx === currentSlide ? 1 : 0.3,
                width: idx === currentSlide ? '20px' : '8px'
              }} 
            />
          ))}
        </div>

        <div style={actionsStyle}>
          {slides[currentSlide].isPremium ? (
            <>
              <button onClick={handleSkip} style={skipBtnStyle}>
                {t('onboarding.skip')}
              </button>
              <button onClick={handleGoPremium} style={{...nextBtnStyle, background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000'}}>
                {t('onboarding.supportBtn')}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSkip} style={skipBtnStyle}>
                {t('onboarding.skip')}
              </button>
              <button onClick={handleNext} style={nextBtnStyle}>
                {currentSlide === slides.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px'
};

const modalStyle = {
  background: 'var(--bg-card, #ffffff)',
  borderRadius: '24px',
  padding: '30px 20px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};

const iconStyle = {
  fontSize: '4rem',
  marginBottom: '20px',
  animation: 'pulse 2s infinite'
};

const titleStyle = {
  fontSize: '1.4rem',
  fontWeight: '800',
  color: 'var(--text-primary, #333)',
  margin: '0 0 10px 0',
  fontFamily: 'var(--font-display)'
};

const descStyle = {
  fontSize: '1rem',
  color: 'var(--text-secondary, #666)',
  lineHeight: '1.5',
  margin: '0 0 30px 0',
  minHeight: '60px' // to keep modal height relatively stable
};

const dotsContainerStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '30px',
  justifyContent: 'center'
};

const dotStyle = {
  height: '8px',
  borderRadius: '4px',
  background: 'var(--color-rose, #ff6b6b)',
  transition: 'all 0.3s ease'
};

const actionsStyle = {
  display: 'flex',
  width: '100%',
  gap: '15px',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const skipBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted, #999)',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  padding: '10px'
};

const nextBtnStyle = {
  background: 'linear-gradient(135deg, var(--color-rose, #ff6b6b) 0%, var(--color-rose-dark, #ff4757) 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
};
