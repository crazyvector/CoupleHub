import React, { useState } from 'react';
import styles from './ItemDetailsModal.module.css';

export default function ItemDetailsModal({ item, onClose, role, onAddComment, onSetLike, onDelete, onEdit }) {
  const [commentText, setCommentText] = useState('');
  const partnerRole = role === 'his' ? 'her' : 'his';

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    onAddComment(item.id, role, commentText);
    setCommentText('');
  };

  const hasMyLike = item.likes && item.likes[role] === true;
  const hasMyDislike = item.likes && item.likes[role] === false;
  const partnerLike = item.likes && item.likes[partnerRole];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className={styles.headerImage} />
        ) : (
          <div className={styles.noImageHeader}>No Image</div>
        )}

        <div className={styles.content}>
          <div className={styles.metaTop}>
            <span className={styles.roomTag}>{item.room}</span>
            {item.price && <span className={styles.priceTag}>{item.price}</span>}
          </div>

          <h2 className={styles.title}>{item.title}</h2>
          
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className={styles.linkBtn}>
              🔗 Deschide Link Produs
            </a>
          )}

          <div className={styles.tagsContainer}>
            {item.tags?.map(t => (
              <span key={t} className={styles.tag}>#{t}</span>
            ))}
          </div>

          <div className={styles.approvalSection}>
            <p className={styles.approvalTitle}>Părerea voastră:</p>
            <div className={styles.statusRow}>
              <span>Tu: {hasMyLike ? '✅ Aprobat' : hasMyDislike ? '❌ Respins' : '⏳ Așteaptă decizia'}</span>
              <span>Partenerul: {partnerLike === true ? '✅ Aprobat' : partnerLike === false ? '❌ Respins' : '⏳ Așteaptă decizia'}</span>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionBtn} ${hasMyDislike ? styles.activeDislike : ''}`}
                onClick={() => onSetLike(item.id, role, false)}
              >
                👎 Nu-mi place
              </button>
              <button 
                className={`${styles.actionBtn} ${hasMyLike ? styles.activeLike : ''}`}
                onClick={() => onSetLike(item.id, role, true)}
              >
                ❤️ Perfect!
              </button>
            </div>
            
            {role === item.addedBy && (
              <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                <button className={styles.editBtn} onClick={() => { onClose(); onEdit(item); }}>✏️ Editează</button>
                <button className={styles.deleteBtn} onClick={() => {
                  if(window.confirm("Sigur vrei să ștergi acest element?")) {
                    onDelete(item.id);
                    onClose();
                  }
                }}>🗑️ Șterge Ideea</button>
              </div>
            )}
          </div>

          <div className={styles.chatSection}>
            <h3 className={styles.chatTitle}>Discuții ({item.comments?.length || 0})</h3>
            <div className={styles.chatBox}>
              {item.comments?.length > 0 ? (
                item.comments.map((c, idx) => (
                  <div key={idx} className={`${styles.chatMsg} ${c.sender === role ? styles.myMsg : styles.partnerMsg}`}>
                    <span className={styles.msgSender}>{c.sender === 'his' ? '🧔‍♂️' : '👩‍🦰'}</span>
                    <span className={styles.msgText}>{c.text}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noComments}>Niciun comentariu. Începe discuția!</p>
              )}
            </div>

            <div className={styles.chatInputArea}>
              <input 
                type="text" 
                placeholder="Scrie un comentariu..." 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendComment()}
              />
              <button onClick={handleSendComment}>➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
