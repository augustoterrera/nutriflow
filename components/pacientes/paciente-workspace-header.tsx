import type { ReactNode } from "react"

import { PacienteNav } from "@/components/pacientes/paciente-nav"
import { edadDesdeFechaNacimiento } from "@/lib/calculos"

type PacienteWorkspaceData = {
  id: number
  dni: string
  nombre_completo: string
  fecha_nacimiento?: string | null
  sexo?: string | null
  ocupacion?: string | null
}

function PacienteWorkspaceHeader({
  paciente,
  actions,
  badge,
}: {
  paciente: PacienteWorkspaceData
  actions?: ReactNode
  badge?: ReactNode
}) {
  const edad = edadDesdeFechaNacimiento(paciente.fecha_nacimiento)
  const sexo = String(paciente.sexo ?? "").trim().toUpperCase()

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="bg-muted text-foreground flex size-14 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold">
            {iniciales(paciente.nombre_completo)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {paciente.nombre_completo}
              </h1>
              {badge}
            </div>
            <p className="text-muted-foreground text-sm">
              DNI <span className="text-foreground font-medium">{paciente.dni}</span>
              {edad !== null ? ` · ${edad} años` : ""}
              {sexo === "F" ? " · Femenino" : sexo === "M" ? " · Masculino" : ""}
              {paciente.ocupacion ? ` · ${paciente.ocupacion}` : ""}
            </p>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <PacienteNav pacienteId={paciente.id} className="mt-6 mb-6" />
    </>
  )
}

function iniciales(nombre: string) {
  const partes = String(nombre ?? "").trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export { PacienteWorkspaceHeader }
export type { PacienteWorkspaceData }
