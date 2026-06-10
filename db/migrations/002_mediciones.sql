PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mediciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,

  fecha TEXT NOT NULL DEFAULT (date('now')),

  peso_kg REAL,
  altura_cm REAL,

  cintura_cm REAL,
  cadera_cm REAL,
  cuello_cm REAL,

  observaciones TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (paciente_id)
    REFERENCES pacientes(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mediciones_paciente_fecha
  ON mediciones(paciente_id, fecha);
