PRAGMA foreign_keys = ON;

-- CONFIGURACIÓN APP
CREATE TABLE IF NOT EXISTS configuracion_app (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pin_hash TEXT,
  pin_creado_en TEXT,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO configuracion_app (id)
VALUES (1)
ON CONFLICT(id) DO NOTHING;

-- SESIONES
CREATE TABLE IF NOT EXISTS sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_sesion TEXT NOT NULL UNIQUE,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  expira_en TEXT NOT NULL,
  ultimo_uso_en TEXT,
  cerrada_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token_sesion);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en);

-- PACIENTES (DNI obligatorio y único)
CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dni TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  sexo TEXT,
  fecha_nacimiento TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  estado_civil TEXT,
  ocupacion TEXT,
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);

-- ANAMNESIS (historial por paciente)
CREATE TABLE IF NOT EXISTS anamnesis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT (date('now')),

  -- hábitos / consumo
  consumo_verduras TEXT,
  consumo_frutas TEXT,
  consumo_agua TEXT,
  consumo_carnes TEXT,
  actividad_fisica TEXT,

  -- preferencias alimentarias
  frutas_no_gusta TEXT,     -- ej: "banana, manzana"
  verduras_no_gusta TEXT,   -- ej: "lechuga, espinaca"

  -- tipo de dieta
  tipo_dieta TEXT NOT NULL DEFAULT 'omnivoro',
  -- valores esperados: omnivoro | vegetariano | vegano

  -- suplementos
  consume_suplementos INTEGER NOT NULL DEFAULT 0,
  suplementos_detalle TEXT,

  observaciones TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (paciente_id)
    REFERENCES pacientes(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_paciente_fecha
  ON anamnesis(paciente_id, fecha);
