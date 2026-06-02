import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MoviesPage.module.css'; // Refolosim fix aceleași stiluri
import { discoverMedia, MOVIE_GENRES, getImageUrl, getMediaDetails } from '../utils/tmdb';
import { saveMoviePreference, removeMoviePreference, useMoviePreferences, useWatchlistMovies } from '../hooks/useDatabase';

export default function RecommendedMoviesPage({ role }) {
  const navigate = useNavigate();
  
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);

  const { likedGenres, likedIds, dislikedIds } = useMoviePreferences(role);
  const watchlistMovies = useWatchlistMovies(role);

  useEffect(() => {
    fetchRecommendations(1);
  }, [likedGenres, selectedGenre, selectedSort]);

  const fetchRecommendations = async (pageNum) => {
    if (likedGenres.length === 0) return;
    setLoading(true);
    
    // TMDb logic:
    // Dacă utilizatorul a filtrat după un anumit gen în UI (ex: '28' Acțiune), vrem recomandări care conțin ACEL gen AND (Oricare din genurile lui apreciate)
    // Deoarece TMDB `with_genres` acceptă doar un singur set de reguli (ex: `28|12,35` nu merge corect pe versiuni vechi), 
    // cel mai simplu este:
    // Dacă a selectat un gen manual, recomandăm exclusiv acel gen.
    // Dacă nu a selectat (all), aducem genurile lui apreciate cu OR (|).
    
    const genresString = selectedGenre === 'all' ? likedGenres.join('|') : selectedGenre;
    
    const data = await discoverMedia('movie', genresString, pageNum, selectedSort);
    if (data && data.results) {
      if (pageNum === 1) {
        setMediaList(data.results.filter(m => m.poster_path));
      } else {
        setMediaList(prev => [...prev, ...data.results.filter(m => m.poster_path)]);
      }
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecommendations(nextPage);
  };

  const openDetails = async (media) => {
    setSelectedMedia(media);
    const details = await getMediaDetails('movie', media.id);
    setMediaDetails(details);
  };

  const closeDetails = () => {
    setSelectedMedia(null);
    setMediaDetails(null);
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

  const renderMediaCard = (media) => (
    <div key={media.id} className={styles.mediaCard} onClick={() => openDetails(media)}>
      <div className={styles.posterContainer}>
        <img src={getImageUrl(media.poster_path)} alt={media.title || media.name} className={styles.poster} loading="lazy" />
        <div className={styles.ratingBadge}>
          ⭐ {media.vote_average?.toFixed(1)}
        </div>
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.mediaTitle}>{media.title || media.name}</span>
        <span className={styles.mediaYear}>
          {(media.release_date || media.first_air_date || '').split('-')[0]}
        </span>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <button className={styles.coupleMatchBtn} onClick={() => navigate(-1)} style={{padding: '10px 15px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}>
          ← Înapoi
        </button>
        <h1 className={styles.title} style={{fontSize: '1.4rem'}}>Toate Recomandările ✨</h1>
      </div>

      <div className={styles.filterRow}>
        <select 
          className={styles.filterSelect} 
          value={selectedSort} 
          onChange={e => { setSelectedSort(e.target.value); setPage(1); }}
        >
          <option value="popularity.desc">🔥 Cele mai populare</option>
          <option value="primary_release_date.desc">🆕 Cele mai noi</option>
          <option value="vote_average.desc">⭐ Top Rated</option>
        </select>

        <select 
          className={styles.filterSelect} 
          value={selectedGenre} 
          onChange={e => { setSelectedGenre(e.target.value); setPage(1); }}
        >
          <option value="all">Doar preferințele mele</option>
          {MOVIE_GENRES.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {loading && page === 1 ? (
        <div className={styles.loading}>Se încarcă recomandările...</div>
      ) : (
        <>
          <div className={styles.mediaGrid}>
            {mediaList.map(renderMediaCard)}
          </div>
          
          {mediaList.length > 0 && (
            <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
              <button className={styles.coupleMatchBtn} onClick={handleLoadMore}>
                Încarcă mai multe
              </button>
            </div>
          )}
        </>
      )}

      {selectedMedia && mediaDetails && (
        <div className={styles.modalOverlay} onClick={closeDetails}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={closeDetails}>✕</button>
            <img src={getImageUrl(mediaDetails.backdrop_path || mediaDetails.poster_path, 'w780')} alt="Backdrop" className={styles.backdrop} />
            
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

              <p className={styles.overview}>{mediaDetails.overview || "Nicio descriere disponibilă în limba română."}</p>

              {mediaDetails?.videos?.results?.length > 0 && (
                <button 
                  className={styles.trailerBtn} 
                  onClick={() => {
                    const trailer = mediaDetails.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || mediaDetails.videos.results[0];
                    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
                  }}
                >
                  ▶️ Urmărește Trailer
                </button>
              )}

              <div className={styles.actionButtons}>
                <button 
                  className={styles.dislikeBtn} 
                  onClick={handleDislike}
                  disabled={dislikedIds.includes(selectedMedia.id)}
                  style={dislikedIds.includes(selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  title="Nu e pentru mine"
                >
                  👎
                </button>
                <button 
                  className={styles.likeBtn} 
                  onClick={handleWatchlist}
                  disabled={watchlistMovies.some(m => m.id === selectedMedia.id)}
                  style={watchlistMovies.some(m => m.id === selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'} : {background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}
                  title="Adaugă în Lista Mea"
                >
                  {watchlistMovies.some(m => m.id === selectedMedia.id) ? '✅ Salvat' : '❤️ Adaugă'}
                </button>
                <button 
                  className={styles.likeBtn} 
                  onClick={handleLike}
                  disabled={likedIds.includes(selectedMedia.id)}
                  style={likedIds.includes(selectedMedia.id) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'} : {background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}
                  title="Îmi place"
                >
                  {likedIds.includes(selectedMedia.id) ? '✅ Ai dat Like' : '❤️ Îmi place'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
