import { getDB } from "@/lib/db"
import type {
  ActividadEnergetica,
  FormulaEnergetica,
  ObjetivoEnergetico,
  ResultadoEnergetico,
} from "@/lib/energia"

export type EvaluacionEnergetica = {
  id: number
  pacienteId: number
  medicionId: number | null
  fecha: string
  fechaMedicionOrigen: string | null
  origen: "medicion" | "manual"
  edad: number
  sexo: "M" | "F"
  pesoKg: number
  tallaCm: number
  actividad: ActividadEnergetica
  factorActividad: number
  formula: FormulaEnergetica
  tmbMifflin: number
  tmbHarris: number
  getKcal: number
  objetivoTipo: ObjetivoEnergetico
  ajusteKcal: number
  objetivoKcal: number
  observaciones: string | null
  versionCalculo: string
  creadoEn: string
}

export type CrearEvaluacionEnergeticaInput = {
  pacienteId: number
  medicionId?: number | null
  fecha: string
  fechaMedicionOrigen?: string | null
  origen: "medicion" | "manual"
  edad: number
  sexo: "M" | "F"
  pesoKg: number
  tallaCm: number
  observaciones?: string | null
  versionCalculo: string
  resultado: ResultadoEnergetico
}

export async function crearEvaluacionEnergetica(input: CrearEvaluacionEnergeticaInput) {
  const db = await getDB()
  const result = await db.run(
    `insert into evaluaciones_energeticas (
       paciente_id, medicion_id, fecha, fecha_medicion_origen, origen,
       edad, sexo, peso_kg, talla_cm, actividad, factor_actividad,
       formula_get, tmb_mifflin, tmb_harris, get_kcal,
       objetivo_tipo, ajuste_kcal, objetivo_kcal, observaciones, version_calculo
     ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.pacienteId,
      input.medicionId ?? null,
      input.fecha,
      input.fechaMedicionOrigen ?? null,
      input.origen,
      input.edad,
      input.sexo,
      input.pesoKg,
      input.tallaCm,
      input.resultado.actividad,
      input.resultado.factorActividad,
      input.resultado.formula,
      input.resultado.mifflin,
      input.resultado.harris,
      input.resultado.get,
      input.resultado.objetivoTipo,
      input.resultado.ajusteKcal,
      input.resultado.objetivoKcal,
      input.observaciones?.trim() || null,
      input.versionCalculo,
    ]
  )
  return Number(result.lastID)
}

export async function listarEvaluacionesEnergeticas(pacienteId: number, limit?: number) {
  const db = await getDB()
  const limitSql = limit && limit > 0 ? "limit ?" : ""
  const rows = await db.all(
    `select * from evaluaciones_energeticas
     where paciente_id = ?
     order by date(fecha) desc, id desc
     ${limitSql}`,
    limitSql ? [pacienteId, limit] : [pacienteId]
  )
  return rows.map(mapEvaluacion)
}

export async function obtenerUltimaEvaluacionEnergetica(pacienteId: number) {
  const db = await getDB()
  const row = await db.get(
    `select * from evaluaciones_energeticas
     where paciente_id = ?
     order by date(fecha) desc, id desc
     limit 1`,
    [pacienteId]
  )
  return row ? mapEvaluacion(row) : null
}

export async function obtenerEvaluacionEnergetica(id: number, pacienteId: number) {
  const db = await getDB()
  const row = await db.get(
    `select * from evaluaciones_energeticas where id = ? and paciente_id = ?`,
    [id, pacienteId]
  )
  return row ? mapEvaluacion(row) : null
}

function mapEvaluacion(row: Record<string, unknown>): EvaluacionEnergetica {
  return {
    id: Number(row.id),
    pacienteId: Number(row.paciente_id),
    medicionId: row.medicion_id == null ? null : Number(row.medicion_id),
    fecha: String(row.fecha),
    fechaMedicionOrigen:
      row.fecha_medicion_origen == null ? null : String(row.fecha_medicion_origen),
    origen: row.origen === "medicion" ? "medicion" : "manual",
    edad: Number(row.edad),
    sexo: row.sexo === "F" ? "F" : "M",
    pesoKg: Number(row.peso_kg),
    tallaCm: Number(row.talla_cm),
    actividad: row.actividad as ActividadEnergetica,
    factorActividad: Number(row.factor_actividad),
    formula: row.formula_get as FormulaEnergetica,
    tmbMifflin: Number(row.tmb_mifflin),
    tmbHarris: Number(row.tmb_harris),
    getKcal: Number(row.get_kcal),
    objetivoTipo: row.objetivo_tipo as ObjetivoEnergetico,
    ajusteKcal: Number(row.ajuste_kcal),
    objetivoKcal: Number(row.objetivo_kcal),
    observaciones: row.observaciones == null ? null : String(row.observaciones),
    versionCalculo: String(row.version_calculo),
    creadoEn: String(row.creado_en),
  }
}
