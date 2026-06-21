import Link from "next/link"
import { notFound } from "next/navigation"
import { ClipboardList, Plus } from "lucide-react"

import {
  AnamnesisHistorialTable,
  type AnamnesisRow,
} from "@/components/anamnesis/AnamnesisHistorialTable"
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Pagination } from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDB } from "@/lib/db"

const PAGE_SIZE = 15

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
            <AnamnesisHistorialTable
              registros={anamnesis}
              baseHref={baseHref}
              safePage={safePage}
            />
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
