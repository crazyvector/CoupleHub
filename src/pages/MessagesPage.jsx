import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat, useProfiles, useChatTheme } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './MessagesPage.module.css';
import TextareaAutosize from 'react-textarea-autosize';
import { stickerPacks } from '../utils/stickers';
import ChatSettingsModal from '../components/ChatSettingsModal';

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const DEFAULT_AVATAR_HIS = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrei&backgroundColor=b6e3f4';
const DEFAULT_AVATAR_HER = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=ffdfbf';

export default function MessagesPage({ role }) {
  const navigate = useNavigate();
  const { messages, partnerTyping, sendMessage, sendSticker, setTyping, markAsRead, setReaction, loading: chatLoading } = useChat(role);
  const { chatTheme, updateChatTheme, loading: themeLoading } = useChatTheme(role);
  const { t } = useLanguage();
  
  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: myProfile } = useProfiles(role);
  const { profile: partnerProfile } = useProfiles(partnerRole);

  const [text, setText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState(stickerPacks[0].id);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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
    await sendMessage(text, replyToMsg?.id);
    setText('');
    setReplyToMsg(null);
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

  // Long press & Swipe logic
  const handleTouchStart = (e, msgId) => {
    if (e.touches && e.touches.length > 0) {
      e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
    } else if (e.clientX) {
      e.currentTarget.dataset.touchStartX = e.clientX;
    }
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageId(msgId);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e, msg) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    const startX = parseFloat(e.currentTarget.dataset.touchStartX || '0');
    let endX = startX;
    
    if (e.changedTouches && e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX;
    } else if (e.clientX) {
      endX = e.clientX;
    }

    if (Math.abs(endX - startX) > 50) {
      setReplyToMsg(msg);
    }
  };

  const handleTouchMove = () => {
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

  const handleImageUpload = async (file) => {
    try {
      const base64Url = await resizeImage(file, 800, 0.6); // Compress for background
      await updateChatTheme({ backgroundImage: base64Url, backgroundColor: 'transparent', isGradient: false });
    } catch (err) {
      console.error("Failed to upload image", err);
    }
  };

  if (chatLoading || themeLoading) {
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

  const themeStyle = chatTheme.backgroundImage
    ? { backgroundImage: `url(${chatTheme.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: chatTheme.backgroundColor };

  return (
    <div className={`${styles.page} animate-fade-in`} style={themeStyle}>
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
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', flexShrink: 0, padding: 0}}
        >
          🎨
        </button>
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
                  onTouchStart={(e) => handleTouchStart(e, msg.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, msg)}
                  onTouchMove={handleTouchMove}
                  onMouseDown={(e) => handleTouchStart(e, msg.id)}
                  onMouseUp={(e) => handleTouchEnd(e, msg)}
                  onMouseLeave={(e) => handleTouchEnd(e, msg)}
                  onDoubleClick={() => setReaction(msg.id, '❤️')}
                >
                  {msg.replyTo && (() => {
                    const repliedMsg = messages.find(m => m.id === msg.replyTo);
                    if (!repliedMsg) return null;
                    const isRepliedMine = repliedMsg.sender === role;
                    return (
                      <div className={`${styles.replyContext} ${isMine ? styles.replyContextMine : ''}`}>
                        <div className={styles.replyName}>{isRepliedMine ? (myProfile?.name || 'Eu') : partnerName}</div>
                        <div className={styles.replyText}>{repliedMsg.text || 'Sticker'}</div>
                      </div>
                    );
                  })()}
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
            <p className={styles.typingText} style={{ marginLeft: '30px', color: chatTheme.backgroundImage || chatTheme.backgroundColor !== 'var(--bg-app)' ? '#fff' : 'inherit', textShadow: chatTheme.backgroundImage ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>{partnerName} {t('chat.isTyping')}</p>
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

        <form className={styles.inputArea} onSubmit={handleSend} style={{ position: 'relative' }}>
          {replyToMsg && (
            <div className={styles.replyInputBanner} style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', zIndex: 10, borderRadius: '0' }}>
              <div className={styles.replyInputContent}>
                <span className={styles.replyName}>{replyToMsg.sender === role ? (myProfile?.name || 'Eu') : partnerName}</span>
                <span className={styles.replyText}>{replyToMsg.text || 'Sticker'}</span>
              </div>
              <button type="button" className={styles.cancelReplyBtn} onClick={() => setReplyToMsg(null)}>✕</button>
            </div>
          )}
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

      <ChatSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={chatTheme}
        onThemeSelect={updateChatTheme}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}
