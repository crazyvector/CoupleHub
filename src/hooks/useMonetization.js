import { useState, useEffect } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useGlobalAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useMonetization() {
  const { userData, coupleId } = useGlobalAuth();
  const [isPro, setIsPro] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [isAdMobReady, setIsAdMobReady] = useState(false);

  // Verifică statusul din Firebase (pentru redundanță)
  useEffect(() => {
    if (!userData?.uid) return;
    const fetchFirebaseProStatus = async () => {
      try {
        const d = await getDoc(doc(db, 'users', userData.uid));
        if (d.exists() && d.data().isPro) {
          setIsPro(true);
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

        // Verifică statusul pro din RevenueCat
        const customerInfo = await Purchases.getCustomerInfo();
        const proEntitlement = customerInfo.entitlements.active['pro']; // Trebuie să definești 'pro' în dashboard
        
        if (typeof proEntitlement !== "undefined") {
          setIsPro(true);
          // Sync to Firebase
          await setDoc(doc(db, 'users', userData.uid), { isPro: true }, { merge: true });
        }

        // Fetch offerings
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
          testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'], // Poți adăuga ID-uri de test aici
          initializeForTesting: false, // Set to false in production
        });
        setIsAdMobReady(true);
      } catch (e) {
        console.error("AdMob Init error:", e);
      }
    };
    initAdMob();
  }, []);

  const purchasePackage = async (rcPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
      if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
        setIsPro(true);
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

  const showBanner = async () => {
    if (!isAdMobReady || isPro || !Capacitor.isNativePlatform()) return;
    
    try {
      const options = {
        adId: 'ca-app-pub-8580245815605338/1561052736',
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0,
        isTesting: false // Modifică în producție
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
  };
}
