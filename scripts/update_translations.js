import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translations } from '../src/data/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure all sections exist
translations.ro.dailyLetters = {};
translations.en.dailyLetters = {};

translations.ro.truthDare = translations.ro.truthDare || {};
translations.en.truthDare = translations.en.truthDare || {};

translations.ro.scratchCards = {};
translations.en.scratchCards = {};

translations.ro.errors = translations.ro.errors || {};
translations.en.errors = translations.en.errors || {};

translations.ro.stickers = translations.ro.stickers || {};
translations.en.stickers = translations.en.stickers || {};

translations.ro.homePlanner = translations.ro.homePlanner || {};
translations.en.homePlanner = translations.en.homePlanner || {};

translations.ro.config = translations.ro.config || {};
translations.en.config = translations.en.config || {};

translations.ro.spinner = translations.ro.spinner || {};
translations.en.spinner = translations.en.spinner || {};

translations.ro.memories = translations.ro.memories || {};
translations.en.memories = translations.en.memories || {};

translations.ro.storage = translations.ro.storage || {};
translations.en.storage = translations.en.storage || {};

translations.ro.monetization = translations.ro.monetization || {};
translations.en.monetization = translations.en.monetization || {};

translations.ro.genres = translations.ro.genres || {};
translations.en.genres = translations.en.genres || {};

