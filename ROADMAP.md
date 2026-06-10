# NutriFlow — Roadmap de Implementación (formato agente)

> Este roadmap está escrito para ser ejecutado por un agente de código (Codex/Claude),
> **una fase por sesión** (o una tarea por prompt en las fases largas).
> Decisión de stack ya tomada y justificada en `AUDIT.md`: se mantiene Next.js 16 + SQLite local. No proponer migraciones de stack.

---

## CONTRATO GLOBAL (leer antes de cualquier fase)

**Contexto mínimo:**
- App Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui. Gestor de paquetes: **pnpm**.
- Persistencia: SQLite en `data/tomi_nutri.sqlite` via `lib/db.ts` (`getDB()`, API async de `sqlite`). Sin ORM. Queries SQL a mano.
- Mutaciones via Server Actions; lectura en Server Components.
- Migraciones: archivos `db/migrations/NNN_nombre.sql` aplicados en orden por `db/migrate.cjs.ts`, que registra las ya ejecutadas en la tabla `migraciones` (idempotente). Comando: `pnpm db:migrate`.
- Archivo de referencia funcional/visual: `nutriapp.html` (raíz del proyecto). Referencias de líneas clave:
  - Array `ALIMENTOS` (~90 ítems): línea 556
  - Objeto `BANCO_DATA` (categorías + preparaciones): línea 648
  - Resumen de paciente (IMC, Lorentz, ICC, TMB): función `renderResumen`, línea 811
  - Calculadora (Mifflin/Harris/GET/objetivo): función `calcularEnergia`, línea 986
  - Editor de plan (5 comidas, macros, barras): función `renderPlanScreen`, línea 1093
  - Template de exportación PDF: función `exportarPlan`, línea 1304

**Prohibido (en todas las fases):**
- Romper lo existente: setup/lock con PIN, sesiones, pacientes, anamnesis, mediciones, evolución, papelera.
- `localStorage`, IndexedDB, Framer Motion, MUI/Chakra, Prisma, librerías de PDF (puppeteer/jsPDF).
- Hardcodear alimentos en el frontend (siempre desde la tabla `alimentos`).
- Requests a CDNs externos (fuentes, CSS): todo self-hosted.
- Instalar dependencias no listadas en la tarea.

**Obligatorio (en todas las fases):**
- Lógica de negocio (cálculos nutricionales, sync) comentada **en español**.
- Cierre de fase: correr `pnpm lint` y `pnpm build`; ambos sin errores. Si el build falla, arreglarlo antes de dar la fase por terminada. Reportar el resultado.

---

## Fase 0 — Limpieza y línea base

> Tareas independientes entre sí. Hardware objetivo: Celeron N4500, 4 GB RAM.

- [x] **F0.1 — Unificar gestor de paquetes.** Borrar `package-lock.json` (queda solo `pnpm-lock.yaml`).
  *Verificar:* `test ! -f package-lock.json && echo OK`
- [x] **F0.2 — Borrar completamente los que existe dentro de public.excepto** `nutriflow-icon.ico`.
  *Verificar:* `ls public/` muestra solo `nutriflow-icon.ico`; `grep -ri "publi\|ULTRAPROCESADOS\|ENTRENO" app components lib` sin resultados.
- [x] **F0.3 — Arreglar `scripts/init-db.js`.** Hoy solo corre migraciones si la DB **no existe**, así que las migraciones nuevas nunca se aplican a una DB existente. Cambiar: ejecutar **siempre** `pnpm run db:migrate` (es idempotente); mantener los mensajes de consola.
  *Verificar:* `node scripts/init-db.js` con la DB existente imprime "No hay migraciones pendientes".
- [x] **F0.4 — Línea base de build.** Correr `pnpm build`. Si hay errores, arreglarlos (cambios mínimos, sin refactors). Anotar en el reporte de la fase los warnings preexistentes.
  *Verificar:* `pnpm build` exit code 0.

---

## Fase 1 — Modo producción + design system

