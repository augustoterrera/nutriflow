PRAGMA foreign_keys = ON;

-- 1) Paciente demo (no rompe si ya existe)
INSERT OR IGNORE INTO pacientes (
  dni,
  nombre_completo,
  telefono,
  email,
  direccion,
  fecha_nacimiento,
  sexo,
  activo
) VALUES (
  '50999888',
  'Paciente Demo Evolución',
  '381-555-1234',
  'demo@nutriflow.local',
  'Tucumán, Argentina',
  '1992-04-18',
  'M',
  1
);

-- 2) Mediciones: insertar usando el ID real del paciente (por DNI)
INSERT INTO mediciones (paciente_id, fecha, peso_kg, altura_cm, cintura_cm)
SELECT
  p.id,
  m.fecha,
  m.peso_kg,
  m.altura_cm,
  m.cintura_cm
FROM pacientes p
JOIN (
  SELECT '2025-01-05' AS fecha, 104.2 AS peso_kg, 173 AS altura_cm, 112.0 AS cintura_cm UNION ALL
  SELECT '2025-01-20', 103.6, 173, 111.2 UNION ALL
  SELECT '2025-02-03', 102.8, 173, 110.4 UNION ALL
  SELECT '2025-02-18', 102.1, 173, 109.6 UNION ALL
  SELECT '2025-03-05', 101.4, 173, 108.9 UNION ALL
  SELECT '2025-03-20', 100.6, 173, 108.1 UNION ALL
  SELECT '2025-04-04', 99.9, 173, 107.3 UNION ALL
  SELECT '2025-04-19', 99.2, 173, 106.7 UNION ALL
  SELECT '2025-05-03', 98.6, 173, 106.0 UNION ALL
  SELECT '2025-05-18', 98.0, 173, 105.3 UNION ALL
  SELECT '2025-06-02', 97.2, 173, 104.7 UNION ALL
  SELECT '2025-06-17', 96.6, 173, 104.0 UNION ALL
  SELECT '2025-07-02', 96.0, 173, 103.4 UNION ALL
  SELECT '2025-07-18', 95.4, 173, 102.7 UNION ALL
  SELECT '2025-08-02', 94.8, 173, 102.1 UNION ALL
  SELECT '2025-08-18', 94.1, 173, 101.4 UNION ALL
  SELECT '2025-09-03', 93.6, 173, 100.9 UNION ALL
  SELECT '2025-09-20', 93.0, 173, 100.3 UNION ALL
  SELECT '2025-10-05', 92.3, 173, 99.7 UNION ALL
  SELECT '2025-10-22', 91.8, 173, 99.1 UNION ALL
  SELECT '2025-11-06', 91.1, 173, 98.6 UNION ALL
  SELECT '2025-11-22', 90.6, 173, 98.0 UNION ALL
  SELECT '2025-12-07', 90.0, 173, 97.4 UNION ALL
  SELECT '2026-01-20', 89.2, 173, 96.8
) m
WHERE p.dni = '50999888';
