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
        const lastShownTime = parseInt(localStorage.getItem('lastPromoShownTime') || '0', 10);
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        // Dacă au trecut mai mult de 7 zile de la ultima afișare
        if (now - lastShownTime > SEVEN_DAYS) {
          // Șansă random să apară (ex: 10% la fiecare schimbare de rută)
          if (Math.random() < 0.10) {
            setShowPromo(true);
            localStorage.setItem('lastPromoShownTime', now.toString());
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