- [x] **F1.1 — `NutriFlow.bat` en modo producción.** Reescribir el `.bat` (es batch de Windows; mantener mensajes en español):
  1. Si no existe `node_modules` → `pnpm install`.
  2. `node scripts/init-db.js` (migraciones).
  3. Si no existe `.next/BUILD_ID` → `pnpm build`. (Regla simple: para forzar rebuild tras actualizar código, borrar `.next`; documentarlo en un `echo` del propio .bat.)
  4. Abrir `http://localhost:3000` tras 5 s (como hoy) y correr `pnpm start`.
  *Verificar:* lectura del .bat (no se puede ejecutar en Linux); localmente `pnpm build && pnpm start` sirve la app en :3000 (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200 o 307).
- [x] **F1.2 — Fuentes self-hosted.** En `app/layout.tsx` cargar con `next/font/google`: **Syne** (variable `--font-syne`), **DM Sans** (`--font-dm-sans`), **DM Mono** (`--font-dm-mono`), `subsets: ["latin"]`, `display: "swap"`. Aplicar las variables al `<html>` y en `globals.css` setear `font-family` base = DM Sans; headings (`h1–h4`) = Syne. (`next/font` descarga en build y sirve local: cumple offline.)
  *Verificar:* `pnpm build` OK y `grep -r "fonts.googleapis" .next/static --include="*.css"` sin resultados.
- [x] **F1.3 — Paleta verde del HTML como tema.** En `app/globals.css`:
  1. Declarar los tokens del HTML (copiar de `nutriapp.html` líneas 10-17): `--v1:#1B4332` … `--v9:#F0FBF4`, `--nar:#E76F51`, `--ama:#F4A261`, `--az:#457B9D`, `--roj:#E63946`, `--bg:#F7FBF8`, `--txt:#1A2E23`, `--sub:#4A6357`, `--muted-nf:#8AAA98`, `--border-nf:#DFF0E7`.
  2. Remapear las variables shadcn en `:root`: `--background`→`--bg`, `--foreground`→`--txt`, `--primary`→`--v2`, `--primary-foreground`→blanco, `--card`→blanco, `--accent`→`--v8`, `--destructive`→`--roj`, `--border`→`--border-nf`, `--muted-foreground`→`--sub`, sidebar: fondo `--v1`, texto blanco, accent `--v2`.
  3. En `app/layout.tsx` quitar `className="dark"` (el tema del HTML es claro). Dejar el bloque `.dark` como está (no se usa).
  *Verificar:* `pnpm build` OK; captura o descripción del dashboard con fondo claro y sidebar verde oscuro.
- [x] **F1.4 — Revisar contraste tras el cambio de tema.** Las páginas existentes tienen estilos inline pensados para fondo oscuro (ej.: `app/dashboard/pacientes/[id]/page.tsx` usa `border-white`, `bg-slate-800`, `rgba(255,255,255,...)`). Reemplazarlos por clases de tema (`border-border`, `bg-card`, `text-muted-foreground`, componentes `Button`/`Card` existentes). Solo cambios de estilo: **no tocar lógica ni queries**.
  *Verificar:* `grep -rn "border-white\|bg-slate-800" app/` sin resultados; `pnpm build` OK.

---

## Fase 2 — Base de datos: alimentos, planes, mediciones, cálculos

> Orden estricto: F2.1 → F2.2 → … Las migraciones se numeran a continuación de `003`.

- [x] **F2.1 — Migración `004_alimentos.sql`.**
  ```sql
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
  ```
  *Verificar:* `pnpm db:migrate` aplica 004; `sqlite3 data/tomi_nutri.sqlite ".schema alimentos"` la muestra.
- [x] **F2.2 — Migración `005_planes.sql`.** Tablas `planes (id, uuid, paciente_id FK→pacientes ON DELETE CASCADE, nombre, fecha TEXT default date('now'), creado_en, actualizado_en)`, `plan_comidas (id, uuid, plan_id FK→planes ON DELETE CASCADE, tipo TEXT NOT NULL CHECK(tipo IN ('desayuno','almuerzo','merienda','cena','colacion')), nota TEXT)`, `plan_items (id, uuid, comida_id FK→plan_comidas ON DELETE CASCADE, alimento_id INTEGER NULL REFERENCES alimentos(id), nombre TEXT NOT NULL, gramos REAL NOT NULL, kcal REAL NOT NULL, prot REAL NOT NULL DEFAULT 0, cho REAL NOT NULL DEFAULT 0, gras REAL NOT NULL DEFAULT 0, fibra REAL NOT NULL DEFAULT 0)`. Mismo patrón de `uuid` default que 004. Índices: `planes(paciente_id, fecha)`, `plan_comidas(plan_id)`, `plan_items(comida_id)`.
  > Nota: los macros se guardan **ya calculados por porción** en `plan_items` (snapshot), igual que el HTML — un plan no cambia si después se edita el alimento.
  *Verificar:* `sqlite3 data/tomi_nutri.sqlite ".tables"` muestra las 3 tablas.