// Daily Letters
const dailyLettersRO = [
  { title: 'Bună dimineața, soarele meu 🌅', content: 'Știu că poate dimineața nu ești cel mai comunicativ om, dar chiar și în tăcerea ta îmi aduci căldură. Gândul că ești acolo, undeva, respirând același aer, îmi face ziua mai bună înainte să fi început măcar. Îți mulțumesc că exiști.' },
  { title: 'Toate lucrurile mici 🍃', content: 'Felul în care râzi cu toată fața. Cum îți asculți muzica cu ochii închiși. Cum ții cana cu ambele mâini când bei ceva cald. Toate aceste lucruri mici pe care poate nu le observi tu — eu le colecționez. Le port cu mine oriunde merg.' },
  { title: 'Un gând de miercuri 💭', content: 'Uneori, în mijlocul unei zile complet obișnuite, îmi amintesc că te iubesc și mă surprind zâmbind de unul singur. Lumea din jur crede că am înnebunit. Poate că au dreptate.' },
  { title: 'Ce înseamnă „acasă" pentru mine 🏡', content: 'Acasă nu este un loc. Acasă ești tu — felul tău de a-ți aranja pernele, vocea ta din altă cameră, prezența ta liniștitoare. Oriunde ești tu, acolo mă simt în siguranță.' },
  { title: 'Îți mulțumesc pentru ieri 🙏', content: 'Nu știu exact ce a fost ieri pentru tine, dar vreau să îți mulțumesc oricum. Pentru că ai ales să fii tu. Pentru că nu te-ai prefăcut. Pentru că m-ai lăsat să fiu și eu eu, lângă tine.' },
  { title: 'O dragoste care alege 💫', content: 'Iubirea nu este doar un sentiment — este o alegere pe care o fac în fiecare zi. Și în fiecare zi, fără să ezit, te aleg pe tine. Nu pentru că trebuie, ci pentru că nu îmi imaginez altfel.' },
  { title: 'Zâmbetul tău e vinovatul 😊', content: 'Există zile în care lumea pare prea grea și prea complicată. Și apoi îți văd zâmbetul și îmi amintesc că totul e bine. Tu ești argumentul cel mai puternic pe care îl am că viața merită trăită frumos.' },
  { title: 'În versuri simple 📝', content: 'Nu am talent la poezie, dar dacă aș scrie una, ar fi despre tine. Despre cum faci ca lucrurile banale să pară extraordinare. Despre cum fiecare zi cu tine are o greutate specială — tipul bun de greutate, cel care te ancorează.' },
  { title: 'Aventura noastră continuă ✈️', content: 'Știi ce mă entuziasmează cel mai tare? Nu destinațiile — ci că le vom vedea împreună. Că vom fi pierduți pe străzi necunoscute, amândoi, râzând de harta greșită și mâncând ceva de care nu am mai auzit. Cu tine, orice drum devine poveste.' },
  { title: 'Înăuntrul momentelor normale 🌿', content: 'Uneori cel mai bun lucru nu e vacanța sau ocazia specială — e seara obișnuită, pe canapea, fără nimic de spus, și totuși fericită. Cu tine, normalul devine ceva de prețuit.' },
  { title: 'Dacă ar fi să te descriu 🎨', content: 'Ești felul în care mirosul de cafea te face să te simți bine dimineața. Ești playlist-ul perfect pentru un drum lung. Ești cartea la care te întorci mereu, deși știi cum se termină — tocmai pentru că știi cum se termină.' },
  { title: 'Promisiunea mea zilnică 🤝', content: 'Nu îți promit că voi fi perfect. Dar îți promit că voi fi prezent. Că voi asculta. Că voi încerca. Că în zilele în care nu știu cum să ajut, voi rămâne oricum lângă tine, tăcut și stabil.' },
  { title: 'Un secret pe care îl știu 🤫', content: 'Știu cum te simți când ești obosită dar nu vrei să arăți. Știu privirea ta de când ceva te îngrijorează dar nu ești sigură că merită menționat. Știu toate astea și te iubesc și mai mult pentru ele.' },
  { title: 'Bucuria mică a zilei 🌸', content: 'Azi vreau să observi un lucru frumos — orice: o culoare, un miros, o senzație. Și să știi că eu te-am gândit pe tine exact în acel moment. Suntem conectați prin toate lucrurile frumoase din lume.' },
  { title: 'Jumătatea mea bună 💛', content: 'Există o teorie că oamenii sunt mai buni lângă persoana potrivită. Nu știu dacă e adevărată în general, dar știu că lângă tine devin versiunea mea cea mai bună. Mă faci să vreau să merit.' },
  { title: 'Când te văd dimineața 🌤️', content: 'Există ceva magic în felul în care arăți dimineața, înainte să înceapă ziua. Ești dezarmată, ești reală, ești tu. Și eu mă simt privilegiat că pot vedea asta.' },
  { title: 'Scrisoarea fără cuvinte mari 💬', content: 'Nu am azi cuvinte mari. Am doar gândul simplu că ești importantă pentru mine. Că ziua mea e mai bună știind că ești în ea. Uneori simplul e cel mai sincer.' },
  { title: 'Pentru zilele mai grele 🌧️', content: 'Dacă azi e o zi mai dificilă, vreau să știi că e în regulă. Nu trebuie să fii bine tot timpul. Dar oriunde ești — în vârful zilei sau în vale — eu sunt în colțul tău. Mereu.' },
  { title: 'Imagini din viitorul nostru 🔭', content: 'Uneori îmi imaginez dimineți de weekend lente, cu cafele și fără grabă. Cu tine citind ceva sau urmărind ceva, și eu privindu-te, fericit că am ales atât de bine. Abia aștept toate acele dimineți.' },
  { title: 'Lucruri pe care nu ți le-am spus 💌', content: 'Că felul în care gesticulezi când ești entuziastă e adorabil. Că râsul tău e contagios în cel mai bun mod posibil. Că mă simt mai inteligent când discut cu tine. Că ești mai frumoasă decât îți dai seama.' },
  { title: 'Trei lucruri de azi 🌟', content: 'Unu: ești minunată. Doi: merit să îți aminteacă cineva asta în fiecare zi. Trei: eu vreau să fiu acel cineva cât mai mult timp posibil.' },
  { title: 'Dragostea ca practică zilnică 🧘‍♀️', content: 'Dragostea nu este un singur moment dramatic — este mia de momente mici: un mesaj trimis la momentul potrivit, o amintire, o mână întinsă. Vreau să practic toate astea cu tine, zi de zi.' },
  { title: 'Magia din obișnuit ✨', content: 'E ceva magic în a iubi pe cineva atât de mult timp încât obișnuitul devine sacru. Ritualurile mici devin comori. Sper să ajungem acolo — și cred că suntem deja pe drum.' },
  { title: 'Curiozitatea mea despre tine 🔍', content: 'Deși te știu, mă fascinezi în continuare. Vreau să știu ce gândești când ești pe gânduri. Ce îți place la tine și ce nu. Ce vise ai că nu mi le-ai spus încă. Ești un univers și abia am început să explorez.' },
  { title: 'Când e greu, ne avem 🫂', content: 'Viața nu va fi mereu ușoară — pentru niciunul dintre noi. Dar în toate scenariile pe care mi le imaginez, tu ești lângă mine. Și în toate, reușim. Nu pentru că e simplu, ci pentru că suntem împreună.' },
  { title: 'Mulțumesc că ești tu 🌺', content: 'Nu mulțumesc pentru ce faci pentru mine — deși faci mult. Mulțumesc pentru cine ești. Pentru valorile tale, pentru bunătatea ta, pentru felul în care te porți cu lumea. Ești omul bun pe care mi l-am dorit.' },
  { title: 'O cafea imaginară ☕', content: 'Imaginez-ți că îți aduc o cafea chiar acum — exact cum îți place. Și stăm în liniște, fără telefoane, fără grabă. Asta îmi doresc pentru noi: momente în care timpul pare că stă pe loc.' },
  { title: 'Puterea unui „bine că ești tu" 💪', content: 'Nu știu ce provocări ai azi. Dar știu că le faci față, pentru că ești mai puternică decât crezi. Și eu sunt în tribul tău, mereu, cel mai tare fan al tău.' },
  { title: 'Seara, la final de zi 🌙', content: 'Sper că ziua ta a fost blândă cu tine. Și dacă nu a fost — sper că această seară să compenseze. Ești merituoasă de zile frumoase, de odihnă bună și de vise liniștite.' },
  { title: 'Iubire fără dată de expirare ♾️', content: 'Unele lucruri se termină. Aceasta nu va fi una dintre ele. Cel puțin, nu din vina mea. Te iubesc ieri, azi și în toate zilele care vor urma — fiecare zi cu câte o scrisoare nouă, dacă e nevoie.' }
];

