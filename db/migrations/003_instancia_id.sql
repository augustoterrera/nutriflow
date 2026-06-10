PRAGMA foreign_keys = ON;

-- Asegurar fila base de configuracion
INSERT OR IGNORE INTO configuracion_app (id) VALUES (1);

-- Agregar instancia_id a configuracion_app (si no existe)
ALTER TABLE configuracion_app ADD COLUMN instancia_id TEXT;

-- Setear instancia_id si está vacío (sirve para DB nueva o vieja)
UPDATE configuracion_app
SET instancia_id = COALESCE(instancia_id, hex(randomblob(16))),
    actualizado_en = COALESCE(actualizado_en, datetime('now'))
WHERE id = 1;

-- Agregar instancia_id a sesiones (si no existe)
ALTER TABLE sesiones ADD COLUMN instancia_id TEXT;

-- Completar sesiones existentes con la instancia actual (por si ya había data)
UPDATE sesiones
SET instancia_id = (SELECT instancia_id FROM configuracion_app WHERE id = 1)
WHERE instancia_id IS NULL;