- [x] **F2.3 — Migración `006_mediciones_extra.sql`.** `ALTER TABLE mediciones ADD COLUMN` para: `grasa_pct REAL`, `musculo_pct REAL`, `brazo_cm REAL`, `muneca_cm REAL`.
  *Verificar:* `sqlite3 data/tomi_nutri.sqlite "PRAGMA table_info(mediciones)"` incluye las 4 columnas.
- [x] **F2.4 — Migración `007_uuid_negocio.sql`.** Agregar columna `uuid TEXT` a `pacientes`, `anamnesis` y `mediciones` (SQLite no permite UNIQUE en ADD COLUMN: agregar columna, hacer `UPDATE ... SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL`, y crear `CREATE UNIQUE INDEX`). Agregar también `actualizado_en TEXT` a `anamnesis` y `mediciones` (backfill con `creado_en`). Es preparación para la sync con el VPS (Fase 6, pospuesta): se hace ahora igual porque cuesta nada y evita re-migrar datos después.
  *Verificar:* `sqlite3 data/tomi_nutri.sqlite "select count(*) from pacientes where uuid is null"` → 0.
- [x] **F2.5 — Seed de alimentos `db/seed_alimentos.sql`.** Transcribir los ~90 ítems del array `ALIMENTOS` de `nutriapp.html` (línea 556; formato `[nombre, kcal, prot, cho, gras, fibra, grupo]`) a `INSERT OR IGNORE INTO alimentos (nombre,kcal,prot,cho,gras,fibra,grupo,es_custom) VALUES (...)` con `es_custom=0`. Cuidado con el encoding del HTML (mojibake UTF-8: "Ã±"→"ñ", "Ã©"→"é", etc.): los nombres en la DB van con tildes correctas. Las "Preparaciones" de `BANCO_DATA` (línea 648) **no** se insertan como alimentos (no tienen macros); se ignoran en esta tarea. Agregar script `db:seed:alimentos` en `package.json`: `sqlite3 data/tomi_nutri.sqlite < db/seed_alimentos.sql`, y llamarlo desde `scripts/init-db.js` después de migrar.
  *Verificar:* `sqlite3 data/tomi_nutri.sqlite "select count(*) from alimentos"` ≥ 85; correrlo dos veces no duplica; `select nombre from alimentos where nombre like '%Maní%'` devuelve "Maní tostado s/sal".
- [x] **F2.6 — `lib/calculos.ts` (funciones puras, comentadas en español, exportadas):**
  - `calcularIMC(pesoKg, alturaCm)` y `clasificarIMC(imc)` → `{categoria, claseCss}` con cortes 18.5/25/30/35 (igual a `renderResumen`, html:811).
  - `pesoIdealLorentz(sexo, tallaCm)` — M: `talla-100-(talla-150)/4`; F: `/2`.
  - `tmbMifflin(sexo, edad, pesoKg, tallaCm)` y `tmbHarris(...)` — coeficientes exactos de `calcularEnergia` (html:986).
  - `calcularGET(tmb, factorActividad)`; `kcalObjetivo(get, objetivo)` con `bajar=-400`, `subir=+400`, `mantener=0`.
  - `calcularICC(cinturaCm, caderaCm)` y `riesgoICC(icc, sexo)` — alto si >0.9 (M) / >0.85 (F).
  - `edadDesdeFechaNacimiento(fechaISO)`.
  - `totalesPlan(items)` → `{kcal, prot, cho, gras, fibra, pProt, pCho, pGras}` con % sobre kcal de macros (prot*4+cho*4+gras*9), igual a `renderPlanScreen` (html:1093).
  - Refactor: `app/dashboard/pacientes/[id]/page.tsx` ya define `calcularIMC` local — importarla de `lib/calculos.ts` y borrar la duplicada. No tocar nada más de esa página.
  *Verificar:* `pnpm build` OK.
