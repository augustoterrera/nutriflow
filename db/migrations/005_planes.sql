PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS planes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  paciente_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  fecha TEXT NOT NULL DEFAULT (date('now')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_comidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  plan_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('desayuno','almuerzo','merienda','cena','colacion')),
  nota TEXT,
  FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  comida_id INTEGER NOT NULL,
  alimento_id INTEGER REFERENCES alimentos(id),
  nombre TEXT NOT NULL,
  gramos REAL NOT NULL,
  kcal REAL NOT NULL,
  prot REAL NOT NULL DEFAULT 0,
  cho REAL NOT NULL DEFAULT 0,
  gras REAL NOT NULL DEFAULT 0,
  fibra REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (comida_id) REFERENCES plan_comidas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_planes_paciente_fecha ON planes(paciente_id, fecha);
CREATE INDEX IF NOT EXISTS idx_plan_comidas_plan ON plan_comidas(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_comida ON plan_items(comida_id);
