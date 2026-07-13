const fs = require('fs');
const path = require('path');

const renames = [
  { old: 'Proposal', new: 'ProposalLetterToTheIndustry' },
  { old: 'ApplicationLetter', new: 'StudentApplicationLetter' },
  { old: 'Endorsement', new: 'STIOJTEndorsementLetter' },
  { old: 'MOA', new: 'MemorandumOfAgreement' },
  { old: 'Journal', new: 'WeeklyJournal' },
  { old: 'TrainingPlan', new: 'OJTTrainingPlan' }
];

const basePath = path.join('c:\\Users\\johnd\\Downloads\\Capstone 2', 'src', 'pages', 'student');

for (const r of renames) {
  const oldPath = path.join(basePath, `${r.old}.tsx`);
  const newPath = path.join(basePath, `${r.new}.tsx`);
  
  if (fs.existsSync(oldPath)) {
    // Read and update the export
    let content = fs.readFileSync(oldPath, 'utf8');
    content = content.replace(new RegExp(`export const ${r.old} =`, 'g'), `export const ${r.new} =`);
    fs.writeFileSync(oldPath, content);
    
    // Rename the file
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${r.old} to ${r.new}`);
  }
}

// Update App.tsx
const appPath = path.join('c:\\Users\\johnd\\Downloads\\Capstone 2', 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

for (const r of renames) {
  appContent = appContent.replace(new RegExp(`import \\{ ${r.old} \\} from '\\./pages/student/${r.old}';`, 'g'), `import { ${r.new} } from './pages/student/${r.new}';`);
  appContent = appContent.replace(new RegExp(`<${r.old} />`, 'g'), `<${r.new} />`);
}

fs.writeFileSync(appPath, appContent);
console.log('App.tsx updated.');
