import { Calculator } from "lucide-react"
import { notFound } from "next/navigation"

import { EvaluacionEnergeticaForm } from "@/components/calculadora/evaluacion-energetica-form"
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { EmptyState } from "@/components/shared/empty-state"
import { PageShell } from "@/components/shared/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import {
  FORMULA_ENERGETICA_LABELS,
  OBJETIVO_ENERGETICO_LABELS,
} from "@/lib/energia"
import {
  listarEvaluacionesEnergeticas,
  type EvaluacionEnergetica,
} from "@/lib/evaluaciones-energeticas"
import { guardarEvaluacionEnergeticaAction } from "./actions"

export default async function EnergiaPacientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ guardada?: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()
  const sp = (await searchParams) ?? {}

  const db = await getDB()
  const [paciente, medicion, evaluaciones] = await Promise.all([
    db.get(
      `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
       from pacientes where id = ? and activo = 1`,
      [pacienteId]
    ),
    db.get(
      `select id, fecha, peso_kg, altura_cm,
              (select altura_cm from mediciones
               where paciente_id = ? and altura_cm is not null
               order by date(fecha) desc, id desc limit 1) as altura_ref
       from mediciones
       where paciente_id = ? and peso_kg is not null
       order by date(fecha) desc, id desc limit 1`,
      [pacienteId, pacienteId]
    ),
    listarEvaluacionesEnergeticas(pacienteId),
  ])
  if (!paciente) notFound()

  const hoy = new Date().toISOString().slice(0, 10)
  const talla = medicion?.altura_cm ?? medicion?.altura_ref ?? ""
  const action = guardarEvaluacionEnergeticaAction.bind(null, pacienteId)

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold">Evaluación energética</h2>
        <p className="text-muted-foreground text-sm">
          Calculá, revisá y guardá estimaciones reproducibles para este paciente.
        </p>
      </div>

      {sp.guardada === "1" ? (
        <Alert className="mb-6" role="status">
          <AlertTitle>Evaluación guardada</AlertTitle>
          <AlertDescription>
            El resultado ya forma parte del historial y puede usarse como referencia de un plan.
          </AlertDescription>
        </Alert>
      ) : null}

      <EvaluacionEnergeticaForm
        fechaNacimiento={paciente.fecha_nacimiento ?? null}
        sexo={paciente.sexo ?? null}
        medicionId={medicion?.id ? Number(medicion.id) : null}
        medicionFecha={medicion?.fecha ? String(medicion.fecha) : null}
        defaultFecha={hoy}
        defaultPeso={medicion?.peso_kg == null ? "" : String(medicion.peso_kg)}
        defaultTalla={talla === "" ? "" : String(talla)}
        action={action}
      />

      <section aria-labelledby="historial-energia-title" className="mt-8">
        <div className="mb-4">
          <h2 id="historial-energia-title" className="text-lg font-semibold">
            Historial
          </h2>
          <p className="text-muted-foreground text-sm">
            {evaluaciones.length} {evaluaciones.length === 1 ? "evaluación guardada" : "evaluaciones guardadas"}
          </p>
        </div>

        {evaluaciones.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="Todavía no hay evaluaciones"
            description="Usá el formulario para guardar la primera estimación energética del paciente."
          />
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
            <EvaluacionesTable evaluaciones={evaluaciones} />
          </Card>
        )}
      </section>
    </PageShell>
  )
}

function EvaluacionesTable({ evaluaciones }: { evaluaciones: EvaluacionEnergetica[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Datos utilizados</TableHead>
          <TableHead>Método</TableHead>
          <TableHead className="text-right">GET</TableHead>
          <TableHead className="text-right">Objetivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {evaluaciones.map((evaluacion) => (
          <TableRow key={evaluacion.id}>
            <TableCell className="align-top">
              <div className="font-medium">{formatFecha(evaluacion.fecha)}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {origenLabel(evaluacion)}
              </div>
            </TableCell>
            <TableCell className="align-top">
              <div>{evaluacion.pesoKg} kg · {evaluacion.tallaCm} cm · {evaluacion.edad} años</div>
              {evaluacion.observaciones ? (
                <div className="text-muted-foreground mt-1 max-w-xs text-xs whitespace-normal">
                  {evaluacion.observaciones}
                </div>
              ) : null}
            </TableCell>
            <TableCell className="align-top">
              <Badge variant="secondary">{FORMULA_ENERGETICA_LABELS[evaluacion.formula]}</Badge>
              <div className="text-muted-foreground mt-1 text-xs">
                Factor {evaluacion.factorActividad} · ajuste {formatAjuste(evaluacion.ajusteKcal)}
              </div>
            </TableCell>
            <TableCell className="text-right align-top font-medium">
              {evaluacion.getKcal.toLocaleString("es-AR")} kcal
            </TableCell>
            <TableCell className="text-right align-top">
              <div className="font-semibold">{evaluacion.objetivoKcal.toLocaleString("es-AR")} kcal</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {OBJETIVO_ENERGETICO_LABELS[evaluacion.objetivoTipo]}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function origenLabel(evaluacion: EvaluacionEnergetica) {
  if (evaluacion.origen === "medicion") {
    return evaluacion.fechaMedicionOrigen
      ? `Medición del ${formatFecha(evaluacion.fechaMedicionOrigen)}`
      : "Datos de medición"
  }
  return evaluacion.medicionId ? "Ajustada desde una medición" : "Carga manual"
}

function formatAjuste(value: number) {
  return `${value > 0 ? "+" : ""}${value} kcal`
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10))
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}
