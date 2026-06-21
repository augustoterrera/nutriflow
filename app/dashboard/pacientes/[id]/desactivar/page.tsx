import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDB } from "@/lib/db"
import { desactivarPacienteAction } from "./actions"

export default async function DesactivarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()

  const db = await getDB()
  const paciente = await db.get(
    `select id, nombre_completo, dni from pacientes where id = ? and activo = 1`,
    [pacienteId]
  )
  if (!paciente) notFound()

  return (
    <PageShell width="form">
      <PageHeader
        title="Desactivar paciente"
        description="Podrás restaurarlo posteriormente desde la papelera."
      />

      <Card>
        <CardHeader>
          <CardTitle>¿Desactivar a {paciente.nombre_completo}?</CardTitle>
          <CardDescription>
            DNI {paciente.dni}. Dejará de aparecer entre los pacientes activos, pero su historia se conservará.
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex-wrap gap-2">
          <form action={desactivarPacienteAction.bind(null, pacienteId)}>
            <Button type="submit" variant="destructive">
              Sí, desactivar
            </Button>
          </form>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/pacientes/${pacienteId}`}>Cancelar</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  )
}