const dailyLettersEN = [
  { title: 'Good morning, my sun 🌅', content: 'I know you might not be the most talkative person in the morning, but even your silence brings me warmth. Just knowing you are out there, breathing the same air, makes my day better before it even starts. Thank you for existing.' },
  { title: 'All the little things 🍃', content: 'The way you laugh with your whole face. How you listen to music with your eyes closed. How you hold your mug with both hands. All these little things you might not even notice — I collect them. I carry them with me wherever I go.' },
  { title: 'A Wednesday thought 💭', content: 'Sometimes, in the middle of a completely ordinary day, I remember that I love you and catch myself smiling. People around probably think I am crazy. Maybe they are right.' },
  { title: 'What "home" means to me 🏡', content: 'Home is not a place. Home is you — the way you arrange your pillows, your voice from another room, your calming presence. Wherever you are, that is where I feel safe.' },
  { title: 'Thank you for yesterday 🙏', content: 'I do not know exactly what yesterday was for you, but I want to thank you anyway. For choosing to be you. For not pretending. For letting me be myself next to you.' },
  { title: 'A love that chooses 💫', content: 'Love is not just a feeling — it is a choice I make every single day. And every day, without hesitation, I choose you. Not because I have to, but because I cannot imagine it any other way.' },
  { title: 'Your smile is the culprit 😊', content: 'There are days when the world seems too heavy and complicated. And then I see your smile and I remember everything is fine. You are the strongest argument I have that life is beautiful.' },
  { title: 'In simple verses 📝', content: 'I am no poet, but if I were to write a poem, it would be about you. About how you make mundane things seem extraordinary. About how every day with you has a special weight — the good kind of weight, the one that anchors you.' },
  { title: 'Our adventure continues ✈️', content: 'You know what excites me the most? Not the destinations — but that we will see them together. That we will be lost on unfamiliar streets, laughing at the wrong map, eating something we have never heard of. With you, every journey becomes a story.' },
  { title: 'Inside normal moments 🌿', content: 'Sometimes the best thing is not a vacation or a special occasion — it is an ordinary evening on the couch, with nothing to say, yet completely happy. With you, normal is something to cherish.' },
  { title: 'If I were to describe you 🎨', content: 'You are the way the smell of coffee makes you feel good in the morning. You are the perfect playlist for a long drive. You are the book you always return to, even though you know how it ends — precisely because you know how it ends.' },
  { title: 'My daily promise 🤝', content: 'I do not promise to be perfect. But I promise to be present. To listen. To try. That on the days I do not know how to help, I will stay by your side anyway, silent and steady.' },
  { title: 'A secret I know 🤫', content: 'I know how you feel when you are tired but do not want to show it. I know your look when something worries you but you are not sure it is worth mentioning. I know all this, and I love you even more for it.' },
  { title: 'A small joy today 🌸', content: 'Today I want you to notice one beautiful thing — anything: a color, a smell, a feeling. And know that I thought of you at that exact moment. We are connected through all the beautiful things in the world.' },
  { title: 'My better half 💛', content: 'There is a theory that people are better when they are with the right person. I do not know if it is true in general, but I know that next to you, I become my best version. You make me want to be worthy.' },
  { title: 'When I see you in the morning 🌤️', content: 'There is something magical about the way you look in the morning, before the day starts. You are unarmed, you are real, you are you. And I feel privileged to witness that.' },
  { title: 'A letter without big words 💬', content: 'I have no big words today. Just the simple thought that you are important to me. That my day is better knowing you are in it. Sometimes simple is the most sincere.' },
  { title: 'For the harder days 🌧️', content: 'If today is a difficult day, I want you to know it is okay. You do not have to be okay all the time. But wherever you are — at the peak of the day or in the valley — I am in your corner. Always.' },
  { title: 'Glimpses of our future 🔭', content: 'Sometimes I imagine slow weekend mornings, with coffee and no rush. With you reading or watching something, and me watching you, happy that I chose so well. I cannot wait for all those mornings.' },
  { title: 'Things I have not told you 💌', content: 'That the way you gesture when you are excited is adorable. That your laugh is contagious in the best possible way. That I feel smarter when I talk to you. That you are more beautiful than you realize.' },
  { title: 'Three things about today 🌟', content: 'One: you are wonderful. Two: you deserve someone to remind you of that every single day. Three: I want to be that someone for as long as possible.' },
  { title: 'Love as a daily practice 🧘‍♀️', content: 'Love is not a single dramatic moment — it is a thousand small moments: a text at the right time, a memory, an extended hand. I want to practice all these with you, day by day.' },
  { title: 'The magic of the ordinary ✨', content: 'There is something magical about loving someone for so long that the ordinary becomes sacred. Small rituals become treasures. I hope we get there — and I think we are already on our way.' },
  { title: 'My curiosity about you 🔍', content: 'Even though I know you, you still fascinate me. I want to know what you think when you are lost in thought. What you like about yourself and what you do not. What dreams you have that you have not told me yet. You are a universe, and I have just started exploring.' },
  { title: 'When it is hard, we have each other 🫂', content: 'Life will not always be easy — for either of us. But in every scenario I imagine, you are next to me. And in all of them, we succeed. Not because it is simple, but because we are together.' },
  { title: 'Thank you for being you 🌺', content: 'Not thank you for what you do for me — although you do a lot. Thank you for who you are. For your values, for your kindness, for the way you treat the world. You are the good person I always wished for.' },
  { title: 'An imaginary coffee ☕', content: 'Imagine I am bringing you a coffee right now — exactly how you like it. And we sit in silence, no phones, no rush. That is what I wish for us: moments where time seems to stand still.' },
  { title: 'The power of "glad it is you" 💪', content: 'I do not know what challenges you have today. But I know you will overcome them, because you are stronger than you think. And I am in your tribe, always, your biggest fan.' },
  { title: 'Evening, at the end of the day 🌙', content: 'I hope your day was gentle with you. And if it was not — I hope this evening makes up for it. You deserve beautiful days, good rest, and peaceful dreams.' },
  { title: 'Love with no expiration date ♾️', content: 'Some things end. This will not be one of them. At least, not because of me. I loved you yesterday, today, and in all the days to come — every day with a new letter, if needed.' }
];

