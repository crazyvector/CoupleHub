import { useState, useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useDatabase';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ role }) {
  const { logout, updatePassword } = useAuth();
  const { profile, updateProfile, loading } = useProfiles(role);
  
  const [passwordData, setPasswordData] = useState({ newPass: '', confirmPass: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  
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

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || (role === 'her' ? 'Ana' : 'Andrei'),
        nickname: profile.nickname || '',
        age: profile.age || '',
        favoriteColor: profile.favoriteColor || '#ffb5c8',
        bio: profile.bio || ''
      });
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile, role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const base64Url = await resizeImage(file, 800, 0.6); // Compress to 800px width, 60% quality
      setAvatarUrl(base64Url);
      await updateProfile({ avatarUrl: base64Url });
      alert("Imaginea a fost salvată cu succes! 💕");
    } catch (error) {
      console.error("Eroare la upload:", error);
      alert("A apărut o eroare la încărcarea imaginii. Posibil fișierul este prea mare sau corupt.");
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
    if (passwordData.newPass !== passwordData.confirmPass) {
      alert("Parolele nu coincid!");
      return;
    }
    if (passwordData.newPass.length < 4) {
      alert("Parola trebuie să aibă minim 4 caractere.");
      return;
    }
    setIsChangingPass(true);
    const success = await updatePassword(passwordData.newPass);
    if (success) {
      alert("Parolă schimbată cu succes! Te rugăm să folosești noua parolă data viitoare.");
      setPasswordData({ newPass: '', confirmPass: '' });
    } else {
      alert("Eroare la schimbarea parolei.");
    }
    setIsChangingPass(false);
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
        <h1 className={styles.title}>Profilul Tău</h1>
        <p className={styles.subtitle}>Personalizează-ți colțul tău din aplicație</p>
        <div style={{ marginTop: '10px', background: '#eee', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${completion}%`, background: 'var(--color-rose-dark)', height: '100%', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '5px' }}>{completion}% completat</p>
      </header>

      <div className={`${styles.card} animate-scale-in`}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {isUploading ? (
              <span className={styles.loadingSpinner} style={{ borderColor: 'var(--color-rose)' }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarPlaceholder}>{role === 'her' ? '👩' : '👨'}</span>
            )}
          </div>
          {isUploading && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Se încarcă (poate dura puțin)...</p>}
          
          <label className={styles.uploadLabel}>
            📷 Schimbă poza
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
            <label htmlFor="name">Nume real</label>
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
            <label htmlFor="nickname">Alint (cum vrei să te strig?)</label>
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
            <label htmlFor="age">Data nașterii</label>
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
            <label htmlFor="favoriteColor">Culoarea preferată</label>
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
            <label htmlFor="bio">Bio / Un gând drăguț</label>
            <textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleInputChange} 
              className={styles.textarea} 
              placeholder="Ceva drăguț despre tine..." 
            />
          </div>

          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? <span className={styles.loadingSpinner} /> : 'Salvează Modificările 💕'}
          </button>
        </form>
      </div>

      <div className={`${styles.card} animate-scale-in`} style={{ marginTop: '20px' }}>
        <h3>Schimbă Parola 🔐</h3>
        <form className={styles.form} onSubmit={handleChangePassword}>
          <div className={styles.field}>
            <label>Parolă nouă</label>
            <input 
              type="password" 
              value={passwordData.newPass}
              onChange={e => setPasswordData({...passwordData, newPass: e.target.value})}
              className={styles.input}
              placeholder="Noua parolă"
            />
          </div>
          <div className={styles.field}>
            <label>Confirmă parolă nouă</label>
            <input 
              type="password" 
              value={passwordData.confirmPass}
              onChange={e => setPasswordData({...passwordData, confirmPass: e.target.value})}
              className={styles.input}
              placeholder="Repetă noua parolă"
            />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={isChangingPass}>
            {isChangingPass ? <span className={styles.loadingSpinner} /> : 'Schimbă Parola'}
          </button>
        </form>
      </div>

      <div className={styles.logoutSection}>
        <button className={styles.logoutBtn} onClick={logout}>
          Deconectare
        </button>
      </div>
    </div>
  );
}
