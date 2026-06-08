import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MoviesPage.module.css';
import { searchMedia, getImageUrl, getMediaDetails, discoverMedia, MOVIE_GENRES, TV_GENRES } from '../utils/tmdb';
import { saveMoviePreference, removeMoviePreference, useMoviePreferences, useMovieSearches, useWatchlistMovies } from '../hooks/useDatabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function MoviesPage({ role }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [tvList, setTvList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);

  const { likedGenres, likedIds, dislikedIds } = useMoviePreferences(role);
  const watchlistMovies = useWatchlistMovies(role);
  const { searches, addSearch, removeSearch } = useMovieSearches(role);
  const { t } = useLanguage();
  
  const [recommendedList, setRecommendedList] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  useEffect(() => {
    fetchPopular();
  }, []);

  useEffect(() => {
    if (likedGenres.length > 0) {
      discoverMedia('movie', likedGenres.join('|')).then(data => {
        if (data && data.results) {
          setRecommendedList(data.results.filter(m => m.poster_path));
        }
      });
    }
  }, [likedGenres]);

  const fetchPopular = async () => {
    setLoading(true);
    const data = await discoverMedia('movie', '', 1, 'popularity.desc');
    if (data && data.results) {
      setMediaList(data.results.filter(m => m.poster_path));
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      setLoading(true);
      const data = await searchMedia(query);
      if (data && data.results) {
        setMediaList(data.results.filter(m => m.media_type === 'movie' && m.poster_path));
        setTvList(data.results.filter(m => m.media_type === 'tv' && m.poster_path));
      }
      setLoading(false);
    } else if (query.length === 0) {
      setTvList([]);
      fetchPopular();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 2) {
      addSearch(searchQuery.trim());
      setShowSearchHistory(false);
    }
  };

  const handleHistoryClick = (term) => {
    setSearchQuery(term);
    setShowSearchHistory(false);
    handleSearch({ target: { value: term } });
  };

  const handleWatchlist = async () => {
    if (!selectedMedia) return;
    const isWatchlisted = watchlistMovies.some(m => m.id === selectedMedia.id);
    if (isWatchlisted) {
      await removeMoviePreference(role, selectedMedia.id);
    } else {
      const genresToSave = mediaDetails?.genres ? mediaDetails.genres : [];
      await saveMoviePreference(role, { ...selectedMedia, genres: genresToSave }, 'watchlist');
    }
  };

  const handleLike = async () => {
    if (!selectedMedia) return;
    const genresToSave = mediaDetails?.genres ? mediaDetails.genres : [];
    await saveMoviePreference(role, { ...selectedMedia, genres: genresToSave }, 'like');
    closeDetails();
  };

  const handleDislike = async () => {
    if (!selectedMedia) return;
    const genresToSave = mediaDetails?.genres ? mediaDetails.genres : [];
    await saveMoviePreference(role, { ...selectedMedia, genres: genresToSave }, 'dislike');
    closeDetails();
  };

  const openDetails = async (media) => {
    setSelectedMedia(media);
    const details = await getMediaDetails(media.media_type || 'movie', media.id);
    setMediaDetails(details);
  };

  const closeDetails = () => {
    setSelectedMedia(null);
    setMediaDetails(null);
  };

  const renderMediaCard = (media) => {
    const isLiked = likedIds.includes(media.id);
    const isWatchlisted = watchlistMovies.some(m => m.id === media.id);

    return (
      <div key={media.id} className={styles.mediaCard} onClick={() => openDetails(media)}>
        <div className={styles.posterContainer}>
          <img src={getImageUrl(media.poster_path)} alt={media.title || media.name} className={styles.poster} loading="lazy" />
          <div className={styles.ratingBadge}>
            ⭐ {media.vote_average?.toFixed(1)}
          </div>
          {isLiked && (
            <div className={`${styles.actionBadge} ${styles.likedBadge}`} title={t('movies.youLikeIt')}>
              ❤️
            </div>
          )}
          {!isLiked && isWatchlisted && (
            <div className={`${styles.actionBadge} ${styles.watchlistBadge}`} title={t('movies.inYourList')}>
              ✅
            </div>
          )}
        </div>
        <div className={styles.cardInfo}>
          <span className={styles.mediaTitle}>{media.title || media.name}</span>
          <span className={styles.mediaYear}>
            {(media.release_date || media.first_air_date || '').split('-')[0]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title} style={{fontSize: '1.6rem'}}>{t('movies.recommendationsTitle')}</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          <button 
            className={styles.coupleMatchBtn} 
            onClick={() => navigate('/movies/library')}
            style={{background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 12px'}}
            title={t('movies.library')}
          >
            📚
          </button>
          <button 
            className={styles.coupleMatchBtn} 
            onClick={() => navigate('/movies/match')}
            style={{padding: '8px 12px'}}
            title={t('movies.coupleMatch')}
          >
            💞 {t('movies.coupleMatch')}
          </button>
        </div>
      </div>

      {/* Affiliate Banner */}
      <div className={styles.affiliateBanner} onClick={() => window.open('https://www.cinemacity.ro', '_blank')} style={{
        background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
        borderRadius: '12px', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🍿 {t('movies.affiliateTitle') || 'Vrei să ieșiți la un film?'}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>{t('movies.affiliateDesc') || 'Rezervă bilete acum și bucurați-vă de o seară specială.'}</p>
        </div>
        <div style={{ background: 'white', color: '#FF6B6B', padding: '8px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          {t('movies.affiliateBtn') || 'Cumpără Bilete'}
        </div>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBar}>
          <span>🔍</span>
          <input 
            type="text" 
            placeholder={t('movies.searchPlaceholder')} 
            className={styles.searchInput}
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSearchHistory(true)}
            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
          />
        </div>
        
        {showSearchHistory && searches.length > 0 && (
          <div className={styles.searchHistory}>
            {searches.map((term, idx) => (
              <div key={idx} className={styles.historyItem}>
                <div className={styles.historyText} onClick={() => handleHistoryClick(term)}>
                  🕒 {term}
                </div>
                <button 
                  className={styles.deleteHistoryBtn} 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearch(term);
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {searchQuery.length <= 2 && (
        <>
          <h2 className={styles.sectionTitle}>{t('movies.recommendedForYou')}</h2>
          {recommendedList.length > 0 ? (
            <div className={styles.horizontalScroll}>
              {recommendedList.slice(0, 10).map(renderMediaCard)}
              <div className={styles.showMoreCard} onClick={() => navigate('/movies/recommended')}>
                <span>{t('movies.seeMore')}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 25, fontStyle: 'italic' }}>
              {t('movies.likeSomeMovies')}
            </p>
          )}

          <h2 className={styles.sectionTitle}>{t('movies.popularNow')}</h2>
          {loading && !mediaList.length ? (
            <div className={styles.loading}>{t('movies.loading')}</div>
          ) : (
            <div className={styles.horizontalScroll}>
              {mediaList.slice(0, 10).map(renderMediaCard)}
              <div className={styles.showMoreCard} onClick={() => navigate('/movies/catalog')}>
                <span>{t('movies.exploreCatalog')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {searchQuery.length > 2 && (
        <>
          {mediaList.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>{t('movies.moviesFound')}</h2>
              <div className={styles.mediaGrid}>
                {mediaList.map(renderMediaCard)}
              </div>
            </>
          )}
          {tvList.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>{t('movies.tvFound')}</h2>
              <div className={styles.mediaGrid}>
                {tvList.map(renderMediaCard)}
              </div>
            </>
          )}
          {mediaList.length === 0 && tvList.length === 0 && !loading && (
             <div className={styles.loading}>{t('movies.noResults')}</div>
          )}
        </>
      )}

      {selectedMedia && mediaDetails && (
        <div className={styles.modalOverlay} onClick={closeDetails}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={closeDetails}>✕</button>
            
            <img 
              src={getImageUrl(mediaDetails.backdrop_path || mediaDetails.poster_path, 'w780')} 
              alt="Backdrop" 
              className={styles.backdrop} 
            />
            
            <div className={styles.modalDetails}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>{mediaDetails.title || mediaDetails.name}</h2>
                  <div className={styles.modalMeta}>
                    <span>⭐ {mediaDetails.vote_average?.toFixed(1)}</span>
                    <span>•</span>
                    <span>{(mediaDetails.release_date || mediaDetails.first_air_date || '').split('-')[0]}</span>
                    {mediaDetails.runtime && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(mediaDetails.runtime / 60)}h {mediaDetails.runtime % 60}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalMeta} style={{ marginBottom: 15 }}>
                {mediaDetails.genres?.map(g => (
                  <span key={g.id} className={styles.genreTag}>{g.name}</span>
                ))}
              </div>

              <p className={styles.overview}>{mediaDetails.overview || t('movies.noOverview')}</p>

              {mediaDetails.credits?.cast?.length > 0 && (
                <>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '1rem' }}>{t('movies.cast')}</h3>
                  <div className={styles.castList}>
                    {mediaDetails.credits.cast.slice(0, 10).map(actor => (
                      <div key={actor.id} className={styles.actorCard}>
                        {actor.profile_path ? (
                          <img src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} className={styles.actorImage} />
                        ) : (
                          <div className={styles.actorImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{t('movies.noPicture')}</div>
                        )}
                        <span className={styles.actorName}>{actor.name}</span>
                        <span className={styles.actorCharacter}>{actor.character}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {mediaDetails?.videos?.results?.length > 0 && (
                <button 
                  className={styles.trailerBtn} 
                  onClick={() => {
                    const trailer = mediaDetails.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || mediaDetails.videos.results[0];
                    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
                  }}
                >
                  {t('movies.watchTrailer')}
                </button>
              )}

              <div className={styles.actionButtons}>
                <button 
                  className={styles.dislikeBtn} 
                  onClick={handleDislike}
                  disabled={dislikedIds.includes(selectedMedia.id)}
                  style={dislikedIds.includes(selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  title={t('movies.notForMe')}
                >
                  👎
                </button>
                <button 
                  className={styles.likeBtn} 
                  onClick={handleWatchlist}
                  disabled={watchlistMovies.some(m => m.id === selectedMedia.id)}
                  style={watchlistMovies.some(m => m.id === selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'} : {background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}
                  title={t('movies.addToMyList')}
                >
                  {watchlistMovies.some(m => m.id === selectedMedia.id) ? t('movies.saved') : t('movies.add')}
                </button>
                <button 
                  className={styles.likeBtn} 
                  onClick={handleLike}
                  disabled={likedIds.includes(selectedMedia.id)}
                  style={likedIds.includes(selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'} : {background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}
                  title={t('movies.likeBtn')}
                >
                  {likedIds.includes(selectedMedia.id) ? t('movies.liked') : t('movies.likeBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