- [x] **F2.7 — Capa de datos `lib/alimentos.ts` y `lib/planes.ts`.** Funciones tipadas sobre `getDB()`:
  - alimentos: `listarAlimentos({q?, grupo?})`, `crearAlimentoCustom(datos)`, `desactivarAlimento(id)` (soft: `activo=0`, solo permitido si `es_custom=1`).
  - planes: `listarPlanesDePaciente(pacienteId)` (con total kcal por plan via JOIN/SUM), `obtenerPlanCompleto(planId)` (plan + 5 comidas + items), `guardarPlan(pacienteId, datos)` — transacción (`BEGIN/COMMIT`) que inserta/reemplaza plan, comidas e items; `eliminarPlan(planId)`.
  *Verificar:* `pnpm build` OK (el uso real se verifica en Fase 3).

---

## Fase 3 — Funcionalidades del HTML

> F3.1 y F3.2 son independientes. F3.3→F3.6 en orden. Referencia visual de todo: `nutriapp.html`.

- [x] **F3.1 — Calculadora energética.** Nueva ruta `app/dashboard/calculadora/page.tsx` + componente client `components/calculadora/CalculadoraForm.tsx`. Replicar el flujo del HTML (pantalla `screen-calc`): pills sexo M/F, inputs edad/peso/talla, select de actividad (1.2/1.375/1.55/1.725/1.9 con las mismas etiquetas), toggle fórmula Mifflin/Harris, objetivo bajar/mantener/subir, botón Calcular → vista de resultados (TMB, GET destacado, kcal objetivo, nota explicativa de la fórmula — textos exactos del HTML) y botón "Nuevo cálculo". Todo client-side usando `lib/calculos.ts`; sin red ni DB. Soportar querystring `?edad=&peso=&talla=&sexo=` para precarga.
  *Verificar:* `pnpm build` OK; con el server corriendo, M/30/70kg/165cm/1.55/Mifflin → TMB 1486, GET 2303 (curl no alcanza, validar los números con un test o cálculo manual en el reporte).
- [x] **F3.2 — Banco de alimentos + tabla de macros.** Ruta `app/dashboard/alimentos/page.tsx` (server component): lee de la tabla `alimentos` (nunca hardcodeado), búsqueda con `?q=` (mismo patrón que `app/dashboard/pacientes/page.tsx`) y filtro `?grupo=` con chips de categorías. Dos vistas con toggle `?vista=banco|tabla`: *banco* = listado agrupado por `grupo` (nombre + kcal/100g); *tabla* = tabla completa Kcal/Prot/CHO/Gras/Fib por 100 g con filas de sección por grupo (estilo `macro-table` del HTML). Más: formulario "Nuevo alimento custom" (dialog shadcn existente) → `crearAlimentoCustom`; los custom se muestran con ⭐ y botón eliminar (con `confirm`).
  *Verificar:* `pnpm build` OK; `/dashboard/alimentos?q=arroz` filtra; crear y eliminar un custom funciona.
- [x] **F3.3 — Planes: listado por paciente.** Ruta `app/dashboard/pacientes/[id]/planes/page.tsx`: tarjetas con nombre, fecha y total kcal (de `listarPlanesDePaciente`), botón "+ Nuevo plan" → `planes/nuevo`, click en tarjeta → `planes/[pid]`. Linkear desde la ficha del paciente (`[id]/page.tsx`): tarjeta/sección "Planes" con contador y acceso, junto a las de Anamnesis/Mediciones.
  *Verificar:* `pnpm build` OK; navegación ficha → planes → vacío con CTA.
