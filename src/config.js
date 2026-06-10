// ============================================================
//  💕 COUPLE HUB — CONFIGURARE PERSONALIZATĂ
//  Editează DOAR acest fișier pentru a personaliza aplicația!
// ============================================================

const config = {
  secretPassword: import.meta.env.VITE_SECRET_PASSWORD || '',
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || '',

  relationshipStartDate: import.meta.env.VITE_RELATIONSHIP_START || '',

  upcomingEvent: {
    emoji: '✈️',
    date: import.meta.env.VITE_UPCOMING_EVENT_DATE || '2026-08-20T10:00:00',
    gradientFrom: '#FFB5C8',
    gradientTo: '#C8B6FF',
    titleKey: 'config.upcomingEventTitle'
  },

  her: {
    name: '',
    petName: '',
  },

  letterUnlockHour: 8,

  telegram: {
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
    myChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
  },

  spinnerItems: [
    { key: 'spinner.pizza', color: '#FFB5C8' },
    { key: 'spinner.sushi', color: '#B5EAD7' },
    { key: 'spinner.pasta', color: '#FFCBA4' },
    { key: 'spinner.salad', color: '#C8B6FF' },
    { key: 'spinner.burger', color: '#FFD7BA' },
    { key: 'spinner.cookAtHome', color: '#B5D8EB' },
    { key: 'spinner.ramen', color: '#FFC8DD' },
    { key: 'spinner.steak', color: '#FFABAB' },
  ],

  coupons: [
    { id: 'massage', emoji: '💆‍♀️', color: '#FFB5C8' },
    { id: 'cooking', emoji: '👨‍🍳', color: '#B5EAD7' },
    { id: 'movie', emoji: '🎬', color: '#C8B6FF' },
    { id: 'breakfast', emoji: '🥐', color: '#FFCBA4' },
    { id: 'date', emoji: '🌹', color: '#FFD7BA' },
    { id: 'walk', emoji: '🚶‍♂️', color: '#B5D8EB' },
  ],

  memories: [
    {
      id: 1,
      coordinates: [44.4268, 26.1025], 
      date: '15 Martie 2024',
      emoji: '💑',
      titleKey: 'memories.firstDateTitle',
      descKey: 'memories.firstDateDesc'
    },
    {
      id: 2,
      coordinates: [44.1598, 28.6348], 
      date: 'Iulie 2024',
      emoji: '🌅',
      titleKey: 'memories.firstVacationTitle',
      descKey: 'memories.firstVacationDesc'
    },
    {
      id: 3,
      coordinates: [45.6427, 25.5887], 
      date: 'Decembrie 2024',
      emoji: '🏔️',
      titleKey: 'memories.mountainTripTitle',
      descKey: 'memories.mountainTripDesc'
    },
  ],

  scratchCard: {
    revealImage: '/assets/scratch-reveal.jpg',
  },
};

export default config;
