PRAGMA foreign_keys = ON;

-- Una evaluación energética es una fotografía clínica: conserva los datos,
-- decisiones y resultados usados en ese momento. No se actualiza al cambiar
-- posteriormente la ficha o las mediciones del paciente.
CREATE TABLE IF NOT EXISTS evaluaciones_energeticas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
  paciente_id INTEGER NOT NULL,
  medicion_id INTEGER,
  fecha TEXT NOT NULL DEFAULT (date('now')),
  fecha_medicion_origen TEXT,
  origen TEXT NOT NULL CHECK(origen IN ('medicion', 'manual')),

  edad INTEGER NOT NULL,
  sexo TEXT NOT NULL CHECK(sexo IN ('M', 'F')),
  peso_kg REAL NOT NULL,
  talla_cm REAL NOT NULL,

  actividad TEXT NOT NULL,
  factor_actividad REAL NOT NULL,
  formula_get TEXT NOT NULL CHECK(formula_get IN ('mifflin', 'harris')),
  tmb_mifflin INTEGER NOT NULL,
  tmb_harris INTEGER NOT NULL,
  get_kcal INTEGER NOT NULL,

  objetivo_tipo TEXT NOT NULL CHECK(objetivo_tipo IN ('bajar', 'mantener', 'subir')),
  ajuste_kcal INTEGER NOT NULL,
  objetivo_kcal INTEGER NOT NULL,
  observaciones TEXT,
  version_calculo TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (medicion_id) REFERENCES mediciones(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_energia_paciente_fecha
  ON evaluaciones_energeticas(paciente_id, fecha DESC, id DESC);

-- El plan conserva qué evaluación se tomó como referencia, aunque sus kcal
-- finales sigan siendo editables por criterio profesional.
ALTER TABLE planes ADD COLUMN evaluacion_energetica_id INTEGER
  REFERENCES evaluaciones_energeticas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_planes_evaluacion_energetica
  ON planes(evaluacion_energetica_id);
