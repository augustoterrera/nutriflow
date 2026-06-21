"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X } from "lucide-react"

import { guardarFichaPacienteAction } from "@/app/dashboard/pacientes/[id]/editar/actions"
import {
  PacienteForm,
  type PacienteDefaults,
} from "@/components/pacientes/PacienteForm"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"

type PacienteFicha = PacienteDefaults & {
  id: number
  dni: string
  nombre_completo: string
}

function FichaPacienteEditor({ paciente }: { paciente: PacienteFicha }) {
  const router = useRouter()
  const [datos, setDatos] = useState(paciente)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDatos(paciente)
  }, [paciente])

  function empezarEdicion() {
    setError(null)
    setSaved(false)
    setEditing(true)
  }

  function cancelarEdicion() {
    setError(null)
    setEditing(false)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    const formData = new FormData(event.currentTarget)
    const dni = String(formData.get("dni") ?? "").trim()
    const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim()

    if (!dni) {
      setError("El DNI es obligatorio.")
      return
    }
    if (!nombreCompleto) {
      setError("El nombre es obligatorio.")
      return
    }

    const input = {
      paciente_id: datos.id,
      dni,
      nombre_completo: nombreCompleto,
      sexo: optionalValue(formData, "sexo"),
      fecha_nacimiento: optionalValue(formData, "fecha_nacimiento"),
      telefono: optionalValue(formData, "telefono"),
      email: optionalValue(formData, "email"),
      direccion: optionalValue(formData, "direccion"),
      estado_civil: optionalValue(formData, "estado_civil"),
      ocupacion: optionalValue(formData, "ocupacion"),
      notas: optionalValue(formData, "notas"),
    }

    setSaving(true)
    try {
      await guardarFichaPacienteAction(input)
      setDatos((actual) => ({
        ...actual,
        ...input,
        id: actual.id,
      }))
      setEditing(false)
      setSaved(true)
      router.refresh()
    } catch (cause: unknown) {
      console.error(cause)
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la ficha.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha del paciente</CardTitle>
        <CardDescription>
          {editing
            ? "Modificá los campos necesarios y guardá los cambios."
            : "Información personal, contacto y notas administrativas."}
        </CardDescription>
        {!editing ? (
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={empezarEdicion}
              title="Editar ficha"
              aria-label="Editar ficha del paciente"
            >
              <Pencil />
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        {editing ? (
          <form onSubmit={onSubmit}>
            <PacienteForm defaultValues={datos}>
              <div className="space-y-3">
                {error ? <FieldError>{error}</FieldError> : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    <Save />
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelarEdicion}
                    disabled={saving}
                  >
                    <X />
                    Cancelar
                  </Button>
                </div>
              </div>
            </PacienteForm>
          </form>
        ) : (
          <div className="space-y-6">
            {saved ? (
              <p className="text-success text-sm" role="status">
                Ficha actualizada.
              </p>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              <FichaSection title="Identificación">
                <FichaDato label="DNI" value={datos.dni} />
                <FichaDato label="Nacimiento" value={formatFecha(datos.fecha_nacimiento)} />
                <FichaDato label="Sexo" value={sexoLargo(datos.sexo)} />
                <FichaDato label="Estado civil" value={datos.estado_civil} />
                <FichaDato label="Ocupación" value={datos.ocupacion} />
              </FichaSection>

              <FichaSection title="Contacto">
                <FichaDato label="Teléfono" value={datos.telefono} />
                <FichaDato label="Email" value={datos.email} />
                <FichaDato label="Dirección" value={datos.direccion} />
              </FichaSection>
            </div>

            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold">Notas</h3>
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {displayValue(datos.notas)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FichaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="font-semibold">{title}</h3>
      <dl className="mt-4 grid gap-3">{children}</dl>
    </section>
  )
}

function FichaDato({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{displayValue(value)}</dd>
    </div>
  )
}

function optionalValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || null
}

function displayValue(value: unknown) {
  return value === null || value === undefined || value === "" ? "—" : String(value)
}

function sexoLargo(value: unknown) {
  const sexo = String(value ?? "").trim().toUpperCase()
  if (sexo === "F") return "Femenino"
  if (sexo === "M") return "Masculino"
  return displayValue(value)
}

function formatFecha(value: unknown) {
  if (!value) return "—"

  const iso = String(value).slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return String(value)

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replaceAll(".", "")
}

export { FichaPacienteEditor }
export type { PacienteFicha }
