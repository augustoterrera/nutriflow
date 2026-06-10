# NutriFlow — Auditoría Técnica

> Fecha: 2026-06-09 · Auditado contra el archivo de referencia `nutriapp.html`

---

## 1. Stack actual detectado

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.3 |
| UI | React | 19.2.3 |
| Componentes | shadcn/ui (Radix UI primitives) | — |
| Estilos | Tailwind CSS 4 + tw-animate-css | 4.x |
| Gráficos | recharts | 3.7 |
| Base de datos | **SQLite local** (`data/tomi_nutri.sqlite`, WAL) via `sqlite` + `sqlite3` | 5.x |
| Auth | PIN con bcryptjs + sesiones en SQLite + cookie httpOnly + middleware | — |
| Validación | zod | 4.x |
| Lanzador | `NutriFlow.bat` → `pnpm dev` + abre `localhost:3000` | — |

**Arquitectura real:** no es una SPA con localStorage como asume el brief. Es una app
**server-rendered** que corre como servidor local en la propia PC: Server Components +
Server Actions leen/escriben SQLite directamente. No hay API REST, no hay estado
client-side persistente, no hay localStorage.

### Lo que ya existe y funciona

- **Setup + Lock screen:** PIN 4-6 dígitos, hash bcrypt, bloqueo temporal a los 5 intentos, sesiones de 12 h con `instancia_id` (invalida sesiones al restaurar backups).
- **Pacientes:** CRUD completo con DNI único, datos de contacto, soft-delete (papelera con restaurar/desactivar).
- **Anamnesis:** historial estructurado por paciente (hábitos, dieta, suplementos, preferencias) — más rico que el textarea libre del HTML.
- **Mediciones:** historial con peso, altura, cintura, cadera, cuello, observaciones.
- **Evolución:** deltas última-vs-anterior y desde-inicio (peso, cintura, IMC), ritmo kg/sem, clasificación de tendencia (incluye detección de recomposición corporal), gráfico recharts en dialog.
- **IMC + riesgo cardiometabólico:** `ImcCard` y `RiesgoCardiometabolico` (usa cintura/altura).
- **Dashboard:** contadores de pacientes y anamnesis, últimos 5 pacientes.

---

## 2. Brechas entre `nutriapp.html` y la app actual

| Funcionalidad del HTML | Estado en NutriFlow |
|---|---|
| Calculadora energética (TMB Mifflin + Harris, GET, objetivo ±400 kcal) | ❌ No existe |
| Banco de alimentos (~90 alimentos con macros, por categoría) | ❌ No existe |
| Tabla de macros filtrable (kcal/prot/CHO/grasas/fibra por 100 g) | ❌ No existe |
| Constructor de plan alimentario (5 comidas, ítems en gramos, notas por comida) | ❌ No existe |
| Alimentos manuales + guardados custom (⭐) | ❌ No existe |
| Resumen de macros del plan (barras de % prot/CHO/grasas/fibra) | ❌ No existe |
| Exportación del plan a PDF imprimible (diseño profesional verde) | ❌ No existe |
| Peso ideal (Lorentz) en resumen del paciente | ❌ No existe |
| ICC (cintura/cadera) con riesgo por sexo | ⚠️ Hay riesgo por cintura/altura; falta ICC explícito (la tabla ya tiene `cadera_cm`) |
| % grasa, % músculo, brazo, muñeca en mediciones | ❌ Faltan columnas (hay peso, altura, cintura, cadera, cuello) |
| TMB automática en el resumen del paciente | ❌ No existe |
| Stats "planes creados" en el dashboard | ❌ No existe (no hay planes) |
| Indicador online/offline en el header | ❌ No existe |
| Pacientes con búsqueda | ⚠️ Verificar — la lista existe; la búsqueda hay que confirmarla/agregarla |
| Modal nuevo control / evolución | ✅ Existe como página `mediciones/nueva` |
| Anamnesis | ✅ Existe (estructurada, superior al HTML) |
| Evolución con deltas ▲▼= | ✅ Existe (más completa que el HTML) |
| IMC + clasificación con badge | ✅ Existe |

**Diferencias de modelo de datos (la app gana):** el HTML guarda `edad/peso/talla`
estáticos en el paciente; la app usa `fecha_nacimiento` + historial de mediciones.
Se mantiene el modelo de la app y se derivan edad/peso/talla de ahí.

