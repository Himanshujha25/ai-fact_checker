const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Global background replacements for hardcoded #08080E and 'rgba(8,8,14...)'
      content = content.replace(/#08080E/g, 'var(--bg-main)');
      content = content.replace(/rgba\(8,\s*8,\s*14,\s*0\.9[0-9]*\)/g, 'var(--bg-overlay)');
      
      // Replace constant declarations to use CSS vars
      content = content.replace(/const\s+GOLD\s*=\s*['"]#C9A84C['"];/g, "const GOLD = 'var(--gold)';");
      content = content.replace(/const\s+GOLD_L\s*=\s*['"]rgba\(201,168,76,0\.12\)['"];/g, "const GOLD_L = 'var(--gold-light)';");
      content = content.replace(/const\s+LINE\s*=\s*['"]rgba\(255,255,255,0\.07\)['"];/g, "const LINE = 'var(--line)';");
      content = content.replace(/const\s+SURF\s*=\s*['"]rgba\(255,255,255,0\.035\)['"];/g, "const SURF = 'var(--surf)';");
      content = content.replace(/const\s+TEXT\s*=\s*['"]#E8E4DC['"];/g, "const TEXT = 'var(--text-main)';");
      
      // Some files use .18 vs .22 for DIM, and .38 vs .42 for MUTED
      content = content.replace(/const\s+DIM\s*=\s*['"]rgba\(232,228,220,0\.[0-9]+\)['"];/g, "const DIM = 'var(--text-dim)';");
      content = content.replace(/const\s+MUTED\s*=\s*['"]rgba\(232,228,220,0\.[0-9]+\)['"];/g, "const MUTED = 'var(--text-muted)';");
      
      // Inline hardcoded text color #E8E4DC without constant
      content = content.replace(/#E8E4DC/g, 'var(--text-main)');
      
      // Inline hardcoded gold
      content = content.replace(/#C9A84C/g, 'var(--gold)');

      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${fullPath}`);
    }
  }
}

fixFiles(srcDir);
console.log('Migration complete!');
