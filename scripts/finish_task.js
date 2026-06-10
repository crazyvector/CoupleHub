import fs from 'fs';
const file = '/Users/andrei/.gemini/antigravity/brain/f9c84990-e058-471b-a56d-3e56fb6a9cb1/task.md';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/- \[ \]/g, '- [x]');
fs.writeFileSync(file, content);
