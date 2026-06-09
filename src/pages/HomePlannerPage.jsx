import React, { useState, useEffect, useRef } from 'react';
import styles from './HomePlannerPage.module.css';
import SwipeCard from '../components/SwipeCard';
import AddHomeItemModal from '../components/AddHomeItemModal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import { useHomeItems } from '../hooks/useHomePlanner';
import { fetchInteriorIdeas } from '../utils/unsplash';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNotifications } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useMonetization } from '../hooks/useMonetization';

const getRooms = (t) => [
  { id: 'bucatarie', label: t('homePlanner.kitchen'), icon: '🍳' },
  { id: 'living', label: t('homePlanner.living'), icon: '🛋️' },
  { id: 'dormitor', label: t('homePlanner.bedroom'), icon: '🛏️' },
  { id: 'baie', label: t('homePlanner.bathroom'), icon: '🛁' },
  { id: 'hol', label: t('homePlanner.hallway'), icon: '🚪' },
  { id: 'balcon', label: t('homePlanner.balcony'), icon: '🪴' },
  { id: 'pod', label: t('homePlanner.attic'), icon: '🪜' },
  { id: 'birou', label: t('homePlanner.office'), icon: '💻' },
  { id: 'idei_cautate', label: t('homePlanner.freeSearches'), icon: '🔍' }
];

