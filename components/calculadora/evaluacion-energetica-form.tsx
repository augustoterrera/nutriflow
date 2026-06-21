"use client"

import * as React from "react"
import { Calculator, Save } from "lucide-react"

import { ResultadosEnergeticos } from "@/components/calculadora/resultados-energeticos"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SelectNative } from "@/components/ui/select-native"
import { Textarea } from "@/components/ui/textarea"
import {
  ACTIVIDADES_ENERGETICAS,
  ajusteSugerido,
  calcularEvaluacionEnergetica,
  edadEnFecha,
  parseNumeroDecimal,
  type ActividadEnergetica,
  type EvaluacionEnergeticaActionState,
  type FormulaEnergetica,
  type ObjetivoEnergetico,
  type ResultadoEnergetico,
} from "@/lib/energia"

type Values = {
  fecha: string
  peso: string
  talla: string
  actividad: ActividadEnergetica
  formula: FormulaEnergetica
  objetivo: ObjetivoEnergetico
  ajuste: string
  observaciones: string
}

type LocalErrors = Partial<Record<"fecha" | "peso" | "talla" | "ajuste", string>>

function EvaluacionEnergeticaForm({
  fechaNacimiento,
  sexo,
  medicionId,
  medicionFecha,
  defaultFecha,
  defaultPeso,
  defaultTalla,
  action,
}: {
  fechaNacimiento: string | null
  sexo: string | null
  medicionId: number | null
  medicionFecha: string | null
  defaultFecha: string
  defaultPeso: string
  defaultTalla: string
  action: (
    state: EvaluacionEnergeticaActionState,
    formData: FormData
  ) => Promise<EvaluacionEnergeticaActionState>
}) {
  const [actionState, formAction, pending] = React.useActionState(action, {})
  const [values, setValues] = React.useState<Values>({
    fecha: defaultFecha,
    peso: defaultPeso,
    talla: defaultTalla,
    actividad: "moderada",
    formula: "mifflin",
    objetivo: "mantener",
    ajuste: "0",
    observaciones: "",
  })
  const [localErrors, setLocalErrors] = React.useState<LocalErrors>({})
  const [resultado, setResultado] = React.useState<ResultadoEnergetico | null>(null)
  const sexoFormula = String(sexo ?? "").trim().toUpperCase()
  const edad = edadEnFecha(fechaNacimiento, values.fecha)
  const puedeUsarFicha = (sexoFormula === "M" || sexoFormula === "F") && edad !== null

  function actualizar<K extends keyof Values>(campo: K, value: Values[K]) {
    setValues((current) => ({ ...current, [campo]: value }))
    setResultado(null)
    if (campo === "fecha" || campo === "peso" || campo === "talla" || campo === "ajuste") {
      setLocalErrors((current) => ({ ...current, [campo]: undefined }))
    }
  }

  function actualizarObjetivo(objetivo: ObjetivoEnergetico) {
    setValues((current) => ({
      ...current,
      objetivo,
      ajuste: String(ajusteSugerido(objetivo)),
    }))
    setResultado(null)
  }

  function calcularPreview() {
    const pesoKg = parseNumeroDecimal(values.peso)
    const tallaCm = parseNumeroDecimal(values.talla)
    const ajusteKcal = parseNumeroDecimal(values.ajuste)
    const errors: LocalErrors = {}

    if (edad === null || values.fecha > defaultFecha) {
      errors.fecha = "Elegí una fecha válida, no posterior a hoy."
    }
    if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
      errors.peso = "Ingresá un peso mayor que cero."
    }
    if (!Number.isFinite(tallaCm) || tallaCm <= 0) {
      errors.talla = "Ingresá una talla mayor que cero."
    }
    if (!Number.isFinite(ajusteKcal)) {
      errors.ajuste = "Ingresá un ajuste calórico válido."
    }

    setLocalErrors(errors)
    if (Object.keys(errors).length > 0 || !puedeUsarFicha) {
      setResultado(null)
      return
    }

    setResultado(
      calcularEvaluacionEnergetica({
        sexo: sexoFormula === "F" ? "F" : "M",
        edad,
        pesoKg,
        tallaCm,
        actividad: values.actividad,
        formula: values.formula,
        objetivoTipo: values.objetivo,
        ajusteKcal,
      })
    )
  }

  const fieldErrors = actionState.fieldErrors ?? {}

  return (
    <form action={formAction}>
      <Input type="hidden" name="medicion_id" value={medicionId ?? ""} />

      {actionState.error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{actionState.error}</AlertDescription>
        </Alert>
      ) : null}

      {!puedeUsarFicha ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Faltan datos de la ficha</AlertTitle>
          <AlertDescription>
            Completá una fecha de nacimiento válida y el sexo del paciente antes de calcular.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nueva evaluación</CardTitle>
            <CardDescription>
              Revisá los datos precargados. Si modificás peso o talla, quedarán registrados como carga manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(localErrors.fecha || fieldErrors.fecha)}>
                <FieldLabel htmlFor="energia-fecha">Fecha de evaluación</FieldLabel>
                <Input
                  id="energia-fecha"
                  name="fecha"
                  type="date"
                  max={defaultFecha}
                  value={values.fecha}
                  aria-invalid={Boolean(localErrors.fecha || fieldErrors.fecha)}
                  onChange={(event) => actualizar("fecha", event.target.value)}
                />
                <FieldError>{localErrors.fecha || fieldErrors.fecha}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="energia-edad">Edad utilizada</FieldLabel>
                <Input
                  id="energia-edad"
                  value={edad === null ? "Sin datos" : `${edad} años`}
                  readOnly
                />
                <FieldDescription>Calculada para la fecha de evaluación.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="energia-sexo">Sexo utilizado</FieldLabel>
                <Input
                  id="energia-sexo"
                  value={sexoFormula === "F" ? "Femenino" : sexoFormula === "M" ? "Masculino" : "Sin datos"}
                  readOnly
                />
              </Field>

              <Field data-invalid={Boolean(localErrors.peso || fieldErrors.peso)}>
                <FieldLabel htmlFor="energia-peso">Peso (kg)</FieldLabel>
                <Input
                  id="energia-peso"
                  name="peso"
                  inputMode="decimal"
                  value={values.peso}
                  placeholder="Ej: 70,5"
                  aria-invalid={Boolean(localErrors.peso || fieldErrors.peso)}
                  onChange={(event) => actualizar("peso", event.target.value)}
                />
                <FieldError>{localErrors.peso || fieldErrors.peso}</FieldError>
              </Field>

              <Field data-invalid={Boolean(localErrors.talla || fieldErrors.talla)}>
                <FieldLabel htmlFor="energia-talla">Talla (cm)</FieldLabel>
                <Input
                  id="energia-talla"
                  name="talla"
                  inputMode="decimal"
                  value={values.talla}
                  placeholder="Ej: 165"
                  aria-invalid={Boolean(localErrors.talla || fieldErrors.talla)}
                  onChange={(event) => actualizar("talla", event.target.value)}
                />
                <FieldError>{localErrors.talla || fieldErrors.talla}</FieldError>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="energia-actividad">Nivel de actividad</FieldLabel>
                <SelectNative
                  id="energia-actividad"
                  name="actividad"
                  value={values.actividad}
                  aria-invalid={Boolean(fieldErrors.actividad)}
                  onChange={(event) =>
                    actualizar("actividad", event.target.value as ActividadEnergetica)
                  }
                >
                  {ACTIVIDADES_ENERGETICAS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectNative>
                <FieldError>{fieldErrors.actividad}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="energia-formula">Fórmula para el GET</FieldLabel>
                <SelectNative
                  id="energia-formula"
                  name="formula"
                  value={values.formula}
                  aria-invalid={Boolean(fieldErrors.formula)}
                  onChange={(event) =>
                    actualizar("formula", event.target.value as FormulaEnergetica)
                  }
                >
                  <option value="mifflin">Mifflin-St Jeor</option>
                  <option value="harris">Harris-Benedict</option>
                </SelectNative>
                <FieldError>{fieldErrors.formula}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="energia-objetivo">Objetivo</FieldLabel>
                <SelectNative
                  id="energia-objetivo"
                  name="objetivo"
                  value={values.objetivo}
                  aria-invalid={Boolean(fieldErrors.objetivo)}
                  onChange={(event) =>
                    actualizarObjetivo(event.target.value as ObjetivoEnergetico)
                  }
                >
                  <option value="bajar">Reducir peso</option>
                  <option value="mantener">Mantener peso</option>
                  <option value="subir">Aumentar peso</option>
                </SelectNative>
                <FieldError>{fieldErrors.objetivo}</FieldError>
              </Field>

              <Field data-invalid={Boolean(localErrors.ajuste || fieldErrors.ajuste)}>
                <FieldLabel htmlFor="energia-ajuste">Ajuste profesional (kcal)</FieldLabel>
                <Input
                  id="energia-ajuste"
                  name="ajuste"
                  inputMode="numeric"
                  value={values.ajuste}
                  aria-invalid={Boolean(localErrors.ajuste || fieldErrors.ajuste)}
                  onChange={(event) => actualizar("ajuste", event.target.value)}
                />
                <FieldDescription>Negativo para déficit; positivo para superávit.</FieldDescription>
                <FieldError>{localErrors.ajuste || fieldErrors.ajuste}</FieldError>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="energia-observaciones">Observaciones</FieldLabel>
                <Textarea
                  id="energia-observaciones"
                  name="observaciones"
                  rows={3}
                  value={values.observaciones}
                  placeholder="Criterio utilizado, contexto clínico o motivo del ajuste..."
                  onChange={(event) => actualizar("observaciones", event.target.value)}
                />
              </Field>

              {medicionFecha ? (
                <p className="text-muted-foreground text-sm sm:col-span-2">
                  Datos precargados desde la medición del {formatFecha(medicionFecha)}.
                </p>
              ) : null}

              <div className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={calcularPreview} disabled={!puedeUsarFicha}>
                  <Calculator aria-hidden="true" />
                  Calcular estimación
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <section aria-labelledby="preview-energia-title" className="space-y-4">
          <div className="space-y-1">
            <h2 id="preview-energia-title" className="text-lg font-semibold">
              Vista previa
            </h2>
            <p className="text-muted-foreground text-sm">
              Revisá el resultado antes de incorporarlo al historial del paciente.
            </p>
          </div>

          <div aria-live="polite">
            {resultado ? (
              <div className="space-y-4">
                <ResultadosEnergeticos resultado={resultado} />
                <Button type="submit" disabled={pending} className="w-full">
                  <Save aria-hidden="true" />
                  {pending ? "Guardando..." : "Guardar evaluación"}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  El registro guardado será inmutable; una corrección se documenta con una nueva evaluación.
                </p>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                  <Calculator className="text-muted-foreground mb-4 size-10" aria-hidden="true" />
                  <p className="font-medium">Calculá para revisar el resultado</p>
                  <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    Nada se guardará hasta que confirmes la evaluación desde esta columna.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </form>
  )
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10))
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

export { EvaluacionEnergeticaForm }
