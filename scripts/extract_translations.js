const fs = require('fs');

const contextFile = '../src/contexts/LanguageContext.jsx';
const contextContent = fs.readFileSync(contextFile, 'utf8');

// I will append new keys at the end of the ro block and en block.
console.log("File read successfully");
