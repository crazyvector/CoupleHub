const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/pages');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.module.css'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Simple regex to replace padding/padding-top/padding-bottom in .page and .container
  // But wait, it's safer to just look for `.page {` and `.container {` and replace their paddings
  
  // Replace padding-bottom: ...
  content = content.replace(/padding-bottom:\s*[^;]+;/g, 'padding-bottom: var(--page-padding-bottom);');
  
  // Replace padding-top: ...
  content = content.replace(/padding-top:\s*[^;]+;/g, 'padding-top: var(--page-padding-top);');

  // Handle shorthands: padding: top right bottom left; or padding: top/bottom left/right;
  // This is a bit tricky with regex, so we'll just append our variables after the shorthand, 
  // which will override the shorthand.
  // We'll insert it right after `.page {` or `.container {`
  content = content.replace(/\.page\s*\{/, '.page {\n  padding-top: var(--page-padding-top) !important;\n  padding-bottom: var(--page-padding-bottom) !important;');
  content = content.replace(/\.container\s*\{/, '.container {\n  padding-top: var(--page-padding-top) !important;\n  padding-bottom: var(--page-padding-bottom) !important;');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
});

console.log('Done padding update.');
