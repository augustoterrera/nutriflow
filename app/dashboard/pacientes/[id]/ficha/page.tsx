import { notFound } from "next/navigation"

import {
  FichaPacienteEditor,
  type PacienteFicha,
} from "@/components/pacientes/ficha-paciente-editor"
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header"
import { PageShell } from "@/components/shared/page-shell"
import { getDB } from "@/lib/db"

export default async function FichaPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = await params
  const pacienteId = Number(idStr)
  if (!Number.isFinite(pacienteId)) notFound()

  const db = await getDB()
  const paciente = await db.get(
    `select id, dni, nombre_completo, telefono, sexo, fecha_nacimiento,
            email, direccion, estado_civil, ocupacion, notas
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  )
  if (!paciente) notFound()

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />
      <FichaPacienteEditor paciente={paciente as PacienteFicha} />
    </PageShell>
  )
}
