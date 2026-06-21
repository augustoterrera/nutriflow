// @ts-nocheck
// app/db/migrate.cjs.ts
const fs = require("fs");
const path = require("path");
const { getDB } = require("../lib/db"); // app/db -> app/lib

async function ensureMetaTable(db) {
  await db.exec(`
    create table if not exists migraciones (
      id integer primary key autoincrement,
      nombre text not null unique,
      ejecutada_en text not null
    );
  `);
}

async function getExecutedMigrations(db) {
  const rows = await db.all("select nombre from migraciones");
  return new Set(rows.map((r) => r.nombre));
}

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No existe db/migrations");
    process.exit(1);
  }

  const db = await getDB();

  await ensureMetaTable(db);
  const executed = await getExecutedMigrations(db);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let applied = 0;

  for (const file of files) {
    if (executed.has(file)) continue;

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    await db.exec("BEGIN");
    try {
      await db.exec(sql);
      await db.run(
        "insert into migraciones (nombre, ejecutada_en) values (?, datetime('now'))",
        file
      );
      await db.exec("COMMIT");
      applied++;
      console.log(`✅ Migración aplicada: ${file}`);
    } catch (e) {
      await db.exec("ROLLBACK");
      throw e;
    }
  }

  if (applied === 0) console.log("✅ No hay migraciones pendientes.");
  else console.log(`✅ Total aplicadas: ${applied}`);
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
