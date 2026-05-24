import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAlM9J7jjEgAK0GWzrM1Soe8X-a9z3qmQ",
  authDomain: "couplehub-17d57.firebaseapp.com",
  projectId: "couplehub-17d57",
  storageBucket: "couplehub-17d57.firebasestorage.app",
  messagingSenderId: "61283267985",
  appId: "1:61283267985:web:bf721ebc04edff68a95630",
  measurementId: "G-4PG6KCGR1W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const quotes = [
  "Te iubesc nu doar pentru ceea ce ești, ci și pentru ceea ce sunt eu când sunt cu tine.",
  "Dragostea nu constă în a ne privi unul pe celălalt, ci în a privi amândoi în aceeași direcție.",
  "Ești primul meu gând dimineața și ultimul meu gând seara.",
  "Nu am nevoie de paradis pentru că te-am găsit pe tine. Nu am nevoie de visuri pentru că te am pe tine.",
  "Acolo unde există dragoste, există viață.",
  "Sufletele noastre vorbesc o limbă pe care doar noi o înțelegem.",
  "În brațele tale am găsit acasă.",
  "Ești cea mai frumoasă întâmplare din viața mea.",
  "Fiecare zi petrecută cu tine este o nouă filă din cea mai frumoasă poveste.",
  "A iubi înseamnă a găsi propria fericire în fericirea celuilalt.",
  "Dragostea este o prietenie care a luat foc.",
  "Când te-am văzut m-am îndrăgostit, și tu ai zâmbit pentru că știai.",
  "Zâmbetul tău este răsăritul meu în fiecare dimineață.",
  "Nu există un moment în care să nu mă gândesc la tine.",
  "Lumea e mai frumoasă de când faci parte din ea.",
  "Tu ești motivul pentru care zâmbesc fără motiv.",
  "Ești soarele meu în zilele înnorate.",
  "Atingerea ta îmi liniștește sufletul.",
  "Inima mea bate mai repede când aud pașii tăi.",
  "Suntem două suflete pereche ce dansează prin viață.",
  "Iubirea noastră este un secret pe care îl știe tot universul.",
  "Ești poezia pe care inima mea nu știa că vrea să o scrie.",
  "Alături de tine, chiar și tăcerea este plină de sens.",
  "Ceea ce simt pentru tine nu poate fi descris în cuvinte.",
  "Tu ești răspunsul la toate rugăciunile mele.",
  "Dacă aș trăi o mie de vieți, te-aș căuta în fiecare dintre ele.",
  "Iubirea ta este ancora mea în furtună.",
  "Tu mă faci să fiu o versiune mai bună a mea.",
  "Orice drum e mai ușor când te țin de mână.",
  "Dragostea nu e despre cum arăți, ci despre cum mă faci să mă simt.",
  "Ești cel mai frumos vis din care nu vreau să mă trezesc.",
  "Fiecare secundă departe de tine este o eternitate.",
  "Tu ești magia din viața mea banală.",
  "Iubirea este atunci când fericirea celeilalte persoane este mai importantă decât a ta.",
  "Ochii tăi sunt singura busolă de care am nevoie.",
  "Alături de tine am învățat că iubirea nu este un cuvânt, ci o acțiune.",
  "Ești comoara pe care nu știam că o caut.",
  "Inima mea este și va fi întotdeauna a ta.",
  "Sunt dependent de parfumul tău și de zâmbetul tău.",
  "Vreau să îmbătrânesc alături de tine, ținându-te de mână.",
  "Dacă iubirea ar fi o stea, tu ai fi întregul univers.",
  "Nimic nu este imposibil când știu că ești lângă mine.",
  "Am știut că ești tu de la prima îmbrățișare.",
  "Dragostea mea pentru tine crește în fiecare zi.",
  "Tu ești muzica pe care o ascultă inima mea.",
  "Ești raza mea de lumină în întuneric.",
  "Să te iubesc este cel mai ușor lucru pe care l-am făcut vreodată.",
  "Lumea se oprește în loc când mă privești.",
  "Ești piesa de puzzle care îmi lipsea.",
  "Viața mea are sens de când te-am cunoscut.",
  "Vreau să fiu motivul pentru care crezi în dragoste adevărată.",
  "Inima mea zâmbește de fiecare dată când te gândești la mine.",
  "Tu ești cel mai bun prieten și marea mea dragoste.",
  "Iubirea ta îmi dă aripi.",
  "Când mă ții în brațe, uit de toate grijile.",
  "Să adorm cu tine în gând este cel mai frumos final de zi.",
  "Zâmbetul tău este tot ce am nevoie pentru a fi fericit.",
  "Fiecare zi alături de tine este un cadou.",
  "Tu ești povestea mea de dragoste preferată.",
  "A iubi înseamnă a trăi viața prin inima celuilalt.",
  "Ești steaua care îmi luminează nopțile.",
  "Inima mea a știut că ești tu încă de la început.",
  "Cu tine, fiecare moment este o amintire de neprețuit.",
  "Dragostea ta este cel mai mare dar pe care l-am primit vreodată.",
  "Nu există loc pe pământ unde m-aș simți mai bine decât în brațele tale.",
  "Ești aerul pe care îl respir și apa care mă potolește.",
  "Să mă trezesc lângă tine este cel mai frumos început de zi.",
  "Iubirea noastră este un foc care nu se va stinge niciodată.",
  "Tu ești liniștea din mijlocul furtunii mele.",
  "Fiecare bătaie a inimii mele rostește numele tău.",
  "Ești cel mai frumos capitol din cartea vieții mele.",
  "Dragostea adevărată nu are final. E eternă, ca noi.",
  "Alături de tine am învățat să zbor fără aripi.",
  "Tu ești curcubeul de după ploaie.",
  "O zi fără tine este ca o zi fără soare.",
  "Ești cea mai dulce melodie pe care am auzit-o vreodată.",
  "Mă îndrăgostesc de tine din nou în fiecare dimineață.",
  "Să fii a mea/al meu este tot ce îmi doresc de la viață.",
  "Iubirea ta m-a vindecat și m-a făcut întreg.",
  "Ești miracolul pe care îl așteptam de o viață.",
  "Nu pot să îmi imaginez viața fără zâmbetul tău.",
  "Tu ești acasă pentru inima mea rătăcitoare.",
  "Sunt al tău/a ta cu fiecare respirație.",
  "Dragostea mea pentru tine este mai adâncă decât oceanul.",
  "Ești lumina care îmi călăuzește pașii.",
  "Cu tine am învățat ce înseamnă să iubești cu adevărat.",
  "Nu am nevoie de o mie de cuvinte, doar de tine.",
  "Ești magia care îmi colorează viața.",
  "Să fim împreună este locul meu preferat de pe pământ.",
  "Tu ești răspunsul la toate întrebările mele.",
  "Iubirea noastră este un cântec ce nu se va termina niciodată.",
  "Ești bucuria mea în fiecare zi.",
  "Mă simt cel mai norocos om din lume pentru că te am pe tine.",
  "Tu ești steaua mea norocoasă.",
  "Zâmbetul tău îmi topește inima instantaneu.",
  "Ești cel mai de preț diamant al meu.",
  "Fiecare moment cu tine este o binecuvântare.",
  "Inima mea este completă de când ești tu în ea.",
  "Tu ești cel mai frumos lucru care mi s-a întâmplat vreodată.",
  "Te iubesc mai mult azi decât ieri și mai puțin decât mâine."
];

async function seed() {
  const quotesCol = collection(db, 'daily_quotes');
  
  const snapshot = await getDocs(quotesCol);
  for (const document of snapshot.docs) {
    await deleteDoc(document.ref);
  }
  console.log("Citate vechi șterse.");

  for (let i = 0; i < quotes.length; i++) {
    await addDoc(quotesCol, { 
      text: quotes[i],
      index: i // useful for deterministic querying
    });
  }
  
  console.log(`100 Citate noi au fost adăugate cu succes în Firebase!`);
  process.exit(0);
}

seed().catch(console.error);
