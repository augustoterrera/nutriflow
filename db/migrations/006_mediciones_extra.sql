PRAGMA foreign_keys = ON;

ALTER TABLE mediciones ADD COLUMN grasa_pct REAL;
ALTER TABLE mediciones ADD COLUMN musculo_pct REAL;
ALTER TABLE mediciones ADD COLUMN brazo_cm REAL;
ALTER TABLE mediciones ADD COLUMN muneca_cm REAL;
