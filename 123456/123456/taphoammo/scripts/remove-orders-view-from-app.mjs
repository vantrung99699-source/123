import fs from 'fs';

const appPath = new URL('../src/App.tsx', import.meta.url);
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);
// Remove OrdersView const (lines 4921-5386, 1-based) -> index 4920..5385
const kept = [...lines.slice(0, 4920), ...lines.slice(5386)];
fs.writeFileSync(appPath, kept.join('\n'), 'utf8');
console.log('removed OrdersView from App.tsx');
