import { useState, useEffect } from 'react';

import { useGlobalAuth } from '../contexts/AuthContext';
import { useProfiles, useAppVersion } from '../hooks/useDatabase';
import { useMonetization } from '../hooks/useMonetization';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ProfilePage.module.css';

import { encryptText, decryptText } from '../hooks/useCrypto';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfilePage({ role }) {
  const { logout, breakUp, gender, userData, changeUserPassword } = useGlobalAuth();
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
        <div style={{ marginTop: '10px', background: '#eee', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${completion}%`, background: 'var(--color-rose-dark)', height: '100%', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '5px' }}>{completion}% {t('profile.completed')}</p>
      </header>

      <div className={`${styles.card} animate-scale-in`}>
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

          <div className={styles.field}>
            <label htmlFor="language">{t('profile.lang')}</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className={styles.input}
            >
              <option value="ro">{t('profile.roLang')}</option>
              <option value="en">{t('profile.enLang')}</option>
            </select>
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

      <div className={`${styles.card} animate-scale-in`} style={{ marginTop: '20px' }}>
        <h3>{t('profile.yourAccount')}</h3>
        
        {userData?.pairKey && (
          <div style={{ background: 'var(--surface-color)', padding: '15px', borderRadius: '12px', border: '1px dashed var(--color-rose)', textAlign: 'center', marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('login.yourKey')}</p>
            <h2 style={{ margin: 0, letterSpacing: '4px', color: 'var(--color-rose)' }}>{userData.pairKey}</h2>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,181,200,0.1)', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--color-rose-dark)' }}>{t('profile.changePass')}</h4>
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
          <button type="submit" disabled={isChangingPass} className={styles.saveBtn} style={{ background: 'var(--color-rose-dark)' }}>
            {isChangingPass ? <span className={styles.loadingSpinner} /> : t('profile.saveNewPass')}
          </button>
        </form>

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

      <div className={styles.logoutSection}>
        {/* Removed logout description as requested */}
        <button 
          className={styles.logoutBtn} 
          onClick={() => {
            if(window.confirm(t('profile.logoutConfirm'))) {
              logout();
            }
          }}
          style={{ background: '#e74c3c', color: 'white', fontWeight: 'bold' }}
        >
          {t('profile.logoutBtn')}
        </button>
        <button 
          className={styles.logoutBtn} 
          disabled={loading}
          onClick={() => setShowBreakupConfirm(true)}
          style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', fontWeight: 'bold', marginTop: '10px', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? (t('common.processing') || 'Se procesează...') : (t('profile.breakUpBtn') || 'Despărțire')}
        </button>
      </div>

      {/* Breakup Confirmation Modal */}
      {showBreakupConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowBreakupConfirm(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#e74c3c', marginTop: 0 }}>{t('profile.breakUpBtn') || 'Despărțire'}</h3>
            <p>{t('profile.breakUpConfirm') || 'Ești sigur că vrei să te desparți? 🥺💔'}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => setShowBreakupConfirm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', background: '#f0f0f0', color: '#333', fontWeight: 'bold' }}
              >
                {t('common.cancel') || 'Anulare'}
              </button>
              <button 
                onClick={async () => {
                  setShowBreakupConfirm(false);
                  try {
                    setLoading(true);
                    await breakUp();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', background: '#e74c3c', color: 'white', fontWeight: 'bold' }}
              >
                {t('common.confirm') || 'Confirmă'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Version Checker */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '30px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>{t('profile.appVersion')}: <strong>{localVersion}</strong></p>
        
        {latestVersion && latestVersion !== localVersion && (
          <div style={{ marginTop: '15px', background: '#FFF0F5', padding: '15px', borderRadius: '12px', border: '1px solid #FFB5C8' }}>
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
