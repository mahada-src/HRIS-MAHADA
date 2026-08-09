const fs = require('fs');

// Patch types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/created_at: string;/g, 'created_at?: string;');
types = types.replace(/updated_at: string;/g, 'updated_at?: string;');
fs.writeFileSync('src/types.ts', types);

// Patch supabase.ts
let supabase = fs.readFileSync('src/lib/supabase.ts', 'utf8');
supabase = supabase.replace(/import.meta.env/g, '(import.meta as any).env');
fs.writeFileSync('src/lib/supabase.ts', supabase);
