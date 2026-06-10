const fs = require('fs');
const path = require('path');

const contextFile = path.join(__dirname, '../src/contexts/LanguageContext.jsx');
let content = fs.readFileSync(contextFile, 'utf8');

// Extract the translations object
const match = content.match(/const translations = (\{[\s\S]*?\n\});\n\nconst LanguageContext/);
if (!match) {
  console.error('Could not find translations object');
  process.exit(1);
}

const translationsStr = match[1];

// We will create src/data/translations.js
let newFileContent = `// Auto-generated translations file
export const translations = ${translationsStr};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/translations.js'), newFileContent);
console.log('Translations extracted to src/data/translations.js');
