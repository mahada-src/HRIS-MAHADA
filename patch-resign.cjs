const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

let count = 0;
files.forEach(file => {
  // Skip the ones where we DO want to see resigning people or where they are handled specifically
  if (file.includes('TimKaryawan.tsx') || file.includes('ExitDetail.tsx') || file.includes('ExitDashboard.tsx') || file.includes('Login.tsx') || file.includes('Laporan.tsx') || file.includes('AuthContext.tsx')) {
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Find things like `supabase.from('employees').select('...')`
  // and append `.neq('status_karyawan', 'Resign').neq('status_karyawan', 'PHK').neq('status_karyawan', 'Inactive')`
  // if not already present.
  
  // A simple regex to find `.from('employees').select('...')`
  const regex = /(supabase\.from\('employees'\)\.select\([^)]*\))/g;
  
  content = content.replace(regex, (match) => {
    if (match.includes("neq('status_karyawan'")) {
      return match; // already patched
    }
    return match + ".neq('status_karyawan', 'Resign').neq('status_karyawan', 'PHK').neq('status_karyawan', 'Inactive')";
  });
  
  // Let's also catch `.from('employees').select("*")` if double quotes were used
  const regex2 = /(supabase\.from\('employees'\)\.select\([^)]*\))/g;
  // wait, the first regex covers both.
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched', file);
    count++;
  }
});

console.log('Total patched:', count);
