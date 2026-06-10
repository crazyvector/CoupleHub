import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePromoPopup(isPro) {
  const [showPromo, setShowPromo] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Dacă e deja PRO, nu afișăm nimic
    if (isPro) return;

    // Așteptăm puțin pentru a nu bloca renderul inițial (mai puțin intruziv)
    const checkPromo = () => {
      try {
        const lastShownDate = localStorage.getItem('lastPromoShownDate');
        const today = new Date().toDateString();

        // Dacă nu s-a afișat azi
        if (lastShownDate !== today) {
          // Șansă foarte mică să apară (5% la fiecare schimbare de rută)
          if (Math.random() < 0.05) {
            setShowPromo(true);
            localStorage.setItem('lastPromoShownDate', today);
          }
        }
      } catch (e) {
        console.error("Error accessing localStorage for promo", e);
      }
    };

    const timer = setTimeout(checkPromo, 2000);

    return () => clearTimeout(timer);
  }, [location.pathname, isPro]);

  return { showPromo, setShowPromo };
}
