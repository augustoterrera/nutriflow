import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { notFound } from "next/navigation"

import { PapeleraSubmitButton } from "@/components/papelera/papelera-submit-button"
import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDB } from "@/lib/db"
import { borrarPacienteDefinitivamenteAction } from "../../actions"

export default async function EliminarPacientePapeleraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()

  const db = await getDB()
  const paciente = await db.get(
    `select id, nombre_completo, dni
     from pacientes
     where id = ? and activo = 0`,
    [pacienteId]
  )
  if (!paciente) notFound()

  const [anamnesis, mediciones, evaluaciones, planes] = await Promise.all([
    contar(db, "anamnesis", pacienteId),
    contar(db, "mediciones", pacienteId),
    contar(db, "evaluaciones_energeticas", pacienteId),
    contar(db, "planes", pacienteId),
  ])

  return (
    <PageShell width="form">
      <PageHeader
        title="Eliminar paciente"
        description="Confirmá el borrado definitivo de la historia clínica."
      />
      <Card>
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mb-2 flex size-11 items-center justify-center rounded-full">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>¿Eliminar definitivamente a {paciente.nombre_completo}?</CardTitle>
          <CardDescription>
            DNI {paciente.dni}. Esta acción es irreversible y no permite recuperar la historia del paciente.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-4">
            <p className="text-destructive font-medium">También se eliminarán:</p>
            <ul className="text-muted-foreground mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <li>{formatCantidad(anamnesis, "anamnesis", "anamnesis")}</li>
              <li>{formatCantidad(mediciones, "medición", "mediciones")}</li>
              <li>{formatCantidad(evaluaciones, "evaluación energética", "evaluaciones energéticas")}</li>
              <li>{formatCantidad(planes, "plan alimentario", "planes alimentarios")}</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex-wrap gap-2">
          <form action={borrarPacienteDefinitivamenteAction.bind(null, pacienteId)}>
            <PapeleraSubmitButton action="eliminar" />
          </form>
          <Button variant="outline" asChild>
            <Link href="/dashboard/papelera">Cancelar</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  )
}

async function contar(
  db: Awaited<ReturnType<typeof getDB>>,
  tabla: "anamnesis" | "mediciones" | "evaluaciones_energeticas" | "planes",
  pacienteId: number
) {
  // `tabla` está restringida por el tipo a este conjunto fijo; el valor no viene del usuario.
  const row = await db.get(`select count(*) as total from ${tabla} where paciente_id = ?`, [
    pacienteId,
  ])
  return Number(row?.total ?? 0)
}

function formatCantidad(cantidad: number, singular: string, plural: string) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`
}
