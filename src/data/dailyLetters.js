/**
 * 💌 SCRISORILE ZILEI
 *
 * Indexul corespunde numărului zilei din an (1-365).
 * Poți adăuga scrisori pentru zile specifice sau lăsa fallback-ul să cicleze.
 *
 * STRUCTURA:
 * {
 *   day: <număr 1-365 sau string 'YYYY-MM-DD' pentru date fixe>,
 *   title: 'Titlul scrisorii',
 *   content: 'Textul scrisorii...',
 *   emoji: '💕',
 * }
 *
 * Sfat: Adaugă scrisori speciale pentru zile importante:
 * - Ziua ei de naștere
 * - Aniversarea voastră
 * - Sărbători
 */

// Cele 30 de scrisori demo — ciclează în ordine în funcție de ziua anului
export const dailyLetters = [
  {
    id: 1,
    title: 'Bună dimineața, soarele meu 🌅',
    content: 'Știu că poate dimineața nu ești cel mai comunicativ om, dar chiar și în tăcerea ta îmi aduci căldură. Gândul că ești acolo, undeva, respirând același aer, îmi face ziua mai bună înainte să fi început măcar. Îți mulțumesc că exiști.',
    emoji: '🌅',
    mood: 'calm',
  },
  {
    id: 2,
    title: 'Toate lucrurile mici 🍃',
    content: 'Felul în care râzi cu toată fața. Cum îți asculți muzica cu ochii închiși. Cum ții cana cu ambele mâini când bei ceva cald. Toate aceste lucruri mici pe care poate nu le observi tu — eu le colecționez. Le port cu mine oriunde merg.',
    emoji: '🍃',
    mood: 'tender',
  },
  {
    id: 3,
    title: 'Un gând de miercuri 💭',
    content: 'Uneori, în mijlocul unei zile complet obișnuite, îmi amintesc că te iubesc și mă surprind zâmbind de unul singur. Lumea din jur crede că am înnebunit. Poate că au dreptate.',
    emoji: '💭',
    mood: 'playful',
  },
  {
    id: 4,
    title: 'Ce înseamnă „acasă" pentru mine 🏡',
    content: 'Acasă nu este un loc. Acasă ești tu — felul tău de a-ți aranja pernele, vocea ta din altă cameră, prezența ta liniștitoare. Oriunde ești tu, acolo mă simt în siguranță.',
    emoji: '🏡',
    mood: 'deep',
  },
  {
    id: 5,
    title: 'Îți mulțumesc pentru ieri 🙏',
    content: 'Nu știu exact ce a fost ieri pentru tine, dar vreau să îți mulțumesc oricum. Pentru că ai ales să fii tu. Pentru că nu te-ai prefăcut. Pentru că m-ai lăsat să fiu și eu eu, lângă tine.',
    emoji: '🙏',
    mood: 'grateful',
  },
  {
    id: 6,
    title: 'O dragoste care alege 💫',
    content: 'Iubirea nu este doar un sentiment — este o alegere pe care o fac în fiecare zi. Și în fiecare zi, fără să ezit, te aleg pe tine. Nu pentru că trebuie, ci pentru că nu îmi imaginez altfel.',
    emoji: '💫',
    mood: 'deep',
  },
  {
    id: 7,
    title: 'Zâmbetul tău e vinovatul 😊',
    content: 'Există zile în care lumea pare prea grea și prea complicată. Și apoi îți văd zâmbetul și îmi amintesc că totul e bine. Tu ești argumentul cel mai puternic pe care îl am că viața merită trăită frumos.',
    emoji: '😊',
    mood: 'bright',
  },
  {
    id: 8,
    title: 'În versuri simple 📝',
    content: 'Nu am talent la poezie, dar dacă aș scrie una, ar fi despre tine. Despre cum faci ca lucrurile banale să pară extraordinare. Despre cum fiecare zi cu tine are o greutate specială — tipul bun de greutate, cel care te ancorează.',
    emoji: '📝',
    mood: 'poetic',
  },
  {
    id: 9,
    title: 'Aventura noastră continuă ✈️',
    content: 'Știi ce mă entuziasmează cel mai tare? Nu destinațiile — ci că le vom vedea împreună. Că vom fi pierduți pe străzi necunoscute, amândoi, râzând de harta greșită și mâncând ceva de care nu am mai auzit. Cu tine, orice drum devine poveste.',
    emoji: '✈️',
    mood: 'adventurous',
  },
  {
    id: 10,
    title: 'Înăuntrul momentelor normale 🌿',
    content: 'Uneori cel mai bun lucru nu e vacanța sau ocazia specială — e seara obișnuită, pe canapea, fără nimic de spus, și totuși fericită. Cu tine, normalul devine ceva de prețuit.',
    emoji: '🌿',
    mood: 'calm',
  },
  {
    id: 11,
    title: 'Dacă ar fi să te descriu 🎨',
    content: 'Ești felul în care mirosul de cafea te face să te simți bine dimineața. Ești playlist-ul perfect pentru un drum lung. Ești cartea la care te întorci mereu, deși știi cum se termină — tocmai pentru că știi cum se termină.',
    emoji: '🎨',
    mood: 'poetic',
  },
  {
    id: 12,
    title: 'Promisiunea mea zilnică 🤝',
    content: 'Nu îți promit că voi fi perfect. Dar îți promit că voi fi prezent. Că voi asculta. Că voi încerca. Că în zilele în care nu știu cum să ajut, voi rămâne oricum lângă tine, tăcut și stabil.',
    emoji: '🤝',
    mood: 'sincere',
  },
  {
    id: 13,
    title: 'Un secret pe care îl știu 🤫',
    content: 'Știu cum te simți când ești obosită dar nu vrei să arăți. Știu privirea ta de când ceva te îngrijorează dar nu ești sigură că merită menționat. Știu toate astea și te iubesc și mai mult pentru ele.',
    emoji: '🤫',
    mood: 'tender',
  },
  {
    id: 14,
    title: 'Bucuria mică a zilei 🌸',
    content: 'Azi vreau să observi un lucru frumos — orice: o culoare, un miros, o senzație. Și să știi că eu te-am gândit pe tine exact în acel moment. Suntem conectați prin toate lucrurile frumoase din lume.',
    emoji: '🌸',
    mood: 'bright',
  },
  {
    id: 15,
    title: 'Jumătatea mea bună 💛',
    content: 'Există o teorie că oamenii sunt mai buni lângă persoana potrivită. Nu știu dacă e adevărată în general, dar știu că lângă tine devin versiunea mea cea mai bună. Mă faci să vreau să merit.',
    emoji: '💛',
    mood: 'grateful',
  },
  {
    id: 16,
    title: 'Când te văd dimineața 🌤️',
    content: 'Există ceva magic în felul în care arăți dimineața, înainte să înceapă ziua. Ești dezarmată, ești reală, ești tu. Și eu mă simt privilegiat că pot vedea asta.',
    emoji: '🌤️',
    mood: 'tender',
  },
  {
    id: 17,
    title: 'Scrisoarea fără cuvinte mari 💬',
    content: 'Nu am azi cuvinte mari. Am doar gândul simplu că ești importantă pentru mine. Că ziua mea e mai bună știind că ești în ea. Uneori simplul e cel mai sincer.',
    emoji: '💬',
    mood: 'simple',
  },
  {
    id: 18,
    title: 'Pentru zilele mai grele 🌧️',
    content: 'Dacă azi e o zi mai dificilă, vreau să știi că e în regulă. Nu trebuie să fii bine tot timpul. Dar oriunde ești — în vârful zilei sau în vale — eu sunt în colțul tău. Mereu.',
    emoji: '🌧️',
    mood: 'supportive',
  },
  {
    id: 19,
    title: 'Imagini din viitorul nostru 🔭',
    content: 'Uneori îmi imaginez dimineți de weekend lente, cu cafele și fără grabă. Cu tine citind ceva sau urmărind ceva, și eu privindu-te, fericit că am ales atât de bine. Abia aștept toate acele dimineți.',
    emoji: '🔭',
    mood: 'dreamy',
  },
  {
    id: 20,
    title: 'Lucruri pe care nu ți le-am spus 💌',
    content: 'Că felul în care gesticulezi când ești entuziastă e adorabil. Că râsul tău e contagios în cel mai bun mod posibil. Că mă simt mai inteligent când discut cu tine. Că ești mai frumoasă decât îți dai seama.',
    emoji: '💌',
    mood: 'romantic',
  },
  {
    id: 21,
    title: 'Trei lucruri de azi 🌟',
    content: 'Unu: ești minunată. Doi: merit să îți aminteacă cineva asta în fiecare zi. Trei: eu vreau să fiu acel cineva cât mai mult timp posibil.',
    emoji: '🌟',
    mood: 'bright',
  },
  {
    id: 22,
    title: 'Dragostea ca practică zilnică 🧘‍♀️',
    content: 'Dragostea nu este un singur moment dramatic — este mia de momente mici: un mesaj trimis la momentul potrivit, o amintire, o mână întinsă. Vreau să practic toate astea cu tine, zi de zi.',
    emoji: '🧘‍♀️',
    mood: 'deep',
  },
  {
    id: 23,
    title: 'Magia din obișnuit ✨',
    content: 'E ceva magic în a iubi pe cineva atât de mult timp încât obișnuitul devine sacru. Ritualurile mici devin comori. Sper să ajungem acolo — și cred că suntem deja pe drum.',
    emoji: '✨',
    mood: 'dreamy',
  },
  {
    id: 24,
    title: 'Curiozitatea mea despre tine 🔍',
    content: 'Deși te știu, mă fascinezi în continuare. Vreau să știu ce gândești când ești pe gânduri. Ce îți place la tine și ce nu. Ce vise ai că nu mi le-ai spus încă. Ești un univers și abia am început să explorez.',
    emoji: '🔍',
    mood: 'curious',
  },
  {
    id: 25,
    title: 'Când e greu, ne avem 🫂',
    content: 'Viața nu va fi mereu ușoară — pentru niciunul dintre noi. Dar în toate scenariile pe care mi le imaginez, tu ești lângă mine. Și în toate, reușim. Nu pentru că e simplu, ci pentru că suntem împreună.',
    emoji: '🫂',
    mood: 'supportive',
  },
  {
    id: 26,
    title: 'Mulțumesc că ești tu 🌺',
    content: 'Nu mulțumesc pentru ce faci pentru mine — deși faci mult. Mulțumesc pentru cine ești. Pentru valorile tale, pentru bunătatea ta, pentru felul în care te porți cu lumea. Ești omul bun pe care mi l-am dorit.',
    emoji: '🌺',
    mood: 'grateful',
  },
  {
    id: 27,
    title: 'O cafea imaginară ☕',
    content: 'Imaginez-ți că îți aduc o cafea chiar acum — exact cum îți place. Și stăm în liniște, fără telefoane, fără grabă. Asta îmi doresc pentru noi: momente în care timpul pare că stă pe loc.',
    emoji: '☕',
    mood: 'calm',
  },
  {
    id: 28,
    title: 'Puterea unui „bine că ești tu" 💪',
    content: 'Nu știu ce provocări ai azi. Dar știu că le faci față, pentru că ești mai puternică decât crezi. Și eu sunt în tribul tău, mereu, cel mai tare fan al tău.',
    emoji: '💪',
    mood: 'encouraging',
  },
  {
    id: 29,
    title: 'Seara, la final de zi 🌙',
    content: 'Sper că ziua ta a fost blândă cu tine. Și dacă nu a fost — sper că această seară să compenseze. Ești merituoasă de zile frumoase, de odihnă bună și de vise liniștite.',
    emoji: '🌙',
    mood: 'peaceful',
  },
  {
    id: 30,
    title: 'Iubire fără dată de expirare ♾️',
    content: 'Unele lucruri se termină. Aceasta nu va fi una dintre ele. Cel puțin, nu din vina mea. Te iubesc ieri, azi și în toate zilele care vor urma — fiecare zi cu câte o scrisoare nouă, dacă e nevoie.',
    emoji: '♾️',
    mood: 'eternal',
  },
];

// Scrisori speciale pentru date fixe (ex: ziua de naștere, aniversare)
// Formatul cheii: 'MM-DD' (luna-ziua)
export const specialDayLetters = {
  // Exemplu: '03-15' pentru 15 Martie — aniversarea voastră
  // '03-15': {
  //   title: '🎉 La mulți ani, noi!',
  //   content: 'Un an întreg de amintiri, râsete și iubire...',
  //   emoji: '🎂',
  //   isSpecial: true,
  // },
};

/**
 * Returnează scrisoarea pentru ziua curentă.
 * Prioritate: scrisori speciale > ciclu de 30 de zile.
 */
export function getDailyLetter() {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Verifică dacă există scrisoare specială pentru azi
  if (specialDayLetters[monthDay]) {
    return specialDayLetters[monthDay];
  }

  // Ciclu de 30 de scrisori în funcție de ziua din an
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const index = (dayOfYear - 1) % dailyLetters.length;
  return dailyLetters[index];
}
