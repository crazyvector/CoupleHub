#!/bin/bash

# Verifică dacă s-a dat versiunea ca argument
if [ -z "$1" ]; then
  echo "Eroare: Trebuie să specifici versiunea!"
  echo "Exemplu: ./release.sh 1.0.5"
  exit 1
fi

NEW_VERSION=$1
echo "🚀 Începem lansarea versiunii $NEW_VERSION..."

# 1. Modificăm versiunea în src/hooks/useDatabase.js
# Folosim sed pentru macOS (care cere un șir gol după -i)
sed -i '' "s/const localVersion = \".*\";/const localVersion = \"$NEW_VERSION\";/" src/hooks/useDatabase.js
echo "✅ Versiunea a fost actualizată în useDatabase.js"

# 2. Rulăm Build pentru web și sincronizăm cu Capacitor
echo "⏳ Se construiește aplicația Web (Vite) și se sincronizează..."
npm run build && npx cap sync
if [ $? -ne 0 ]; then
    echo "❌ Eroare la npm run build sau npx cap sync!"
    exit 1
fi
echo "✅ Web build & sync complet!"

echo "⏳ Se publică aplicația web pe Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "❌ Eroare la publicarea pe Firebase Hosting!"
    exit 1
fi
echo "✅ Aplicația web a fost publicată cu succes!"

# 3. Compilăm APK-ul de Android (Debug)
echo "⏳ Se compilează APK-ul în Android Studio (Gradle)..."

# Setează JAVA_HOME automat dacă există Android Studio pe Mac
if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
fi

cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ Eroare la compilarea APK-ului! Încearcă să-l compilezi manual din Android Studio."
    exit 1
fi
cd ..
echo "✅ APK compilat cu succes!"

# 4. Deschidem locațiile pentru upload-ul manual
APK_PATH="/Users/andrei/Documents/AntigravityProjects/couple-hub/android/app/build/outputs/apk/debug"
echo "📂 Se deschide folderul cu fișierul app-debug.apk..."
open "$APK_PATH"

echo "🌐 Se deschide link-ul către Google Drive și Firebase..."
# Deschide Google Drive
open "https://drive.google.com/drive/folders/1RueS7aROBVThK1EOibMfC_B-7lGHvtl0?usp=sharing"
# Deschide Firebase Console (link generic catre consola)
open "https://console.firebase.google.com/"

echo ""
echo "🎉 APROAPE GATA! Mai ai de făcut 2 pași manuali foarte rapizi:"
echo "1. Trage fișierul 'app-debug.apk' din folderul deschis în pagina de Google Drive (dă-i Replace/Overwrite)."
echo "2. Mergi în Firebase -> Firestore Database -> system -> app_version și schimbă version la \"$NEW_VERSION\"."
echo "Succes!"

echo "To generate lifetime codes use : node scripts/generatePromoCode.js"
