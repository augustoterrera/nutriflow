import Link from "next/link"
import { CheckCircle2, Trash2 } from "lucide-react"

import { PapeleraSubmitButton } from "@/components/papelera/papelera-submit-button"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { activarPacienteAction } from "./actions"

export const dynamic = "force-dynamic"

type PacienteDesactivado = {
  id: number
  dni: string
  nombre_completo: string
  telefono: string | null
  actualizado_en: string | null
}

export default async function PapeleraPage({
  searchParams,
}: {
  searchParams?: Promise<{ restaurado?: string; eliminado?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const db = await getDB()
  const pacientes = (await db.all(
    `select id, dni, nombre_completo, telefono, actualizado_en
     from pacientes
     where activo = 0
     order by datetime(actualizado_en) desc, id desc`
  )) as PacienteDesactivado[]

  return (
    <PageShell>
      <PageHeader
        title="Papelera"
        description={`${pacientes.length} ${pacientes.length === 1 ? "paciente desactivado" : "pacientes desactivados"}.`}
      />

      {sp.restaurado === "1" ? (
        <Alert className="mb-6" role="status">
          <CheckCircle2 />
          <AlertTitle>Paciente restaurado</AlertTitle>
          <AlertDescription>
            Volvió a estar disponible en el listado de pacientes activos.
          </AlertDescription>
        </Alert>
      ) : null}

      {sp.eliminado === "1" ? (
        <Alert className="mb-6" role="status">
          <CheckCircle2 />
          <AlertTitle>Paciente eliminado definitivamente</AlertTitle>
          <AlertDescription>
            El paciente y sus registros asociados fueron eliminados.
          </AlertDescription>
        </Alert>
      ) : null}

      {pacientes.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="La papelera está vacía"
          description="Los pacientes que desactives aparecerán acá para que puedas restaurarlos o eliminarlos definitivamente."
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Desactivado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.id}>
                  <TableCell className="font-medium">
                    {paciente.nombre_completo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {paciente.dni}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {paciente.telefono || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFechaHora(paciente.actualizado_en)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={activarPacienteAction.bind(null, paciente.id)}>
                        <PapeleraSubmitButton action="restaurar" />
                      </form>
                      <Button variant="destructive" size="sm" asChild>
                        <Link href={`/dashboard/papelera/${paciente.id}/eliminar`}>
                          <Trash2 />
                          Eliminar
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageShell>
  )
}

function formatFechaHora(value: string | null) {
  if (!value) return "Sin fecha"
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z"
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
