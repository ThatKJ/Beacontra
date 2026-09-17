import fs from 'fs';

const data = fs.readFileSync('docs/research/competitive_landscape_raw.md', 'utf8');

const rows = data.split('\n').filter(line => line.startsWith('|') && line.includes('http'));

const matches = rows.filter(project => {
  const lower = project.toLowerCase();
  return lower.includes('brand') || 
         lower.includes('counterfeit') || 
         lower.includes('trademark') || 
         lower.includes('fake') || 
         lower.includes('mrp') || 
         lower.includes('unauthorized');
});

console.log(`Found ${matches.length} projects related to brand protection/counterfeit.`);
matches.forEach(m => console.log(m.trim().substring(0, 150) + '...'));
