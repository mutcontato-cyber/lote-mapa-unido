const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/SUPABASE_URL=(.*)/)[1].trim().replace(/"/g, '');
const key = env.match(/SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/"/g, '');

fetch(url + '/rest/v1/admin_settings?select=*&limit=1', {
  headers: { apikey: key, Authorization: 'Bearer ' + key }
})
.then(r => r.json())
.then(console.log);
