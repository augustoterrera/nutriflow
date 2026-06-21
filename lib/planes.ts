import { getDB } from "@/lib/db";
import { parseGrid, type PlanGrid, type PlanGridCompleto } from "@/lib/plan-grid";

// ── Modelo de grilla semanal ────────────────────────────────────────────────
// Un plan es un documento: encabezado (objetivo, kcal, peso/talla/imc) + una o
// más semanas. Cada semana es una grilla de comidas × días con texto libre.
// Se guarda entero como JSON en planes.grid_json. Los tipos/helpers puros viven
// en lib/plan-grid para poder usarse también desde el editor (cliente).

export type { PlanGrid, PlanSemana, PlanGridCompleto } from "@/lib/plan-grid";
export { gridVacio, semanaVacia } from "@/lib/plan-grid";

export async function listarPlanesDePaciente(pacienteId: number) {
  const db = await getDB();
  return db.all(
    `select p.id, p.uuid, p.nombre, p.fecha,
            json_extract(grid_json, '$.kcalObjetivo') as kcal_objetivo,
            json_extract(grid_json, '$.objetivo') as objetivo,
            e.fecha as evaluacion_fecha
     from planes p
     left join evaluaciones_energeticas e on e.id = p.evaluacion_energetica_id
     where p.paciente_id = ?
     order by date(p.fecha) desc, p.id desc`,
    [pacienteId]
  );
}

export async function obtenerPlanGrid(planId: number): Promise<PlanGridCompleto | null> {
  const db = await getDB();
  const plan = await db.get(`select * from planes where id = ?`, [planId]);
  if (!plan) return null;

  return {
    id: Number(plan.id),
    nombre: String(plan.nombre ?? ""),
    fecha: plan.fecha ?? null,
    evaluacionEnergeticaId:
      plan.evaluacion_energetica_id == null
        ? null
        : Number(plan.evaluacion_energetica_id),
    ...parseGrid(plan.grid_json),
  };
}

export type GuardarPlanInput = {
  id?: number | null;
  nombre: string;
  fecha?: string | null;
  grid: PlanGrid;
  evaluacionEnergeticaId?: number | null;
};

export async function guardarPlanGrid(pacienteId: number, datos: GuardarPlanInput) {
  const db = await getDB();
  const nombre = datos.nombre.trim() || "Plan alimentario";
  const gridJson = JSON.stringify(datos.grid);
  const evaluacionEnergeticaId = datos.evaluacionEnergeticaId
    ? Number(datos.evaluacionEnergeticaId)
    : null;

  if (evaluacionEnergeticaId) {
    const evaluacion = await db.get(
      `select id from evaluaciones_energeticas where id = ? and paciente_id = ?`,
      [evaluacionEnergeticaId, pacienteId]
    );
    if (!evaluacion) throw new Error("La evaluación energética no pertenece al paciente.");
  }

  let planId = Number(datos.id || 0);

  if (planId) {
    const existe = await db.get(
      `select id from planes where id = ? and paciente_id = ?`,
      [planId, pacienteId]
    );
    if (!existe) throw new Error("Plan no encontrado.");

    await db.run(
      `update planes
       set nombre = ?, fecha = coalesce(?, fecha), grid_json = ?,
           evaluacion_energetica_id = ?, actualizado_en = datetime('now')
       where id = ? and paciente_id = ?`,
      [
        nombre,
        datos.fecha || null,
        gridJson,
        evaluacionEnergeticaId,
        planId,
        pacienteId,
      ]
    );
  } else {
    const res = await db.run(
      `insert into planes (
         paciente_id, nombre, fecha, grid_json, evaluacion_energetica_id, actualizado_en
       ) values (?, ?, coalesce(?, date('now')), ?, ?, datetime('now'))`,
      [pacienteId, nombre, datos.fecha || null, gridJson, evaluacionEnergeticaId]
    );
    planId = Number(res.lastID);
  }

  return planId;
}

export async function eliminarPlan(planId: number, pacienteId: number) {
  const db = await getDB();
  const existe = await db.get(
    `select id from planes where id = ? and paciente_id = ?`,
    [planId, pacienteId]
  );
  if (!existe) throw new Error("Plan no encontrado.");
  await db.run(`delete from planes where id = ? and paciente_id = ?`, [planId, pacienteId]);
}