dailyLettersRO.forEach((item, index) => {
  translations.ro.dailyLetters[index] = item;
  translations.en.dailyLetters[index] = dailyLettersEN[index];
});

// Scratch cards
const scratchCardsRO = [
  "Masaj de 30 de minute garantat!",
  "Astăzi alegi tu filmul!",
  "Mic dejun la pat mâine dimineață",
  "O îmbrățișare lungă de 5 minute",
  "Cina gătită de mine în seara asta",
  "Un desert la alegerea ta",
  "O plimbare de seară doar noi doi",
  "O seară de jocuri (board games sau video)",
  "Astăzi te scutesc de o sarcină casnică",
  "Un compliment sincer și din suflet"
];

const scratchCardsEN = [
  "Guaranteed 30-minute massage!",
  "You pick the movie tonight!",
  "Breakfast in bed tomorrow morning",
  "A long 5-minute hug",
  "Dinner cooked by me tonight",
  "A dessert of your choice",
  "An evening walk just the two of us",
  "A game night (board games or video games)",
  "Today I spare you from a household chore",
  "A sincere and heartfelt compliment"
];

scratchCardsRO.forEach((item, index) => {
  translations.ro.scratchCards[index] = item;
  translations.en.scratchCards[index] = scratchCardsEN[index];
});

