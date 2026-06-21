import * as React from "react"

import { DatePickerSimple } from "@/components/pacientes/Date-picker"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type MedicionDefaults = {
  fecha?: string | null
  peso_kg?: number | string | null
  altura_cm?: number | string | null
  cintura_cm?: number | string | null
  cadera_cm?: number | string | null
  cuello_cm?: number | string | null
  grasa_pct?: number | string | null
  musculo_pct?: number | string | null
  brazo_cm?: number | string | null
  muneca_cm?: number | string | null
  observaciones?: string | null
}

function val(v: number | string | null | undefined) {
  return v === null || v === undefined ? "" : String(v)
}

/**
 * Campos compartidos de una medición (alta y edición). El <form>, los inputs
 * ocultos y la lógica de envío los pone la página. `children` se renderiza como
 * una fila a todo el ancho (acciones).
 */
function MedicionForm({
  defaultValues,
  children,
}: {
  defaultValues?: MedicionDefaults
  children?: React.ReactNode
}) {
  const d = defaultValues ?? {}

  return (
    <FieldGroup className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
        <DatePickerSimple name="fecha" defaultValue={val(d.fecha)} />
      </Field>

      <NumField id="peso_kg" label="Peso (kg)" placeholder="Ej: 82.5" value={d.peso_kg} />
      <NumField id="altura_cm" label="Altura (cm)" placeholder="Ej: 175" value={d.altura_cm} />
      <NumField id="cintura_cm" label="Cintura (cm)" placeholder="Ej: 92" value={d.cintura_cm} />
      <NumField id="cadera_cm" label="Cadera (cm)" placeholder="Ej: 102" value={d.cadera_cm} />
      <NumField id="cuello_cm" label="Cuello (cm)" placeholder="Ej: 38" value={d.cuello_cm} />
      <NumField id="grasa_pct" label="Grasa (%)" placeholder="Ej: 22" value={d.grasa_pct} />
      <NumField id="musculo_pct" label="Músculo (%)" placeholder="Ej: 38" value={d.musculo_pct} />
      <NumField id="brazo_cm" label="Brazo (cm)" placeholder="Ej: 32" value={d.brazo_cm} />
      <NumField id="muneca_cm" label="Muñeca (cm)" placeholder="Ej: 16" value={d.muneca_cm} />

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
        <Textarea
          id="observaciones"
          name="observaciones"
          rows={4}
          placeholder="Notas de la medición..."
          defaultValue={d.observaciones ?? ""}
        />
        <FieldDescription>
          El IMC y el WHtR se calculan automáticamente con peso, altura y cintura.
        </FieldDescription>
      </Field>

      {children ? <div className="sm:col-span-2">{children}</div> : null}
    </FieldGroup>
  )
}

function NumField({
  id,
  label,
  placeholder,
  value,
}: {
  id: string
  label: string
  placeholder: string
  value: number | string | null | undefined
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={id}
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue={val(value)}
      />
    </Field>
  )
}

export { MedicionForm }
