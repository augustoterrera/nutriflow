# NutriFlow — Roadmap de UX/UI (formato agente)

> **Propósito.** Unificar toda la app bajo **un único sistema de diseño** con **buena UX**,
> eliminando estilos inline, colores hardcodeados y HTML crudo, mediante **componentes globales
> reutilizables**.
>
> **Cómo se ejecuta.** Este documento es autocontenido: cualquier IA de código (Claude, Codex, etc.)
> debe poder tomar **una fase** (o una sub-tarea) y completarla **sin más contexto que este archivo
> y el repo**. Trabajar **una fase por sesión**. No saltar fases hacia atrás (cada fase asume que las
> anteriores están hechas). Marcar `[x]` lo completado al cerrar.

---

## 0. Cómo usar este roadmap

1. Leé **§1 Contrato global**, **§2 Tokens**, **§3 Catálogo de componentes** y **§4 Recetario** una vez.
   Son la "fuente de verdad" del diseño. Toda fase los referencia en vez de repetir.
2. Elegí la **primera fase no marcada** en §7. Leé su bloque completo (objetivo, archivos, estado actual,
   pasos, DoD).
3. Implementá siguiendo el recetario (§4) y las convenciones (§5). **No inventes patrones nuevos** si ya
   hay una receta.
4. Al terminar, corré el **cierre de fase** (`pnpm lint` + `pnpm build`), aplicá el **DoD** (§6) y marcá la fase.
5. Reportá: qué archivos tocaste, resultado de lint/build, y cualquier desvío.

---

## 1. Contrato global (leer antes de cualquier fase)

### Stack
- **Next.js 16** (App Router) + **React 19** + **Tailwind v4** + **shadcn/ui** (estilo `new-york`).
- Iconos: **`lucide-react`**. Gestor de paquetes: **`pnpm`**.
- Persistencia: **SQLite** local vía `lib/db.ts` (`getDB()`, API async). Sin ORM, SQL a mano.
- Lectura de datos: **Server Components**. Mutaciones: **Server Actions** (`actions.tsx`/`actions.ts`).
- Alias de imports: `@/components`, `@/components/ui`, `@/lib`, `@/hooks` (ver `components.json`).

### Identidad visual (decisiones fijadas — NO cambiar sin aviso)
- **Estilo:** *Neutro elegante* — escala `neutral`, acento sutil, sin color de marca fuerte.
- **Tema:** **Solo oscuro** (dark-only). `<html lang="es" className="dark">` se mantiene.

### Prohibido
- `style={{ ... }}` inline para layout/estética (salvo casos imposibles con clases, p. ej. `width` calculado
  dinámicamente en barras de progreso; justificarlo con comentario).
- Colores **hardcodeados**: `bg-slate-*`, `bg-blue-*`, `bg-red-*`, `bg-green-*`, `bg-gray-*`,
  `border-white`, `border-gray-*`, `text-white` (salvo dentro de variantes shadcn ya existentes),
  `bg-black`, `rgba(...)`. **Todo color sale de tokens** (§2).
- HTML crudo de formulario/tabla: `<input>`, `<select>`, `<textarea>`, `<button>`, `<table>` "pelados".
  Usar los componentes globales (§3).
- Framer Motion / librerías de animación JS pesadas, MUI/Chakra, librerías de PDF, requests a CDNs en runtime
  (fuentes/CSS self-hosted). Hardware objetivo bajo (Celeron N4500 / 4 GB, uso offline) → **solo transiciones CSS**.
- Instalar dependencias **no** mencionadas explícitamente en la fase.

### Obligatorio
- Reutilizar componentes globales (§3) y recetas (§4). Si un patrón se repite ≥2 veces, extraer componente.
- Comentarios de **lógica de negocio en español** (cálculos nutricionales, etc.).
- No romper funcionalidad: setup/lock con PIN, sesiones, CRUD de pacientes/anamnesis/mediciones/planes, papelera.
- **Cierre de fase:** `pnpm lint` y `pnpm build` sin errores. Si algo falla, arreglarlo antes de cerrar.

### Comandos
```bash
pnpm dev      # desarrollo (corre init-db y next dev)
pnpm lint     # eslint — debe terminar con 0 errores
pnpm build    # next build — debe compilar sin errores
pnpm test     # vitest (lógica de cálculos)
```

---

## 2. Sistema de diseño: tokens (referencia completa)

Definidos en `app/globals.css` (dark-only). Cada token CSS `--x` se expone como utilidades Tailwind
`bg-x`, `text-x`, `border-x`, `ring-x`, etc. **Usar siempre estas clases, nunca un color literal.**