// Truth or Dare (adding the ones from seed)
const truthsRO = [
  'Care e cel mai mare secret al tău?',
  'Ce te sperie cel mai mult în viată?',
  'Care e momentul de care îți e cel mai rușine?',
  'Dacă ai putea schimba ceva la tine, ce ar fi?',
  'Care e cel mai mare vis al tău neîmplinit?',
  'Ce calitate apreciezi cel mai mult la mine?',
  'Care e amintirea ta preferată cu noi?',
  'Ce te-a atras prima dată la mine?',
  'Care e lucrul pe care nu l-ai spus niciodată nimănui?',
  'Cum îți imaginezi viata noastră peste 10 ani?'
];

const truthsEN = [
  'What is your biggest secret?',
  'What scares you the most in life?',
  'What is your most embarrassing moment?',
  'If you could change something about yourself, what would it be?',
  'What is your biggest unfulfilled dream?',
  'What quality do you appreciate the most about me?',
  'What is your favorite memory of us?',
  'What attracted you to me in the first place?',
  'What is the one thing you have never told anyone?',
  'How do you imagine our life in 10 years?'
];

const daresRO = [
  'Mimează-ți personajul preferat din filme!',
  'Cântă 30 de secunde din melodia ta preferată!',
  'Fă 10 flotări acum!',
  'Spune 3 lucruri pe care le admiri la mine!',
  'Dansează 1 minut fără muzică!',
  'Vorbește cu accent timp de 2 minute!',
  'Fă o poză haioasă și pune-o story!',
  'Imită 3 emoji-uri diferite!',
  'Spune câte cuvinte poți în 30 de secunde!',
  'Fă o glumă (bună sau proastă, nu contează)!'
];

const daresEN = [
  'Mime your favorite movie character!',
  'Sing 30 seconds of your favorite song!',
  'Do 10 pushups now!',
  'Say 3 things you admire about me!',
  'Dance for 1 minute without music!',
  'Speak with an accent for 2 minutes!',
  'Take a funny photo and post it on your story!',
  'Imitate 3 different emojis!',
  'Say as many words as you can in 30 seconds!',
  'Tell a joke (good or bad, it does not matter)!'
];

translations.ro.truthDare.truthsSeed = truthsRO;
translations.en.truthDare.truthsSeed = truthsEN;
translations.ro.truthDare.daresSeed = daresRO;
translations.en.truthDare.daresSeed = daresEN;

