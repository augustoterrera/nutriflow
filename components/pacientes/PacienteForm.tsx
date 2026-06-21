import * as React from "react"

import { DatePickerSimple } from "@/components/pacientes/Date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectNative } from "@/components/ui/select-native"

export type PacienteDefaults = {
  dni?: string | null
  nombre_completo?: string | null
  telefono?: string | null
  sexo?: string | null
  fecha_nacimiento?: string | null
  email?: string | null
  direccion?: string | null
  ocupacion?: string | null
  estado_civil?: string | null
  notas?: string | null
}

/**
 * Campos compartidos del paciente (alta y edición). El <form> y la lógica de
 * envío los pone la página: el alta usa un Server Action y la edición un onSubmit
 * client. `children` se renderiza como una fila a todo el ancho (errores + submit).
 */
function PacienteForm({
  defaultValues,
  children,
}: {
  defaultValues?: PacienteDefaults
  children?: React.ReactNode
}) {
  const d = defaultValues ?? {}

  return (
    <FieldGroup className="grid gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="dni">DNI</FieldLabel>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          placeholder="Ej: 35123456"
          defaultValue={d.dni ?? ""}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="nombre_completo">Nombre completo</FieldLabel>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          placeholder="Ej: Juan Pérez"
          defaultValue={d.nombre_completo ?? ""}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
        <Input
          id="telefono"
          name="telefono"
          placeholder="Ej: 3815551234"
          defaultValue={d.telefono ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="sexo">Sexo</FieldLabel>
        <SelectNative
          id="sexo"
          name="sexo"
          defaultValue={(d.sexo ?? "").toUpperCase()}
        >
          <option value="">Sin especificar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </SelectNative>
      </Field>

      <Field>
        <FieldLabel htmlFor="fecha_nacimiento">Fecha de nacimiento</FieldLabel>
        <DatePickerSimple
          name="fecha_nacimiento"
          defaultValue={d.fecha_nacimiento ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ej: nombre@correo.com"
          defaultValue={d.email ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ej: Av. Siempre Viva 123"
          defaultValue={d.direccion ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="ocupacion">Ocupación</FieldLabel>
        <Input
          id="ocupacion"
          name="ocupacion"
          placeholder="Ej: Profesor"
          defaultValue={d.ocupacion ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="estado_civil">Estado civil</FieldLabel>
        <Input
          id="estado_civil"
          name="estado_civil"
          placeholder="Ej: Soltero"
          defaultValue={d.estado_civil ?? ""}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="notas">Notas</FieldLabel>
        <Textarea
          id="notas"
          name="notas"
          rows={4}
          defaultValue={d.notas ?? ""}
        />
      </Field>

      {children ? <div className="sm:col-span-2">{children}</div> : null}
    </FieldGroup>
  )
}

export { PacienteForm }
