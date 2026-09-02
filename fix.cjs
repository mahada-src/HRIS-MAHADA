const fs = require('fs');

try {
  let content = fs.readFileSync('supabase-schema.sql', 'utf-8');

  // Regex to match CREATE POLICY statements outside DO block
  const pattern = /CREATE\s+POLICY\s+\"([^\"]+)\"\s+ON\s+([a-zA-Z0-9_\.]+)/gi;
  
  content = content.replace(pattern, (match, policyName, tableName) => {
    return 'DROP POLICY IF EXISTS \"' + policyName + '\" ON ' + tableName + ';\n' + match;
  });

  // Regex to match CREATE POLICY inside format() in DO block
  const doPattern = /EXECUTE\s+format\(\'CREATE\s+POLICY\s+\"([^\"]+)\"\s+ON\s+([a-zA-Z0-9_\.]+)/gi;
  content = content.replace(doPattern, (match, policyName, tableName) => {
    return 'EXECUTE format(\'DROP POLICY IF EXISTS \"' + policyName + '\" ON ' + tableName + ';\', tbl, tbl);\n    ' + match;
  });

  fs.writeFileSync('supabase-schema-idempotent.sql', content, 'utf-8');
  console.log('File supabase-schema-idempotent.sql berhasil dibuat!');
} catch (err) {
  console.error(err);
}