| Token / clase base | Uso previsto |
|---|---|
| `bg-background` / `text-foreground` | Fondo de página y texto por defecto. Ya aplicado al `body`. |
| `bg-card` / `text-card-foreground` | Superficies elevadas (tarjetas, paneles). Lo usa `Card`. |
| `bg-popover` / `text-popover-foreground` | Flotantes: dropdowns, popovers, tooltips, dialog. |
| `bg-primary` / `text-primary-foreground` | **Acción principal** (botón default ≈ blanco con texto oscuro). |
| `bg-secondary` / `text-secondary-foreground` | Acción secundaria (gris oscuro). |
| `bg-muted` / `text-muted-foreground` | Superficie tenue y **texto secundario** (descripciones, hints, headers de tabla). |
| `bg-accent` / `text-accent-foreground` | **Estados hover** de items interactivos (filas, menús, ghost). |
| `bg-destructive` / `text-destructive` | Acciones/errores peligrosos (borrar, desactivar, mensajes de error). |
| `border` / `border-border` | Bordes por defecto (1px). `border` ya toma el color del token. |
| `border-input` | Borde de campos de formulario. |
| `ring-ring` | Anillo de foco (`focus-visible:ring-ring/50 ring-[3px]`). |
| `bg-chart-1` … `bg-chart-5` | Series de gráficos `recharts`. |
| `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `bg-sidebar-primary`, `border-sidebar-border` | Exclusivos del sidebar. |
| `rounded-sm/md/lg/xl` | Radios derivados de `--radius` (0.625rem). Tarjetas: `rounded-xl`; controles: `rounded-md`. |

**Reglas rápidas de color**
- Texto secundario / ayudas → `text-muted-foreground`.
- Hover de algo clickeable → `hover:bg-accent hover:text-accent-foreground`.
- Error de validación → `text-destructive` y `aria-invalid` en el control.
- Nunca `text-white`/`text-black`: usar `text-foreground` / `text-background`.

---

## 3. Catálogo de componentes globales

Import desde `@/components/ui/*` (primitivas shadcn) o `@/components/shared/*` (composables de app).
Todos aceptan `className` (se combina con `cn()`), así que se ajustan con clases de token.

### Primitivas de formulario y acción
| Componente | Import | Exports / API clave |
|---|---|---|
| **Button** | `@/components/ui/button` | `Button`. Props: `variant` = `default \| destructive \| outline \| secondary \| ghost \| link`; `size` = `default \| xs \| sm \| lg \| icon \| icon-xs \| icon-sm \| icon-lg`; `asChild`. |
| **Input** | `@/components/ui/input` | `Input` (`<input>` estilizado con tokens, foco y `aria-invalid`). |
| **Textarea** | `@/components/ui/textarea` | `Textarea`. |
| **Label** | `@/components/ui/label` | `Label` (usar `htmlFor`). |
| **Field** | `@/components/ui/field` | `Field`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldLabel`, `FieldContent`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError`. `Field` props: `orientation` = `vertical \| horizontal \| responsive`. `FieldError` acepta `errors={[{message}]}` o `children`. |
| **Checkbox** | `@/components/ui/checkbox` | `Checkbox`. |

### Superficies y datos
| Componente | Import | Exports |
|---|---|---|
| **Card** | `@/components/ui/card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. |
| **Table** | `@/components/ui/table` | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`. (Trae scroll-x propio.) |
| **Badge** | `@/components/ui/badge` | `Badge`. `variant` = `default \| secondary \| destructive \| outline`. |
| **Alert** | `@/components/ui/alert` | `Alert`, `AlertTitle`, `AlertDescription`. |
| **Skeleton** | `@/components/ui/skeleton` | `Skeleton` (placeholders de carga). |
| **Separator** | `@/components/ui/separator` | `Separator`. |

### Flotantes / overlays
| Componente | Import | Exports |
|---|---|---|
| **Dialog** | `@/components/ui/dialog` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal`. |
| **Sheet** | `@/components/ui/sheet` | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`. |
| **Popover** | `@/components/ui/popover` | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`. |
| **Tooltip** | `@/components/ui/tooltip` | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`. |
| **Calendar** | `@/components/ui/calendar` | `Calendar`, `CalendarDayButton`. |

### Navegación
| Componente | Import | Notas |
|---|---|---|
| **Sidebar** | `@/components/ui/sidebar` | `Sidebar`, `SidebarProvider`, `SidebarTrigger`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarGroup(+Label/Content/Action)`, `SidebarMenu(+Item/Button/Action/Badge/Sub*)`, `SidebarInset`, `SidebarRail`, `SidebarSeparator`, `useSidebar`. |
| **AppSidebar** | `@/components/app-sidebar` | Sidebar concreto de NutriFlow (se mejora en Fase 2). |

### Composables de app (`components/shared/`)
| Componente | Import | API |
|---|---|---|
| **PageShell** | `@/components/shared/page-shell` | Contenedor centrado con padding/ancho. Prop `width` = `default \| form \| prose \| full`. |
| **PageHeader** | `@/components/shared/page-header` | Props: `title` (req), `description?`, `actions?` (nodo, va a la derecha). Renderiza el único `<h1>`. |
| **EmptyState** | `@/components/shared/empty-state` | Props: `icon?` (LucideIcon), `title` (req), `description?`, `action?`. |

> **Componentes a crear más adelante** (con su receta en §4): `SelectNative` (Fase 5), `StatCard` (Fase 4),
> `Pagination` (Fase 5), y formularios compartidos `PacienteForm`/`AnamnesisForm`/`MedicionForm`.

---

## 4. Recetario de patrones (copy-paste)

> Recetas canónicas. Si una pantalla necesita algo de acá, **copiá la receta** en vez de improvisar.

### 4.1 Esqueleto de página (Server Component)
```tsx
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MiPagina() {
  return (
    <PageShell>
      <PageHeader
        title="Título"
        description="Subtítulo opcional de la sección."
        actions={
          <Button asChild>
            <Link href="/destino">Acción principal</Link>
          </Button>
        }
      />
      {/* contenido */}
    </PageShell>
  );
}
```

### 4.2 Formulario con Server Action
```tsx
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function MiForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action}>
      <FieldGroup className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="dni">DNI</FieldLabel>
          <Input id="dni" name="dni" inputMode="numeric" placeholder="Ej: 35123456" required />
        </Field>

        <Field>
          <FieldLabel htmlFor="nombre">Nombre completo</FieldLabel>
          <Input id="nombre" name="nombre_completo" placeholder="Ej: Juan Pérez" required />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="notas">Notas</FieldLabel>
          <Textarea id="notas" name="notas" rows={4} />
          {/* <FieldError>Mensaje</FieldError> para errores */}
        </Field>

        <div className="sm:col-span-2">
          <Button type="submit">Guardar</Button>
        </div>
      </FieldGroup>
    </form>
  );
}
```
Para errores de validación, agregar `aria-invalid` al control y `<FieldError>texto</FieldError>` debajo.

### 4.3 Tabla de datos
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>DNI</TableHead>
      <TableHead className="text-right">Acciones</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filas.map((f) => (
      <TableRow key={f.id}>
        <TableCell className="font-medium">{f.nombre}</TableCell>
        <TableCell className="text-muted-foreground">{f.dni}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" asChild><Link href={`...`}>Editar</Link></Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 4.4 Estado vacío
```tsx
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

