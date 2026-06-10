import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './AddHomeItemModal.module.css';

const getRooms = (t) => [
  { id: 'bucatarie', label: t('homePlanner.kitchen'), icon: '🍳' },
  { id: 'living', label: t('homePlanner.living'), icon: '🛋️' },
  { id: 'dormitor', label: t('homePlanner.bedroom'), icon: '🛏️' },
  { id: 'baie', label: t('homePlanner.bathroom'), icon: '🛁' },
  { id: 'balcon', label: t('homePlanner.balcony'), icon: '🪴' },
  { id: 'hol', label: t('homePlanner.hallway'), icon: '🚪' },
  { id: 'pod', label: t('homePlanner.attic'), icon: '🪜' },
  { id: 'birou', label: t('homePlanner.office'), icon: '💻' },
  { id: 'idei_cautate', label: t('homePlanner.freeSearches'), icon: '🔍' }
];

const getPredefinedTags = (t) => [
  t('homePlanner.tags.furniture'), 
  t('homePlanner.tags.technology'), 
  t('homePlanner.tags.finishes'), 
  t('homePlanner.tags.decorations'), 
  t('homePlanner.tags.accessories'), 
  t('homePlanner.tags.lighting'), 
  t('homePlanner.tags.inspiration')
];

export default function AddHomeItemModal({ onClose, onSave, role, initialData = {} }) {
  const { t } = useLanguage();
  
  const ROOMS = getRooms(t);
  const PREDEFINED_TAGS = getPredefinedTags(t);

  const [title, setTitle] = useState(initialData.title || '');
  const [link, setLink] = useState(initialData.link || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || '');
  const [price, setPrice] = useState(initialData.price || '');
  const [room, setRoom] = useState(initialData.room || 'living');
  const [tags, setTags] = useState(initialData.tags || []);
  const [isUploading, setIsUploading] = useState(false);

  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim().toLowerCase())) {
      setTags([...tags, customTag.trim().toLowerCase()]);
      setCustomTag('');
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

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert(t('homePlanner.pleaseAddTitle'));
      return;
    }
    
    setIsUploading(true);
    let finalImageUrl = imagePreview; // might be initial data if no new file

    if (imageFile) {
      try {
        finalImageUrl = await resizeImage(imageFile, 800, 0.6);
      } catch (err) {
        console.error("Eroare la procesarea imaginii:", err);
        alert(t('homePlanner.imageProcessError'));
        finalImageUrl = '';
      }
    }

    try {
      await onSave({
        title,
        link,
        imageUrl: finalImageUrl,
        price,
        room,
        tags,
        addedBy: role
      });
    } catch (e) {
      console.error("Save error:", e);
      alert(t('homePlanner.saveError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 className={styles.title}>{t('homePlanner.addNewIdea')}</h2>
        
        <div className={styles.formGroup}>
          <label>{t('homePlanner.nameLabel')}</label>
          <input 
            type="text" 
            placeholder={t('homePlanner.namePlaceholder')} 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label>{t('homePlanner.roomLabel')}</label>
          <select value={room} onChange={e => setRoom(e.target.value)}>
            {ROOMS.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{t('homePlanner.linkLabel')}</label>
          <input 
            type="url" 
            placeholder="https://..." 
            value={link} 
            onChange={e => setLink(e.target.value)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label>{t('homePlanner.imageLabel')}</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange} 
            className={styles.fileInput}
          />
          {imagePreview && <img src={imagePreview} alt="Preview" className={styles.previewImg} />}
        </div>

        <div className={styles.formGroup}>
          <label>{t('homePlanner.priceLabel')}</label>
          <input 
            type="text" 
            placeholder={t('homePlanner.pricePlaceholder')} 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label>{t('homePlanner.tagsLabel')}</label>
          <div className={styles.tagsContainer}>
            {PREDEFINED_TAGS.map(t => (
              <span 
                key={t} 
                className={`${styles.tag} ${tags.includes(t) ? styles.active : ''}`}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </span>
            ))}
            {tags.filter(t => !PREDEFINED_TAGS.includes(t)).map(t => (
              <span 
                key={t} 
                className={`${styles.tag} ${styles.active}`}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder={t('homePlanner.newTagPlaceholder')} 
              value={customTag} 
              onChange={e => setCustomTag(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleAddCustomTag()}
            />
            <button className={styles.addTagBtn} onClick={handleAddCustomTag}>+</button>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave} disabled={isUploading}>
          {isUploading ? t('common.loading') : t('homePlanner.saveIdea')}
        </button>
      </div>
    </div>
  );
}
