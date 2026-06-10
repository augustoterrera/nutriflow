const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'tomi_nutri.sqlite');

// Verificar si la DB existe
if (!fs.existsSync(dbFile)) {
  console.log('📦 Base de datos no encontrada. Ejecutando migraciones...');
  try {
    execSync('pnpm run db:migrate', { stdio: 'inherit' });
    console.log('✅ Migraciones completadas. Iniciando servidor...\n');
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Base de datos encontrada. Iniciando servidor...\n');
}
