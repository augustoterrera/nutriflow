const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3');

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'tomi_nutri.sqlite');

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

function quoteSql(value) {
  return String(value).replaceAll("'", "''");
}

function runSql(sql) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbFile);
    db.exec(sql, (err) => {
      db.close((closeErr) => {
        if (err || closeErr) reject(err || closeErr);
        else resolve();
      });
    });
  });
}

async function crearBackupDiario() {
  if (!fs.existsSync(dbFile)) return;

  const backupsDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const backupFile = path.join(backupsDir, `tomi_nutri_${today}.sqlite`);

  if (!fs.existsSync(backupFile)) {
    console.log('🧰 Creando backup local del día...');
    await runSql(`VACUUM INTO '${quoteSql(backupFile)}';`);
  }

  const backups = fs
    .readdirSync(backupsDir)
    .filter((name) => /^tomi_nutri_\d{4}-\d{2}-\d{2}\.sqlite$/.test(name))
    .sort()
    .reverse();

  for (const oldBackup of backups.slice(7)) {
    fs.unlinkSync(path.join(backupsDir, oldBackup));
  }

  // La app puede vivir en disco extraíble: truncar WAL reduce riesgo de corrupción al desconectar.
  await runSql('PRAGMA wal_checkpoint(TRUNCATE);');
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(dbFile)) {
    await crearBackupDiario();
    console.log('✅ Base de datos encontrada. Ejecutando migraciones...');
  } else {
    console.log('📦 Base de datos no encontrada. Ejecutando migraciones...');
  }

  try {
    run('pnpm run db:migrate');
    console.log('✅ Migraciones completadas.');

    const seedAlimentos = path.join(process.cwd(), 'db', 'seed_alimentos.sql');
    if (fs.existsSync(seedAlimentos)) {
      run('pnpm run db:seed:alimentos');
      console.log('✅ Banco de alimentos actualizado.');
    }

    console.log('🚀 Iniciando servidor...\n');
  } catch (error) {
    console.error('❌ Error al preparar la base de datos:', error.message);
    process.exit(1);
  }
}

main();
