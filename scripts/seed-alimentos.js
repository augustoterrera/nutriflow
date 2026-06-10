const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dbFile = path.join(process.cwd(), 'data', 'tomi_nutri.sqlite');
const seedFile = path.join(process.cwd(), 'db', 'seed_alimentos.sql');

if (!fs.existsSync(seedFile)) {
  console.error('❌ No existe db/seed_alimentos.sql');
  process.exit(1);
}

const sql = fs.readFileSync(seedFile, 'utf8');
const db = new sqlite3.Database(dbFile);

db.exec(sql, (err) => {
  db.close((closeErr) => {
    if (err || closeErr) {
      console.error('❌ Error al cargar alimentos:', (err || closeErr).message);
      process.exit(1);
    }
    console.log('✅ Seed de alimentos aplicado.');
  });
});