- [x] **F3.4 — Editor de plan.** Rutas `planes/nuevo/page.tsx` y `planes/[pid]/page.tsx` compartiendo `components/planes/PlanEditor.tsx` (client). Estado en memoria del componente (useState; **sin localStorage**), persistencia solo al "Guardar" via Server Action → `guardarPlan` transaccional. Estructura (réplica de `renderPlanScreen`, html:1093):
  - Input nombre del plan.
  - 5 bloques colapsables (desayuno/almuerzo/merienda/cena/colación) con kcal parcial en el header.
  - Por ítem: nombre, gramos, kcal, botón quitar. Macros del ítem = valores/100g × gramos/100 (snapshot).
  - Textarea de nota libre por comida.
  - "+ Agregar alimento" abre dialog con 3 pestañas (como el modal del HTML): **Buscar** (lista desde `alimentos` con búsqueda, elegir → pedir gramos), **Manual** (nombre + macros/100g + gramos + checkbox "Guardar para usar siempre" → crea custom), **Guardados** (solo `es_custom=1`).
  - Resumen del día abajo: total kcal + barras de progreso CSS de % prot/cho/gras y fibra (colores `--v5`/`--ama`/`--az`/`--v6`).
  - El picker recibe la lista de alimentos como prop server-fetched (≈100 ítems, sin API route).
  *Verificar:* `pnpm build` OK; crear plan con ≥2 comidas y ≥3 ítems, guardar, reabrir y ver los mismos datos; `sqlite3 ... "select count(*) from plan_items"` coincide.
- [x] **F3.5 — Exportación del plan a PDF imprimible.** Ruta `app/dashboard/pacientes/[id]/planes/[pid]/imprimir/page.tsx` (server component sin sidebar — layout propio mínimo): réplica fiel del template de `exportarPlan` (html:1304): encabezado con degradado `#1B4332→#40916C`, nombre del plan, paciente (nombre/edad/peso de última medición), fecha, total kcal/día; tabla por comida (alimento/gramos/kcal) con nota en recuadro naranja si existe; resumen de macronutrientes (g, kcal, %); pie "Elaborado por Álvaro Tomás Terrera · Técnico en Nutrición · @alvaro.nutre" + botón `no-print` "🖨️ Guardar como PDF" → `window.print()` (único JS client de la página). CSS `@media print` oculta el botón. Botón "📤 Exportar" en el editor de plan que abre esta ruta en pestaña nueva.
  *Verificar:* `pnpm build` OK; la ruta renderiza el plan creado en F3.4.
- [x] **F3.6 — Completar resumen del paciente.** En `app/dashboard/pacientes/[id]/page.tsx` (y/o `ImcCard`/nuevos componentes en `components/pacientes/`), usando `lib/calculos.ts` y la última medición:
  - Peso ideal (Lorentz) con leyenda "Fórmula Lorentz".
  - TMB estimada (Mifflin) con leyenda "Mifflin-St Jeor" (edad desde `fecha_nacimiento`; si falta algún dato, no mostrar).
  - ICC con badge de riesgo si hay `cintura_cm` y `cadera_cm`.
  - Botón "⚡ Calcular kcal" → `/dashboard/calculadora?edad=&peso=&talla=&sexo=` precargado.
  - Formularios de mediciones (`mediciones/nueva` y `[mid]/editar`): agregar campos opcionales `grasa_pct`, `musculo_pct`, `brazo_cm`, `muneca_cm`; mostrarlos en el historial y la ficha si existen.
  *Verificar:* `pnpm build` OK; paciente demo (DNI 50999888) muestra Lorentz/TMB/ICC coherentes.
- [x] **F3.7 — Navegación y dashboard.** En `components/app-sidebar.tsx` agregar ítems: Calculadora (icono `Zap`) → `/dashboard/calculadora`, Alimentos (icono `Apple` o `UtensilsCrossed`) → `/dashboard/alimentos`. En `app/dashboard/page.tsx`: stat "Planes creados" (`select count(*) from planes`) y grilla de accesos rápidos a las 4 herramientas (estilo tool-grid del HTML).
  *Verificar:* `pnpm build` OK; sidebar con 5 ítems + papelera.

---

## Fase 4 — Performance y resiliencia

Decisiones ya tomadas: **no** migrar a `better-sqlite3` por ahora; `@next/bundle-analyzer` solo como devDependency.

- [x] **F4.1 — recharts fuera del bundle inicial.** Cargar `EvolucionDialog` (única superficie de recharts) con `next/dynamic` y `ssr: false` desde la página que lo usa; fallback: `Skeleton` existente.
  *Verificar:* `pnpm build` OK y el chunk de la ruta `pacientes/[id]` baja (comparar tamaño en el output del build antes/después; reportar números).
