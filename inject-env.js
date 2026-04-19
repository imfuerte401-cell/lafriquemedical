const fs = require('fs');
const path = require('path');

const filesToUpdate = ['app.js', 'admin.js'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminUser = process.env.ADMIN_USERNAME;
const adminPass = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey || !adminUser || !adminPass) {
  console.error('Error: All environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_USERNAME, ADMIN_PASSWORD) must be set');
  process.exit(1);
}

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/VITE_SUPABASE_URL/g, supabaseUrl);
    content = content.replace(/VITE_SUPABASE_ANON_KEY/g, supabaseKey);
    content = content.replace(/ADMIN_USERNAME/g, adminUser);
    content = content.replace(/ADMIN_PASSWORD/g, adminPass);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file} with environment variables`);
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

console.log('Build script completed successfully');
