const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
let res1 = '', res2 = '';
for(let i=0; i<lines.length; i++) {
  if(lines[i].includes('currentView === \'gian-hang\'')) {
      res1 += `${i+1}: ${lines[i].trim()}\n`;
  }
  if(lines[i].includes('New Panel')) {
      res2 += `${i+1}: ${lines[i].trim()}\n`;
  }
}
fs.writeFileSync('temp_grep_gian_hang.txt', 'Render:\n' + res1 + '\nLogo:\n' + res2);