- [x] **F4.2 — Bundle budget.** Instalar `@next/bundle-analyzer` (dev), wirear en `next.config.ts` bajo env `ANALYZE=true`. Revisar el output de `pnpm build`: ninguna ruta con First Load JS > 200 KB. Si alguna lo supera, aplicar `dynamic()`/memoización en sus componentes pesados.
  *Verificar:* tabla de First Load JS por ruta en el reporte, todas < 200 KB.
- [x] **F4.3 — Memoización de listas grandes.** `React.memo` en la fila del picker de alimentos del PlanEditor y `useMemo` para el filtrado de la lista (~100 ítems). No virtualizar (no se justifica con N≈100; dejar comentario).
- [x] **F4.4 — Backup automático.** En `scripts/init-db.js`, antes de arrancar: si no existe backup del día, `VACUUM INTO 'data/backups/tomi_nutri_YYYY-MM-DD.sqlite'` (crear `data/backups/`), conservar los últimos 7 (borrar más viejos). Después, `PRAGMA wal_checkpoint(TRUNCATE)`. Motivo (comentar en el código): la app vive en disco extraíble; WAL sin checkpoint + extracción = corrupción.
  *Verificar:* correr `node scripts/init-db.js` dos veces → un solo backup del día en `data/backups/`; agregar `data/backups/` a `.gitignore` si existiera repo.

---

## Fase 5 — Testing y entrega

Decisión ya tomada: tests automatizados solo para `lib/calculos.ts` (vitest).

- [x] **F5.1 — Tests de cálculos.** Instalar `vitest` (dev) + script `"test": "vitest run"`. Archivo `lib/calculos.test.ts`: casos para IMC (cortes de clasificación exactos: 18.5/25/30/35), Lorentz M y F, Mifflin vs Harris (valores conocidos: M/30/70/165 → Mifflin 1486), GET por factor, objetivo ±400, ICC y riesgo por sexo, `totalesPlan` con lista vacía y con ítems.
  *Verificar:* `pnpm test` verde.
- [x] **F5.2 — Build final + lint.** `pnpm lint && pnpm build` sin errores.
- [x] **F5.3 — Checklist de regresión manual** (ejecuta el humano en el Celeron; el agente solo lo deja escrito en `TESTING.md`): setup PIN → lock → paciente nuevo → anamnesis → medición (con campos nuevos) → evolución → calculadora (precargada desde ficha) → banco/tabla alimentos → plan completo → export PDF → papelera (desactivar/restaurar) → desconectar internet y verificar que todo sigue funcionando igual.
- [x] **F5.4 — README real.** Reemplazar el README boilerplate: qué es NutriFlow, arquitectura (Next + SQLite local, diagrama de texto), cómo se usa el `.bat`, cómo forzar rebuild, backup/restore, estructura de carpetas. Mencionar que la sync con VPS está planificada (Fase 6) pero no implementada.

---

## Fase 6 — Sincronización SQLite ↔ PostgreSQL (VPS) — ⏸️ POSPUESTA

> **No implementar hasta que el dueño del proyecto lo pida explícitamente.** La app funciona
> 100 % offline sin esta fase; esto solo agrega respaldo remoto automático cuando hay internet.
> Prerrequisitos ya cumplidos en Fase 2 (F2.4): columnas `uuid` y `actualizado_en`.
> Diseño completo en `AUDIT.md` §5: sync **servidor→servidor**, sin Prisma, sin IndexedDB. Orden estricto.
> Dependencias a instalar recién al activarla: `pg@^8` y `@types/pg` (dev). Nada más.

