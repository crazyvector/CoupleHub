import os
import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'useLanguage' not in content:
        content = content.replace("import styles from", "import { useLanguage } from '../contexts/LanguageContext';\nimport styles from")
    
    # insert const { t } = useLanguage(); inside component if not there
    if 'const { t } = useLanguage();' not in content:
        content = re.sub(r'(export default function \w+\([^)]*\)\s*{)', r'\1\n  const { t } = useLanguage();\n', content)
        content = re.sub(r'(function \w+\([^)]*\)\s*{)', r'\1\n  const { t } = useLanguage();\n', content)

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# AddHomeItemModal.jsx
add_home_replacements = {
    "'Bucătărie'": "t('homePlanner.kitchen')",
    "'Living'": "t('homePlanner.living')",
    "'Dormitor'": "t('homePlanner.bedroom')",
    "'Baie'": "t('homePlanner.bathroom')",
    "'Balcon'": "t('homePlanner.balcony')",
    "'Hol'": "t('homePlanner.hallway')",
    "'Pod / Mansardă'": "t('homePlanner.attic')",
    "'Birou'": "t('homePlanner.office')",
    "'Căutări Libere'": "t('homePlanner.freeSearches')",
    "['mobilă', 'tehnologie', 'finisaje', 'decorațiuni', 'accesorii', 'iluminat', 'inspirație']": "[t('homePlanner.tags.furniture'), t('homePlanner.tags.technology'), t('homePlanner.tags.finishes'), t('homePlanner.tags.decorations'), t('homePlanner.tags.accessories'), t('homePlanner.tags.lighting'), t('homePlanner.tags.inspiration')]",
    "\"Te rog introdu măcar un titlu!\"": "t('homePlanner.pleaseAddTitle')",
    "\"Imaginea nu s-a putut procesa. Se va salva ideea fără imagine.\"": "t('homePlanner.imageProcessError')",
    "\"A apărut o eroare la salvare!\"": "t('homePlanner.saveError')",
    "'Adaugă Idee Nouă'": "t('homePlanner.addNewIdea')",
    "'Nume / Produs *'": "t('homePlanner.nameLabel')",
    "\"Ex: Canapea colțar IKEA\"": "t('homePlanner.namePlaceholder')",
    "'Cameră'": "t('homePlanner.roomLabel')",
    "'Link (URL produs/idee)'": "t('homePlanner.linkLabel')",
    "'Imagine (Opțional)'": "t('homePlanner.imageLabel')",
    "'Preț estimativ (Opțional)'": "t('homePlanner.priceLabel')",
    "\"Ex: 2500 RON\"": "t('homePlanner.pricePlaceholder')",
    "'Etichete (Tags)'": "t('homePlanner.tagsLabel')",
    "\"Tag nou...\"": "t('homePlanner.newTagPlaceholder')",
    "'Se încarcă...'": "t('common.loading')",
    "'Salvează Ideea'": "t('homePlanner.saveIdea')",
}
replace_in_file('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/AddHomeItemModal.jsx', add_home_replacements)

# ItemDetailsModal.jsx
item_details_replacements = {
    "'🔗 Deschide Link Produs'": "t('homePlanner.openProductLink')",
    "'Părerea voastră:'": "t('homePlanner.yourOpinion')",
    "'Tu:'": "t('homePlanner.you')",
    "'✅ Aprobat'": "t('homePlanner.approved')",
    "'❌ Respins'": "t('homePlanner.rejected')",
    "'⏳ Așteaptă decizia'": "t('homePlanner.waitingDecision')",
    "'Partenerul:'": "t('homePlanner.partner')",
    "'👎 Nu-mi place'": "t('homePlanner.dislike')",
    "'❤️ Perfect!'": "t('homePlanner.perfect')",
    "'✏️ Editează'": "t('homePlanner.edit')",
    "\"Sigur vrei să ștergi acest element?\"": "t('homePlanner.confirmDelete')",
    "'🗑️ Șterge Ideea'": "t('homePlanner.deleteIdea')",
    "'Discuții'": "t('homePlanner.discussions')",
    "'Niciun comentariu. Începe discuția!'": "t('homePlanner.noComments')",
    "\"Scrie un comentariu...\"": "t('homePlanner.writeComment')",
}
replace_in_file('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/ItemDetailsModal.jsx', item_details_replacements)

# SwipeCard.jsx
swipe_card_replacements = {
    "'DA ❤️'": "t('homePlanner.yes')",
    "'NU ❌'": "t('homePlanner.no')"
}
replace_in_file('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/components/SwipeCard.jsx', swipe_card_replacements)

print("Modals refactored")