<EmptyState
  icon={Users}
  title="Todavía no hay pacientes"
  description="Creá el primero para empezar a trabajar."
  action={<Button asChild><Link href="/dashboard/pacientes/nuevo">Nuevo paciente</Link></Button>}
/>
```

### 4.5 Buscador (form GET)
```tsx
<form className="flex flex-wrap items-center gap-2">
  <Input name="q" defaultValue={q} placeholder="Buscar por DNI o nombre…" className="max-w-xs" />
  <Button type="submit" variant="secondary">Buscar</Button>
</form>
```

### 4.6 Pantalla de confirmación (ruta, sin dependencias nuevas)
Las confirmaciones de borrar/desactivar ya son **rutas** (`.../desactivar`, `.../eliminar`). Mantenerlas como
ruta y estilarlas con `Card` + dos botones (no agregar `AlertDialog`/dep nueva):
```tsx
<PageShell width="form">
  <Card>
    <CardHeader>
      <CardTitle>¿Desactivar paciente?</CardTitle>
      <CardDescription>Esta acción se puede revertir desde la papelera.</CardDescription>
    </CardHeader>
    <CardFooter className="gap-2">
      <form action={confirmarAction}>
        <Button type="submit" variant="destructive">Sí, desactivar</Button>
      </form>
      <Button variant="outline" asChild><Link href="..">Cancelar</Link></Button>
    </CardFooter>
  </Card>
</PageShell>
```

### 4.7 `StatCard` (crear en Fase 4 → `components/shared/stat-card.tsx`)
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {hint ? <p className="text-muted-foreground mt-1 text-sm">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
```

### 4.8 `SelectNative` (crear en Fase 5 → `components/ui/select-native.tsx`)
Opción liviana (sin dep) para reemplazar `<select>` crudos, con estética de `Input`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

