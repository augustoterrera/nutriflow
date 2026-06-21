import Link from "next/link"
import { notFound } from "next/navigation"
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react"

import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Pagination } from "@/components/shared/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDB } from "@/lib/db"

const PAGE_SIZE = 15

type AnamnesisRow = {
  id: number
  fecha: string
  tipo_dieta: string
  consumo_verduras: string | null
  consumo_frutas: string | null
  consumo_carnes: string | null
  consumo_agua: string | null
  actividad_fisica: string | null
  consume_suplementos: number
  suplementos_detalle: string | null
  frutas_no_gusta: string | null
  verduras_no_gusta: string | null
  observaciones: string | null
}

export default async function AnamnesisHistorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ p?: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()

  const sp = (await searchParams) ?? {}
  const page = Math.max(1, Number(sp.p ?? 1) || 1)
  const db = await getDB()

  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  )
  if (!paciente) notFound()

  const rowCount = await db.get(
    `select count(*) as total from anamnesis where paciente_id = ?`,
    [pacienteId]
  )
  const total = Number(rowCount?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const offset = (safePage - 1) * PAGE_SIZE

  const anamnesis = (await db.all(
    `select id, fecha, tipo_dieta,
            consumo_verduras, consumo_frutas, consumo_carnes, consumo_agua,
            actividad_fisica, consume_suplementos, suplementos_detalle,
            frutas_no_gusta, verduras_no_gusta, observaciones
     from anamnesis
     where paciente_id = ?
     order by date(fecha) desc, id desc
     limit ? offset ?`,
    [pacienteId, PAGE_SIZE, offset]
  )) as AnamnesisRow[]

  const baseHref = `/dashboard/pacientes/${pacienteId}/anamnesis`

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <section aria-labelledby="anamnesis-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="anamnesis-title" className="text-lg font-semibold">
              Anamnesis
            </h2>
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "registro" : "registros"}
            </p>
          </div>
          <Button asChild>
            <Link href={`${baseHref}/nueva`}>
              <Plus />
              Nueva anamnesis
            </Link>
          </Button>
        </div>

        {anamnesis.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay anamnesis"
            description="Cargá el primer registro para documentar hábitos y antecedentes."
            action={
              <Button asChild>
                <Link href={`${baseHref}/nueva`}>Crear primera anamnesis</Link>
              </Button>
            }
          />
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Fecha</TableHead>
                  <TableHead>Dieta</TableHead>
                  <TableHead>Consumos</TableHead>
                  <TableHead>Actividad física</TableHead>
                  <TableHead>Suplementos</TableHead>
                  <TableHead>Preferencias</TableHead>
                  <TableHead>Observación</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anamnesis.map((registro, index) => {
                  const consumos = [
                    registro.consumo_verduras ? `Verduras: ${registro.consumo_verduras}` : null,
                    registro.consumo_frutas ? `Frutas: ${registro.consumo_frutas}` : null,
                    registro.consumo_carnes ? `Carnes: ${registro.consumo_carnes}` : null,
                    registro.consumo_agua ? `Agua: ${registro.consumo_agua}` : null,
                  ].filter(Boolean).join(" · ")
                  const preferencias = [
                    registro.frutas_no_gusta ? `Frutas: ${compact(registro.frutas_no_gusta)}` : null,
                    registro.verduras_no_gusta ? `Verduras: ${compact(registro.verduras_no_gusta)}` : null,
                  ].filter(Boolean).join(" · ")

                  return (
                    <TableRow key={registro.id}>
                      <TableCell className="px-4">
                        <div className="font-medium">{formatFecha(registro.fecha)}</div>
                        {safePage === 1 && index === 0 ? (
                          <div className="text-success mt-0.5 text-xs">más reciente</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{labelDieta(registro.tipo_dieta)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-80 whitespace-normal">
                        {consumos || "Sin registro"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.actividad_fisica || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.consume_suplementos
                          ? registro.suplementos_detalle || "Sí"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-64 whitespace-normal">
                        {preferencias || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-72">
                        <div className="truncate" title={registro.observaciones ?? undefined}>
                          {registro.observaciones || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link
                              href={`${baseHref}/${registro.id}/editar`}
                              aria-label={`Editar anamnesis del ${formatFecha(registro.fecha)}`}
                              title="Editar"
                            >
                              <Pencil />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            asChild
                          >
                            <Link
                              href={`${baseHref}/${registro.id}/eliminar`}
                              aria-label={`Eliminar anamnesis del ${formatFecha(registro.fecha)}`}
                              title="Eliminar"
                            >
                              <Trash2 />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {totalPages > 1 ? (
          <div className="mt-4">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              hrefFor={(nextPage) => `${baseHref}?p=${nextPage}`}
            />
          </div>
        ) : null}
      </section>
    </PageShell>
  )
}

function labelDieta(value: string) {
  if (value === "vegano") return "Vegano"
  if (value === "vegetariano") return "Vegetariano"
  return "Omnívoro"
}

function compact(value: string) {
  const text = value.trim()
  if (!text) return ""
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.join(", ")
    } catch {
      return text
    }
  }
  return text
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10))
  if (!match) return value
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date).replaceAll(".", "")
}