// AddHomeItemModal & ItemDetailsModal & general additions
Object.assign(translations.ro.homePlanner, {
  kitchen: 'Bucătărie', living: 'Living', bedroom: 'Dormitor', bathroom: 'Baie', balcony: 'Balcon', hallway: 'Hol', attic: 'Pod / Mansardă', office: 'Birou',
  freeSearches: 'Căutări Libere', pleaseAddTitle: 'Te rog introdu măcar un titlu!', imageProcessError: 'Imaginea nu s-a putut procesa. Se va salva ideea fără imagine.', saveError: 'A apărut o eroare la salvare!', addNewIdea: 'Adaugă Idee Nouă', nameLabel: 'Nume / Produs *', namePlaceholder: 'Ex: Canapea colțar IKEA', roomLabel: 'Cameră', linkLabel: 'Link (URL produs/idee)', imageLabel: 'Imagine (Opțional)', priceLabel: 'Preț estimativ (Opțional)', pricePlaceholder: 'Ex: 2500 RON', tagsLabel: 'Etichete (Tags)', newTagPlaceholder: 'Tag nou...', saveIdea: 'Salvează Ideea', openProductLink: '🔗 Deschide Link Produs', yourOpinion: 'Părerea voastră:', you: 'Tu:', partner: 'Partenerul:', approved: '✅ Aprobat', rejected: '❌ Respins', waitingDecision: '⏳ Așteaptă decizia',
  dislike: '👎 Nu-mi place', perfect: '❤️ Perfect!', edit: '✏️ Editează', confirmDelete: 'Sigur vrei să ștergi acest element?', deleteIdea: '🗑️ Șterge Ideea', discussions: 'Discuții', noComments: 'Niciun comentariu. Începe discuția!', writeComment: 'Scrie un comentariu...', yes: 'DA ❤️', no: 'NU ❌', tags: { furniture: 'mobilă', technology: 'tehnologie', finishes: 'finisaje', decorations: 'decorațiuni', accessories: 'accesorii', lighting: 'iluminat', inspiration: 'inspirație' }
});

Object.assign(translations.en.homePlanner, {
  kitchen: 'Kitchen', living: 'Living Room', bedroom: 'Bedroom', bathroom: 'Bathroom', balcony: 'Balcony', hallway: 'Hallway', attic: 'Attic', office: 'Office',
  freeSearches: 'Free Searches', pleaseAddTitle: 'Please enter at least a title!', imageProcessError: 'Image could not be processed. Saving without image.', saveError: 'An error occurred while saving!', addNewIdea: 'Add New Idea', nameLabel: 'Name / Product *', namePlaceholder: 'Ex: IKEA Sofa', roomLabel: 'Room', linkLabel: 'Link (URL)', imageLabel: 'Image (Optional)', priceLabel: 'Estimated Price (Optional)', pricePlaceholder: 'Ex: 500 USD', tagsLabel: 'Tags', newTagPlaceholder: 'New tag...', saveIdea: 'Save Idea', openProductLink: '🔗 Open Product Link', yourOpinion: 'Your opinion:', you: 'You:', partner: 'Partner:', approved: '✅ Approved', rejected: '❌ Rejected', waitingDecision: '⏳ Waiting for decision',
  dislike: '👎 Dislike', perfect: '❤️ Perfect!', edit: '✏️ Edit', confirmDelete: 'Are you sure you want to delete this item?', deleteIdea: '🗑️ Delete Idea', discussions: 'Discussions', noComments: 'No comments yet. Start the discussion!', writeComment: 'Write a comment...', yes: 'YES ❤️', no: 'NO ❌', tags: { furniture: 'furniture', technology: 'technology', finishes: 'finishes', decorations: 'decorations', accessories: 'accessories', lighting: 'lighting', inspiration: 'inspiration' }
});

// Errors & Fallbacks
Object.assign(translations.ro.errors, {
  notAuthenticated: 'Neautentificat', keyNotFound: 'Cheia nu a fost găsită.', keyAlreadyAssociated: 'Această cheie este deja asociată unui cuplu activ!', loginError: 'Eroare la conectare', somethingWrong: 'Oops! S-a produs o eroare 😢', reloadApp: 'Reîncarcă aplicația'
});

Object.assign(translations.en.errors, {
  notAuthenticated: 'Not authenticated', keyNotFound: 'Key not found.', keyAlreadyAssociated: 'This key is already associated with an active couple!', loginError: 'Login error', somethingWrong: 'Oops! Something went wrong 😢', reloadApp: 'Reload app'
});

// Config & Common
Object.assign(translations.ro.config, {
  upcomingEventTitle: 'Vacanță în Toscana 🌿', telegramTokenPlaceholder: 'PUNE_TOKEN_BOT_TELEGRAM_AICI', telegramChatIdPlaceholder: 'PUNE_CHAT_ID_AL_TAU_AICI', defaultName: 'Partner'
});
Object.assign(translations.en.config, {
  upcomingEventTitle: 'Tuscany Vacation 🌿', telegramTokenPlaceholder: 'PUT_TELEGRAM_BOT_TOKEN_HERE', telegramChatIdPlaceholder: 'PUT_YOUR_CHAT_ID_HERE', defaultName: 'Partner'
});

