PRAGMA foreign_keys = ON;

ALTER TABLE pacientes ADD COLUMN uuid TEXT;
UPDATE pacientes SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_uuid ON pacientes(uuid);

ALTER TABLE anamnesis ADD COLUMN uuid TEXT;
UPDATE anamnesis SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_uuid ON anamnesis(uuid);

ALTER TABLE mediciones ADD COLUMN uuid TEXT;
UPDATE mediciones SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mediciones_uuid ON mediciones(uuid);

ALTER TABLE anamnesis ADD COLUMN actualizado_en TEXT;
UPDATE anamnesis SET actualizado_en = COALESCE(actualizado_en, creado_en, datetime('now'));

ALTER TABLE mediciones ADD COLUMN actualizado_en TEXT;
UPDATE mediciones SET actualizado_en = COALESCE(actualizado_en, creado_en, datetime('now'));
