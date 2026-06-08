import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup as LeafletPopup, useMap, useMapEvents } from 'react-leaflet';
import { useMemories, useProfiles } from '../hooks/useDatabase';
import { useMonetization } from '../hooks/useMonetization';
import { useLanguage } from '../contexts/LanguageContext';
import L from 'leaflet';
import styles from './MemoriesPage.module.css';
import 'leaflet/dist/leaflet.css';

// ============================================================
// Harta Leaflet - Configurare
// ============================================================
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '© OpenStreetMap contributors © CARTO';

function createCustomIcon(emoji, color) {
  const svgPin = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      <ellipse cx="22" cy="49" rx="8" ry="3" fill="rgba(0,0,0,0.12)"/>
      <path d="M22 2C13.16 2 6 9.16 6 18c0 12.5 16 32 16 32s16-19.5 16-32C38 9.16 30.84 2 22 2z"
        fill="${color}" filter="url(#shadow)"/>
      <circle cx="22" cy="18" r="11" fill="white" opacity="0.95"/>
      <text x="22" y="23" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>
  `;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPin)}`,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -54]
  });
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function MapBounds({ memories }) {
  const map = useMap();
  useEffect(() => {
    const validCoords = memories.filter(m => m.coordinates && m.coordinates.length === 2).map(m => m.coordinates);
    if (validCoords.length > 1) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50] });
    }
  }, [memories, map]);
  return null;
}

function MemoryMap({ memories, onPinClick, onMapClick }) {
  const center = memories.length > 0 && memories[0].coordinates 
    ? memories[0].coordinates 
    : [44.4268, 26.1025]; // Bucuresti fallback

  const pinColors = ['#FFB5C8', '#C8B6FF', '#FFCBA4', '#B5EAD7', '#B5D8EB'];

  return (
    <div className={styles.mapWrapper}>
      <MapContainer 
        center={center} 
        zoom={memories.length === 1 ? 13 : 7} 
        className={styles.mapContainer}
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        {memories.map((m, idx) => {
          if (!m.coordinates || m.coordinates.length < 2) return null;
          return (
            <Marker 
              key={m.id} 
              position={m.coordinates} 
              icon={createCustomIcon(m.emoji || '📍', pinColors[idx % pinColors.length])}
              eventHandlers={{ click: () => onPinClick(m) }}
            />
          );
        })}
        <MapEvents onMapClick={onMapClick} />
        <MapBounds memories={memories} />
      </MapContainer>
    </div>
  );
}

