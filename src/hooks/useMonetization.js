import { useState, useEffect, useRef } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useGlobalAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useMonetization() {
  const { userData, coupleId } = useGlobalAuth();
  const [isRCPro, setIsRCPro] = useState(false);
  const [isLifetimePro, setIsLifetimePro] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [isAdMobReady, setIsAdMobReady] = useState(false);
  const rewardCallbackRef = useRef(null);

  // Verifică statusul Lifetime Promo Code din Firebase
  useEffect(() => {
    if (!coupleId) return;
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'system', 'subscription'), (d) => {
      if (d.exists() && d.data().isLifetimePro) {
        setIsLifetimePro(true);
      } else {
        setIsLifetimePro(false);
      }
    });
    return () => unsub();
  }, [coupleId]);

  // Verifică statusul din Firebase (pentru redundanță user)
  useEffect(() => {
    if (!userData?.uid) return;
    const fetchFirebaseProStatus = async () => {
      try {
        const d = await getDoc(doc(db, 'users', userData.uid));
        if (d.exists() && d.data().isPro) {
          setIsRCPro(true);
        }
      } catch (e) {
        console.error("Firebase Pro check error:", e);
      }
    };
    fetchFirebaseProStatus();
  }, [userData]);

  // Inițializează RevenueCat
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!userData?.uid) return;

    const initRC = async () => {
      try {
        await Purchases.setLogLevel({ level: "DEBUG" });
        await Purchases.configure({ 
          apiKey: "test_pufjEojFYkOsIVOtPFnnTWsuKEo",
          appUserID: userData.uid
        });

        const customerInfo = await Purchases.getCustomerInfo();
        const proEntitlement = customerInfo.entitlements.active['pro'];
        
        if (typeof proEntitlement !== "undefined") {
          setIsRCPro(true);
          await setDoc(doc(db, 'users', userData.uid), { isPro: true }, { merge: true });
        }

        const offs = await Purchases.getOfferings();
        if (offs.current !== null) {
          setOfferings(offs.current);
        }
      } catch (e) {
        console.error("RevenueCat Init error:", e);
      }
    };
    initRC();
  }, [userData]);

  // Inițializează AdMob
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
          initializeForTesting: false,
        });
        setIsAdMobReady(true);
      } catch (e) {
        console.error("AdMob Init error:", e);
      }
    };
    initAdMob();
  }, []);

  // Listeners pentru Rewarded Ads
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupListeners = async () => {
      await AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem) => {
        if (rewardCallbackRef.current) {
          rewardCallbackRef.current(rewardItem);
          rewardCallbackRef.current = null;
        }
      });

      await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        prepareRewardedAd(); // re-încarcă următoarea reclamă
      });
    };
    setupListeners();
    
    return () => {
      AdMob.removeAllListeners();
    };
  }, []);

  const prepareRewardedAd = async () => {
    if (!isAdMobReady || isRCPro || isLifetimePro || !Capacitor.isNativePlatform()) return;
    try {
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-8580245815605338/1215103221', // Real Rewarded ID
        isTesting: false
      });
    } catch (e) {
      console.error("Failed to prepare rewarded ad", e);
    }
  };

  // Preîncarcă reclama când AdMob este gata
  useEffect(() => {
    if (isAdMobReady) {
      prepareRewardedAd();
    }
  }, [isAdMobReady]);

  const showRewardedAd = async (callback) => {
    const isPro = isRCPro || isLifetimePro;
    if (isPro || !Capacitor.isNativePlatform()) {
      // Dacă e Pro sau pe Web, dăm recompensa instant
      if (callback) callback();
      return;
    }
    
    try {
      rewardCallbackRef.current = callback;
      await AdMob.showRewardVideoAd();
    } catch (e) {
      console.error("Show Rewarded Ad error:", e);
      alert("Nu am putut afișa reclama. Încearcă din nou mai târziu.");
      rewardCallbackRef.current = null;
    }
  };

  const purchasePackage = async (rcPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
      if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
        setIsRCPro(true);
        if (userData?.uid) {
          await setDoc(doc(db, 'users', userData.uid), { isPro: true }, { merge: true });
        }
        return true;
      }
      return false;
    } catch (e) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
      }
      return false;
    }
  };

  const redeemPromoCode = async (code) => {
    if (!coupleId) return { success: false, message: "Eroare: Nu ești într-un cuplu." };
    if (code === 'ANDREIPRO1') {
      try {
        await setDoc(doc(db, 'couples', coupleId, 'system', 'subscription'), {
          isLifetimePro: true,
          redeemedAt: new Date().toISOString(),
          codeUsed: code
        }, { merge: true });
        return { success: true, message: "Felicitări! Ai deblocat Premium Lifetime! 🎉" };
      } catch (err) {
        console.error("Eroare la activare promo code:", err);
        return { success: false, message: "Eroare la conectarea cu baza de date." };
      }
    }
    return { success: false, message: "Cod promoțional invalid sau expirat." };
  };

  const isPro = isRCPro || isLifetimePro;

  const showBanner = async () => {
    if (!isAdMobReady || isPro || !Capacitor.isNativePlatform()) return;
    try {
      const options = {
        adId: 'ca-app-pub-8580245815605338/1561052736',
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
        isTesting: false
      };
      await AdMob.showBanner(options);
    } catch (e) {
      console.error("Show Banner error:", e);
    }
  };

  const hideBanner = async () => {
    if (!isAdMobReady || !Capacitor.isNativePlatform()) return;
    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (e) {
      console.error("Hide Banner error:", e);
    }
  };

  return {
    isPro,
    offerings,
    purchasePackage,
    showBanner,
    hideBanner,
    redeemPromoCode,
    isLifetimePro,
    prepareRewardedAd,
    showRewardedAd
  };
}
