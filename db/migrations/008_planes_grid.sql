-- Planes como grilla semanal (comidas × días) de texto libre.
-- Guardamos todo el documento del plan (encabezado + semanas + celdas) como JSON
-- en una sola columna; es flexible para días/semanas variables y se lee/escribe entero.
-- Las tablas plan_comidas / plan_items quedan en desuso (no se borran por compatibilidad).
ALTER TABLE planes ADD COLUMN grid_json TEXT;
