import React, { useState, useEffect, useRef } from 'react';
import styles from './HomePlannerPage.module.css';
import SwipeCard from '../components/SwipeCard';
import AddHomeItemModal from '../components/AddHomeItemModal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import { useHomeItems } from '../hooks/useHomePlanner';
import { fetchInteriorIdeas } from '../utils/unsplash';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNotifications } from '../hooks/useDatabase';

const ROOMS = [
  { id: 'bucatarie', label: 'Bucătărie', icon: '🍳' },
  { id: 'living', label: 'Living', icon: '🛋️' },
  { id: 'dormitor', label: 'Dormitor', icon: '🛏️' },
  { id: 'baie', label: 'Baie', icon: '🛁' },
  { id: 'hol', label: 'Hol', icon: '🚪' },
  { id: 'balcon', label: 'Balcon', icon: '🪴' },
  { id: 'pod', label: 'Pod', icon: '🪜' },
  { id: 'birou', label: 'Birou', icon: '💻' },
  { id: 'idei_cautate', label: 'Căutări Libere', icon: '🔍' }
];

const MOCK_IDEAS = [
  { id: 'mock1', title: 'Minimalist Living', category: 'living room', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800&h=1200' },
  { id: 'mock2', title: 'Bucătărie Modernă', category: 'kitchen', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&q=80&w=800&h=1200' },
];

export default function HomePlannerPage({ role }) {
  const { items, addItem, deleteItem, updateItem, setItemLike, addComment, loading } = useHomeItems();
  const { addNotification } = useNotifications(role);
  
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
  const [cards, setCards] = useState([]);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [isPlanB, setIsPlanB] = useState(false);

  // Filters inside a room
  const [activeTag, setActiveTag] = useState('all');

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
        addNotification("Super Match! 🌟", `Ai un match la: ${item.title}`, 'system', 'his');
        addNotification("Super Match! 🌟", `Ai un match la: ${item.title}`, 'system', 'her');
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
              title: "Super Match la Design! 🌟",
              body: `S-a creat un match nou: ${item.title || 'idee de design'}!`,
              id: new Date().getTime()
            }]
          }).catch(console.error);

          // Notificare In-App
          setMatchNotification({
            title: "Super Match! 🌟",
            body: `Amândoi ați apreciat: ${item.title || 'o idee de design'}`
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

  const handleSwipeLeft = (item) => {
    setCards(prev => prev.filter(c => c.id !== item.id));
  };

  const handleSwipeRight = async (item) => {
    const existingMatch = items.find(i => i.unsplashId === item.id);

    if (existingMatch) {
      await handleSetItemLike(existingMatch.id, role, true);
    } else {
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
  if (loading) return <div className={styles.loading}>Se încarcă proiectul...</div>;

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
            <span className={styles.itemCount}>{roomItems.length} salvate</span>
          </div>

          <div className={styles.tagsFilter}>
            {allTags.map(tag => (
              <button 
                key={tag} 
                className={`${styles.filterTag} ${activeTag === tag ? styles.activeFilter : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag === 'all' ? 'Toate' : `#${tag}`}
              </button>
            ))}
          </div>

          {filteredItems.filter(i => !i.unsplashId).length > 0 && (
            <>
              <h3 className={styles.subSectionTitle} style={{marginTop: 20}}>Elemente Adăugate 🛒</h3>
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
                              🔗 Deschide Link
                            </a>
                          ) : (
                            '🔗 Fără Poză'
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
                            🔗 Vezi Link
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
              <h3 className={styles.subSectionTitle} style={{marginTop: 30}}>Idei din Swipe 💡</h3>
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
                        <div className={styles.itemNoImg}>🔗 Link</div>
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
              Nu ai salvat încă nimic aici. Folosește butonul + sau Swipe.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.dashboardView}>
        <div className={styles.statsCard}>
          <h3>Proiectul Nostru 🏠</h3>
          <p>Total idei salvate: {items.length}</p>
          <p>Link-uri adăugate de voi: {items.filter(i => !i.unsplashId).length} 🔗</p>
          <p>Super Matches: {getMatches().length} 🌟</p>
          <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.9 }}>
            💰 Cost estimativ cumulat: ~{calculateTotal(items)} RON
          </p>
        </div>

        <h3 className={styles.sectionTitle}>Camere</h3>
        <div className={styles.roomsGrid}>
          {ROOMS.map(room => {
            const roomItems = getRoomItems(room.id);
            const count = roomItems.length;
            const roomTotal = calculateTotal(roomItems);
            return (
              <div key={room.id} className={styles.roomFolder} onClick={() => handleOpenRoom(room.id)}>
                <div className={styles.folderIcon}>{room.icon}</div>
                <div className={styles.folderName}>{room.label}</div>
                <div className={styles.folderCount}>
                  {count} idei {roomTotal > 0 && `| ~${roomTotal} lei`}
                </div>
              </div>
            );
          })}
        </div>
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
                label: `Căutare: ${customSearch}`, 
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
                placeholder="Caută în engleză pt rezultate optime (ex: black sofa)..." 
                value={customSearch}
                onChange={e => setCustomSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </form>

          <h3 className={styles.sectionTitle}>Sau alege o cameră:</h3>
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
          <button className={styles.backBtn} onClick={() => setSwipeCategory(null)}>← Înapoi</button>
          <span className={styles.activeCategoryTag}>{swipeCategory.icon} {swipeCategory.label}</span>
        </div>

        {swipeLoading ? (
          <div className={styles.emptyState}>Se caută idei premium... ⏳</div>
        ) : cards.length > 0 ? (
          <>
            {isPlanB && <div className={styles.planBWarning}>⚠️ Folosim Pinterest-ul local (Plan B)</div>}
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
            <h2>Ai văzut tot!</h2>
            <button className={styles.reloadBtn} onClick={() => loadSwipeImages(swipeCategory)}>Mai caută</button>
          </div>
        )}
      </div>
    );
  };

  const renderMatches = () => {
    const matches = getMatches();
    if (matches.length === 0) return <div className={styles.emptyState}>Încă nu aveți potriviri aprobate amândoi.</div>;

    return (
      <div className={styles.matchesView}>
        <h3 className={styles.sectionTitle}>Decizii Aprobate (Match-uri) 🌟</h3>
        <div className={styles.itemsGrid}>
          {matches.map(item => (
            <div key={item.id} className={`${styles.itemCard} ${styles.matchCard}`} onClick={() => setSelectedItem(item)}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className={styles.itemImg} /> : <div className={styles.itemNoImg}>🔗 Link</div>}
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
        <h1 className={styles.title}>Home Planner 🏡</h1>
        <p className={styles.subtitle}>Proiectul pentru cuibușorul nostru</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>Proiect</button>
        <button className={`${styles.tabBtn} ${activeTab === 'swipe' ? styles.active : ''}`} onClick={() => setActiveTab('swipe')}>Inspirație</button>
        <button className={`${styles.tabBtn} ${activeTab === 'matches' ? styles.active : ''}`} onClick={() => setActiveTab('matches')}>Matches</button>
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'swipe' && renderSwipe()}
        {activeTab === 'matches' && renderMatches()}
      </div>

      {/* Floating Action Button (Doar pe Dashboard) */}
      {activeTab === 'dashboard' && (
        <button className={styles.fab} onClick={() => setShowAddModal(true)}>
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
            <h3>Unde salvăm imaginea?</h3>
            <img src={swipeRoomPrompt.imageUrl} alt="preview" className={styles.promptImg} />
            <div className={styles.promptRooms}>
              {ROOMS.map(r => (
                <button key={r.id} onClick={() => handleConfirmSwipeSave(r.id)}>{r.icon} {r.label}</button>
              ))}
            </div>
            <button className={styles.promptCancel} onClick={handleCancelSwipeSave}>Anulează</button>
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
                Apreciază ❤️
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
