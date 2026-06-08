import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat, useProfiles } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './MessagesPage.module.css';
import TextareaAutosize from 'react-textarea-autosize';
import { stickerPacks } from '../utils/stickers';

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const DEFAULT_AVATAR_HIS = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrei&backgroundColor=b6e3f4';
const DEFAULT_AVATAR_HER = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=ffdfbf';

export default function MessagesPage({ role }) {
  const navigate = useNavigate();
  const { messages, partnerTyping, sendMessage, sendSticker, setTyping, markAsRead, setReaction, loading } = useChat(role);
  const { t } = useLanguage();
  
  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: myProfile } = useProfiles(role);
  const { profile: partnerProfile } = useProfiles(partnerRole);

  const [text, setText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState(stickerPacks[0].id);
  
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Scroll la ultimul mesaj automat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Marchează mesajele primite ca citite când deschidem pagina
  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
    setIsStickerDrawerOpen(false);
  };

  const handleSendSticker = async (url) => {
    await sendSticker(url);
    setIsStickerDrawerOpen(false);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Throttle la isTyping
    if (!typingTimeoutRef.current) {
      setTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  // Long press logic
  const handleTouchStart = (msgId) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageId(msgId);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleReactionSelect = async (emoji) => {
    if (selectedMessageId) {
      await setReaction(selectedMessageId, emoji);
    }
    setSelectedMessageId(null);
  };

  const partnerName = partnerProfile?.name || (role === 'his' ? 'Ana' : 'Andrei');

  if (loading) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>{t('messages.loading')}</p>
      </div>
    );
  }

  // Verificăm care a fost ultimul mesaj trimis de mine pentru a pune "Seen" sub el
  const myMessages = messages.filter(m => m.sender === role);
  const lastMyMessageId = myMessages.length > 0 ? myMessages[myMessages.length - 1].id : null;
  const lastMyMessageIsRead = myMessages.length > 0 ? myMessages[myMessages.length - 1].read : false;

  return (
    <div className={`${styles.page} animate-fade-in`}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', flexShrink: 0, padding: 0}} aria-label={t('messages.back')}>
          ←
        </button>
        <h1 className={styles.title} onClick={() => setShowPartnerProfile(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={partnerProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HER : DEFAULT_AVATAR_HIS)} 
            alt={partnerName} 
            className={styles.headerAvatar} 
          />
          {partnerProfile?.nickname || partnerName}
        </h1>
      </header>

      <div className={styles.chatContainer}>
        {messages.map((msg) => {
          const isMine = msg.sender === role;
          const showSeen = isMine && msg.id === lastMyMessageId && msg.read;
          let seenText = t('messages.seen');
          if (showSeen && msg.readAt) {
            seenText = `${t('messages.seenAt')}${new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          }

          const msgAvatarUrl = isMine 
            ? (myProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HIS : DEFAULT_AVATAR_HER))
            : (partnerProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HER : DEFAULT_AVATAR_HIS));

          return (
            <div 
              key={msg.id} 
              className={`${styles.messageRow} ${isMine ? styles.messageRowMine : styles.messageRowTheirs}`}
            >
              <div className={styles.bubbleWrapper} style={{ flexDirection: isMine ? 'row-reverse' : 'row' }}>
                <img src={msgAvatarUrl} alt="avatar" className={styles.messageAvatar} />
                <div 
                  className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                  style={msg.type === 'sticker' ? { background: 'transparent', padding: 0, boxShadow: 'none' } : {}}
                  onTouchStart={() => handleTouchStart(msg.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(msg.id)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  {msg.type === 'sticker' ? (
                    <img src={msg.stickerUrl} alt="Sticker" className={styles.messageSticker} />
                  ) : (
                    msg.text
                  )}
                  
                  {msg.reaction && (
                    <div className={`${styles.reaction} ${isMine ? styles.reactionMine : styles.reactionTheirs}`}>
                      {msg.reaction}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginTop: '2px', marginRight: isMine ? '30px' : '0', marginLeft: !isMine ? '30px' : '0' }}>
                <span className={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {showSeen && <span className={styles.seenIndicator}>{seenText}</span>}
              </div>
            </div>
          );
        })}

        {partnerTyping && (
          <div className={styles.messageRowTheirs}>
            <div className={styles.bubbleWrapper}>
              <img 
                src={partnerProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HER : DEFAULT_AVATAR_HIS)} 
                alt={partnerName} 
                className={styles.messageAvatar} 
              />
              <div className={styles.typingIndicator} style={{ marginTop: 0 }}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            </div>
            <p className={styles.typingText} style={{ marginLeft: '30px' }}>{partnerName} {t('messages.typing')}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div style={{ position: 'relative' }}>
        {isStickerDrawerOpen && (
          <div className={`${styles.stickerDrawer} animate-slide-up`}>
            <div className={styles.stickerTabs}>
              {stickerPacks.map(pack => (
                <button 
                  key={pack.id}
                  type="button"
                  className={`${styles.stickerTab} ${activeStickerTab === pack.id ? styles.stickerTabActive : ''}`}
                  onClick={() => setActiveStickerTab(pack.id)}
                >
                  {pack.name}
                </button>
              ))}
            </div>
            <div className={styles.stickerGrid}>
              {stickerPacks.find(p => p.id === activeStickerTab)?.stickers.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Sticker" 
                  className={styles.stickerItem} 
                  onClick={() => handleSendSticker(url)}
                />
              ))}
            </div>
          </div>
        )}

        <form className={styles.inputArea} onSubmit={handleSend}>
          <button 
            type="button" 
            className={styles.stickerBtn} 
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
          >
            {isStickerDrawerOpen ? '⌨️' : '😀'}
          </button>
          
          <TextareaAutosize
          className={styles.textInput}
          placeholder={t('messages.writeMessagePlaceholder')}
          value={text}
          onChange={handleTextChange}
          maxRows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
          ➤
        </button>
      </form>
      </div>

      {/* Meniu Reacții Overlay */}
      {selectedMessageId && (
        <div className={styles.reactionOverlay} onClick={() => setSelectedMessageId(null)}>
          <div className={styles.reactionMenu} onClick={e => e.stopPropagation()}>
            {REACTIONS.map(emoji => (
              <button 
                key={emoji} 
                className={styles.reactionEmoji}
                onClick={() => handleReactionSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
            <button 
              className={styles.reactionEmoji} 
              style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}
              onClick={() => handleReactionSelect(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Profil Partener Modal */}
      {showPartnerProfile && (
        <div className={styles.partnerProfileOverlay} onClick={() => setShowPartnerProfile(false)}>
          <div className={`${styles.partnerProfileModal} animate-scale-in`} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setShowPartnerProfile(false)}>✕</button>
            <div className={styles.modalAvatarWrapper}>
              <img 
                src={partnerProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HER : DEFAULT_AVATAR_HIS)} 
                alt={partnerName} 
                className={styles.modalAvatar}
              />
            </div>
            <h2 className={styles.modalName}>{partnerProfile?.name || partnerName}</h2>
            {partnerProfile?.nickname && <p className={styles.modalNickname}>"{partnerProfile.nickname}"</p>}
            
            <div className={styles.modalDetails}>
              {partnerProfile?.age && (
                <div className={styles.modalDetailRow}>
                  <span>{t('messages.birthday')}</span>
                  <strong>{new Date(partnerProfile.age).toLocaleDateString()}</strong>
                </div>
              )}
              {partnerProfile?.favoriteColor && (
                <div className={styles.modalDetailRow}>
                  <span>{t('messages.favColor')}</span>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: partnerProfile.favoriteColor, border: '1px solid #ccc' }} />
                </div>
              )}
            </div>

            {partnerProfile?.bio && (
              <div className={styles.modalBio}>
                <p>"{partnerProfile.bio}"</p>
              </div>
            )}

            <button className={styles.backFromModalBtn} onClick={() => setShowPartnerProfile(false)}>
              {t('messages.backToChat')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