Object.assign(translations.ro.spinner, {
  salad: 'Salată 🥗', cookAtHome: 'Acasă gătim 👨‍🍳', pizza: 'Pizza 🍕', sushi: 'Sushi 🍱', pasta: 'Paste 🍝', burger: 'Burger 🍔', ramen: 'Ramen 🍜', steak: 'Steak 🥩'
});
Object.assign(translations.en.spinner, {
  salad: 'Salad 🥗', cookAtHome: 'Cook at home 👨‍🍳', pizza: 'Pizza 🍕', sushi: 'Sushi 🍱', pasta: 'Pasta 🍝', burger: 'Burger 🍔', ramen: 'Ramen 🍜', steak: 'Steak 🥩'
});

Object.assign(translations.ro.coupons, {
  massage: { title: 'Masaj', description: 'Un masaj relaxant de 30 minute, oricând vrei' },
  cooking: { title: 'Gătesc eu', description: 'Aleg eu rețeta și gătesc tot — tu te odihnești' },
  movie: { title: 'Seară de Film', description: 'Tu alegi filmul, eu aduc snacks-urile' },
  breakfast: { title: 'Mic dejun la pat', description: 'Mic dejun surprise servit în pat' },
  date: { title: 'Date Night', description: 'O seară romantică planificată 100% de mine' },
  walk: { title: 'Plimbare surpriză', description: 'O plimbare secretă spre un loc frumos' }
});

Object.assign(translations.en.coupons, {
  massage: { title: 'Massage', description: 'A relaxing 30-minute massage, whenever you want' },
  cooking: { title: 'I cook', description: 'I pick the recipe and cook everything — you rest' },
  movie: { title: 'Movie Night', description: 'You pick the movie, I bring the snacks' },
  breakfast: { title: 'Breakfast in bed', description: 'Surprise breakfast served in bed' },
  date: { title: 'Date Night', description: 'A romantic evening planned 100% by me' },
  walk: { title: 'Surprise walk', description: 'A secret walk to a beautiful place' }
});

Object.assign(translations.ro.memories, {
  firstDateTitle: 'Prima noastră întâlnire 💕', firstDateDesc: 'Locul unde totul a început...',
  firstVacationTitle: 'Prima vacanță la mare 🌊', firstVacationDesc: 'Apusul de soare pe care nu îl vom uita niciodată',
  mountainTripTitle: 'Weekend la munte ⛰️', mountainTripDesc: 'Frig afară, cald în suflet'
});
Object.assign(translations.en.memories, {
  firstDateTitle: 'Our first date 💕', firstDateDesc: 'The place where it all began...',
  firstVacationTitle: 'First beach vacation 🌊', firstVacationDesc: 'The sunset we will never forget',
  mountainTripTitle: 'Mountain weekend ⛰️', mountainTripDesc: 'Cold outside, warm in our hearts'
});

Object.assign(translations.ro.stickers, {
  animals: '🐶 Animăluțe', couples: '❤️ Cupluri', funny: '🤪 Amuzante'
});
Object.assign(translations.en.stickers, {
  animals: '🐶 Animals', couples: '❤️ Couples', funny: '🤪 Funny'
});

Object.assign(translations.ro.monetization, {
  adError: "Nu am putut afișa reclama. Încearcă din nou mai târziu.", noCoupleError: "Eroare: Nu ești într-un cuplu.", promoSuccess: "Felicitări! Ai deblocat Premium Lifetime! 🎉", dbError: "Eroare la conectarea cu baza de date.", invalidPromo: "Cod promoțional invalid sau expirat."
});
Object.assign(translations.en.monetization, {
  adError: "Could not display ad. Try again later.", noCoupleError: "Error: You are not in a couple.", promoSuccess: "Congratulations! You unlocked Premium Lifetime! 🎉", dbError: "Database connection error.", invalidPromo: "Invalid or expired promo code."
});

Object.assign(translations.ro.storage, {
  limitReached: "Ați atins limita de 1GB de stocare gratuită! Ștergeți din amintiri sau treceți la PRO."
});
Object.assign(translations.en.storage, {
  limitReached: "You have reached the 1GB free storage limit! Delete memories or upgrade to PRO."
});

