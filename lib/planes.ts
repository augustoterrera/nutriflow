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
    `select id, uuid, nombre, fecha,
            json_extract(grid_json, '$.kcalObjetivo') as kcal_objetivo,
            json_extract(grid_json, '$.objetivo') as objetivo
     from planes
     where paciente_id = ?
     order by date(fecha) desc, id desc`,
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
    ...parseGrid(plan.grid_json),
  };
}

export type GuardarPlanInput = {
  id?: number | null;
  nombre: string;
  fecha?: string | null;
  grid: PlanGrid;
};

export async function guardarPlanGrid(pacienteId: number, datos: GuardarPlanInput) {
  const db = await getDB();
  const nombre = datos.nombre.trim() || "Plan alimentario";
  const gridJson = JSON.stringify(datos.grid);

  let planId = Number(datos.id || 0);

  if (planId) {
    const existe = await db.get(
      `select id from planes where id = ? and paciente_id = ?`,
      [planId, pacienteId]
    );
    if (!existe) throw new Error("Plan no encontrado.");

    await db.run(
      `update planes
       set nombre = ?, fecha = coalesce(?, fecha), grid_json = ?, actualizado_en = datetime('now')
       where id = ? and paciente_id = ?`,
      [nombre, datos.fecha || null, gridJson, planId, pacienteId]
    );
  } else {
    const res = await db.run(
      `insert into planes (paciente_id, nombre, fecha, grid_json, actualizado_en)
       values (?, ?, coalesce(?, date('now')), ?, datetime('now'))`,
      [pacienteId, nombre, datos.fecha || null, gridJson]
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
