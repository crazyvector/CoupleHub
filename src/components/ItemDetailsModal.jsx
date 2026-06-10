import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ItemDetailsModal.module.css';

export default function ItemDetailsModal({ item, onClose, role, onAddComment, onSetLike, onDelete, onEdit }) {
  const { t } = useLanguage();

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
              {t('homePlanner.openProductLink')}
            </a>
          )}

          <div className={styles.tagsContainer}>
            {item.tags?.map(t => (
              <span key={t} className={styles.tag}>#{t}</span>
            ))}
          </div>

          <div className={styles.approvalSection}>
            <p className={styles.approvalTitle}>{t('homePlanner.yourOpinion')}</p>
            <div className={styles.statusRow}>
              <span>{t('homePlanner.you')} {hasMyLike ? t('homePlanner.approved') : hasMyDislike ? t('homePlanner.rejected') : t('homePlanner.waitingDecision')}</span>
              <span>{t('homePlanner.partner')} {partnerLike === true ? t('homePlanner.approved') : partnerLike === false ? t('homePlanner.rejected') : t('homePlanner.waitingDecision')}</span>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionBtn} ${hasMyDislike ? styles.activeDislike : ''}`}
                onClick={() => onSetLike(item.id, role, false)}
              >
                {t('homePlanner.dislike')}
              </button>
              <button 
                className={`${styles.actionBtn} ${hasMyLike ? styles.activeLike : ''}`}
                onClick={() => onSetLike(item.id, role, true)}
              >
                {t('homePlanner.perfect')}
              </button>
            </div>
            
            {role === item.addedBy && (
              <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                <button className={styles.editBtn} onClick={() => { onClose(); onEdit(item); }}>{t('homePlanner.edit')}</button>
                <button className={styles.deleteBtn} onClick={() => {
                  if(window.confirm(t('homePlanner.confirmDelete'))) {
                    onDelete(item.id);
                    onClose();
                  }
                }}>{t('homePlanner.deleteIdea')}</button>
              </div>
            )}
          </div>

          <div className={styles.chatSection}>
            <h3 className={styles.chatTitle}>{t('homePlanner.discussions')} ({item.comments?.length || 0})</h3>
            <div className={styles.chatBox}>
              {item.comments?.length > 0 ? (
                item.comments.map((c, idx) => (
                  <div key={idx} className={`${styles.chatMsg} ${c.sender === role ? styles.myMsg : styles.partnerMsg}`}>
                    <span className={styles.msgSender}>{c.sender === 'his' ? '🧔‍♂️' : '👩‍🦰'}</span>
                    <span className={styles.msgText}>{c.text}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noComments}>{t('homePlanner.noComments')}</p>
              )}
            </div>

            <div className={styles.chatInputArea}>
              <input 
                type="text" 
                placeholder={t('homePlanner.writeComment')} 
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