Object.assign(translations.ro.genres, {
  action: 'Acțiune', adventure: 'Aventură', animation: 'Animație', comedy: 'Comedie', crime: 'Crimă', documentary: 'Documentar', drama: 'Dramă', family: 'Familie', fantasy: 'Fantezie', history: 'Istorie', horror: 'Groază', music: 'Muzică', mystery: 'Mister', romance: 'Romantic', tvMovie: 'Film TV', war: 'Război', actionAdventure: 'Acțiune & Aventură', news: 'Știri', warPolitics: 'Război & Politică'
});
Object.assign(translations.en.genres, {
  action: 'Action', adventure: 'Adventure', animation: 'Animation', comedy: 'Comedy', crime: 'Crime', documentary: 'Documentary', drama: 'Drama', family: 'Family', fantasy: 'Fantasy', history: 'History', horror: 'Horror', music: 'Music', mystery: 'Mystery', romance: 'Romance', tvMovie: 'TV Movie', war: 'War', actionAdventure: 'Action & Adventure', news: 'News', warPolitics: 'War & Politics'
});

translations.ro.common.partner = 'Partener';
translations.en.common.partner = 'Partner';
translations.ro.common.understood = 'Am înțeles';
translations.en.common.understood = 'Understood';

Object.assign(translations.ro.dashboard, {
  drawingSent: 'Desen trimis cu succes! ✈️', drawingReceivedDesc: 'Desen drăguț primit pe Dashboard! 🎨', drawingSaved: 'Desenul a fost salvat în Amintiri! ❤️', drawingAlt: 'Desen primit', baristaCountPlural: 'cereri', baristaCountToday: 'azi 💕'
});
Object.assign(translations.en.dashboard, {
  drawingSent: 'Drawing sent successfully! ✈️', drawingReceivedDesc: 'Cute drawing received on Dashboard! 🎨', drawingSaved: 'Drawing saved to Memories! ❤️', drawingAlt: 'Received drawing', baristaCountPlural: 'requests', baristaCountToday: 'today 💕'
});

translations.ro.scratchCard = { message: 'Te iubesc la infinit! ♾️💕' };
translations.en.scratchCard = { message: 'I love you to infinity! ♾️💕' };

translations.ro.chat = translations.ro.chat || {};
translations.en.chat = translations.en.chat || {};
Object.assign(translations.ro.chat, {
  premiumOnly: 'Funcția de fundal personalizat este disponibilă doar pentru conturile Premium! 👑', settingsTitle: 'Personalizare Chat 🎨', settingsDesc: 'Alegeți un fundal frumos pentru conversația voastră.', uploadBg: 'Încarcă Imagine Fundal', removeBg: 'Șterge Imaginea', watchAdToUnlock: 'Vizionează o scurtă reclamă pentru a aplica această temă superbă în chat-ul vostru!', unlockTheme: 'Deblochează Tema 🎁'
});
Object.assign(translations.en.chat, {
  premiumOnly: 'Custom background feature is only available for Premium accounts! 👑', settingsTitle: 'Chat Customization 🎨', settingsDesc: 'Choose a beautiful background for your conversation.', uploadBg: 'Upload Background Image', removeBg: 'Remove Image', watchAdToUnlock: 'Watch a short ad to apply this gorgeous theme to your chat!', unlockTheme: 'Unlock Theme 🎁'
});

Object.assign(translations.ro.studyLobby, {
  maxLevel: '✨ Nivel Maxim — '
});
Object.assign(translations.en.studyLobby, {
  maxLevel: '✨ Max Level — '
});

Object.assign(translations.ro.nav, { mainNavigation: 'Navigare principală' });
Object.assign(translations.en.nav, { mainNavigation: 'Main navigation' });

translations.ro.unsplash = { ideaFallback: 'Idee {category}' };
translations.en.unsplash = { ideaFallback: '{category} Idea' };

const fileContent = `export const translations = ${JSON.stringify(translations, null, 2)};`;
fs.writeFileSync(path.join(__dirname, '../src/data/translations.js'), fileContent);
console.log('Translations updated.');