const MOCK_IDEAS = [
  { id: 'mock1', title: 'Minimalist Living', category: 'living room', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800&h=1200' },
  { id: 'mock2', title: 'Bucătărie Modernă', category: 'kitchen', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&q=80&w=800&h=1200' },
];

export default function HomePlannerPage({ role }) {
  const { items, addItem, deleteItem, updateItem, setItemLike, addComment, loading } = useHomeItems();
  const { addNotification } = useNotifications(role);
  const { isPro } = useMonetization();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'swipe', 'matches'
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // pt ItemDetailsModal
  const [editingItem, setEditingItem] = useState(null); // pt AddHomeItemModal
  const [swipeRoomPrompt, setSwipeRoomPrompt] = useState(null); // cand dai swipe right
  const [fullScreenSwipeItem, setFullScreenSwipeItem] = useState(null); // cand dai click pe swipe card
  const [matchNotification, setMatchNotification] = useState(null); // in-app toast

  // Swipe State
  const [swipeCategory, setSwipeCategory] = useState(null);
  const [customSearch, setCustomSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [cards, setCards] = useState([]);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [isPlanB, setIsPlanB] = useState(false);

  // Filters inside a room
  const [activeTag, setActiveTag] = useState('all');

  const { t, language: lang } = useLanguage();
  const ROOMS = getRooms(t);

  const previousItemsRef = useRef([]);

  // Sincronizeaza elementul selectat (pt Modal) ca să se dea refresh instant când Ana sau tu dați like/comentați
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
      else setSelectedItem(null); // daca a fost sters
    }
  }, [items]);

  // Funcție personalizată pentru a trata momentul când dai like și se formează match
  const handleSetItemLike = async (id, r, isLiked) => {
    await setItemLike(id, r, isLiked);
    if (isLiked) {
      const item = items.find(i => i.id === id);
      const partnerRole = r === 'his' ? 'her' : 'his';
      // Dacă partenerul avea deja like, e match ACUM pentru că tu tocmai ai dat like!
      if (item && item.likes?.[partnerRole] === true) {
        addNotification(t('homePlanner.superMatchTitlePush'), `${t('homePlanner.superMatchBodyPush')}${item.title}`, 'system', 'his');
        addNotification(t('homePlanner.superMatchTitlePush'), `${t('homePlanner.superMatchBodyPush')}${item.title}`, 'system', 'her');
      }
    }
  };

  // Detectează match-uri noi în timp real (pentru ambele telefoane simultan) - doar TOAST și Local Push
  useEffect(() => {
    if (items.length > 0 && previousItemsRef.current.length > 0) {
      items.forEach(item => {
        const prevItem = previousItemsRef.current.find(i => i.id === item.id);
        const isMatchNow = item.likes?.his === true && item.likes?.her === true;
        const wasMatchBefore = prevItem ? (prevItem.likes?.his === true && prevItem.likes?.her === true) : false;

        if (isMatchNow && !wasMatchBefore) {
          // Push notification pe device
          LocalNotifications.schedule({
            notifications: [{
              title: t('homePlanner.superMatchTitlePush'),
              body: `${t('homePlanner.superMatchBodyPush')}${item.title || 'idee de design'}!`,
              id: new Date().getTime()
            }]
          }).catch(console.error);

          // Notificare In-App
          setMatchNotification({
            title: t('homePlanner.superMatchTitleInApp'),
            body: `${t('homePlanner.superMatchBodyInApp')}${item.title || 'o idee de design'}`
          });
          
          setTimeout(() => setMatchNotification(null), 6000);
        }
      });
    }
    previousItemsRef.current = items;
  }, [items]);

  // ------- DASHBOARD / ROOMS LOGIC -------
  const getRoomItems = (roomId) => items.filter(i => i.room === roomId);
  const getMatches = () => items.filter(i => i.likes?.his === true && i.likes?.her === true);

  const extractPrice = (priceStr) => {
    if (!priceStr) return 0;
    // scoate orice nu e cifră, dar tratează virgula și punctul corect dacă e nevoie
    // Pentru simplitate scoatem doar cifrele ca număr întreg
    const match = priceStr.toString().replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const calculateTotal = (itemsArray) => {
    return itemsArray.reduce((acc, item) => acc + extractPrice(item.price), 0);
  };

  const handleOpenRoom = (roomId) => {
    setSelectedRoom(roomId);
    setActiveTag('all');
  };

  // ------- SWIPE LOGIC -------
  const generateAlgorithmKeywords = (catId) => {
    const roomItems = items.filter(i => i.likes?.his || i.likes?.her);
    if (roomItems.length === 0) return "";
    const words = roomItems
      .map(i => i.title)
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['idee', 'pentru', 'design', 'interior'].includes(w));
    if (words.length === 0) return "";
    return words[Math.floor(Math.random() * words.length)];
  };

  const getTagsForSwipe = (cat) => {
    const base = ["inspirație", "design", "premium", "modern"];
    if(cat === "living room") base.push("confort", "canapea");
    else if(cat === "bedroom") base.push("odihnă", "pat");
    else if(cat === "kitchen") base.push("gătit", "mobilă");
    else if(cat === "bathroom") base.push("relaxare", "baie");
    return base.map(t => `#${t}`).join(" ");
  };

  const loadSwipeImages = async (categoryObj) => {
    setSwipeLoading(true);
    setSwipeCategory(categoryObj);
    try {
      const extra = generateAlgorithmKeywords(categoryObj.id);
      const page = Math.floor(Math.random() * 3) + 1;
      const results = await fetchInteriorIdeas(categoryObj.id, page, extra);
      setCards(results.reverse());
    } catch (error) {
      setIsPlanB(true);
      setCards([...MOCK_IDEAS].reverse());
    }
    setSwipeLoading(false);
  };

  const getNextMonthName = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleString(lang === 'en' ? 'en-US' : 'ro-RO', { month: 'long' });
  };

  const checkSwipeLimit = () => {
    if (isPro) return true;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const swipeKey = `homePlanner_swipes_${currentMonth}_${role}`;
    const swipes = parseInt(localStorage.getItem(swipeKey) || '0', 10);
    
    if (swipes >= 15) {
      const monthName = getNextMonthName();
      alert(t('homePlanner.swipeLimit') || `Ai atins limita de 15 swipe-uri gratuite pe luna aceasta. Se va reseta pe 1 ${monthName}. Treci la Premium pentru swipe-uri nelimitate!`);
      return false;
    }
    
    localStorage.setItem(swipeKey, (swipes + 1).toString());
    return true;
  };

  const handleSwipeLeft = (item) => {
    if (!checkSwipeLimit()) return;
    setCards(prev => prev.filter(c => c.id !== item.id));
  };

  const handleSwipeRight = async (item) => {
    if (!checkSwipeLimit()) return;
    const existingMatch = items.find(i => i.unsplashId === item.id);

    if (existingMatch) {
      await handleSetItemLike(existingMatch.id, role, true);
    } else {
      if (!isPro && items.filter(i => i.addedBy === role).length >= 100) {
        alert("Ai atins limita maxima de idei salvate gratuite! Treci la Premium pentru stocare nelimitată.");
        return;
      }
      const roomAssigned = swipeCategory ? swipeCategory.roomId : 'living';

      await addItem({
        title: item.title || 'Inspirație Pinterest',
        imageUrl: item.imageUrl,
        room: roomAssigned,
        tags: ['inspirație'],
        addedBy: role,
        unsplashId: item.id,
        likes: { [role]: true, [role === 'his' ? 'her' : 'his']: null }
      });
    }

    setCards(prev => prev.filter(c => c.id !== item.id));
  };

  // ------- RENDERING -------
  if (loading) return <div className={styles.loading}>{t('homePlanner.loadingProject')}</div>;

  const renderDashboard = () => {
    if (selectedRoom) {
      const roomItems = getRoomItems(selectedRoom);
      const allTags = ['all', ...new Set(roomItems.flatMap(i => i.tags || []))];
      const filteredItems = activeTag === 'all' ? roomItems : roomItems.filter(i => i.tags?.includes(activeTag));
      const roomLabel = ROOMS.find(r => r.id === selectedRoom)?.label || selectedRoom;

      return (
        <div className={styles.roomView}>
          <div className={styles.roomHeader}>
            <button className={styles.backBtn} onClick={() => setSelectedRoom(null)}>←</button>
            <h2>{roomLabel}</h2>
            <span className={styles.itemCount}>{roomItems.length} {t('homePlanner.saved')}</span>
          </div>

          <div className={styles.tagsFilter}>
            {allTags.map(tag => (
              <button 
                key={tag} 
                className={`${styles.filterTag} ${activeTag === tag ? styles.activeFilter : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag === 'all' ? t('homePlanner.all') : `#${tag}`}
              </button>
            ))}
          </div>

          {filteredItems.filter(i => !i.unsplashId).length > 0 && (
            <>
              <h3 className={styles.subSectionTitle} style={{marginTop: 20}}>{t('homePlanner.addedItems')}</h3>
              <div className={styles.itemsGrid}>
                {filteredItems.filter(i => !i.unsplashId).map(item => {
                  const hasMyLike = item.likes?.[role] === true;
                  const hasMyDislike = item.likes?.[role] === false;
                  const partnerRole = role === 'his' ? 'her' : 'his';
                  const partnerLike = item.likes?.[partnerRole];
                  const isMatch = hasMyLike && partnerLike === true;

                  return (
                    <div key={item.id} className={`${styles.itemCard} ${isMatch ? styles.matchCard : ''}`} onClick={() => setSelectedItem(item)}>
                      {isMatch && <div className={styles.matchBadge}>🌟 Match</div>}
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className={styles.itemImg} />
                      ) : (
                        <div className={styles.itemNoImg}>
                          {item.link ? (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={styles.gridLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t('homePlanner.openLink')}
                            </a>
                          ) : (
                            t('homePlanner.noPicture')
                          )}
                        </div>
                      )}
                      <div className={styles.itemInfo}>
                        <p className={styles.itemTitle}>{item.title}</p>
                        {item.imageUrl && item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={styles.gridMiniLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('homePlanner.viewLink')}
                          </a>
                        )}
                        <div className={styles.itemMeta}>
                          <span className={styles.chatIcon}>💬 {item.comments?.length || 0}</span>
                          <div className={styles.likesIndicators}>
                            {hasMyLike && <span>✅</span>}
                            {hasMyDislike && <span>❌</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {filteredItems.filter(i => i.unsplashId).length > 0 && (
            <>
              <h3 className={styles.subSectionTitle} style={{marginTop: 30}}>{t('homePlanner.swipeIdeas')}</h3>
              <div className={styles.itemsGrid}>
                {filteredItems.filter(i => i.unsplashId).map(item => {
                  const hasMyLike = item.likes?.[role] === true;
                  const hasMyDislike = item.likes?.[role] === false;
                  const partnerRole = role === 'his' ? 'her' : 'his';
                  const partnerLike = item.likes?.[partnerRole];
                  const isMatch = hasMyLike && partnerLike === true;

                  return (
                    <div key={item.id} className={`${styles.itemCard} ${isMatch ? styles.matchCard : ''}`} onClick={() => setSelectedItem(item)}>
                      {isMatch && <div className={styles.matchBadge}>🌟 Match</div>}
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className={styles.itemImg} />
                      ) : (
                        <div className={styles.itemNoImg}>{t('homePlanner.link')}</div>
                      )}
                      <div className={styles.itemInfo}>
                        <p className={styles.itemTitle}>{item.title}</p>
                        <div className={styles.itemMeta}>
                          <span className={styles.chatIcon}>💬 {item.comments?.length || 0}</span>
                          <div className={styles.likesIndicators}>
                            {hasMyLike && <span>✅</span>}
                            {hasMyDislike && <span>❌</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              {t('homePlanner.emptyRoom')}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.dashboardView}>
        <div className={styles.statsCard}>
          <h3>{t('homePlanner.ourProject')}</h3>
          <p>{t('homePlanner.totalIdeasSaved')}{items.length}</p>
          <p>{t('homePlanner.ideasAddedByYou')}{items.filter(i => !i.unsplashId).length} 🔗</p>
          <p>{t('homePlanner.superMatches')}{getMatches().length} 🌟</p>
          <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.9 }}>
            {t('homePlanner.estimatedCost')}{calculateTotal(items)} {t('homePlanner.currency')}
          </p>
        </div>

        {/* Affiliate Banner for Home Deco */}
        {!isPro && (
          <div style={{
            background: 'linear-gradient(135deg, #003399 0%, #002266 100%)',
            borderRadius: '12px', padding: '15px', color: 'white', cursor: 'pointer', marginBottom: '20px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0, 51, 153, 0.3)'
          }} onClick={() => window.open('https://jysk.ro', '_blank')}>
              <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '1px' }}>JYSK</span>
                <svg viewBox="0 0 24 24" height="20" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>🛋️ {t('homePlanner.affiliateTitle') || 'Inspiră-te din Jysk'}</h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>{t('homePlanner.affiliateDesc') || 'Găsește decorațiunile perfecte pentru cuibul vostru.'}</p>
            </div>
            <div style={{ background: 'white', color: '#003399', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {t('homePlanner.affiliateBtn') || 'Vezi oferte'}
            </div>
          </div>
        )}

        <div className={styles.dashboardSearch}>
          <div className={styles.searchBar}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder={t('homePlanner.searchSavedIdeas')} 
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className={styles.searchInput}
            />
            {globalSearch && (
              <button className={styles.clearSearchBtn} onClick={() => setGlobalSearch('')}>✕</button>
            )}
          </div>
        </div>

        {!globalSearch ? (
          <>
            <h3 className={styles.sectionTitle}>{t('homePlanner.rooms')}</h3>
            <div className={styles.roomsGrid}>
              {ROOMS.map(room => {
                const roomItems = getRoomItems(room.id);
                const itemsAdded = roomItems.filter(i => !i.unsplashId);
                const count = itemsAdded.length;
                const roomTotal = calculateTotal(roomItems); // Keep calculation on all in case they ever get prices, though usually only links have them
                return (
                  <div key={room.id} className={styles.roomFolder} onClick={() => handleOpenRoom(room.id)}>
                    <div className={styles.folderIcon}>{room.icon}</div>
                    <div className={styles.folderName}>{room.label}</div>
                    <div className={styles.folderCount}>
                      {count} {count === 1 ? t('homePlanner.item') : t('homePlanner.items')} {roomTotal > 0 && `| ~${roomTotal} ${t('homePlanner.currency')}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.searchResults}>
            <h3 className={styles.sectionTitle}>{t('homePlanner.searchResults')}</h3>
            {(() => {
              const query = globalSearch.toLowerCase();
              const results = items.filter(i => 
                (i.title && i.title.toLowerCase().includes(query)) ||
                (i.tags && i.tags.some(t => t.toLowerCase().includes(query))) ||
                (i.link && i.link.toLowerCase().includes(query))
              );
              
              if (results.length === 0) {
                return <div className={styles.emptyState}>{t('homePlanner.noIdeasFor')} "{globalSearch}"</div>;
              }

              return (
                <div className={styles.itemsGrid}>
                  {results.map(item => {
                    const hasMyLike = item.likes?.[role] === true;
                    const hasMyDislike = item.likes?.[role] === false;
                    const partnerRole = role === 'his' ? 'her' : 'his';
                    const partnerLike = item.likes?.[partnerRole];
                    const isMatch = hasMyLike && partnerLike === true;
                    const roomLabel = ROOMS.find(r => r.id === item.room)?.label || item.room;

                    return (
                      <div key={item.id} className={`${styles.itemCard} ${isMatch ? styles.matchCard : ''}`} onClick={() => setSelectedItem(item)}>
                        {isMatch && <div className={styles.matchBadge}>🌟 Match</div>}
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className={styles.itemImg} />
                        ) : (
                          <div className={styles.itemNoImg}>
                            {item.link ? t('homePlanner.link') : t('homePlanner.noPicture')}
                          </div>
                        )}
                        <div className={styles.itemInfo}>
                          <p className={styles.itemTitle}>{item.title}</p>
                          <span className={styles.searchRoomTag}>📂 {roomLabel}</span>
                          <div className={styles.itemMeta}>
                            <span className={styles.chatIcon}>💬 {item.comments?.length || 0}</span>
                            <div className={styles.likesIndicators}>
                              {hasMyLike && <span>✅</span>}
                              {hasMyDislike && <span>❌</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const renderSwipe = () => {
    if (!swipeCategory) {
      return (
        <div className={styles.swipeCategories}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (customSearch.trim()) {
              const cat = { 
                id: customSearch.trim(), 
                label: `${t('homePlanner.searchLabel')}${customSearch}`, 
                icon: '🔍', 
                roomId: 'idei_cautate' // Merge în folderul specific
              };
              loadSwipeImages(cat);
              setCustomSearch('');
            }
          }}>
            <div className={styles.searchBar}>
              <span>🔍</span>
              <input 
                type="text" 
                placeholder={t('homePlanner.searchPlaceholderSwipe')} 
                value={customSearch}
                onChange={e => setCustomSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </form>

          <h3 className={styles.sectionTitle}>{t('homePlanner.orChooseRoom')}</h3>
          <div className={styles.roomsGrid}>
            {ROOMS.map(r => {
              const unsplashSearchMap = {
                'bucatarie': 'kitchen',
                'living': 'living room',
                'dormitor': 'bedroom',
                'baie': 'bathroom',
                'hol': 'hallway entrance',
                'balcon': 'balcony terrace',
                'pod': 'attic loft',
                'birou': 'home office'
              };
              const cat = { 
                id: unsplashSearchMap[r.id] || r.id, 
                label: r.label, 
                icon: r.icon, 
                roomId: r.id 
              };
              
              return (
                <div key={r.id} className={styles.roomFolder} onClick={() => loadSwipeImages(cat)}>
                  <div className={styles.folderIcon}>{cat.icon}</div>
                  <div className={styles.folderName}>{cat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const currentCard = cards[cards.length - 1];

    return (
      <div className={styles.swipeArea}>
        <div className={styles.swipeHeader}>
          <button className={styles.backBtn} onClick={() => setSwipeCategory(null)}>{t('homePlanner.backBtn')}</button>
          <span className={styles.activeCategoryTag}>{swipeCategory.icon} {swipeCategory.label}</span>
        </div>

        {swipeLoading ? (
          <div className={styles.emptyState}>{t('homePlanner.searchingPremiumIdeas')}</div>
        ) : cards.length > 0 ? (
          <>
            {isPlanB && <div className={styles.planBWarning}>{t('homePlanner.planBWarning')}</div>}
            <div className={styles.cardStack}>
              {cards.slice(-3).map((item, index, array) => {
                const isTop = index === array.length - 1;
                return (
                  <div 
                    key={item.id} 
                    className={styles.cardWrapper}
                    style={{
                      zIndex: index,
                      transform: `scale(${1 - (array.length - 1 - index) * 0.05}) translateY(${(array.length - 1 - index) * -15}px)`,
                      opacity: index < array.length - 2 ? 0 : 1
                    }}
                  >
                    {isTop ? (
                      <SwipeCard item={item} onSwipeRight={handleSwipeRight} onSwipeLeft={handleSwipeLeft} onClick={setFullScreenSwipeItem} />
                    ) : (
                      <div className={styles.inactiveCard}>
                         <img src={item.imageUrl} alt="" className={styles.bgImage} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {currentCard && (
              <div className={styles.actionButtons}>
                <button className={styles.btnNope} onClick={() => handleSwipeLeft(currentCard)}>❌</button>
                <button className={styles.btnLike} onClick={() => handleSwipeRight(currentCard)}>❤️</button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <h2>{t('homePlanner.seenItAll')}</h2>
            <button className={styles.reloadBtn} onClick={() => loadSwipeImages(swipeCategory)}>{t('homePlanner.searchMore')}</button>
          </div>
        )}
      </div>
    );
  };

  const renderMatches = () => {
    const matches = getMatches();
    if (matches.length === 0) return <div className={styles.emptyState}>{t('homePlanner.noMatchesYet')}</div>;

    return (
      <div className={styles.matchesView}>
        <h3 className={styles.sectionTitle}>{t('homePlanner.approvedDecisions')}</h3>
        <div className={styles.itemsGrid}>
          {matches.map(item => (
            <div key={item.id} className={`${styles.itemCard} ${styles.matchCard}`} onClick={() => setSelectedItem(item)}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className={styles.itemImg} /> : <div className={styles.itemNoImg}>{t('homePlanner.link')}</div>}
              <div className={styles.itemInfo}>
                <p className={styles.itemTitle}>{item.title}</p>
                <span className={styles.roomMiniTag}>{item.room}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('homePlanner.homePlannerTitle')}</h1>
        <p className={styles.subtitle}>{t('homePlanner.homePlannerSubtitle')}</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>{t('homePlanner.projectTab')}</button>
        <button className={`${styles.tabBtn} ${activeTab === 'swipe' ? styles.active : ''}`} onClick={() => setActiveTab('swipe')}>{t('homePlanner.inspirationTab')}</button>
        <button className={`${styles.tabBtn} ${activeTab === 'matches' ? styles.active : ''}`} onClick={() => setActiveTab('matches')}>{t('homePlanner.matchesTab')}</button>
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'swipe' && renderSwipe()}
        {activeTab === 'matches' && renderMatches()}
      </div>

      {/* Floating Action Button (Doar pe Dashboard) */}
      {activeTab === 'dashboard' && (
        <button className={styles.fab} onClick={() => {
          if (!isPro && items.length >= 5) {
            alert("Ai atins limita de 5 idei gratuite! Treci la Premium pentru stocare nelimitată.");
            return;
          }
          setShowAddModal(true);
        }}>
          +
        </button>
      )}

      {/* Modals */}
      {(showAddModal || editingItem) && (
        <AddHomeItemModal 
          role={role} 
          initialData={editingItem || (selectedRoom ? { room: selectedRoom } : {})}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }} 
          onSave={async (data) => { 
            if (editingItem) {
              await updateItem(editingItem.id, data);
            } else {
              await addItem(data); 
            }
            setShowAddModal(false); 
            setEditingItem(null);
          }} 
        />
      )}

      {selectedItem && (
        <ItemDetailsModal 
          item={selectedItem} 
          role={role}
          onClose={() => setSelectedItem(null)}
          onAddComment={addComment}
          onSetLike={handleSetItemLike}
          onDelete={deleteItem}
          onEdit={(item) => {
            setEditingItem(item);
          }}
        />
      )}

      {/* Prompt la Swipe Right */}
      {swipeRoomPrompt && (
        <div className={styles.promptOverlay}>
          <div className={styles.promptModal}>
            <h3>{t('homePlanner.whereToSave')}</h3>
            <img src={swipeRoomPrompt.imageUrl} alt="preview" className={styles.promptImg} />
            <div className={styles.promptRooms}>
              {ROOMS.map(r => (
                <button key={r.id} onClick={() => handleConfirmSwipeSave(r.id)}>{r.icon} {r.label}</button>
              ))}
            </div>
            <button className={styles.promptCancel} onClick={handleCancelSwipeSave}>{t('homePlanner.cancel')}</button>
          </div>
        </div>
      )}

      {/* Fullscreen Swipe Item Details */}
      {fullScreenSwipeItem && (
        <div className={styles.promptOverlay} onClick={() => setFullScreenSwipeItem(null)}>
          <div className={styles.fullScreenModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFullscreenBtn} onClick={() => setFullScreenSwipeItem(null)}>✕</button>
            <img src={fullScreenSwipeItem.imageUrl} alt={fullScreenSwipeItem.title} className={styles.fullScreenImg} />
            <div className={styles.fullScreenInfo}>
              <h3>{fullScreenSwipeItem.title}</h3>
              <p>#{fullScreenSwipeItem.category} {getTagsForSwipe(fullScreenSwipeItem.category)}</p>
              <button className={styles.btnPrimary} onClick={() => {
                handleSwipeRight(fullScreenSwipeItem);
                setFullScreenSwipeItem(null);
              }}>
                {t('homePlanner.likeSwipeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Match Notification Toast */}
      {matchNotification && (
        <div className={styles.toastNotification}>
          <h4>{matchNotification.title}</h4>
          <p>{matchNotification.body}</p>
        </div>
      )}

    </div>
  );
}
