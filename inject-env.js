const fs = require('fs');
const path = require('path');

const filesToUpdate = ['app.js', 'admin.js'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/VITE_SUPABASE_URL/g, supabaseUrl);
    content = content.replace(/VITE_SUPABASE_ANON_KEY/g, supabaseKey);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file} with environment variables`);
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

console.log('Build script completed successfully');
