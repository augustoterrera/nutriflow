import { Fragment } from "react"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Apple, Search, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  crearAlimentoCustom,
  desactivarAlimento,
  listarAlimentos,
  listarGruposAlimentos,
  type Alimento,
} from "@/lib/alimentos"

async function crearAlimentoAction(formData: FormData) {
  "use server"

  const num = (name: string) =>
    Number(String(formData.get(name) ?? "0").replace(",", ".")) || 0

  await crearAlimentoCustom({
    nombre: String(formData.get("nombre") ?? ""),
    kcal: num("kcal"),
    prot: num("prot"),
    cho: num("cho"),
    gras: num("gras"),
    fibra: num("fibra"),
    grupo: String(formData.get("grupo") ?? "Personalizados"),
  })

  revalidatePath("/dashboard/alimentos")
  redirect("/dashboard/alimentos?vista=tabla")
}

async function desactivarAlimentoAction(formData: FormData) {
  "use server"

  await desactivarAlimento(Number(formData.get("id")))
  revalidatePath("/dashboard/alimentos")
}

export default async function AlimentosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; grupo?: string; vista?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const q = String(sp.q ?? "").trim()
  const grupo = String(sp.grupo ?? "").trim()
  const vista = sp.vista === "tabla" ? "tabla" : "banco"
  const [alimentos, grupos] = await Promise.all([
    listarAlimentos({ q, grupo }),
    listarGruposAlimentos(),
  ])

  const grouped = alimentos.reduce<Map<string, Alimento[]>>((acc, item) => {
    const current = acc.get(item.grupo) ?? []
    current.push(item)
    acc.set(item.grupo, current)
    return acc
  }, new Map())
  const hayFiltros = Boolean(q || grupo)

  return (
    <PageShell>
      <PageHeader
        title="Alimentos"
        description="Banco y composición nutricional expresada por cada 100 g."
        actions={
          <div className="flex gap-2" role="group" aria-label="Vista de alimentos">
            <Button variant={vista === "banco" ? "default" : "outline"} asChild>
              <Link
                href={`/dashboard/alimentos?${qs({ q, grupo, vista: "banco" })}`}
                aria-current={vista === "banco" ? "page" : undefined}
              >
                Banco
              </Link>
            </Button>
            <Button variant={vista === "tabla" ? "default" : "outline"} asChild>
              <Link
                href={`/dashboard/alimentos?${qs({ q, grupo, vista: "tabla" })}`}
                aria-current={vista === "tabla" ? "page" : undefined}
              >
                Tabla
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-center gap-2" role="search">
            <Label htmlFor="buscar-alimento" className="sr-only">
              Buscar alimento
            </Label>
            <Input
              id="buscar-alimento"
              name="q"
              defaultValue={q}
              placeholder="Buscar alimento..."
              className="w-full sm:max-w-xs"
            />
            <Input type="hidden" name="vista" value={vista} />
            {grupo ? <Input type="hidden" name="grupo" value={grupo} /> : null}
            <Button type="submit" variant="secondary">
              <Search />
              Buscar
            </Button>
            {hayFiltros ? (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/alimentos?vista=${vista}`}>Limpiar</Link>
              </Button>
            ) : null}
          </form>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por grupo">
            <Button size="sm" variant={!grupo ? "default" : "outline"} asChild>
              <Link
                href={`/dashboard/alimentos?${qs({ q, vista })}`}
                aria-current={!grupo ? "page" : undefined}
              >
                Todos
              </Link>
            </Button>
            {grupos.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={grupo === item ? "default" : "outline"}
                asChild
              >
                <Link
                  href={`/dashboard/alimentos?${qs({ q, grupo: item, vista })}`}
                  aria-current={grupo === item ? "page" : undefined}
                >
                  {item}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nuevo alimento personalizado</CardTitle>
          <CardDescription>
            Cargá la composición por 100 g. Los campos de macronutrientes aceptan decimales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={crearAlimentoAction}>
            <FieldGroup className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-7">
              <FoodField id="alimento-nombre" name="nombre" label="Nombre" className="lg:col-span-2" required />
              <FoodField id="alimento-kcal" name="kcal" label="Kcal" required />
              <FoodField id="alimento-prot" name="prot" label="Proteínas (g)" />
              <FoodField id="alimento-cho" name="cho" label="Carbohidratos (g)" />
              <FoodField id="alimento-gras" name="gras" label="Grasas (g)" />
              <FoodField id="alimento-fibra" name="fibra" label="Fibra (g)" />

              <Field className="sm:col-span-2 lg:col-span-2">
                <FieldLabel htmlFor="alimento-grupo">Grupo</FieldLabel>
                <Input id="alimento-grupo" name="grupo" defaultValue="Personalizados" required />
              </Field>

              <div className="sm:col-span-2 lg:col-span-2 lg:self-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Guardar alimento
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="resultados-alimentos" className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="resultados-alimentos" className="text-lg font-semibold">
              {vista === "banco" ? "Banco de alimentos" : "Tabla nutricional"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {alimentos.length} {alimentos.length === 1 ? "alimento" : "alimentos"}
            </p>
          </div>
        </div>

        {alimentos.length === 0 ? (
          <EmptyState
            icon={Apple}
            title={hayFiltros ? "No encontramos alimentos" : "Todavía no hay alimentos"}
            description={
              hayFiltros
                ? "Probá con otro término o limpiá los filtros activos."
                : "Cargá el primer alimento personalizado para comenzar."
            }
            action={
              hayFiltros ? (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/alimentos?vista=${vista}`}>Limpiar filtros</Link>
                </Button>
              ) : undefined
            }
          />
        ) : vista === "banco" ? (
          <BancoAlimentos grouped={grouped} />
        ) : (
          <TablaAlimentos grouped={grouped} />
        )}
      </section>
    </PageShell>
  )
}

