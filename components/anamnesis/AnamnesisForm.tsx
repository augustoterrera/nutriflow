import * as React from "react"

import { DatePickerSimple } from "@/components/pacientes/Date-picker"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectNative } from "@/components/ui/select-native"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export type AnamnesisDefaults = {
  fecha?: string | null
  tipo_dieta?: string | null
  consumo_verduras?: string | null
  consumo_frutas?: string | null
  consumo_carnes?: string | null
  consumo_agua?: string | null
  actividad_fisica?: string | null
  consume_suplementos?: number | boolean | null
  suplementos_detalle?: string | null
  frutas_no_gusta?: string | null
  verduras_no_gusta?: string | null
  observaciones?: string | null
}

/**
 * Campos compartidos de la anamnesis (alta y edición). El <form>, los inputs
 * ocultos y la lógica de envío los pone la página. `children` se renderiza como
 * una fila a todo el ancho (acciones).
 */
function AnamnesisForm({
  defaultValues,
  children,
}: {
  defaultValues?: AnamnesisDefaults
  children?: React.ReactNode
}) {
  const d = defaultValues ?? {}

  return (
    <FieldGroup className="grid gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
        <DatePickerSimple name="fecha" defaultValue={d.fecha ?? ""} />
      </Field>

      <Field>
        <FieldLabel htmlFor="tipo_dieta">Tipo de dieta</FieldLabel>
        <SelectNative
          id="tipo_dieta"
          name="tipo_dieta"
          defaultValue={d.tipo_dieta ?? "omnivoro"}
        >
          <option value="omnivoro">Omnívoro</option>
          <option value="vegetariano">Vegetariano</option>
          <option value="vegano">Vegano</option>
        </SelectNative>
      </Field>

      <Field>
        <FieldLabel htmlFor="consumo_verduras">Consumo de verduras</FieldLabel>
        <Input
          id="consumo_verduras"
          name="consumo_verduras"
          placeholder="Ej: 2 porciones/día"
          defaultValue={d.consumo_verduras ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="consumo_frutas">Consumo de frutas</FieldLabel>
        <Input
          id="consumo_frutas"
          name="consumo_frutas"
          placeholder="Ej: 1 fruta/día"
          defaultValue={d.consumo_frutas ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="consumo_carnes">Consumo de carnes</FieldLabel>
        <Input
          id="consumo_carnes"
          name="consumo_carnes"
          placeholder="Ej: 4 veces/sem"
          defaultValue={d.consumo_carnes ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="consumo_agua">Agua</FieldLabel>
        <Input
          id="consumo_agua"
          name="consumo_agua"
          placeholder="Ej: 2 L/día"
          defaultValue={d.consumo_agua ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="actividad_fisica">Actividad física</FieldLabel>
        <Input
          id="actividad_fisica"
          name="actividad_fisica"
          placeholder="Ej: camina 3x/sem"
          defaultValue={d.actividad_fisica ?? ""}
        />
      </Field>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox
          id="consume_suplementos"
          name="consume_suplementos"
          value="1"
          defaultChecked={Boolean(d.consume_suplementos)}
        />
        <Label htmlFor="consume_suplementos">Consume suplementos</Label>
      </div>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="suplementos_detalle">Detalle de suplementos</FieldLabel>
        <Input
          id="suplementos_detalle"
          name="suplementos_detalle"
          placeholder="Ej: creatina, proteína"
          defaultValue={d.suplementos_detalle ?? ""}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="frutas_no_gusta">Frutas que no le gustan</FieldLabel>
        <Input
          id="frutas_no_gusta"
          name="frutas_no_gusta"
          placeholder="Ej: banana, manzana"
          defaultValue={d.frutas_no_gusta ?? ""}
        />
        <FieldDescription>Separá por coma.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="verduras_no_gusta">Verduras que no le gustan</FieldLabel>
        <Input
          id="verduras_no_gusta"
          name="verduras_no_gusta"
          placeholder="Ej: brócoli, espinaca"
          defaultValue={d.verduras_no_gusta ?? ""}
        />
        <FieldDescription>Separá por coma.</FieldDescription>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
        <Textarea
          id="observaciones"
          name="observaciones"
          rows={5}
          defaultValue={d.observaciones ?? ""}
        />
      </Field>

      {children ? <div className="sm:col-span-2">{children}</div> : null}
    </FieldGroup>
  )
}

export { AnamnesisForm }