function SelectNative({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
export { SelectNative };
```
Las `<option>` heredan el fondo del tema; no necesitan `bg-black`. Si se requiere búsqueda/multiselección,
recién ahí evaluar `@radix-ui/react-select` (shadcn `select`) como dependencia nueva.

### 4.9 `Pagination` (crear en Fase 5 → `components/shared/pagination.tsx`)
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, hrefFor }: {
  page: number; totalPages: number; hrefFor: (p: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={hrefFor(Math.max(1, page - 1))}><ChevronLeft className="size-4" /> Anterior</Link>
      </Button>
      <span className="text-muted-foreground text-sm">Página {page} de {totalPages}</span>
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link href={hrefFor(Math.min(totalPages, page + 1))}>Siguiente <ChevronRight className="size-4" /></Link>
      </Button>
    </div>
  );
}
```

---

## 5. Convenciones de código

- **Estructura.** Primitivas shadcn en `components/ui/`. Composables transversales en `components/shared/`.
  Componentes de una sección en `components/<seccion>/` (p. ej. `components/pacientes/PacienteForm.tsx`).
- **Formularios compartidos.** Alta y edición de una misma entidad comparten **un** componente de formulario
  (`PacienteForm`, `AnamnesisForm`, `MedicionForm`) que recibe `defaultValues` y un `action`. No duplicar campos.
- **Botones.** Acción principal = `Button` default; secundaria = `variant="secondary"` u `outline`; peligrosa =
  `variant="destructive"`; navegación liviana = `variant="ghost"` o `link`. Para links, `asChild` + `<Link>`.
- **Spacing.** Múltiplos de 4 (`gap-2/4/6`, `p-4/6`). Páginas: `PageShell` maneja el padding externo.
- **Tipografía.** Un solo `<h1>` por página (lo da `PageHeader`). Subtítulos de sección: `CardTitle` o
  `text-lg font-semibold`. Texto secundario: `text-muted-foreground text-sm`.
- **Accesibilidad.** Todo control con `id` + `<FieldLabel htmlFor>`. Inputs numéricos con `inputMode="numeric"`.
  Errores con `aria-invalid` + `FieldError`. No remover el foco visible.
- **`asChild`.** Para que un `Button`/`Badge` sea un link, usar `asChild` y meter `<Link>` adentro
  (no anidar `<button>` dentro de `<a>`).

---

## 6. Definition of Done (checklist por sección)

Una pantalla está lista cuando:
- [ ] No quedan `style={{`, ni colores hardcodeados, ni HTML de form/tabla crudo en sus archivos.
- [ ] Usa `PageShell` + `PageHeader`; listas vacías usan `EmptyState`.
- [ ] Inputs/labels/botones/tablas son componentes globales con tokens.
- [ ] Labels asociados (`htmlFor`/`id`), foco visible, errores accesibles, responsive (mobile→desktop).
- [ ] `pnpm lint` y `pnpm build` en verde.

**Auto-verificación (grep):** desde la raíz, ninguno de estos debería matchear en los archivos de la sección
(salvo casos justificados con comentario):
```bash
grep -rnE 'style=\{\{' app/<seccion>
grep -rnE 'bg-(slate|blue|red|green|gray|zinc|neutral)-[0-9]|border-(white|gray)|rgba\(' app/<seccion>
grep -rnE '<(input|select|textarea|table|button)[ >]' app/<seccion>
```

---

## 7. Fases

### Fase 1 — Fundación del sistema de diseño ✅ (HECHA)
> Sin esto, los componentes shadcn renderizan sin color (usaban tokens inexistentes).

- [x] **1.1 Tokens completos** en `app/globals.css` (dark-only, neutral): `background/foreground`, `card`,
  `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`,
  `chart-1..5`, `sidebar-*` + escala `radius-{sm,md,lg,xl}`, todo mapeado en `@theme inline`.
- [x] **1.2 Base layer** + font stack en `body`; `* { border-border outline-ring/50 }`.
- [x] **1.3 Primitivas shadcn** `textarea`, `table` (sin deps).
- [x] **1.4 Composables** `PageShell`, `PageHeader`, `EmptyState` en `components/shared/`.
- [x] Cierre: `pnpm lint` + `pnpm build` verdes. (Se corrigió de paso un error de lint en `EvolucionDialog.tsx`.)

---

### Fase 2 — Shell de navegación (layout + sidebar)
**Objetivo.** Un marco consistente para todas las pantallas del dashboard: barra superior real y sidebar
con identidad NutriFlow y estado activo.

**Archivos.** `app/dashboard/layout.tsx`, `components/app-sidebar.tsx`, (revisar) `app/layout.tsx`.

**Estado actual / problemas.**
- `app/dashboard/layout.tsx`: renderiza `<SidebarTrigger />` suelto + `children`, sin header ni contenedor.
- `components/app-sidebar.tsx`: `SidebarGroupLabel` dice "Application" (en inglés); sin header de marca; sin
  estado activo según ruta; footer ok (botón cerrar sesión).

**Pasos.**
1. En `app/dashboard/layout.tsx`: envolver el contenido con `SidebarInset` (o `<main>`) y agregar una **barra
   superior sticky**: `SidebarTrigger` + (opcional) breadcrumb/título de sección + `Separator` inferior.
   Quitar el trigger suelto. Ej:
   ```tsx
   <SidebarProvider>
     <AppSidebar />
     <SidebarInset>
       <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
         <SidebarTrigger />
       </header>
       {children}
     </SidebarInset>
   </SidebarProvider>
   ```
2. En `components/app-sidebar.tsx`: agregar `SidebarHeader` con marca "NutriFlow" (ícono `lucide` + texto);
   cambiar el label "Application" → "NutriFlow" o quitarlo; convertir a client component (`"use client"`) y
   marcar el item activo con `usePathname()` → `SidebarMenuButton isActive={pathname === item.url || pathname.startsWith(item.url + "/")}`.
3. Verificar que el botón "Cerrar sesión" del footer use `variant="destructive"` (ya lo hace).

**DoD.** §6 + el header se ve en todas las páginas del dashboard, el item activo se resalta, build verde.

---

### Fase 3 — Autenticación / Entrada (setup + lock)
**Objetivo.** Primeras pantallas (crear PIN / ingresar PIN) prolijas y on-brand.

**Archivos.** `app/setup/page.tsx`, `app/lock/page.tsx`. (No tocar `actions.ts` ni la lógica de sesión.)

**Estado actual / problemas.** Ya usan `Card`/`Input`/`Label`/`Button`, pero los botones tienen
`className="...bg-slate-700 hover:bg-blue-700"` hardcodeado e `import Link` sin usar (warning de lint).

**Pasos.**
1. Quitar `bg-slate-700 hover:bg-blue-700` de los `Button` (dejar la variante default).
2. Quitar imports sin usar (`Link`) y el `e` sin usar en catches (resuelve warnings de lint).
3. Centrar con `PageShell width="form"` o mantener el `min-h-screen flex items-center justify-center`, agregar
   un encabezado de marca "NutriFlow" sobre la `Card`. Errores con `text-destructive` (ya está).

**DoD.** §6. Sin `bg-slate/blue`. Sin warnings nuevos. Build verde.

---

### Fase 4 — Dashboard (home)
**Objetivo.** Home con métricas y accesos claros, sin colores hardcodeados.

**Archivos.** `app/dashboard/page.tsx`; crear `components/shared/stat-card.tsx` (receta §4.7).

**Estado actual / problemas.** Usa `Card`/`Button` pero con `bg-slate-800 border-2`, `bg-slate-800`,
`border-2 border-gray-700`, `border-2 ... rounded-2xl` hardcodeados; tarjetas de métrica repetidas a mano.

**Pasos.**
1. Crear `StatCard` (§4.7). Reemplazar las 3 tarjetas de métricas (Pacientes/Anamnesis/Planes) por `StatCard`.
2. Quitar **todos** los `bg-slate-800`, `border-2`, `border-gray-700`, `rounded-2xl` de botones y del "Abrir".
   Botones: variantes (`default`, `secondary`, `outline`). El header con `PageHeader` (título + acciones).
3. "Últimos pacientes": envolver en `Card`; filas como links con `hover:bg-accent`; si no hay, `EmptyState`.
4. La tarjeta "Atajos" → `Card` con botones `variant="outline"` (sin `bg-slate-800`).

**DoD.** §6. `grep` de colores hardcodeados en `app/dashboard/page.tsx` vacío. Build verde.

---

### Fase 5 — Pacientes (lista + alta/edición + detalle + confirmaciones)
> Sección con más deuda técnica (estilos inline, `<table>`/`<input>`/`<select>` crudos, colores hardcodeados).

**Archivos.**
- Lista: `app/dashboard/pacientes/page.tsx`
- Alta: `app/dashboard/pacientes/nuevo/page.tsx` (+ `actions.tsx`, `error.tsx`)
- Edición: `app/dashboard/pacientes/[id]/editar/page.tsx`
- Detalle: `app/dashboard/pacientes/[id]/page.tsx`
- Confirmación: `app/dashboard/pacientes/[id]/desactivar/page.tsx`
- Componentes a crear: `components/ui/select-native.tsx` (§4.8), `components/shared/pagination.tsx` (§4.9),
  `components/pacientes/PacienteForm.tsx` (compartido alta/edición).

**Estado actual / problemas.**
- `pacientes/page.tsx`: `style={{}}` por todos lados, `<table>` con estilos inline + `rgba(...)`, `<input>`/
  `<button>` crudos, links con `bg-blue-700`/`bg-red-600` hardcodeados, paginación con `pointerEvents`/`opacity`.
- `pacientes/nuevo/page.tsx`: `style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)" }}`, `<label>/<input>/
  <select>/<textarea>` crudos con `border-white`, `bg-black` en `<option>`, botón `bg-blue-600`.
- `[id]/editar/page.tsx`: mismo patrón de form crudo.
- `[id]/page.tsx`: detalle con `style={{}}` y colores hardcodeados; usa `ImcCard`, `RiesgoCardiometabolico`,
  `EvolucionDialogLazy` (ojo: esos componentes también tienen `style`/`rgba`, se tocan en Fase 7).
- `desactivar/page.tsx`: confirmación con estilos inline.

**Pasos.**
1. **SelectNative y Pagination**: crear ambos (recetas §4.8, §4.9).
2. **PacienteForm** (`components/pacientes/PacienteForm.tsx`): formulario único con campos DNI, nombre, teléfono,
   sexo (`SelectNative`), fecha nacimiento (`DatePickerSimple` existente), email, dirección, ocupación, estado
   civil, notas (`Textarea`). Props: `defaultValues?` y `action`. Usar receta §4.2 (grid responsive 2 cols).
   Conectar `nuevo` y `[id]/editar` a este componente (pasando la action y los valores).
3. **Lista** (`pacientes/page.tsx`): reescribir con `PageShell`+`PageHeader`, buscador (§4.5), `Table` (§4.3),
   acciones Editar (`variant="ghost/outline"`) y Desactivar (`variant="destructive"` o link rojo→`destructive`),
   `Pagination` (§4.9), `EmptyState` si no hay resultados. Eliminar `thStyle`/`tdStyle`/`style`/`rgba`.
4. **Detalle** (`[id]/page.tsx`): `PageShell`+`PageHeader` (nombre del paciente + acciones editar/desactivar),
   datos en `Card`s, secciones (Resumen, Anamnesis, Mediciones, Planes) con contadores y links. Quitar `style`/
   colores hardcodeados propios (los de `ImcCard`/Riesgo/Evolucion quedan para Fase 7, anotarlo).
5. **Confirmación** (`desactivar/page.tsx`): receta §4.6.

**DoD.** §6 en los 5 archivos. `grep` de §6 vacío en `app/dashboard/pacientes/` (excepto componentes de Fase 7).
Build verde.

---

### Fase 6 — Anamnesis
**Objetivo.** CRUD de anamnesis unificado.

**Archivos.** `app/dashboard/pacientes/[id]/anamnesis/page.tsx`, `.../nueva/page.tsx` (+ `actions.tsx`),
`.../[aid]/editar/page.tsx`, `.../[aid]/eliminar/page.tsx`. Crear `components/anamnesis/AnamnesisForm.tsx`.

**Estado actual / problemas.** Todas con `style={{}}` + `rgba(...)`; forms con `<input>/<textarea>` crudos;
`eliminar` es confirmación con estilos inline.

**Pasos.**
1. `AnamnesisForm` compartido (alta/edición) con `Field`/`Input`/`Textarea`/`SelectNative` (receta §4.2).
2. Lista de anamnesis: `Table` o `Card`s con `PageHeader` + `EmptyState`.
3. `eliminar`: confirmación con receta §4.6.
4. Quitar todo `style`/`rgba`/colores hardcodeados.

**DoD.** §6 + build verde.

---

### Fase 7 — Mediciones (+ tarjetas clínicas y gráfico)
**Objetivo.** CRUD de mediciones e historial, más los componentes clínicos.

**Archivos.** `app/dashboard/pacientes/[id]/mediciones/page.tsx`, `.../nueva/page.tsx`,
`.../[mid]/editar/page.tsx`, `.../[mid]/eliminar/page.tsx`; componentes
`components/pacientes/ImcCard.tsx`, `RiesgoCardiometabolico.tsx`, `EvolucionDialog.tsx`,
`EvolucionDialogLazy.tsx`, `Date-picker.tsx`. Crear `components/mediciones/MedicionForm.tsx`.

**Estado actual / problemas.** Páginas con `style`/`rgba`/HTML crudo; `ImcCard` y `EvolucionDialog` con `style`
inline; gráfico `recharts` debería usar `--chart-*` y `--muted-foreground` en ejes/tooltips; `Date-picker.tsx`
tiene colores hardcodeados.

**Pasos.**
1. `MedicionForm` compartido (peso, altura, cintura, etc.) con `Field`/`Input` (receta §4.2).
2. Historial: `Table` con `PageHeader` + `EmptyState`.
3. `ImcCard` / `RiesgoCardiometabolico`: migrar `style`→clases con tokens (`bg-card`, `text-muted-foreground`,
   badges de riesgo con `Badge` variantes). Mantener la lógica de cálculo intacta (comentarios en español).
4. `EvolucionDialog`: usar `Dialog`; en `recharts` mapear colores a `var(--chart-1)` etc. y ejes/grilla a
   `var(--border)`/`var(--muted-foreground)`. (El `style` dinámico de `width` de barras, si lo hubiera, se permite.)
5. `Date-picker.tsx`: quitar colores hardcodeados (usar `Button`/`Popover`/`Calendar` con tokens).
6. `eliminar`: receta §4.6.

**DoD.** §6 + build verde. Gráfico legible en dark.

---

### Fase 8 — Planes (editor + impresión)
**Objetivo.** Editor de plan alimentario y su versión imprimible.

**Archivos.** `app/dashboard/pacientes/[id]/planes/page.tsx`, `.../nuevo/page.tsx`, `.../[pid]/page.tsx`,
`.../[pid]/imprimir/page.tsx`; `components/planes/PlanEditor.tsx`, `components/planes/PrintButton.tsx`.

**Estado actual / problemas.** `PlanEditor` con `style`/HTML crudo y barras de macros; `imprimir` y `PrintButton`
con colores hardcodeados; `[pid]` con `<table>`/`<button>` crudos.

**Pasos.**
1. `PlanEditor`: inputs con `Input`/`SelectNative`; tabla de comidas con `Table`; barras de macros con
   `bg-chart-*` (el `width` dinámico vía `style` está permitido, comentar por qué). Botones con `Button`.
2. Lista/detalle de planes: `PageHeader` + `Table`/`Card` + `EmptyState`.
3. **Vista de impresión** (`imprimir/page.tsx`): estilos `print:` propios (fondo claro y buen contraste **en
   papel**) sin romper el tema oscuro de pantalla. Usar utilidades `print:` de Tailwind (`print:bg-white
   print:text-black`) acotadas a esa ruta. `PrintButton` con `Button`.

**DoD.** §6 + build verde + impresión legible en papel.

---

### Fase 9 — Calculadora energética
**Objetivo.** Calculadora con form claro y resultados legibles.

**Archivos.** `app/dashboard/calculadora/page.tsx`, `components/calculadora/CalculadoraForm.tsx`.

**Estado actual / problemas.** Form y resultados a revisar; estandarizar inputs y layout.

**Pasos.**
1. `CalculadoraForm`: inputs con `Field`/`Input`/`SelectNative`; layout responsive en 2 columnas
   (formulario | resultado).
2. Resultados (Mifflin/Harris/GET/objetivo) en `Card`s legibles con jerarquía clara. Mantener la lógica de
   cálculo (`lib/calculos.ts`) intacta.

**DoD.** §6 + build verde.

---

### Fase 10 — Alimentos (banco) + Papelera
**Objetivo.** Banco de alimentos y papelera consistentes.

**Archivos.** `app/dashboard/alimentos/page.tsx`; `app/dashboard/papelera/page.tsx`,
`app/dashboard/papelera/PapeleraClient.tsx`.

**Estado actual / problemas.** `alimentos` con `<input>/<table>` crudos; `PapeleraClient` con `style`/`rgba` y
acciones a mano.

**Pasos.**
1. **Alimentos**: `PageHeader` + buscador (§4.5) + filtros por categoría con `Badge`/botones; listado en `Table`
   (o cards). Datos siempre desde la tabla `alimentos` (no hardcodear).
2. **Papelera**: `Table` con acciones Restaurar (`variant="outline"`) / Eliminar (`variant="destructive"`),
   confirmaciones (§4.6) y `EmptyState`. Quitar `style`/`rgba`.

**DoD.** §6 + build verde.

---

### Fase 11 — QA visual, accesibilidad y consistencia final
**Objetivo.** Cerrar la coherencia global.

**Pasos.**
1. Barrido global — estos greps deben dar **vacío** (o solo casos justificados con comentario):
   ```bash
   grep -rnE 'style=\{\{' app components | grep -v node_modules
   grep -rnE 'bg-(slate|blue|red|green|gray|zinc|neutral)-[0-9]|border-(white|gray)|text-white|bg-black|rgba\(' app | grep -v node_modules
   grep -rnE '<(input|select|textarea|table|button)[ >]' app | grep -v node_modules
   ```
   (En `components/ui/*` algunos `text-white` dentro de variantes shadcn son legítimos.)
2. Revisión de **foco/teclado** (tabular toda la app), **contraste** y `aria-*`.
3. Pasada de **spacing/tipografía**: que todas las secciones se vean "de la misma familia".
4. Revisar **impresión** de planes en papel.
5. Cierre: `pnpm lint` + `pnpm build` verdes.

**DoD.** Los 3 greps sin hallazgos no justificados. Lint/build verdes.

---

## 8. Inventario de deuda por archivo (snapshot inicial)

Marcas: `S` = `style={{}}` inline · `C` = color hardcodeado · `R` = `rgba()` · `H` = HTML crudo de form/tabla.

| Archivo | Deuda | Fase |
|---|---|---|
| `app/dashboard/layout.tsx` | shell incompleto | 2 |
| `components/app-sidebar.tsx` | label en inglés, sin activo | 2 |
| `app/setup/page.tsx` · `app/lock/page.tsx` | C (botones) + imports sin usar | 3 |
| `app/dashboard/page.tsx` | C | 4 |
| `app/dashboard/pacientes/page.tsx` | S C R H | 5 |
| `app/dashboard/pacientes/nuevo/page.tsx` | S C H | 5 |
| `app/dashboard/pacientes/nuevo/error.tsx` | S H | 5 |
| `app/dashboard/pacientes/[id]/page.tsx` | S C R | 5 |
| `app/dashboard/pacientes/[id]/editar/page.tsx` | S C H | 5 |
| `app/dashboard/pacientes/[id]/desactivar/page.tsx` | S C | 5 |
| `app/dashboard/pacientes/[id]/anamnesis/page.tsx` | S C R H | 6 |
| `app/dashboard/pacientes/[id]/anamnesis/nueva/page.tsx` | S C H | 6 |
| `app/dashboard/pacientes/[id]/anamnesis/[aid]/editar/page.tsx` | S R H | 6 |
| `app/dashboard/pacientes/[id]/anamnesis/[aid]/eliminar/page.tsx` | S R H | 6 |
| `app/dashboard/pacientes/[id]/mediciones/page.tsx` | S C R H | 7 |
| `app/dashboard/pacientes/[id]/mediciones/nueva/page.tsx` | C H | 7 |
| `app/dashboard/pacientes/[id]/mediciones/[mid]/editar/page.tsx` | S R H | 7 |
| `app/dashboard/pacientes/[id]/mediciones/[mid]/eliminar/page.tsx` | S R H | 7 |
| `components/pacientes/ImcCard.tsx` | S R | 7 |
| `components/pacientes/RiesgoCardiometabolico.tsx` | S | 7 |
| `components/pacientes/EvolucionDialog.tsx` | S C R | 7 |
| `components/pacientes/Date-picker.tsx` | C H | 7 |
| `app/dashboard/pacientes/[id]/planes/[pid]/page.tsx` | H | 8 |
| `app/dashboard/pacientes/[id]/planes/[pid]/imprimir/page.tsx` | C H | 8 |
| `components/planes/PlanEditor.tsx` | S H | 8 |
| `components/planes/PrintButton.tsx` | C H | 8 |
| `app/dashboard/calculadora/page.tsx` · `CalculadoraForm.tsx` | revisar | 9 |
| `app/dashboard/alimentos/page.tsx` | H | 10 |
| `app/dashboard/papelera/PapeleraClient.tsx` | S C R | 10 |

> `components/ui/{alert,badge,button,dialog,sheet}.tsx` aparecen en el grep de "color" por `text-white`/
> `dark:bg-destructive/60` **dentro de variantes shadcn**: son legítimos, no son deuda.

---

## 9. Inventario de componentes globales (meta)

| Componente | Estado | Ubicación |
|---|---|---|
| Button, Input, Label, Field, Card, Badge, Alert, Checkbox | ✅ existen | `components/ui/` |
| Dialog, Sheet, Popover, Tooltip, Calendar, Separator, Skeleton, Sidebar | ✅ existen | `components/ui/` |
| Textarea, Table | ✅ Fase 1 | `components/ui/` |
| PageShell, PageHeader, EmptyState | ✅ Fase 1 | `components/shared/` |
| StatCard | ⬜ Fase 4 | `components/shared/` |
| SelectNative | ⬜ Fase 5 | `components/ui/` |
| Pagination | ⬜ Fase 5 | `components/shared/` |
| PacienteForm | ⬜ Fase 5 | `components/pacientes/` |
| AnamnesisForm | ⬜ Fase 6 | `components/anamnesis/` |
| MedicionForm | ⬜ Fase 7 | `components/mediciones/` |
| Select (Radix, con dep) | ⬜ solo si hace falta búsqueda/multiselect | `components/ui/` |
