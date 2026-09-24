const fs = require('fs');
const content = fs.readFileSync('step_user.html', 'utf8');

// Find elements with style attributes
const styleMatches = [...content.matchAll(/<([a-z0-9]+)[^>]*?style="([^"]*)"[^>]*>/gi)];
console.log(`Found ${styleMatches.length} styled elements:`);
for (const m of styleMatches) {
  const tag = m[1];
  const full = m[0];
  const style = m[2];
  // extract class if any
  const cls = (full.match(/class="([^"]*)"/) || [])[1] || '';
  console.log(`TAG: <${tag}> CLASS: ${cls.slice(0, 60)}...`);
  console.log(`  STYLE: ${style}\n`);
}

// Find Card 3 in Row 3
const card3Match = content.match(/Action Needed|Complete/i);
console.log('Match for Action Needed or Complete:', card3Match ? card3Match[0] : 'None');

