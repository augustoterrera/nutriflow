import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, NotebookTabs, Plus } from "lucide-react"

import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDB } from "@/lib/db"
import { listarPlanesDePaciente } from "@/lib/planes"

type PlanResumen = {
  id: number
  nombre: string
  fecha: string | null
  kcal_objetivo: string | null
  objetivo: string | null
  evaluacion_fecha: string | null
}

export default async function PlanesPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()

  const db = await getDB()
  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  )
  if (!paciente) notFound()

  const planes = (await listarPlanesDePaciente(pacienteId)) as PlanResumen[]
  const baseHref = `/dashboard/pacientes/${pacienteId}/planes`

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <section aria-labelledby="planes-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="planes-title" className="text-lg font-semibold">
              Planes alimentarios
            </h2>
            <p className="text-muted-foreground text-sm">
              {planes.length} {planes.length === 1 ? "plan creado" : "planes creados"}
            </p>
          </div>
          <Button asChild>
            <Link href={`${baseHref}/nuevo`}>
              <Plus />
              Nuevo plan
            </Link>
          </Button>
        </div>

        {planes.length === 0 ? (
          <EmptyState
            icon={NotebookTabs}
            title="Todavía no hay planes"
            description={`Creá el primer plan alimentario de ${primerNombre(paciente.nombre_completo)}.`}
            action={
              <Button asChild>
                <Link href={`${baseHref}/nuevo`}>Crear primer plan</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planes.map((plan) => (
              <Link
                key={plan.id}
                href={`${baseHref}/${plan.id}`}
                className="focus-visible:ring-ring/50 rounded-xl focus-visible:ring-3 focus-visible:outline-none"
              >
                <Card className="hover:bg-accent/40 h-full transition-colors">
                  <CardHeader>
                    <CardTitle>{plan.nombre}</CardTitle>
                    <CardDescription>{formatFecha(plan.fecha)}</CardDescription>
                    <CardAction>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {plan.kcal_objetivo?.trim() || "Plan semanal"}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {plan.objetivo?.trim() || "Grilla por comida y día"}
                    </p>
                    {plan.evaluacion_fecha ? (
                      <Badge variant="secondary" className="mt-3">
                        Evaluación del {formatFecha(plan.evaluacion_fecha)}
                      </Badge>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}

function primerNombre(nombre: string) {
  return String(nombre).trim().split(/\s+/)[0] || "este paciente"
}

function formatFecha(value: string | null) {
  if (!value) return "Sin fecha"
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
