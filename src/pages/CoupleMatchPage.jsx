import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CoupleMatchPage.module.css';
import { MOVIE_GENRES, getCoupleMatch, getImageUrl } from '../utils/tmdb';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function CoupleMatchPage({ role }) {
  const navigate = useNavigate();
  const [myGenres, setMyGenres] = useState([]);
  const [partnerGenres, setPartnerGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const partnerRole = role === 'his' ? 'her' : 'his';
  const matchDocRef = doc(db, 'system', 'couple_movie_match');

  // Ascultăm după selecțiile din Firebase (live sync)
  useEffect(() => {
    const unsub = onSnapshot(matchDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data[role]) setMyGenres(data[role]);
        if (data[partnerRole]) setPartnerGenres(data[partnerRole]);
      }
    });
    return () => unsub();
  }, [role]);

  const toggleMyGenre = async (genreId) => {
    let newGenres = [...myGenres];
    if (newGenres.includes(genreId)) {
      newGenres = newGenres.filter(id => id !== genreId);
    } else {
      if (newGenres.length >= 3) {
        alert("Poți alege maxim 3 genuri!");
        return;
      }
      newGenres.push(genreId);
    }
    setMyGenres(newGenres);
    
    // Salvează în Firebase ca să vadă și partenerul
    try {
      await setDoc(matchDocRef, { [role]: newGenres }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFindMatch = async () => {
    if (myGenres.length === 0 && partnerGenres.length === 0) {
      alert("Alegeți măcar un gen!");
      return;
    }
    setLoading(true);
    const data = await getCoupleMatch(myGenres, partnerGenres, 'movie');
    if (data && data.results) {
      setResults(data.results.slice(0, 10)); // Top 10 matches
    }
    setLoading(false);
  };

  const clearSelection = async () => {
    setMyGenres([]);
    setPartnerGenres([]);
    setResults([]);
    await setDoc(matchDocRef, { [role]: [], [partnerRole]: [] }, { merge: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/movies')}>←</button>
        <div>
          <h1 className={styles.title}>Couple Match 💞</h1>
        </div>
      </div>
      <p className={styles.subtitle}>Ce aveți chef să vedeți în seara asta?</p>

      <div className={styles.rolesContainer}>
        {/* Eu */}
        <div className={`${styles.roleCard} ${styles.isMe}`}>
          <div className={styles.roleTitle}>
            <span>{role === 'his' ? '🧔‍♂️' : '👩‍🦰'} Alegerile mele</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
              (Alege max 3)
            </span>
          </div>
          <div className={styles.genresGrid}>
            {MOVIE_GENRES.map(g => {
              const isSelected = myGenres.includes(g.id);
              return (
                <div 
                  key={g.id} 
                  className={`${styles.genreTag} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleMyGenre(g.id)}
                >
                  {g.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Partenerul */}
        <div className={styles.roleCard}>
          <div className={styles.roleTitle}>
            <span>{partnerRole === 'his' ? '🧔‍♂️' : '👩‍🦰'} Alegerile {partnerRole === 'his' ? 'lui' : 'ei'}</span>
          </div>
          {partnerGenres.length === 0 ? (
            <div className={styles.partnerPending}>Așteptăm să aleagă...</div>
          ) : (
            <div className={styles.genresGrid}>
              {MOVIE_GENRES.filter(g => partnerGenres.includes(g.id)).map(g => (
                <div key={g.id} className={`${styles.genreTag} ${styles.selected}`} style={{ cursor: 'default' }}>
                  {g.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button 
        className={styles.findMatchBtn} 
        onClick={handleFindMatch}
        disabled={loading || myGenres.length === 0 || partnerGenres.length === 0}
      >
        {loading ? 'Căutăm...' : (myGenres.length === 0 || partnerGenres.length === 0) ? 'Așteptăm selecțiile...' : '🍿 Găsește Filmul Perfect'}
      </button>

      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>Recomandări pentru voi</h2>
            <button onClick={clearSelection} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Resetează</button>
          </div>
          <div className={styles.resultsGrid} style={{ marginTop: 15 }}>
            {results.map(movie => (
              <div key={movie.id} className={styles.matchCard}>
                <img src={getImageUrl(movie.poster_path)} alt={movie.title} className={styles.poster} />
                <div className={styles.cardInfo}>
                  <div className={styles.mediaTitle}>{movie.title}</div>
                  <div className={styles.mediaScore}>⭐ {movie.vote_average?.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
