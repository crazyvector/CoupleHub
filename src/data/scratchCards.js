export const scratchCards = [
  { message: "Masaj de 30 de minute garantat!", emoji: "💆‍♀️" },
  { message: "Astăzi alegi tu filmul!", emoji: "🍿" },
  { message: "Mic dejun la pat mâine dimineață", emoji: "🥞" },
  { message: "O îmbrățișare lungă de 5 minute", emoji: "🫂" },
  { message: "Cina gătită de mine în seara asta", emoji: "🍝" },
  { message: "Un desert la alegerea ta", emoji: "🍰" },
  { message: "O plimbare de seară doar noi doi", emoji: "🌙" },
  { message: "O seară de jocuri (board games sau video)", emoji: "🎲" },
  { message: "Astăzi te scutesc de o sarcină casnică", emoji: "🧹" },
  { message: "Un compliment sincer și din suflet", emoji: "💌" },
  // Vom recicla aceste carduri dacă sunt necesare mai multe
];

export function getDailyScratchCard() {
  const now = new Date();
  // Ziua anului (1 - 365)
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  
  return scratchCards[day % scratchCards.length];
}
