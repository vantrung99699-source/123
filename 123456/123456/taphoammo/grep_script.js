const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
let res = '';
for(let i=0; i<lines.length; i++) {
  if(lines[i].includes('dịch vụ') || lines[i].includes('Dịch vụ') || lines[i].includes('sản phẩm') || lines[i].includes('Sản phẩm') || lines[i].includes('Tạm giữ tiền')) {
      res += `${i+1}: ${lines[i].trim()}\n`;
  }
}
fs.writeFileSync('temp_grep.txt', res);
