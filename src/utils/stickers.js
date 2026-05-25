// Base URL for high-quality SVG Twemojis
const BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/';

export const stickerPacks = [
  {
    id: 'animals',
    name: '🐶 Animăluțe',
    stickers: [
      `${BASE_URL}1f408.svg`, // Cat
      `${BASE_URL}1f431.svg`, // Cat face
      `${BASE_URL}1f63b.svg`, // Heart eyes cat
      `${BASE_URL}1f436.svg`, // Dog
      `${BASE_URL}1f430.svg`, // Bunny
      `${BASE_URL}1f98a.svg`, // Fox
      `${BASE_URL}1f43b.svg`, // Bear
      `${BASE_URL}1f427.svg`, // Penguin
    ]
  },
  {
    id: 'couples',
    name: '❤️ Cupluri',
    stickers: [
      `${BASE_URL}2764.svg`,   // Red heart
      `${BASE_URL}1f48b.svg`,  // Kiss mark
      `${BASE_URL}1f491.svg`,  // Couple with heart
      `${BASE_URL}1f970.svg`,  // Smiling face with hearts
      `${BASE_URL}1f496.svg`,  // Sparkling heart
      `${BASE_URL}1f46b.svg`,  // Holding hands
      `${BASE_URL}1f49d.svg`,  // Heart with ribbon
      `${BASE_URL}1f48f.svg`,  // Kiss couple
    ]
  },
  {
    id: 'funny',
    name: '🤪 Amuzante',
    stickers: [
      `${BASE_URL}1f602.svg`,  // Tears of joy
      `${BASE_URL}1f92a.svg`,  // Zany face
      `${BASE_URL}1f974.svg`,  // Woozy face
      `${BASE_URL}1f921.svg`,  // Clown
      `${BASE_URL}1f480.svg`,  // Skull
      `${BASE_URL}1f92f.svg`,  // Mind blown
      `${BASE_URL}1f4a5.svg`,  // Collision
      `${BASE_URL}1f47d.svg`,  // Alien
    ]
  }
];
