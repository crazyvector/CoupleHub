import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LibraryPage.module.css';
import modalStyles from './MoviesPage.module.css'; // Refolosim stilurile pentru modal
import { useWatchlistMovies, removeMoviePreference } from '../hooks/useDatabase';
import { getImageUrl, getMediaDetails } from '../utils/tmdb';

export default function LibraryPage({ role }) {
  const navigate = useNavigate();
  const likedMovies = useWatchlistMovies(role);
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const openDetails = async (media) => {
    setSelectedMedia(media);
    setLoadingDetails(true);
    // Presupunem 'movie' dacă nu e specificat clar, pentru siguranță. (Dacă vrem TV, TMDb s-ar putea să nu îl găsească la movie)
    // Vom încerca la movie, apoi la tv dacă nu merge, sau dacă am stocat type.
    try {
      const details = await getMediaDetails('movie', media.id);
      setMediaDetails(details);
    } catch {
      try {
        const detailsTv = await getMediaDetails('tv', media.id);
        setMediaDetails(detailsTv);
      } catch (e) {
        console.error(e);
      }
    }
    setLoadingDetails(false);
  };

  const closeDetails = () => {
    setSelectedMedia(null);
    setMediaDetails(null);
  };

  const handleRemove = async () => {
    if (!selectedMedia) return;
    await removeMoviePreference(role, selectedMedia.id);
    closeDetails();
  };

  const renderMediaCard = (media) => (
    <div key={media.id} className={styles.mediaCard} onClick={() => openDetails(media)}>
      <img 
        src={getImageUrl(media.poster_path)} 
        alt={media.title || media.name} 
        className={styles.poster}
        loading="lazy"
      />
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{media.title || media.name}</h3>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.title}>Librăria Mea</h1>
      </div>

      {likedMovies.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Librăria e goală</h2>
          <p>Filmele pe care le apreciezi (❤️) vor apărea aici pentru a le putea viziona mai târziu.</p>
          <button className={modalStyles.actionBtn} style={{background: 'var(--accent)'}} onClick={() => navigate(-1)}>Caută Filme</button>
        </div>
      ) : (
        <div className={styles.mediaGrid}>
          {likedMovies.map(renderMediaCard)}
        </div>
      )}

      {selectedMedia && (
        <div className={modalStyles.modalOverlay} onClick={closeDetails}>
          <div className={modalStyles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={modalStyles.closeModalBtn} onClick={closeDetails}>✕</button>
            
            <img 
              src={getImageUrl(selectedMedia.backdrop_path || selectedMedia.poster_path, 'w780')} 
              alt="Backdrop" 
              className={modalStyles.backdrop} 
            />

            <div className={modalStyles.modalDetails}>
              <div className={modalStyles.modalHeader}>
                <div style={{flex: 1}}>
                  <h2 className={modalStyles.modalTitle}>{selectedMedia.title || selectedMedia.name}</h2>
                  {loadingDetails ? (
                    <p>Se încarcă detaliile...</p>
                  ) : mediaDetails ? (
                    <>
                      <p className={modalStyles.modalMeta}>
                        ⭐ {mediaDetails.vote_average?.toFixed(1)}/10 • {mediaDetails.release_date?.substring(0,4) || mediaDetails.first_air_date?.substring(0,4)}
                      </p>
                      <div className={modalStyles.modalGenres}>
                        {mediaDetails.genres?.map(g => (
                          <span key={g.id} className={modalStyles.genreTag}>{g.name}</span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {mediaDetails && (
                <>
                  <p className={modalStyles.overview}>{mediaDetails.overview}</p>
                  
                  {mediaDetails.credits?.cast?.length > 0 && (
                    <div style={{marginTop: '20px'}}>
                      <h3 style={{fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)'}}>Distribuție</h3>
                      <div className={modalStyles.castList}>
                        {mediaDetails.credits.cast.slice(0, 10).map(actor => actor.profile_path && (
                          <div key={actor.id} className={modalStyles.actorCard}>
                            <img src={getImageUrl(actor.profile_path, 'w200')} alt={actor.name} className={modalStyles.actorImage} />
                            <span className={modalStyles.actorName}>{actor.name}</span>
                            <span className={modalStyles.actorCharacter}>{actor.character}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mediaDetails?.videos?.results?.length > 0 && (
                <button 
                  className={modalStyles.trailerBtn} 
                  onClick={() => {
                    const trailer = mediaDetails.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || mediaDetails.videos.results[0];
                    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
                  }}
                >
                  ▶️ Urmărește Trailer
                </button>
              )}

              <div className={modalStyles.actionButtons}>
                <button 
                  className={modalStyles.dislikeBtn} 
                  onClick={handleRemove}
                >
                  ❌ Elimină din Listă
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