// ============================================================
// Popup Amintire
// ============================================================
function MemoryPopup({ memory, onClose, onAddReaction, onDeleteMemory, onEditMemory, role, myName, partnerName }) {
  const [newReaction, setNewReaction] = useState('');
  const { t } = useLanguage();
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const handleReaction = () => {
    if (newReaction.trim()) {
      onAddReaction(memory.id, { text: newReaction, sender: role, date: new Date().toISOString() });
      setNewReaction('');
    }
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={`${styles.popup} animate-scale-in`} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button className={styles.popupClose} onClick={onClose} style={{ position: 'relative', top: 0, right: 0 }}>✕</button>
          <div>
            <button onClick={() => onEditMemory && onEditMemory(memory)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '10px' }}>✏️</button>
            <button onClick={() => onDeleteMemory(memory)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#ff4d4d', padding: '10px' }}>🗑️</button>
          </div>
        </div>
        <div className={`${styles.popupEmoji} animate-bounce-in`}>{memory.emoji}</div>
        
        {memory.imagePath && (
          <div className={styles.popupImageWrapper}>
            <img src={memory.imagePath} alt={memory.title} className={styles.popupImage} loading="lazy" />
          </div>
        )}
        
        <div className={styles.popupContent}>
          <span className={styles.popupDate}>📅 {memory.date}</span>
          <h3 className={styles.popupTitle}>{memory.title}</h3>
          <p className={styles.popupDescription}>{memory.description}</p>
        </div>

        {memory.coordinates && memory.coordinates.length === 2 && (
          <a className={styles.popupMapLink} href={`https://www.google.com/maps/search/?api=1&query=${memory.coordinates[0]},${memory.coordinates[1]}`} target="_blank" rel="noreferrer">
            {t('memories.openMap')}
          </a>
        )}

        <div className={styles.reactionsSection}>
          <h4>{t('memories.commentsReactions')}</h4>
          <div className={styles.reactionsList}>
            {(memory.reactions || []).map((r, i) => (
              <div key={i} className={styles.reactionItem} style={{ marginBottom: '8px', background: 'rgba(255,181,200,0.1)', padding: '8px', borderRadius: '8px' }}>
                <strong>{r.sender === role ? myName : r.sender === 'admin' ? 'Admin' : partnerName}: </strong>
                {r.text}
              </div>
            ))}
          </div>
          <div className={styles.addReaction}>
            <input 
              type="text" 
              value={newReaction} 
              onChange={e => setNewReaction(e.target.value)} 
              placeholder={t('memories.addReactionPlaceholder')} 
              className={styles.reactionInput}
            />
            <button onClick={handleReaction} className={styles.reactionBtn}>{t('memories.send')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Formular adăugare Amintire / Poză (cu Geocoding by City)
// ============================================================
function AddMemoryForm({ onSave, onCancel, onUploadFile, initialCoords, mode = 'memory', initialData = null }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ 
    title: initialData?.title || '', 
    description: initialData?.description || '', 
    date: initialData?.date || '', 
    emoji: initialData?.emoji || '📍', 
    cityName: '' 
  });
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const geocodeCity = async (cityName) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    return null;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'photo' && !file && !initialData?.imagePath) {
      alert(t('memories.pleaseAddPhoto'));
      return;
    }
    setIsSaving(true);

    let coords = initialCoords || initialData?.coordinates;

    if (mode === 'memory' && !coords) {
      alert(t('memories.pleaseClickMap'));
      setIsSaving(false);
      return;
    }

    let imagePath = initialData?.imagePath || null;
    let imageSize = initialData?.imageSize || 0;
    if (file) {
      try {
        const base64Url = await resizeImage(file, 600, 0.5); // smaller for firestore
        imagePath = base64Url;
        imageSize = Math.round(base64Url.length * 0.75); // approx size in bytes
      } catch (err) {
        alert(t('memories.errorImage'));
        setIsSaving(false);
        return;
      }
    }

    await onSave({ 
      title: formData.title || (mode === 'photo' ? t('memories.newPhoto') : ''), 
      description: formData.description || '', 
      date: formData.date || new Date().toISOString().split('T')[0], 
      emoji: formData.emoji || '📍',
      imagePath, 
      imageSize,
      coordinates: coords || null
    });
    setIsSaving(false);
  };

  return (
    <div className={styles.popupOverlay} style={{ zIndex: 9999 }}>
      <form className={`${styles.popup} animate-scale-in`} onSubmit={handleSubmit} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>{initialData ? t('memories.editMemory') : (mode === 'photo' ? t('memories.addPhotoGallery') : t('memories.addMemoryNew'))}</h3>
        
        {initialCoords && mode === 'memory' && <p style={{ fontSize: '0.8rem', color: '#666' }}>{t('memories.locSelected')}</p>}
        {initialData && mode === 'memory' && !initialCoords && <p style={{ fontSize: '0.8rem', color: '#666' }}>{t('memories.locKept')}</p>}
        
        {mode === 'memory' && (
          <>
            <input required type="text" placeholder={t('memories.titlePlaceholder')} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={styles.input} />
            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={styles.input} />
            <textarea required placeholder={t('memories.descPlaceholder')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
            <input required type="text" placeholder={t('memories.emojiPlaceholder')} value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} className={styles.input} />
          </>
        )}

        <label className={styles.uploadLabel}>
          {file ? t('memories.changeSelectedPhoto') : (initialData?.imagePath ? t('memories.replaceCurrentPhoto') : t('memories.selectPhoto'))}
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className={styles.uploadInput} />
        </label>
        {file && <span className={styles.fileName}>{file.name}</span>}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '8px' }}>{t('memories.cancel')}</button>
          <button type="submit" disabled={isSaving || (mode === 'photo' && !file && !initialData?.imagePath)} className={styles.saveBtn} style={{ flex: 1, padding: '10px', background: 'var(--color-rose)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            {isSaving ? t('memories.saving') : (initialData ? t('memories.save') : t('memories.add'))}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Galerie Foto (Grid)
// ============================================================
function PhotoGallery({ memories, onPhotoClick, onAddPhoto, onDeletePhoto }) {
  const { t } = useLanguage();
  const photos = memories.filter(m => m.imagePath && m.title === (t('memories.newPhoto') || 'Poză nouă')); // SAU simplu doar cu poze care n-au coordonate

  return (
    <div style={{ paddingBottom: '20px', marginTop: '30px' }}>
      <h2 style={{fontSize: '1.2rem', marginBottom: '10px'}}>{t('memories.photoGallery')}</h2>
      <button className={styles.addBtn} onClick={onAddPhoto} style={{ marginBottom: '15px' }}>
        {t('memories.addOnlyPhoto')}
      </button>
      
      {photos.length === 0 ? (
        <div className={styles.emptyState}>
          <span style={{ fontSize: '3rem' }}>📸</span>
          <p>{t('memories.noPhotosYet')}</p>
        </div>
      ) : (
        <div className={styles.photoGrid}>
          {photos.map(m => (
            <div key={m.id} className={styles.photoThumbWrapper} onClick={() => onPhotoClick(m)}>
              <img src={m.imagePath} alt={m.title} className={styles.photoThumb} loading="lazy" />
              <div className={styles.photoOverlay}>
                <span className={styles.photoOverlayTitle}>{m.title}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '4px' }}>
                  <div className={styles.photoOverlayReactions}>💬 {(m.reactions || []).length}</div>
                  <button onClick={(e) => { e.stopPropagation(); onDeletePhoto(m); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#ff4d4d' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MemoriesPage — pagina principală
// ============================================================
export default function MemoriesPage({ role }) {
  const [activeTab, setActiveTab] = useState('map');
  const { memories, addMemory, updateMemory, addReaction, deleteMemory, loading } = useMemories();
  const { profile: myProfile } = useProfiles(role);
  const targetRole = role === 'her' ? 'his' : 'her';
  const { profile: targetProfile } = useProfiles(targetRole);
  const { t } = useLanguage();
  const { isPro } = useMonetization();

  const myName = myProfile?.name || (role === 'her' ? 'Ana' : 'Andrei');
  const partnerName = targetProfile?.name || (targetRole === 'her' ? 'Ana' : 'Andrei');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('memory'); // 'memory' sau 'photo'
  const [newCoords, setNewCoords] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null); // New state for editing

  if (loading) return <div className={styles.page}>{t('memories.loadingMemories')}</div>;

  // Map click
  const handleMapClick = (coords) => {
    if (!isPro && memories.length >= 10) {
      alert("Ai atins limita de 10 amintiri gratuite! Treci la Premium pentru stocare nelimitată. Poți adăuga un cod promoțional în setările profilului.");
      return;
    }
    setEditingMemory(null);
    setNewCoords(coords);
    setAddMode('memory');
    setShowAddModal(true);
  };

  const handleSaveMemory = async (data) => {
    if (editingMemory) {
      await updateMemory(editingMemory.id, data);
      setEditingMemory(null);
    } else {
      await addMemory(data);
    }
    setShowAddModal(false);
    setNewCoords(null);
  };

  const handleDeleteMemory = async (memory) => {
    if (window.confirm(t('memories.confirmDelete'))) {
      await deleteMemory(memory.id);
      setSelectedMemory(null);
    }
  };

  const memoriesWithCoords = memories.filter(m => m.coordinates && m.coordinates.length === 2);

  return (
    <div className={styles.page}>
      {selectedMemory && (
        <MemoryPopup 
          memory={selectedMemory} 
          onClose={() => setSelectedMemory(null)} 
          onAddReaction={addReaction} 
          onDeleteMemory={(memory) => { handleDeleteMemory(memory); setSelectedMemory(null); }} 
          onEditMemory={(memory) => { setEditingMemory(memory); setSelectedMemory(null); setShowAddModal(true); }}
          role={role}
          myName={myName}
          partnerName={partnerName}
        />
      )}
      {showAddModal && (
          <AddMemoryForm 
          onSave={handleSaveMemory} 
          onCancel={() => { setShowAddModal(false); setNewCoords(null); setEditingMemory(null); }} 
          initialCoords={newCoords} 
          mode={editingMemory ? (editingMemory.coordinates ? 'memory' : 'photo') : addMode}
          initialData={editingMemory}
        />
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>{t('memories.ourMemories')}</h1>
        <p className={styles.subtitle}>{t('memories.specialPlaces')}</p>
      </header>

      <div className={styles.tabContent}>
        {/* MAP SECTION */}
        <div className="animate-fade-in" style={{marginBottom: '20px'}}>
          <MemoryMap memories={memoriesWithCoords} onPinClick={setSelectedMemory} onMapClick={handleMapClick} />
          <p className={styles.mapHint} style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
            {t('memories.mapHint')}
          </p>
        </div>
        
        {/* MEMORIES LIST SECTION */}
        <div className={`${styles.listContainer} animate-fade-in`}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '10px'}}>{t('memories.savedLocations')}</h2>
          {memoriesWithCoords.map((m, idx) => {
            const colors = ['#FFB5C8', '#C8B6FF', '#FFCBA4', '#B5EAD7', '#B5D8EB'];
            const color = colors[idx % colors.length];
            return (
              <button key={m.id} className={styles.memoryCard} style={{ '--card-color': color }} onClick={() => setSelectedMemory(m)}>
                <div className={styles.memoryCardLeft} style={{ background: `${color}25` }}>
                  <span className={styles.memoryCardEmoji}>{m.emoji}</span>
                </div>
                <div className={styles.memoryCardContent}>
                  <span className={styles.memoryCardDate}>{m.date}</span>
                  <h3 className={styles.memoryCardTitle}>{m.title}</h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteMemory(m); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#ff4d4d', marginRight: '10px' }}>🗑️</button>
                <div className={styles.memoryCardArrow} style={{ color }}>›</div>
              </button>
            );
          })}
          {memoriesWithCoords.length === 0 && <p className={styles.emptyState}>{t('memories.noMemoriesOnMap')}</p>}
        </div>

        {/* GALLERY SECTION */}
        <div className="animate-fade-in">
          <PhotoGallery 
            memories={memories} 
            onPhotoClick={setSelectedMemory} 
            onAddPhoto={() => { 
              if (!isPro && memories.length >= 10) {
                alert("Ai atins limita de 10 amintiri gratuite! Treci la Premium pentru stocare nelimitată.");
                return;
              }
              setEditingMemory(null); 
              setAddMode('photo'); 
              setShowAddModal(true); 
            }}
            onDeletePhoto={handleDeleteMemory}
          />
        </div>
      </div>
    </div>
  );
}
