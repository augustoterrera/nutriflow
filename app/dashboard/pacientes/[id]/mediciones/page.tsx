import Link from "next/link"
import { notFound } from "next/navigation"
import { Activity, Plus } from "lucide-react"

import {
  MedicionesHistorialTable,
  type MedicionRow,
} from "@/components/mediciones/MedicionesHistorialTable"
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Pagination } from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getDB } from "@/lib/db"

const PAGE_SIZE = 15

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
            <MedicionesHistorialTable
              registros={mediciones}
              alturaRef={alturaRef}
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
