const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const newContent = content.replace(/dark:[^\s"'\`]+/g, '');
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
      }
    }
  });
};

walk('./src');
console.log('Removed all dark classes');
