const fs = require('fs');
const path = require('path');

const renames = [
  { old: 'Completion', new: 'IntegrationPaper' },
  { old: 'Evaluation', new: 'PerformanceAppraisal' }
];

const basePath = path.join('c:\\Users\\johnd\\Downloads\\Capstone 2', 'src', 'pages', 'student');

for (const r of renames) {
  const oldPath = path.join(basePath, `${r.old}.tsx`);
  const newPath = path.join(basePath, `${r.new}.tsx`);
  
  if (fs.existsSync(oldPath)) {
    let content = fs.readFileSync(oldPath, 'utf8');
    content = content.replace(new RegExp(`export const ${r.old} =`, 'g'), `export const ${r.new} =`);
    content = content.replace(new RegExp(`export const ${r.old}: React\\.FC =`, 'g'), `export const ${r.new}: React.FC =`);
    fs.writeFileSync(oldPath, content);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${r.old} to ${r.new}`);
  }
}

const appPath = path.join('c:\\Users\\johnd\\Downloads\\Capstone 2', 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

for (const r of renames) {
  appContent = appContent.replace(new RegExp(`import \\{ ${r.old} \\} from '\\./pages/student/${r.old}';`, 'g'), `import { ${r.new} } from './pages/student/${r.new}';`);
  appContent = appContent.replace(new RegExp(`<${r.old} />`, 'g'), `<${r.new} />`);
}

fs.writeFileSync(appPath, appContent);
console.log('App.tsx updated.');
