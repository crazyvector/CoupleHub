import re

def fix_fallbacks(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# ChatSettingsModal.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/ChatSettingsModal.jsx', {
    "|| 'Funcția de fundal personalizat este disponibilă doar pentru conturile Premium! 👑'": "",
    "|| 'Personalizare Chat 🎨'": "",
    "|| 'Alegeți un fundal frumos pentru conversația voastră.'": "",
    "|| 'Încarcă Imagine Fundal'": "",
    "|| 'Șterge Imaginea'": "",
    "|| 'Vizionează o scurtă reclamă pentru a aplica această temă superbă în chat-ul vostru!'": "",
    "|| 'Deblochează Tema 🎁'": ""
})

# ErrorBoundary.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/ErrorBoundary.jsx', {
    "'Oops! S-a produs o eroare 😢'": "t('errors.somethingWrong')",
    "'Reîncarcă aplicația'": "t('errors.reloadApp')"
})

# InfoModal.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/InfoModal.jsx', {
    "'Am înțeles'": "t('common.understood')"
})

# LiveCanvasWidget.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/LiveCanvasWidget.jsx', {
    "|| 'Desen nou!'": "",
    "|| 'Ai primit un desen nou pe ecranul principal!'": "",
    "'Desen trimis cu succes! ✈️'": "t('dashboard.drawingSent')",
    "'Desen drăguț primit pe Dashboard! 🎨'": "t('dashboard.drawingReceivedDesc')",
    "'Desenul a fost salvat în Amintiri! ❤️'": "t('dashboard.drawingSaved')",
    "alt=\"Desen primit\"": "alt={t('dashboard.drawingAlt')}",
    "|| 'Poză nouă'": ""
})

# ScrapbookExport.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/ScrapbookExport.jsx', {
    "|| 'Cartea Noastră de Amintiri'": "",
    "|| \"O amintire de neuitat...\"": "",
    "|| 'Comentarii:'": "",
    "|| 'Generat cu iubire prin CoupleHub 💕'": ""
})

# BottomNav.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/layout/BottomNav.jsx', {
    "aria-label=\"Navigare principală\"": "aria-label={t('nav.mainNavigation')}"
})

# RewardModal.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/RewardModal.jsx', {
    "|| 'SAU'": "",
    "|| 'Treci la Premium (Nelimitat)'": ""
})

# App.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/App.jsx', {
    "|| 'Actualizare nouă!'": "",
    "|| 'Avem o versiune nouă. Actualizează acum!'": "",
    "|| 'Actualizează'": "",
    "|| 'Mai târziu'": "",
    "role === 'his' ? 'Ana' : 'Andrei'": "role === 'his' ? t('common.partner') : t('common.partner')"
})

# NotificationCenter.jsx
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/NotificationCenter.jsx', {
    "role === 'his' ? 'Ana' : 'Andrei'": "role === 'his' ? t('common.partner') : t('common.partner')"
})

# useAuth.js
fix_fallbacks('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/hooks/useAuth.js', {
    "'Neautentificat'": "t('errors.notAuthenticated')",
    "'Cheia nu a fost găsită.'": "t('errors.keyNotFound')",
    "'Această cheie este deja asociată unui cuplu activ!'": "t('errors.keyAlreadyAssociated')",
    "'Eroare la conectare'": "t('errors.loginError')",
    "role === 'her' ? 'ANDREI2024' : 'ANA2024'": "import.meta.env.VITE_MIGRATION_KEY || 'SECRET_KEY'"
})

print("Fallbacks fixed")