**Diferencia de diseño:** el HTML usa el design system verde (Syne/DM Sans/DM Mono,
paleta `#1B4332…#F0FBF4`); la app usa el tema slate oscuro por defecto de shadcn,
sin fuentes configuradas (`next/font` no se usa). Hay que migrar tokens y fuentes.

---

## 3. Recomendación de Stack

### Stack recomendado: **mantener Next.js + SQLite local (sin migración de framework)**

**Por qué:**

1. **La app ya es offline-first por arquitectura.** El servidor y la base de datos viven
   en la misma PC: funciona al 100 % sin internet hoy. El stack sugerido en el brief
   (PWA + IndexedDB/Dexie + Prisma) presupone una app browser-only desplegada en la nube;
   aplicarlo acá significaría tener **dos bases de datos locales** (SQLite del servidor +
   IndexedDB del browser) sincronizando entre sí en la misma máquina. Es complejidad neta
   sin beneficio. SQLite **es** el store offline; la sincronización con PostgreSQL del VPS
   se hace servidor-a-servidor (ver §5).
2. **Next.js no está siendo usado como CSR disfrazado:** son Server Components reales que
   consultan SQLite, con Server Actions para mutaciones. El JS que llega al cliente es bajo
   y casi todo el trabajo pesado ocurre en Node, no en el browser del Celeron.
3. **El cuello de botella real no es el framework: es que `NutriFlow.bat` corre `pnpm dev`
   (modo desarrollo) en producción.** El dev server compila on-demand, no minifica, incluye
   HMR y consume mucha más RAM/CPU. En un Celeron N4500 eso explica la lentitud percibida.
   Pasar a `next build` + `next start` es la mejora de performance más grande disponible,
   con esfuerzo casi nulo.

**Ventajas sobre cambiar de stack:** cero regresión (auth, papelera, anamnesis, evolución
ya funcionan), todo el esfuerzo va a features nuevas en vez de a reescribir, y el equipo
ya conoce el código.

**Trade-offs / lo que se pierde:** no hay instalador "de escritorio"; depende de tener
Node + el `.bat`. Mitigación: el `.bat` mejorado (modo producción) da la misma UX práctica.

**Esfuerzo de migración estimado:** nulo (no hay migración).

**Alternativas descartadas y por qué:**

- **Tauri** (ya insinuado en `next.config.ts`): Tauri empaqueta frontends *estáticos*.
  Para mantener Server Actions + SQLite server-side habría que correr un sidecar de Node
  dentro de Tauri (frágil, más RAM, lo peor de ambos mundos) o reescribir toda la capa de
  datos al cliente (semanas de trabajo, alto riesgo de regresión). Beneficio marginal: un
  ícono en el escritorio. **Descartado.** Si más adelante se quiere "app instalable", la
  ruta barata es un acceso directo al `.bat` mejorado o un shortcut de Chrome en modo app
  (`--app=http://localhost:3000`).
- **Electron:** todo lo anterior, pero con +150 MB de RAM base. Descartado.
- **SvelteKit / Astro (reescritura):** bundle algo menor, pero implica reescribir una app
  funcionando. En modo producción Next.js ya rinde de sobra para esta UI en ese hardware.
  Descartado por costo/beneficio.

### Respuestas a las preguntas del análisis

1. **¿SSR real o todo CSR?** SSR/RSC real con datos de SQLite. Next.js está justificado.
2. **¿Bundle viable en el N4500?** En dev no (por eso va lento). En producción sí: las
   páginas actuales son mayormente server-rendered; el JS cliente relevante es shadcn +
   recharts. recharts (~150 KB gz) ya está confinado a un dialog y se cargará con
   `dynamic()` para sacarlo del bundle inicial.
3. **¿Dependencias pesadas reemplazables?** recharts es la única pesada → lazy-load (no
   reemplazar aún). No hay MUI/Chakra/Framer Motion. `sqlite3` (nativo) podría migrarse a
   `better-sqlite3` (más rápido, síncrono, ya está `@types/better-sqlite3` instalado) —
   opcional, fase de performance.
4. **¿Solo esa PC u otros dispositivos?** El servidor local ya permite acceder desde el
   celular en la misma red WiFi (`http://IP-de-la-PC:3000`) sin trabajo extra. La sync
   con el VPS habilita a futuro un segundo puesto de trabajo.
5. **¿Optimizar web o ir a nativo?** Optimizar lo existente: modo producción + lazy
   loading + limpiar `public/` rinde más que cualquier migración.

