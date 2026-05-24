// ============================================================
//  💕 COUPLE HUB — CONFIGURARE PERSONALIZATĂ
//  Editează DOAR acest fișier pentru a personaliza aplicația!
// ============================================================

const config = {
  // -----------------------------------------------------------
  // 🔐 PAROLA EI (SECRETĂ)
  // -----------------------------------------------------------
  secretPassword: '26032025',

  // -----------------------------------------------------------
  // 🔧 PAROLA DE ADMIN (SECRETĂ — doar pentru tine!)
  // -----------------------------------------------------------
  adminPassword: '24042003',

  // -----------------------------------------------------------
  // 💑 DATA RELAȚIEI
  // De când suntem împreună — format: ISO 8601 (YYYY-MM-DD)
  // Exemplu: '2024-03-15T18:30:00' (include ora dacă vrei precizie)
  // -----------------------------------------------------------
  relationshipStartDate: '2025-03-26',

  // -----------------------------------------------------------
  // 🌍 COUNTDOWN EVENIMENT VIITOR
  // Un eveniment special la care numărați amândoi zilele
  // -----------------------------------------------------------
  upcomingEvent: {
    title: 'Vacanță în Toscana 🌿',
    emoji: '✈️',
    date: '2026-08-20T10:00:00',
    // Culori gradient pentru cardul countdown
    gradientFrom: '#FFB5C8',
    gradientTo: '#C8B6FF',
  },

  // -----------------------------------------------------------
  // 👤 PERSONALIZARE MESAJE
  // -----------------------------------------------------------
  her: {
    name: 'Ana Dicu',        // Numele ei (apare în greeting)
    petName: 'Pui',    // Alintul preferat
  },

  // -----------------------------------------------------------
  // ⏰ SCRISOAREA ZILEI — Ora de deblocare
  // Scrisoarea devine vizibilă după această oră (format 24h)
  // -----------------------------------------------------------
  letterUnlockHour: 8, // 08:00 dimineața

  // -----------------------------------------------------------
  // 📱 TELEGRAM NOTIFICĂRI
  //
  // CUM CREEZI UN BOT TELEGRAM:
  //  1. Deschide Telegram și caută @BotFather
  //  2. Trimite /newbot și urmează instrucțiunile
  //  3. Copiază TOKEN-ul primit (arată ca: 1234567890:ABCdef...)
  //
  // CUM GĂSEȘTI CHAT ID-UL TĂU:
  //  1. Trimite un mesaj botului tău
  //  2. Accesează: https://api.telegram.org/bot<TOKEN>/getUpdates
  //  3. Copiază valoarea "id" din "chat" -> "id"
  // -----------------------------------------------------------
  telegram: {
    botToken: 'PUNE_TOKEN_BOT_TELEGRAM_AICI',
    myChatId: 'PUNE_CHAT_ID_AL_TAU_AICI',
  },

  // -----------------------------------------------------------
  // 🎰 ROATA NOROCULUI — „Ce mâncăm deseară?"
  // Personalizează lista cu restaurantele/mâncărurile voastre
  // -----------------------------------------------------------
  spinnerItems: [
    { label: 'Pizza 🍕', color: '#FFB5C8' },
    { label: 'Sushi 🍱', color: '#B5EAD7' },
    { label: 'Paste 🍝', color: '#FFCBA4' },
    { label: 'Salată 🥗', color: '#C8B6FF' },
    { label: 'Burger 🍔', color: '#FFD7BA' },
    { label: 'Acasă gătim 👨‍🍳', color: '#B5D8EB' },
    { label: 'Ramen 🍜', color: '#FFC8DD' },
    { label: 'Steak 🥩', color: '#FFABAB' },
  ],

  // -----------------------------------------------------------
  // 🎟️ CUPOANE DIGITALE
  // Personalizează lista de cupoane romantice
  // -----------------------------------------------------------
  coupons: [
    {
      id: 'massage',
      emoji: '💆‍♀️',
      title: 'Masaj',
      description: 'Un masaj relaxant de 30 minute, oricând vrei',
      color: '#FFB5C8',
    },
    {
      id: 'cooking',
      emoji: '👨‍🍳',
      title: 'Gătesc eu',
      description: 'Aleg eu rețeta și gătesc tot — tu te odihnești',
      color: '#B5EAD7',
    },
    {
      id: 'movie',
      emoji: '🎬',
      title: 'Seară de Film',
      description: 'Tu alegi filmul, eu aduc snacks-urile',
      color: '#C8B6FF',
    },
    {
      id: 'breakfast',
      emoji: '🥐',
      title: 'Mic dejun la pat',
      description: 'Mic dejun surprise servit în pat',
      color: '#FFCBA4',
    },
    {
      id: 'date',
      emoji: '🌹',
      title: 'Date Night',
      description: 'O seară romantică planificată 100% de mine',
      color: '#FFD7BA',
    },
    {
      id: 'walk',
      emoji: '🚶‍♂️',
      title: 'Plimbare surpriză',
      description: 'O plimbare secretă spre un loc frumos',
      color: '#B5D8EB',
    },
  ],

  // -----------------------------------------------------------
  // 🗺️ AMINTIRI PE HARTĂ
  // Coordonate GPS ale locurilor voastre speciale
  // Formatul: [latitudine, longitudine]
  // Sfat: click dreapta pe Google Maps → „Ce e aici?" pentru coord.
  // -----------------------------------------------------------
  memories: [
    {
      id: 1,
      coordinates: [44.4268, 26.1025], // București (exemplu)
      title: 'Prima noastră întâlnire 💕',
      description: 'Locul unde totul a început...',
      date: '15 Martie 2024',
      // imagePath: '/assets/memories/prima-intalnire.jpg', // decomentează când adaugi poza
      emoji: '💑',
    },
    {
      id: 2,
      coordinates: [44.1598, 28.6348], // Constanța (exemplu)
      title: 'Prima vacanță la mare 🌊',
      description: 'Apusul de soare pe care nu îl vom uita niciodată',
      date: 'Iulie 2024',
      emoji: '🌅',
    },
    {
      id: 3,
      coordinates: [45.6427, 25.5887], // Brașov (exemplu)
      title: 'Weekend la munte ⛰️',
      description: 'Frig afară, cald în suflet',
      date: 'Decembrie 2024',
      emoji: '🏔️',
    },
  ],

  // -----------------------------------------------------------
  // 🎴 SCRATCH CARD — Imagine ascunsă
  // Pune imaginea în /public/assets/ și specifică path-ul
  // -----------------------------------------------------------
  scratchCard: {
    revealImage: '/assets/scratch-reveal.jpg', // imaginea generată (înlocuiește cu o poză personală dacă vrei!)
    message: 'Te iubesc la infinit! ♾️💕',
  },
};

export default config;