function BancoAlimentos({ grouped }: { grouped: Map<string, Alimento[]> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...grouped.entries()].map(([nombreGrupo, items]) => (
        <Card key={nombreGrupo}>
          <CardHeader>
            <CardTitle>{nombreGrupo}</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "alimento" : "alimentos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.nombre}</span>
                    {item.es_custom ? <Badge variant="secondary">Personalizado</Badge> : null}
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {item.kcal} kcal / 100 g
                  </div>
                </div>
                {item.es_custom ? <DeleteFood id={item.id} nombre={item.nombre} /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TablaAlimentos({ grouped }: { grouped: Map<string, Alimento[]> }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alimento</TableHead>
            <TableHead className="text-right">Kcal</TableHead>
            <TableHead className="text-right">Proteínas</TableHead>
            <TableHead className="text-right">Carbohidratos</TableHead>
            <TableHead className="text-right">Grasas</TableHead>
            <TableHead className="text-right">Fibra</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...grouped.entries()].map(([nombreGrupo, items]) => (
            <Fragment key={nombreGrupo}>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableCell className="font-semibold" colSpan={7}>
                  {nombreGrupo}
                </TableCell>
              </TableRow>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.nombre}</span>
                      {item.es_custom ? <Badge variant="secondary">Personalizado</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.kcal}</TableCell>
                  <TableCell className="text-right">{item.prot}</TableCell>
                  <TableCell className="text-right">{item.cho}</TableCell>
                  <TableCell className="text-right">{item.gras}</TableCell>
                  <TableCell className="text-right">{item.fibra}</TableCell>
                  <TableCell className="text-right">
                    {item.es_custom ? <DeleteFood id={item.id} nombre={item.nombre} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function FoodField({
  id,
  name,
  label,
  className,
  required = false,
}: {
  id: string
  name: string
  label: string
  className?: string
  required?: boolean
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        inputMode={name === "nombre" ? "text" : "decimal"}
        required={required}
      />
    </Field>
  )
}

function DeleteFood({ id, nombre }: { id: number; nombre: string }) {
  return (
    <form action={desactivarAlimentoAction}>
      <Input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        aria-label={`Eliminar ${nombre}`}
        title={`Eliminar ${nombre}`}
      >
        <Trash2 />
      </Button>
    </form>
  )
}

function qs(values: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
  }
  return params.toString()
}
