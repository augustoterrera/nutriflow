# NutriFlow

NutriFlow es una app local para consultorio nutricional. Corre en la PC del usuario con Next.js y guarda los datos en una base SQLite local, por lo que funciona sin internet.

## Arquitectura

```text
Navegador -> Next.js local (:3000) -> Server Components / Server Actions -> SQLite
```

- Framework: Next.js App Router, React, Tailwind y shadcn/ui.
- Persistencia: `data/tomi_nutri.sqlite`.
- Migraciones: `db/migrations/*.sql`, aplicadas con `pnpm db:migrate`.
- Seed de alimentos: `db/seed_alimentos.sql`.
- No usa ORM, localStorage, IndexedDB ni servicios externos en runtime.

## Uso en Windows

Ejecutar `NutriFlow.bat`.

El script:

1. Instala dependencias si falta `node_modules`.
2. Ejecuta migraciones y seed.
3. Genera build de producción si falta `.next/BUILD_ID`.
4. Abre `http://localhost:3000` y corre `pnpm start`.

Para forzar un rebuild después de actualizar código, borrar la carpeta `.next` y volver a ejecutar el `.bat`.

## Desarrollo

```bash
pnpm install
pnpm db:migrate
pnpm run db:seed:alimentos
pnpm dev
```

Verificaciones:

```bash
pnpm test
pnpm lint
pnpm build
```

## Backups

`scripts/init-db.js` crea un backup diario en `data/backups/` con `VACUUM INTO` y conserva los últimos 7. También ejecuta `PRAGMA wal_checkpoint(TRUNCATE)` para reducir riesgo de corrupción si la app se usa desde un disco extraíble.

Para restaurar, cerrar NutriFlow y reemplazar `data/tomi_nutri.sqlite` por el backup elegido.

## Estructura

- `app/`: rutas, Server Components y Server Actions.
- `components/`: UI reutilizable.
- `lib/`: acceso a datos y cálculos nutricionales.
- `db/`: migraciones y seeds SQL.
- `scripts/`: utilidades de arranque.
- `public/nutriflow-icon.ico`: ícono local.

## Sync futura

La sincronización SQLite -> PostgreSQL en VPS está planificada como Fase 6 del roadmap, pero no está implementada. La app actual es 100% offline.
