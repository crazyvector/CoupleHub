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

        if (lastShownDate !== today) {
          // Șansă random să apară (ex: 25% la fiecare schimbare de rută sau reload)
          // Dar maxim o dată pe zi. Dacă nimerim cei 25%, se afișează și setăm data.
          if (Math.random() < 0.25) {
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