- [ ] **F6.1 — Migración `008_sync_queue.sql`.** Tabla `sync_queue (id INTEGER PK AUTOINCREMENT, operacion TEXT CHECK(operacion IN ('upsert','delete')), tabla TEXT NOT NULL, registro_uuid TEXT NOT NULL, datos_json TEXT, timestamp TEXT NOT NULL DEFAULT (datetime('now')), intentos INTEGER NOT NULL DEFAULT 0, ultimo_error TEXT)`. Índice por `(tabla, registro_uuid)`.
- [ ] **F6.2 — Esquema espejo Postgres.** Archivo `db/postgres/schema.sql` (no se ejecuta desde la app; se aplica a mano en el VPS): tablas `pacientes`, `anamnesis`, `mediciones`, `alimentos`, `planes`, `plan_comidas`, `plan_items` con **PK = uuid**, columna `instancia_id TEXT`, tipos equivalentes (TEXT→text, REAL→double precision, INTEGER 0/1→boolean donde aplique) y `actualizado_en timestamptz`. Documentar en comentario del archivo cómo aplicarlo (`psql $DATABASE_URL -f db/postgres/schema.sql`).
- [ ] **F6.3 — Encolado.** Helper `encolarSync(db, operacion, tabla, uuid, datos)` en `lib/sync.ts`. Integrarlo en cada Server Action de escritura existente (pacientes, anamnesis, mediciones, planes, alimentos custom) **dentro de la misma transacción/secuencia** de la escritura local. La app debe seguir funcionando idéntico sin `DATABASE_URL` configurada (la queue crece y nada más; comentar esto en el código).
  *Verificar:* crear un paciente → `sqlite3 ... "select tabla, operacion from sync_queue"` muestra la fila.
- [ ] **F6.4 — Worker de sync.** En `lib/sync.ts` (comentado en español): `procesarQueue()` lee la queue en orden (`id ASC`), y por ítem hace upsert en Postgres: `INSERT ... ON CONFLICT (uuid) DO UPDATE SET ... WHERE excluded.actualizado_en > tabla.actualizado_en` (last-write-wins). Éxito → borrar de la queue; error → `intentos+1`, `ultimo_error`, y backoff (saltear ítems con `intentos>0` hasta pasados `2^intentos` minutos). Pool `pg` de máx. 2 conexiones, `connectionTimeoutMillis: 5000`. Disparo: `setInterval` de 60 s iniciado lazy desde `instrumentation.ts` (o primer uso de `getDB()`), + invocación fire-and-forget tras cada `encolarSync`. Sin `DATABASE_URL` → el worker no arranca.
- [ ] **F6.5 — Indicador de estado.** `app/api/sync/status/route.ts` → JSON `{estado: 'verde'|'amarillo'|'rojo'|'gris', pendientes, ultimaSyncOk}` (gris = sin `DATABASE_URL`; rojo = último intento falló por conexión; amarillo = pendientes>0; verde = queue vacía y último intento OK — persistir `ultima_sync_ok` en `configuracion_app` via `ALTER TABLE` en la migración 008). Componente client `components/SyncIndicator.tsx`: punto de color + tooltip con pendientes, polling `fetch` cada 30 s, montado en el footer del sidebar.
  *Verificar:* sin `DATABASE_URL`: `curl -s localhost:3000/api/sync/status` → `{"estado":"gris",...}`. Con un Postgres local de prueba (si hay Docker disponible: `docker run -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:16-alpine` + aplicar schema): crear paciente → fila en Postgres < 90 s y estado verde. Si no hay Docker, dejar el test de integración documentado en el reporte como pendiente manual.
- [ ] **F6.6 — Pull manual.** Script `scripts/sync-pull.js` + comando `pnpm sync:pull`: trae de Postgres los registros con `actualizado_en` posterior al local (o inexistentes) y los upsertea en SQLite por `uuid`. Uso: restaurar en una máquina nueva o segundo puesto. Actualizar README.
  *Verificar:* correrlo sin `DATABASE_URL` da error claro en español y exit 1.

---

## Cómo asignar esto a un agente

- Una fase por sesión; en Fase 3, una tarea (F3.x) por prompt si la sesión se queda corta.
- Orden de ejecución: Fase 0 → 1 → 2 → 3 → 4 → 5. **La Fase 6 (sync VPS) está pospuesta: no ejecutarla salvo pedido explícito del dueño.**
- Prompt sugerido: *"Leé CONTRATO GLOBAL y la Fase N de ROADMAP.md y AUDIT.md. Ejecutá la tarea FN.M. Al terminar corré las verificaciones indicadas y reportá resultados. No avances a la siguiente tarea."*
- Al completar una tarea, el agente marca el checkbox en este archivo como parte de su diff.