---

## 4. Decisiones de arquitectura

1. **SQLite sigue siendo la fuente de verdad local.** Todas las escrituras van primero a
   SQLite (respuesta inmediata, funciona sin red). Sin Dexie/IndexedDB: la restricción del
   brief "no localStorage" se cumple de raíz porque no hay persistencia en el browser.
2. **Sync servidor→VPS** (ver §5), no browser→VPS.
3. **El esquema SQL existente se extiende, no se reemplaza:** se agregan tablas
   `alimentos`, `planes`, `plan_comidas`, `plan_items`, `sync_queue` y columnas nuevas en
   `mediciones` (`grasa_pct`, `musculo_pct`, `brazo_cm`, `muneca_cm`). Migraciones 004+.
4. **El banco de ~90 alimentos** del HTML se migra como seed SQL (`alimentos` con
   `es_custom = 0`), nunca hardcodeado en el frontend.
5. **Export a PDF** del plan: ruta de impresión server-rendered (`/dashboard/planes/[id]/imprimir`)
   con CSS `@media print` replicando el diseño del HTML + `window.print()`. Sin librerías
   de PDF (puppeteer/jsPDF prohibitivos en 4 GB de RAM).
6. **Design system:** se portan los tokens verdes y fuentes del HTML a `globals.css`
   (Tailwind 4 `@theme`) y se mapean a las variables shadcn (`--primary`, `--background`,
   etc.), de modo que los componentes existentes adopten la identidad visual sin
   reescribirlos. Fuentes Syne/DM Sans/DM Mono self-hosted con `next/font` (offline-safe).
7. **Modo producción:** `NutriFlow.bat` pasa a `next build` (solo si cambió el código) +
   `next start`.

---

## 5. Sincronización offline ↔ online (SQLite ↔ PostgreSQL VPS)

Adaptación de la estrategia del brief a la arquitectura real:

1. Toda operación de escritura va a SQLite **y** encola un registro en `sync_queue`
   `{operacion, tabla, registro_uuid, datos_json, timestamp}` dentro de la misma transacción.
2. Un worker en el proceso Next (intervalo + disparo post-escritura) intenta drenar la
   queue contra PostgreSQL del VPS (conexión via `pg`, **sin Prisma**: el ORM no aporta
   nada con SQL ya escrito a mano y suma peso).
3. Sin red o VPS caído → la queue persiste y se reintenta con backoff. Nada bloquea al usuario.
4. **Conflict resolution:** last-write-wins por `actualizado_en` (timestamp del cliente).
5. Todas las tablas sincronizables ganan una columna `uuid` (los `INTEGER AUTOINCREMENT`
   actuales colisionarían entre instancias) — se aprovecha el `instancia_id` existente.
6. **Indicador de estado en el header:** verde (sync ok), amarillo (pendientes en queue),
   rojo (sin conexión/VPS inaccesible). Endpoint `/api/sync/status` + polling liviano.

---

## 6. Riesgos identificados

| Riesgo | Severidad | Mitigación |
|---|---|---|
| `.bat` corre `next dev` en la máquina de producción | 🔴 Alta | Fase 1: build de producción |
| El proyecto vive en un disco extraíble (hay `System Volume Information/`) con SQLite en WAL — riesgo de corrupción si se extrae sin cerrar | 🔴 Alta | Backup automático periódico (`VACUUM INTO`) + checkpoint WAL al cerrar; la sync al VPS actúa de respaldo remoto |
| `public/` lleno de PNGs pesados de Instagram que se copian al build y ocupan disco (26 GB libres) | 🟡 Media | Mover material gráfico fuera del proyecto |
| `package-lock.json` y `pnpm-lock.yaml` coexisten | 🟡 Media | Borrar `package-lock.json`, estandarizar pnpm |
| Sin `next/font`: si se agregan fuentes via Google Fonts CDN se rompe offline | 🟡 Media | Self-host con `next/font` desde el inicio |
| `sqlite3` callback-based y compilación nativa frágil en Windows | 🟢 Baja | Opcional: migrar a `better-sqlite3` en fase de performance |
| IDs autoincrement vs sync multi-instancia | 🟡 Media | Columna `uuid` en migración 004, antes de activar sync |
| Restricción del brief "siempre Dexie.js" | — | No aplica a esta arquitectura (no hay persistencia browser); documentado en §3-4 |
