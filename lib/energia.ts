import { calcularGET, kcalObjetivo, tmbHarris, tmbMifflin } from "./calculos"

export const ENERGIA_CALCULO_VERSION = "1"

export const ACTIVIDADES_ENERGETICAS = [
  { value: "sedentario", factor: 1.2, label: "Sedentario (poco o nada de ejercicio)" },
  { value: "ligera", factor: 1.375, label: "Actividad ligera (1-3 días/semana)" },
  { value: "moderada", factor: 1.55, label: "Actividad moderada (3-5 días/semana)" },
  { value: "muy_activo", factor: 1.725, label: "Muy activo (6-7 días/semana)" },
  { value: "extra_activo", factor: 1.9, label: "Extra activo (trabajo físico + entrenamiento)" },
] as const

export type ActividadEnergetica = (typeof ACTIVIDADES_ENERGETICAS)[number]["value"]
export type FormulaEnergetica = "mifflin" | "harris"
export type ObjetivoEnergetico = "bajar" | "mantener" | "subir"

export const FORMULA_ENERGETICA_LABELS: Record<FormulaEnergetica, string> = {
  mifflin: "Mifflin-St Jeor",
  harris: "Harris-Benedict",
}

export const OBJETIVO_ENERGETICO_LABELS: Record<ObjetivoEnergetico, string> = {
  bajar: "Reducir peso",
  mantener: "Mantener peso",
  subir: "Aumentar peso",
}

export type EvaluacionEnergeticaInput = {
  sexo: "M" | "F"
  edad: number
  pesoKg: number
  tallaCm: number
  actividad: ActividadEnergetica
  formula: FormulaEnergetica
  objetivoTipo: ObjetivoEnergetico
  ajusteKcal?: number
}

export type ResultadoEnergetico = {
  mifflin: number
  harris: number
  tmbSeleccionada: number
  get: number
  objetivoKcal: number
  actividad: ActividadEnergetica
  factorActividad: number
  formula: FormulaEnergetica
  objetivoTipo: ObjetivoEnergetico
  ajusteKcal: number
}

export type EvaluacionEnergeticaActionState = {
  error?: string
  fieldErrors?: Partial<
    Record<"fecha" | "peso" | "talla" | "actividad" | "formula" | "objetivo" | "ajuste", string>
  >
}

export function esActividadEnergetica(value: string): value is ActividadEnergetica {
  return ACTIVIDADES_ENERGETICAS.some((item) => item.value === value)
}

export function esFormulaEnergetica(value: string): value is FormulaEnergetica {
  return value === "mifflin" || value === "harris"
}

export function esObjetivoEnergetico(value: string): value is ObjetivoEnergetico {
  return value === "bajar" || value === "mantener" || value === "subir"
}

export function ajusteSugerido(objetivo: ObjetivoEnergetico) {
  // Conserva el criterio simple existente: déficit o superávit de 400 kcal.
  return kcalObjetivo(0, objetivo)
}

export function calcularEvaluacionEnergetica(
  input: EvaluacionEnergeticaInput
): ResultadoEnergetico {
  const actividad = ACTIVIDADES_ENERGETICAS.find((item) => item.value === input.actividad)
  if (!actividad) throw new Error("Nivel de actividad inválido.")

  const mifflin = tmbMifflin(input.sexo, input.edad, input.pesoKg, input.tallaCm)
  const harris = tmbHarris(input.sexo, input.edad, input.pesoKg, input.tallaCm)
  const tmbSeleccionada = input.formula === "mifflin" ? mifflin : harris
  const get = calcularGET(tmbSeleccionada, actividad.factor)
  const ajusteKcal = Number.isFinite(input.ajusteKcal)
    ? Math.round(Number(input.ajusteKcal))
    : ajusteSugerido(input.objetivoTipo)

  return {
    mifflin,
    harris,
    tmbSeleccionada,
    get,
    objetivoKcal: get + ajusteKcal,
    actividad: input.actividad,
    factorActividad: actividad.factor,
    formula: input.formula,
    objetivoTipo: input.objetivoTipo,
    ajusteKcal,
  }
}

export function edadEnFecha(
  fechaNacimiento: string | null | undefined,
  fechaEvaluacion: string | null | undefined
) {
  const nacimiento = parseFechaISO(fechaNacimiento)
  const evaluacion = parseFechaISO(fechaEvaluacion)
  if (!nacimiento || !evaluacion || evaluacion < nacimiento) return null

  let edad = evaluacion.year - nacimiento.year
  if (
    evaluacion.month < nacimiento.month ||
    (evaluacion.month === nacimiento.month && evaluacion.day < nacimiento.day)
  ) {
    edad -= 1
  }
  return edad >= 0 ? edad : null
}

export function parseNumeroDecimal(value: string) {
  const normalized = String(value ?? "").trim().replace(",", ".")
  return normalized ? Number(normalized) : Number.NaN
}

function parseFechaISO(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").slice(0, 10))
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}
