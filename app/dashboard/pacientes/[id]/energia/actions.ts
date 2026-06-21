"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  ENERGIA_CALCULO_VERSION,
  calcularEvaluacionEnergetica,
  edadEnFecha,
  esActividadEnergetica,
  esFormulaEnergetica,
  esObjetivoEnergetico,
  parseNumeroDecimal,
  type EvaluacionEnergeticaActionState,
} from "@/lib/energia"
import { crearEvaluacionEnergetica } from "@/lib/evaluaciones-energeticas"
import { getDB } from "@/lib/db"

export async function guardarEvaluacionEnergeticaAction(
  pacienteId: number,
  _previousState: EvaluacionEnergeticaActionState,
  formData: FormData
): Promise<EvaluacionEnergeticaActionState> {
  const db = await getDB()
  const paciente = await db.get(
    `select id, fecha_nacimiento, sexo from pacientes where id = ? and activo = 1`,
    [pacienteId]
  )
  if (!paciente) return { error: "No se encontró el paciente activo." }

  const fecha = String(formData.get("fecha") ?? "").trim()
  const pesoKg = parseNumeroDecimal(String(formData.get("peso") ?? ""))
  const tallaCm = parseNumeroDecimal(String(formData.get("talla") ?? ""))
  const actividadRaw = String(formData.get("actividad") ?? "")
  const formulaRaw = String(formData.get("formula") ?? "")
  const objetivoRaw = String(formData.get("objetivo") ?? "")
  const ajusteKcal = parseNumeroDecimal(String(formData.get("ajuste") ?? ""))
  const observaciones = String(formData.get("observaciones") ?? "").trim()
  const fieldErrors: NonNullable<EvaluacionEnergeticaActionState["fieldErrors"]> = {}
  const hoy = new Date().toISOString().slice(0, 10)
  const edad = edadEnFecha(paciente.fecha_nacimiento, fecha)
  const sexo = String(paciente.sexo ?? "").trim().toUpperCase()

  if (!fecha || fecha > hoy || edad === null) {
    fieldErrors.fecha = "Elegí una fecha válida, no posterior a hoy."
  }
  if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
    fieldErrors.peso = "Ingresá un peso mayor que cero."
  }
  if (!Number.isFinite(tallaCm) || tallaCm <= 0) {
    fieldErrors.talla = "Ingresá una talla mayor que cero."
  }
  if (!esActividadEnergetica(actividadRaw)) {
    fieldErrors.actividad = "Elegí un nivel de actividad válido."
  }
  if (!esFormulaEnergetica(formulaRaw)) {
    fieldErrors.formula = "Elegí una fórmula válida."
  }
  if (!esObjetivoEnergetico(objetivoRaw)) {
    fieldErrors.objetivo = "Elegí un objetivo válido."
  }
  if (!Number.isFinite(ajusteKcal)) {
    fieldErrors.ajuste = "Ingresá un ajuste calórico válido."
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  if (sexo !== "M" && sexo !== "F") {
    return {
      error: "Completá el sexo en la ficha del paciente antes de guardar la evaluación.",
    }
  }

  // Los guards anteriores estrechan estos valores; la verificación mantiene al
  // servidor como fuente de verdad aunque el formulario sea manipulado.
  if (
    edad === null ||
    !esActividadEnergetica(actividadRaw) ||
    !esFormulaEnergetica(formulaRaw) ||
    !esObjetivoEnergetico(objetivoRaw)
  ) {
    return { error: "No se pudieron validar los datos de la evaluación." }
  }

  const medicionIdRaw = Number(formData.get("medicion_id"))
  const medicion = Number.isFinite(medicionIdRaw) && medicionIdRaw > 0
    ? await db.get(
        `select id, fecha, peso_kg, altura_cm,
                (select altura_cm from mediciones
                 where paciente_id = ? and altura_cm is not null
                 order by date(fecha) desc, id desc limit 1) as altura_ref
         from mediciones where id = ? and paciente_id = ?`,
        [pacienteId, medicionIdRaw, pacienteId]
      )
    : null

  const pesoOrigen = medicion?.peso_kg == null ? null : Number(medicion.peso_kg)
  const tallaOrigenRaw = medicion?.altura_cm ?? medicion?.altura_ref
  const tallaOrigen = tallaOrigenRaw == null ? null : Number(tallaOrigenRaw)
  const coincideConMedicion =
    pesoOrigen !== null &&
    tallaOrigen !== null &&
    Math.abs(pesoOrigen - pesoKg) < 0.01 &&
    Math.abs(tallaOrigen - tallaCm) < 0.01

  const resultado = calcularEvaluacionEnergetica({
    sexo,
    edad,
    pesoKg,
    tallaCm,
    actividad: actividadRaw,
    formula: formulaRaw,
    objetivoTipo: objetivoRaw,
    ajusteKcal,
  })

  await crearEvaluacionEnergetica({
    pacienteId,
    medicionId: medicion ? Number(medicion.id) : null,
    fecha,
    fechaMedicionOrigen: medicion?.fecha ? String(medicion.fecha) : null,
    origen: coincideConMedicion ? "medicion" : "manual",
    edad,
    sexo,
    pesoKg,
    tallaCm,
    resultado,
    observaciones,
    versionCalculo: ENERGIA_CALCULO_VERSION,
  })

  revalidatePath(`/dashboard/pacientes/${pacienteId}`)
  revalidatePath(`/dashboard/pacientes/${pacienteId}/energia`)
  revalidatePath(`/dashboard/pacientes/${pacienteId}/planes/nuevo`)
  redirect(`/dashboard/pacientes/${pacienteId}/energia?guardada=1`)
}
