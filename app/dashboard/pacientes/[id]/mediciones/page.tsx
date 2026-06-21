import Link from "next/link"
import { notFound } from "next/navigation"
import { Activity, Pencil, Plus, Trash2 } from "lucide-react"

import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Pagination } from "@/components/shared/pagination"
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
import { calcularIMC } from "@/lib/calculos"
import { getDB } from "@/lib/db"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 15

type MedicionRow = {
  id: number
  fecha: string
  peso_kg: number | null
  altura_cm: number | null
  cintura_cm: number | null
  cadera_cm: number | null
  cuello_cm: number | null
  grasa_pct: number | null
  musculo_pct: number | null
  brazo_cm: number | null
  muneca_cm: number | null
  observaciones: string | null
}

export default async function MedicionesHistorialPage({
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
    `select count(*) as total from mediciones where paciente_id = ?`,
    [pacienteId]
  )
  const total = Number(rowCount?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const offset = (safePage - 1) * PAGE_SIZE

  const mediciones = (await db.all(
    `select id, fecha, peso_kg, altura_cm, cintura_cm, cadera_cm, cuello_cm,
            grasa_pct, musculo_pct, brazo_cm, muneca_cm, observaciones
     from mediciones
     where paciente_id = ?
     order by date(fecha) desc, id desc
     limit ? offset ?`,
    [pacienteId, PAGE_SIZE, offset]
  )) as MedicionRow[]

  const alturaRefRow = await db.get(
    `select altura_cm from mediciones
     where paciente_id = ? and altura_cm is not null
     order by date(fecha) desc, id desc
     limit 1`,
    [pacienteId]
  )
  const alturaRef = alturaRefRow?.altura_cm ?? null
  const baseHref = `/dashboard/pacientes/${pacienteId}/mediciones`

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <section aria-labelledby="mediciones-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="mediciones-title" className="text-lg font-semibold">
              Mediciones
            </h2>
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "medición registrada" : "mediciones registradas"}
            </p>
          </div>
          <Button asChild>
            <Link href={`${baseHref}/nueva`}>
              <Plus />
              Nueva medición
            </Link>
          </Button>
        </div>

        {mediciones.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Todavía no hay mediciones"
            description="Cargá peso, altura y perímetros para comenzar el seguimiento clínico."
            action={
              <Button asChild>
                <Link href={`${baseHref}/nueva`}>Crear primera medición</Link>
              </Button>
            }
          />
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Fecha</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Cintura</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead>WHtR</TableHead>
                  <TableHead>Altura</TableHead>
                  <TableHead>Extras</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediciones.map((medicion, index) => {
                  const anterior = mediciones[index + 1] ?? null
                  const altura = medicion.altura_cm || alturaRef
                  const alturaAnterior = anterior?.altura_cm || alturaRef
                  const imc = medicion.peso_kg && altura
                    ? calcularIMC(Number(medicion.peso_kg), Number(altura))
                    : null
                  const imcAnterior = anterior?.peso_kg && alturaAnterior
                    ? calcularIMC(Number(anterior.peso_kg), Number(alturaAnterior))
                    : null
                  const whtr = medicion.cintura_cm && altura
                    ? Number(medicion.cintura_cm) / Number(altura)
                    : null
                  const extras = [
                    medicion.cadera_cm ? `Cadera ${Number(medicion.cadera_cm).toFixed(1)} cm` : null,
                    medicion.cuello_cm ? `Cuello ${Number(medicion.cuello_cm).toFixed(1)} cm` : null,
                    medicion.grasa_pct ? `Grasa ${Number(medicion.grasa_pct).toFixed(1)}%` : null,
                    medicion.musculo_pct ? `Músculo ${Number(medicion.musculo_pct).toFixed(1)}%` : null,
                    medicion.brazo_cm ? `Brazo ${Number(medicion.brazo_cm).toFixed(1)} cm` : null,
                    medicion.muneca_cm ? `Muñeca ${Number(medicion.muneca_cm).toFixed(1)} cm` : null,
                    medicion.observaciones ? `Obs: ${medicion.observaciones}` : null,
                  ].filter(Boolean).join(" · ")

                  return (
                    <TableRow key={medicion.id}>
                      <TableCell className="px-4">
                        <div className="font-medium">{formatFecha(medicion.fecha)}</div>
                        {safePage === 1 && index === 0 ? (
                          <div className="text-success mt-0.5 text-xs">más reciente</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <MetricCell
                          value={medicion.peso_kg}
                          previous={anterior?.peso_kg}
                          unit="kg"
                        />
                      </TableCell>
                      <TableCell>
                        <MetricCell
                          value={medicion.cintura_cm}
                          previous={anterior?.cintura_cm}
                          unit="cm"
                        />
                      </TableCell>
                      <TableCell>
                        <MetricCell value={imc} previous={imcAnterior} />
                      </TableCell>
                      <TableCell>{whtr !== null ? whtr.toFixed(2) : "—"}</TableCell>
                      <TableCell>{altura ? `${Number(altura).toFixed(0)} cm` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground max-w-80">
                        <div className="truncate" title={extras || undefined}>{extras || "—"}</div>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link
                              href={`${baseHref}/${medicion.id}/editar`}
                              aria-label={`Editar medición del ${formatFecha(medicion.fecha)}`}
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
                              href={`${baseHref}/${medicion.id}/eliminar`}
                              aria-label={`Eliminar medición del ${formatFecha(medicion.fecha)}`}
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

function MetricCell({
  value,
  previous,
  unit,
}: {
  value: number | null
  previous?: number | null
  unit?: string
}) {
  if (value === null || value === undefined) return <>—</>
  const current = Number(value)
  const previousNumber = previous === null || previous === undefined ? null : Number(previous)
  const delta = previousNumber !== null ? current - previousNumber : null

  return (
    <div className="flex items-baseline gap-1.5">
      <span>{current.toFixed(1)}{unit ? ` ${unit}` : ""}</span>
      {delta !== null ? (
        <span
          className={cn(
            "text-xs font-medium",
            delta < 0 && "text-success",
            delta > 0 && "text-destructive",
            delta === 0 && "text-muted-foreground"
          )}
        >
          {delta < 0 ? "↓" : delta > 0 ? "↑" : "→"}{Math.abs(delta).toFixed(1)}
        </span>
      ) : null}
    </div>
  )
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
