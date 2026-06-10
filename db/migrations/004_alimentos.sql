PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS alimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  nombre TEXT NOT NULL UNIQUE,
  kcal REAL NOT NULL,
  prot REAL NOT NULL DEFAULT 0,
  cho REAL NOT NULL DEFAULT 0,
  gras REAL NOT NULL DEFAULT 0,
  fibra REAL NOT NULL DEFAULT 0,
  grupo TEXT NOT NULL,
  es_custom INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alimentos_grupo ON alimentos(grupo);
CREATE INDEX IF NOT EXISTS idx_alimentos_nombre ON alimentos(nombre);
