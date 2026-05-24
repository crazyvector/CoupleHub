// Script one-shot pentru seed Truth or Dare în Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Citit din .env sau hardcodat pt seed
};

// Rulat cu: node --experimental-vm-modules seed_truth_dare.mjs
// SAU mai simplu: adaugă direct din adminPage sau din codul de init al appului

const TRUTHS = [
  { label: 'Care e cel mai mare secret al tău?', color: '#A78BFA' },
  { label: 'Ce te sperie cel mai mult în viată?', color: '#8B5CF6' },
  { label: 'Care e momentul de care îți e cel mai rușine?', color: '#7C3AED' },
  { label: 'Dacă ai putea schimba ceva la tine, ce ar fi?', color: '#C4B5FD' },
  { label: 'Care e cel mai mare vis al tău neîmplinit?', color: '#DDD6FE' },
  { label: 'Ce calitate apreciezi cel mai mult la mine?', color: '#A78BFA' },
  { label: 'Care e amintirea ta preferată cu noi?', color: '#8B5CF6' },
  { label: 'Ce te-a atras prima dată la mine?', color: '#7C3AED' },
  { label: 'Care e lucrul pe care nu l-ai spus niciodată nimănui?', color: '#C4B5FD' },
  { label: 'Cum îți imaginezi viata noastră peste 10 ani?', color: '#A78BFA' },
];

const DARES = [
  { label: 'Mimează-ți personajul preferat din filme!', color: '#FB923C' },
  { label: 'Cântă 30 de secunde din melodia ta preferată!', color: '#F97316' },
  { label: 'Fă 10 flotări acum!', color: '#EA580C' },
  { label: 'Spune 3 lucruri pe care le admiri la mine!', color: '#FDBA74' },
  { label: 'Dansează 1 minut fără muzică!', color: '#FED7AA' },
  { label: 'Vorbește cu accent timp de 2 minute!', color: '#F97316' },
  { label: 'Fă o poză haioasă și pune-o story!', color: '#FB923C' },
  { label: 'Imită 3 emoji-uri diferite!', color: '#EA580C' },
  { label: 'Spune câte cuvinte poți în 30 de secunde!', color: '#FDBA74' },
  { label: 'Fă o glumă (bună sau proastă, nu contează)!', color: '#F97316' },
];

console.log('Truths:', TRUTHS.length, 'Dares:', DARES.length);
export { TRUTHS, DARES };
