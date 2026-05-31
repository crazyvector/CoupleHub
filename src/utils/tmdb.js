const TMDB_API_KEY = 'ebcdb33e1581668fb4fa8e0ca678e7e1';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYmNkYjMzZTE1ODE2NjhmYjRmYThlMGNhNjc4ZTdlMSIsIm5iZiI6MTc4MDIzNTA3OS44NzAwMDAxLCJzdWIiOiI2YTFjM2I0NzcwOTY0N2JkZTZmMGI2ZjYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.ayb-djCgm61j7c9oUT7lQ_b1JD1UL0whbdFAOyAxStI';
const BASE_URL = 'https://api.themoviedb.org/3';

export const MOVIE_GENRES = [
  { id: 28, name: 'Acțiune' },
  { id: 12, name: 'Aventură' },
  { id: 16, name: 'Animație' },
  { id: 35, name: 'Comedie' },
  { id: 80, name: 'Crimă' },
  { id: 99, name: 'Documentar' },
  { id: 18, name: 'Dramă' },
  { id: 10751, name: 'Familie' },
  { id: 14, name: 'Fantezie' },
  { id: 36, name: 'Istorie' },
  { id: 27, name: 'Groază' },
  { id: 10402, name: 'Muzică' },
  { id: 9648, name: 'Mister' },
  { id: 10749, name: 'Romantic' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'Film TV' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Război' },
  { id: 37, name: 'Western' }
];

export const TV_GENRES = [
  { id: 10759, name: 'Acțiune & Aventură' },
  { id: 16, name: 'Animație' },
  { id: 35, name: 'Comedie' },
  { id: 80, name: 'Crimă' },
  { id: 99, name: 'Documentar' },
  { id: 18, name: 'Dramă' },
  { id: 10751, name: 'Familie' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mister' },
  { id: 10763, name: 'Știri' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'Război & Politică' },
  { id: 37, name: 'Western' }
];

const fetchTMDB = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('language', 'ro-RO'); // Vrem detalii în română acolo unde sunt disponibile
  
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
      }
    });
    if (!res.ok) {
      throw new Error(`TMDb API error: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('TMDb request failed:', error);
    return null;
  }
};

// Obține imagini
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Căutare generală Filme și Seriale
export const searchMedia = async (query, page = 1) => {
  return await fetchTMDB('/search/multi', { query, page, include_adult: false });
};

// Trending (Azi sau Săptămâna Asta)
export const getTrending = async (type = 'all', timeWindow = 'day') => {
  return await fetchTMDB(`/trending/${type}/${timeWindow}`);
};

// Descoperă filme/seriale pe baza genurilor și a sortării
export const discoverMedia = async (type = 'movie', genresString = '', page = 1, sortBy = 'popularity.desc') => {
  return await fetchTMDB(`/discover/${type}`, {
    with_genres: genresString,
    page,
    sort_by: sortBy,
    include_adult: false,
    'vote_count.gte': sortBy.includes('vote_average') ? 100 : 0 // Evităm filme obscure cu nota 10
  });
};

// Detalii specifice unui film/serial (inclusiv actori, trailere)
export const getMediaDetails = async (type, id) => {
  return await fetchTMDB(`/${type}/${id}`, { append_to_response: 'credits,videos,similar' });
};

// Pentru Couple Match: Găsește filme care se potrivesc cu 2 seturi de preferințe
// Dacă Andrei vrea X și Ana vrea Y, combinăm id-urile de gen.
export const getCoupleMatch = async (hisGenres = [], herGenres = [], type = 'movie') => {
  const combinedGenres = [...new Set([...hisGenres, ...herGenres])];
  
  // Dacă vrem să fie filme care au MACAR unul din genuri (with_genres este AND/OR, dar despărțite prin virgulă e AND, pipe e OR)
  // Vrem filme care îmbină ambele lumi (cu AND) dacă sunt puține genuri, sau OR dacă sunt multe.
  // Pentru TMDb: cu virgulă înseamnă AND, cu | înseamnă OR.
  // Ne vom rezuma la "OR" ca să nu dăm un set vid, apoi filtrăm local pe baza scorurilor.
  const genresOr = combinedGenres.join('|');
  
  return await fetchTMDB(`/discover/${type}`, {
    with_genres: genresOr,
    sort_by: 'popularity.desc',
    'vote_average.gte': 6.0, // Filme cu notă minim 6
    'vote_count.gte': 100, // Filme care nu sunt obscure
    page: 1,
    include_adult: false
  });
};
