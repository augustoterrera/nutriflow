import * as React from "react"

import { DatePickerSimple } from "@/components/pacientes/Date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectNative } from "@/components/ui/select-native"
import type { PacienteField } from "@/lib/pacientes"

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
  invalidFields,
  errorId,
  children,
}: {
  defaultValues?: PacienteDefaults
  invalidFields?: Partial<Record<PacienteField, boolean>>
  errorId?: string
  children?: React.ReactNode
}) {
  const d = defaultValues ?? {}
  const invalid = (field: PacienteField) => Boolean(invalidFields?.[field])
  const describedBy = (field: PacienteField) =>
    invalid(field) && errorId ? errorId : undefined

  return (
    <FieldGroup className="grid gap-6 sm:grid-cols-2">
      <Field data-invalid={invalid("dni") || undefined}>
        <FieldLabel htmlFor="dni">DNI</FieldLabel>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          placeholder="Ej: 35123456"
          defaultValue={d.dni ?? ""}
          aria-invalid={invalid("dni") || undefined}
          aria-describedby={describedBy("dni")}
          required
        />
      </Field>

      <Field data-invalid={invalid("nombre_completo") || undefined}>
        <FieldLabel htmlFor="nombre_completo">Nombre completo</FieldLabel>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          placeholder="Ej: Juan Pérez"
          defaultValue={d.nombre_completo ?? ""}
          aria-invalid={invalid("nombre_completo") || undefined}
          aria-describedby={describedBy("nombre_completo")}
          required
        />
      </Field>

      <Field data-invalid={invalid("telefono") || undefined}>
        <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
        <Input
          id="telefono"
          name="telefono"
          placeholder="Ej: 3815551234"
          defaultValue={d.telefono ?? ""}
          aria-invalid={invalid("telefono") || undefined}
          aria-describedby={describedBy("telefono")}
        />
      </Field>

      <Field data-invalid={invalid("sexo") || undefined}>
        <FieldLabel htmlFor="sexo">Sexo</FieldLabel>
        <SelectNative
          id="sexo"
          name="sexo"
          defaultValue={(d.sexo ?? "").toUpperCase()}
          aria-invalid={invalid("sexo") || undefined}
          aria-describedby={describedBy("sexo")}
        >
          <option value="">Sin especificar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </SelectNative>
      </Field>

      <Field data-invalid={invalid("fecha_nacimiento") || undefined}>
        <FieldLabel htmlFor="fecha_nacimiento">Fecha de nacimiento</FieldLabel>
        <DatePickerSimple
          name="fecha_nacimiento"
          defaultValue={d.fecha_nacimiento ?? ""}
          ariaInvalid={invalid("fecha_nacimiento")}
          ariaDescribedBy={describedBy("fecha_nacimiento")}
        />
      </Field>

      <Field data-invalid={invalid("email") || undefined}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ej: nombre@correo.com"
          defaultValue={d.email ?? ""}
          aria-invalid={invalid("email") || undefined}
          aria-describedby={describedBy("email")}
        />
      </Field>

      <Field data-invalid={invalid("direccion") || undefined}>
        <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ej: Av. Siempre Viva 123"
          defaultValue={d.direccion ?? ""}
          aria-invalid={invalid("direccion") || undefined}
          aria-describedby={describedBy("direccion")}
        />
      </Field>

      <Field data-invalid={invalid("ocupacion") || undefined}>
        <FieldLabel htmlFor="ocupacion">Ocupación</FieldLabel>
        <Input
          id="ocupacion"
          name="ocupacion"
          placeholder="Ej: Profesor"
          defaultValue={d.ocupacion ?? ""}
          aria-invalid={invalid("ocupacion") || undefined}
          aria-describedby={describedBy("ocupacion")}
        />
      </Field>

      <Field data-invalid={invalid("estado_civil") || undefined}>
        <FieldLabel htmlFor="estado_civil">Estado civil</FieldLabel>
        <Input
          id="estado_civil"
          name="estado_civil"
          placeholder="Ej: Soltero"
          defaultValue={d.estado_civil ?? ""}
          aria-invalid={invalid("estado_civil") || undefined}
          aria-describedby={describedBy("estado_civil")}
        />
      </Field>

      <Field
        className="sm:col-span-2"
        data-invalid={invalid("notas") || undefined}
      >
        <FieldLabel htmlFor="notas">Notas</FieldLabel>
        <Textarea
          id="notas"
          name="notas"
          rows={4}
          defaultValue={d.notas ?? ""}
          aria-invalid={invalid("notas") || undefined}
          aria-describedby={describedBy("notas")}
        />
      </Field>

      {children ? <div className="sm:col-span-2">{children}</div> : null}
    </FieldGroup>
  )
}

export { PacienteForm }
