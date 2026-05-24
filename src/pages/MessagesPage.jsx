import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat, useProfiles } from '../hooks/useDatabase';
import styles from './MessagesPage.module.css';
import TextareaAutosize from 'react-textarea-autosize';

const REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const DEFAULT_AVATAR_HIS = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrei&backgroundColor=b6e3f4';
const DEFAULT_AVATAR_HER = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=ffdfbf';

export default function MessagesPage({ role }) {
  const navigate = useNavigate();
  const { messages, partnerTyping, sendMessage, setTyping, markAsRead, setReaction, loading } = useChat(role);
  
  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: myProfile } = useProfiles(role);
  const { profile: partnerProfile } = useProfiles(partnerRole);

  const [text, setText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  
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

  const partnerName = role === 'his' ? 'Ana' : 'Andrei';

  if (loading) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Încărcare mesaje...</p>
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
        <button onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Înapoi">
          🔙
        </button>
        <h1 className={styles.title}>
          <img 
            src={partnerProfile?.avatarUrl || (role === 'his' ? DEFAULT_AVATAR_HER : DEFAULT_AVATAR_HIS)} 
            alt={partnerName} 
            className={styles.headerAvatar} 
          />
          {partnerName}
        </h1>
      </header>

      <div className={styles.chatContainer}>
        {messages.map((msg) => {
          const isMine = msg.sender === role;
          const showSeen = isMine && msg.id === lastMyMessageId && msg.read;
          let seenText = 'Văzut';
          if (showSeen && msg.readAt) {
            seenText = `Văzut la ${new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
                  onTouchStart={() => handleTouchStart(msg.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(msg.id)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  {msg.text}
                  
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
            <p className={styles.typingText} style={{ marginLeft: '30px' }}>{partnerName} scrie...</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <TextareaAutosize
          className={styles.textInput}
          placeholder="Scrie un mesaj..."
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
    </div>
  );
}
