import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGlobalAuth } from '../contexts/AuthContext';
import { useProfiles, useAppVersion } from '../hooks/useDatabase';
import { useMonetization } from '../hooks/useMonetization';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ProfilePage.module.css';

import { encryptText, decryptText } from '../hooks/useCrypto';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfilePage({ role }) {
  const { user, logout, breakUp, gender, userData, changeUserPassword } = useGlobalAuth();
  const { profile, updateProfile, loading } = useProfiles(role);
  const { latestVersion, downloadUrl, localVersion } = useAppVersion();
  const { isPro, offerings, purchasePackage, redeemPromoCode, isLifetimePro } = useMonetization();
  const { t, setLang } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    age: '',
    favoriteColor: '#ffb5c8',
    bio: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const [passwordData, setPasswordData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showBreakupConfirm, setShowBreakupConfirm] = useState(false);
  const [isBreakingUp, setIsBreakingUp] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'main'); // main, personal, settings, pro, contact

  // Update URL and state when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'main' ? {} : { tab });
  };

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || (role === 'her' ? 'Ana' : 'Andrei'),
        nickname: profile.nickname || '',
        age: profile.age || '',
        favoriteColor: profile.favoriteColor || '#ffb5c8',
        bio: profile.bio || '',
        anniversaryDate: profile.anniversaryDate || '',
        language: profile.language || 'ro'
      });
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile, role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'language') {
      setLang(value);
      updateProfile({ language: value });
    }
  };

  const resizeImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64Url = await resizeImage(file, 400, 0.6); // Compress aggressively for Firestore
      
      setAvatarUrl(base64Url);
      await updateProfile({ avatarUrl: base64Url });
      alert("Imaginea a fost salvată cu succes direct în baza de date! 💕");
    } catch (error) {
      console.error("Eroare la upload:", error);
      alert("A apărut o eroare la salvarea imaginii.");
    }
    setIsUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile({ ...formData, avatarUrl, isConfigured: true });
    setIsSaving(false);
    alert('Profil actualizat cu succes! 💕');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPass) {
      alert("Introdu parola curentă!");
      return;
    }
    if (passwordData.newPass !== passwordData.confirmPass) {
      alert("Parolele noi nu coincid!");
      return;
    }
    if (passwordData.newPass.length < 6) {
      alert("Noua parolă trebuie să aibă minim 6 caractere.");
      return;
    }
    setIsChangingPass(true);
    
    // 1. Schimbăm parola in Firebase Auth (verifică și parola veche)
    const res = await changeUserPassword(passwordData.oldPass, passwordData.newPass);
    if (!res.success) {
      alert("Eroare la schimbarea parolei. Verifică parola veche și încearcă din nou.\n" + res.error);
      setIsChangingPass(false);
      return;
    }

    // 2. Re-criptăm Jurnalul (dacă există intrări)
    try {
      if (userData?.coupleId) {
        const colName = role ? `diary_${role}` : 'diary_unknown';
        const diaryRef = collection(db, 'couples', userData.coupleId, colName);
        const snapshot = await getDocs(diaryRef);
        
        let reEncryptionErrors = 0;
        const updates = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.encrypted) {
            const decryptedContent = await decryptText(data.encrypted, passwordData.oldPass);
            if (decryptedContent === null) {
              reEncryptionErrors++;
              continue; // Skip this entry, wrong password or corrupted
            }
            // Encrypt with new password
            const newEncrypted = await encryptText(decryptedContent, passwordData.newPass);
            updates.push(updateDoc(docSnap.ref, { encrypted: newEncrypted }));
          }
        }

        // Run all updates
        await Promise.all(updates);

        if (reEncryptionErrors > 0) {
          alert(`Parola a fost schimbată, dar ${reEncryptionErrors} intrări din jurnal nu au putut fi decriptate cu parola veche (posibil corupte sau adăugate cu altă parolă). Ele nu au fost modificate.`);
        } else {
          alert("Parola a fost schimbată și jurnalul a fost re-criptat cu succes! 💕");
        }
      } else {
        alert("Parola a fost schimbată cu succes!");
      }
    } catch (err) {
      console.error("Eroare la re-criptarea jurnalului:", err);
      alert("Parola a fost schimbată, dar a apărut o eroare la actualizarea jurnalului.");
    }

    setPasswordData({ oldPass: '', newPass: '', confirmPass: '' });
    setIsChangingPass(false);
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setIsRedeeming(true);
    const res = await redeemPromoCode(promoCode.trim().toUpperCase());
    alert(res.message);
    if (res.success) setPromoCode('');
    setIsRedeeming(false);
  };

  if (loading) {
    return <div className={styles.page}>Încărcare...</div>;
  }

  // Calculare completare profil
  const calculateCompletion = () => {
    let score = 0;
    const totalFields = 5; // nume, alint, varsta, avatar, bio
    if (formData.name) score++;
    if (formData.nickname) score++;
    if (formData.age) score++;
    if (formData.bio) score++;
    if (avatarUrl) score++;
    return Math.round((score / totalFields) * 100);
  };
  const completion = calculateCompletion();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('profile.title')}</h1>
        <p className={styles.subtitle}>{t('profile.subtitle')}</p>
        <div style={{ marginTop: '10px', background: 'var(--border-color)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${completion}%`, background: 'var(--color-rose-dark)', height: '100%', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '5px' }}>{completion}% {t('profile.completed')}</p>
      </header>

      {activeTab === 'main' && (
        <div className={styles.settingsList} style={{ marginBottom: '20px' }}>
          <div className={styles.settingsItem} onClick={() => handleTabChange('personal')} style={{ cursor: 'pointer' }}>
             <div className={styles.settingsIcon} style={{ background: '#3498db' }}>👤</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.tabPersonalInfo')}</span>
             </div>
             <div style={{ color: '#bbb', fontSize: '1.2rem' }}>›</div>
          </div>
          <div className={styles.settingsItem} onClick={() => handleTabChange('couple')} style={{ cursor: 'pointer' }}>
             <div className={styles.settingsIcon} style={{ background: '#e84393' }}>💕</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.tabCouple') || 'Detalii Cuplu'}</span>
             </div>
             <div style={{ color: '#bbb', fontSize: '1.2rem' }}>›</div>
          </div>
          <div className={styles.settingsItem} onClick={() => handleTabChange('settings')} style={{ cursor: 'pointer' }}>
             <div className={styles.settingsIcon} style={{ background: '#9b59b6' }}>⚙️</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.tabSettings')}</span>
             </div>
             <div style={{ color: '#bbb', fontSize: '1.2rem' }}>›</div>
          </div>
          <div className={styles.settingsItem} onClick={() => handleTabChange('pro')} style={{ cursor: 'pointer' }}>
             <div className={styles.settingsIcon} style={{ background: '#f1c40f' }}>💎</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.tabPro')}</span>
             </div>
             <div style={{ color: '#bbb', fontSize: '1.2rem' }}>›</div>
          </div>
          <div className={styles.settingsItem} onClick={() => handleTabChange('contact')} style={{ cursor: 'pointer' }}>
             <div className={styles.settingsIcon} style={{ background: '#e74c3c' }}>📞</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.tabSupport')}</span>
             </div>
             <div style={{ color: '#bbb', fontSize: '1.2rem' }}>›</div>
          </div>
        </div>
      )}

      {activeTab !== 'main' && (
        <button 
          onClick={() => handleTabChange('main')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--color-rose-dark)', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', cursor: 'pointer' }}
        >
          ← {t('common.back') || 'Înapoi'}
        </button>
      )}

      {activeTab === 'personal' && (
      <div className={`${styles.card} animate-scale-in`} style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>{t('profile.tabPersonalInfo')}</h3>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {isUploading ? (
              <span className={styles.loadingSpinner} style={{ borderColor: 'var(--color-rose)' }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarPlaceholder}>{gender === 'F' ? '👩' : '👨'}</span>
            )}
          </div>
          {isUploading && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.uploadingAvatar')}</p>}
          
          <label className={styles.uploadLabel}>
            {t('profile.changeAvatar')}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className={styles.uploadInput}
              disabled={isUploading}
            />
          </label>
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label htmlFor="name">{t('profile.realName')}</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              className={styles.input} 
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="nickname">{t('profile.nickname')}</label>
            <input 
              type="text" 
              id="nickname" 
              name="nickname" 
              value={formData.nickname} 
              onChange={handleInputChange} 
              className={styles.input} 
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="age">{t('profile.birthdate')}</label>
            <input 
              type="date" 
              id="age" 
              name="age" 
              value={formData.age} 
              onChange={handleInputChange} 
              className={styles.input} 
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="favoriteColor">{t('profile.color')}</label>
            <input 
              type="color" 
              id="favoriteColor" 
              name="favoriteColor" 
              value={formData.favoriteColor} 
              onChange={handleInputChange} 
              className={styles.input} 
              style={{ padding: '4px', height: '50px' }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="bio">{t('profile.bioLabel')}</label>
            <textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleInputChange} 
              className={styles.textarea} 
              placeholder={t('profile.bioPlaceholder')} 
            />
          </div>

          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? <span className={styles.loadingSpinner} /> : `${t('profile.save')} 💕`}
          </button>
        </form>
      </div>
      )}

      {activeTab === 'settings' && (
      <div className={`${styles.card} animate-scale-in`} style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>{t('profile.yourAccount')}</h3>
        
        <div className={styles.settingsList}>
          <div className={styles.settingsItem}>
            <div className={styles.settingsIcon} style={{ background: '#3498db' }}>🌍</div>
            <div className={styles.settingsInfo}>
              <span className={styles.settingsLabel}>{t('profile.lang')}</span>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className={styles.settingsSelect}
              >
                <option value="ro">{t('profile.roLang')}</option>
                <option value="en">{t('profile.enLang')}</option>
              </select>
            </div>
          </div>
          
          <div className={styles.settingsItem}>
            <div className={styles.settingsIcon} style={{ background: 'var(--color-rose)' }}>📧</div>
            <div className={styles.settingsInfo}>
              <span className={styles.settingsLabel}>Email</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
            </div>
          </div>
          
          <div className={styles.settingsItem} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
             <div className={styles.settingsIcon} style={{ background: '#9b59b6' }}>🔒</div>
             <div className={styles.settingsInfo}>
               <span className={styles.settingsLabel}>{t('profile.changePass')}</span>
             </div>
          </div>
          <form onSubmit={handleChangePassword} style={{ padding: '0 16px 16px 16px', marginTop: '10px' }}>
            <input
              type="password"
              placeholder={t('profile.currentPass')}
              value={passwordData.oldPass}
              onChange={(e) => setPasswordData({...passwordData, oldPass: e.target.value})}
              className={styles.input}
              style={{ marginBottom: '10px' }}
              required
            />
            <input
              type="password"
              placeholder={t('profile.newPassRules')}
              value={passwordData.newPass}
              onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
              className={styles.input}
              style={{ marginBottom: '10px' }}
              required
            />
            <input
              type="password"
              placeholder={t('profile.confirmPass')}
              value={passwordData.confirmPass}
              onChange={(e) => setPasswordData({...passwordData, confirmPass: e.target.value})}
              className={styles.input}
              style={{ marginBottom: '15px' }}
              required
            />
            <button type="submit" disabled={isChangingPass} className={styles.saveBtn} style={{ background: 'var(--color-rose-dark)', width: '100%', fontSize: '0.95rem' }}>
              {isChangingPass ? <span className={styles.loadingSpinner} /> : t('profile.saveNewPass')}
            </button>
          </form>
        </div>
      </div>
      )}

      {activeTab === 'pro' && (
      <div className={`${styles.card} animate-scale-in`} style={{ marginBottom: '20px' }}>
        <div className={styles.proSectionContainer}>
          {isPro ? (
            <div style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', padding: '15px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{t('profile.proTitle')}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('profile.proDesc')}</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '2px solid #FFD700', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#B8860B', fontSize: '1.2rem', textAlign: 'center' }}>✨ Remove Ads & Go Pro ✨</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', textAlign: 'center' }}>
                {t('profile.proUpgradeDesc')}
              </p>
              
              {offerings?.availablePackages?.map((pkg) => (
                <button 
                  key={pkg.identifier}
                  onClick={async () => {
                    const success = await purchasePackage(pkg);
                    if (success) alert(t('profile.proThankYou'));
                  }}
                  className={styles.saveBtn} 
                  style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', marginBottom: '10px', fontWeight: 'bold' }}
                >
                  {t('profile.buyPkg')} {pkg.product.title} - {pkg.product.priceString}
                </button>
              ))}
              
              {!offerings && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('profile.loadingOffers')}</p>
              )}
              
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '15px' }}>
                <p style={{ fontSize: '0.8rem', textAlign: 'center', marginBottom: '8px', color: 'var(--text-muted)' }}>{t('profile.havePromo') || 'Ai un cod promoțional?'}</p>
                <form onSubmit={handleRedeemCode} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder={t('profile.codePlaceholder') || 'CODE'} 
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    className={styles.input}
                    style={{ flex: 1, textTransform: 'uppercase', marginBottom: 0 }}
                  />
                  <button 
                    type="submit" 
                    disabled={isRedeeming}
                    style={{ background: 'var(--color-rose)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold' }}
                  >
                    {isRedeeming ? '...' : (t('profile.apply') || 'Aplică')}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'contact' && (
      <div className={`${styles.card} animate-scale-in`} style={{ marginBottom: '20px' }}>
        <h3 style={{ textAlign: 'center' }}>{t('profile.supportTitle')}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {t('profile.supportDesc')}
        </p>

        <a href="mailto:contact@couplehub.io" className={styles.contactBtn}>
          {t('profile.contactEmail')}
        </a>
        <a href="https://couplehub-marketing.web.app" target="_blank" rel="noreferrer" className={styles.contactBtn} style={{ background: 'var(--color-purple)' }}>
          {t('profile.contactWebsite')}
        </a>
      </div>
      )}

      {activeTab === 'couple' && (
      <div className={`${styles.card} animate-scale-in`} style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>{t('profile.tabCouple') || 'Detalii Cuplu'}</h3>
        
        <div className={styles.settingsList} style={{ marginBottom: '20px' }}>
          {userData?.pairKey && (
            <div className={styles.settingsItem} style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div className={styles.settingsIcon} style={{ background: 'var(--color-rose)' }}>🔑</div>
              <div className={styles.settingsInfo}>
                <span className={styles.settingsLabel}>{t('login.yourKey')}</span>
                <span className={styles.settingsValue} style={{ letterSpacing: '2px', fontWeight: 'bold' }}>{userData.pairKey}</span>
              </div>
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label htmlFor="anniversaryDate">{t('profile.anniversaryLabel')}</label>
            <input 
              type="date" 
              id="anniversaryDate" 
              name="anniversaryDate" 
              value={formData.anniversaryDate} 
              onChange={handleInputChange} 
              className={styles.input} 
            />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? <span className={styles.loadingSpinner} /> : `${t('profile.save')} 💕`}
          </button>
        </form>

        <div className={styles.logoutSection} style={{ marginTop: '40px' }}>
          <button 
            className={styles.logoutBtn} 
            disabled={isBreakingUp}
            onClick={() => setShowBreakupConfirm(true)}
            style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', fontWeight: 'bold', width: '100%', opacity: isBreakingUp ? 0.5 : 1 }}
          >
            {isBreakingUp ? (t('common.processing') || 'Se procesează...') : (t('profile.breakUpBtn') || 'Despărțire')}
          </button>
        </div>
      </div>
      )}

      {/* Breakup Confirmation Modal */}
      {showBreakupConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowBreakupConfirm(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#e74c3c', marginTop: 0 }}>{t('profile.breakUpBtn') || 'Despărțire'}</h3>
            <p>{t('profile.breakUpConfirm') || 'Ești sigur că vrei să te desparți? 🥺💔'}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => setShowBreakupConfirm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', background: 'var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold' }}
              >
                {t('common.cancel') || 'Anulare'}
              </button>
              <button 
                onClick={async () => {
                  try {
                    setIsBreakingUp(true);
                    await breakUp();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsBreakingUp(false);
                    setShowBreakupConfirm(false);
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', background: '#e74c3c', color: 'white', fontWeight: 'bold' }}
              >
                {isBreakingUp ? '...' : (t('common.confirm') || 'Confirmă')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Logout Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => {
            if(window.confirm(t('profile.logoutConfirm'))) {
              logout();
            }
          }}
          style={{ background: 'transparent', color: '#e74c3c', border: 'none', fontWeight: 'bold', textDecoration: 'underline', fontSize: '1rem', cursor: 'pointer', padding: '10px' }}
        >
          {t('profile.logoutBtn')}
        </button>
      </div>

      {/* Version Checker */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '30px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>{t('profile.appVersion')}: <strong>{localVersion}</strong></p>
        
        {latestVersion && latestVersion !== localVersion && (
          <div style={{ marginTop: '15px', background: 'var(--color-rose-pale)', padding: '15px', borderRadius: '12px', border: '1px solid var(--color-rose)' }}>
            <p style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
              ⚠️ {t('profile.newVersionAvailable')} ({latestVersion})!
            </p>
            {downloadUrl && (
              <a href={downloadUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--color-rose-dark)', color: 'white', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {t('profile.downloadUpdate')}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
