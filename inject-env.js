const fs = require('fs');
const path = require('path');

const filesToUpdate = ['app.js', 'admin.js'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminUser = process.env.ADMIN_USERNAME;
const adminPass = process.env.ADMIN_PASSWORD;

console.log('--- Environment Check ---');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `Set (Length: ${supabaseKey.length})` : 'MISSING');
console.log('ADMIN_USERNAME:', adminUser ? `Set (Length: ${adminUser.length})` : 'MISSING');
console.log('ADMIN_PASSWORD:', adminPass ? `Set (Length: ${adminPass.length})` : 'MISSING');
console.log('-------------------------');

if (!supabaseUrl || !supabaseKey || !adminUser || !adminPass) {
  console.error('Error: All environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_USERNAME, ADMIN_PASSWORD) must be set');
  process.exit(1);
}

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Absolute replacement of unique placeholders
    const newContent = content
      .replace(/\[\[SUPABASE_URL\]\]/g, supabaseUrl)
      .replace(/\[\[SUPABASE_KEY\]\]/g, supabaseKey)
      .replace(/\[\[ADMIN_USER\]\]/g, adminUser)
      .replace(/\[\[ADMIN_PASS\]\]/g, adminPass)
      .replace(/\[\[BUILD_TIME\]\]/g, new Date().toLocaleString());

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Updated ${file} successfully`);
    } else {
      console.log(`⚠️ No placeholders found in ${file}`);
    }
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

console.log('Build script completed successfully');
