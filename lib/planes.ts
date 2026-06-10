import { getDB } from "@/lib/db";
import { TIPOS_COMIDA, type TipoComida } from "@/lib/plan-constants";

export type PlanItemInput = {
  alimento_id?: number | null;
  nombre: string;
  gramos: number;
  kcal: number;
  prot?: number;
  cho?: number;
  gras?: number;
  fibra?: number;
};

export type PlanComidaInput = {
  tipo: TipoComida;
  nota?: string | null;
  items: PlanItemInput[];
};

export type PlanInput = {
  id?: number | null;
  nombre: string;
  fecha?: string | null;
  comidas: PlanComidaInput[];
};

export async function listarPlanesDePaciente(pacienteId: number) {
  const db = await getDB();
  return db.all(
    `select p.id, p.uuid, p.nombre, p.fecha, coalesce(sum(i.kcal), 0) as total_kcal
     from planes p
     left join plan_comidas c on c.plan_id = p.id
     left join plan_items i on i.comida_id = c.id
     where p.paciente_id = ?
     group by p.id
     order by date(p.fecha) desc, p.id desc`,
    [pacienteId]
  );
}

export async function obtenerPlanCompleto(planId: number) {
  const db = await getDB();
  const plan = await db.get(
    `select * from planes where id = ?`,
    [planId]
  );
  if (!plan) return null;

  const comidas = await db.all(
    `select * from plan_comidas where plan_id = ? order by
      case tipo
        when 'desayuno' then 1
        when 'almuerzo' then 2
        when 'merienda' then 3
        when 'cena' then 4
        else 5
      end`,
    [planId]
  );

  const items = await db.all(
    `select i.*
     from plan_items i
     join plan_comidas c on c.id = i.comida_id
     where c.plan_id = ?
     order by i.id asc`,
    [planId]
  );

  return {
    ...plan,
    comidas: comidas.map((comida: any) => ({
      ...comida,
      items: items.filter((item: any) => item.comida_id === comida.id),
    })),
  };
}

export async function guardarPlan(pacienteId: number, datos: PlanInput) {
  const db = await getDB();
  const nombre = datos.nombre.trim() || "Plan alimentario";

  await db.exec("BEGIN");
  try {
    let planId = Number(datos.id || 0);

    if (planId) {
      const existe = await db.get(
        `select id from planes where id = ? and paciente_id = ?`,
        [planId, pacienteId]
      );
      if (!existe) throw new Error("Plan no encontrado.");

      await db.run(
        `update planes
         set nombre = ?, fecha = coalesce(?, fecha), actualizado_en = datetime('now')
         where id = ? and paciente_id = ?`,
        [nombre, datos.fecha || null, planId, pacienteId]
      );
      await db.run(`delete from plan_comidas where plan_id = ?`, [planId]);
    } else {
      const res = await db.run(
        `insert into planes (paciente_id, nombre, fecha, actualizado_en)
         values (?, ?, coalesce(?, date('now')), datetime('now'))`,
        [pacienteId, nombre, datos.fecha || null]
      );
      planId = Number(res.lastID);
    }

    for (const tipo of TIPOS_COMIDA) {
      const comida = datos.comidas.find((c) => c.tipo === tipo) ?? { tipo, items: [] };
      const comidaRes = await db.run(
        `insert into plan_comidas (plan_id, tipo, nota) values (?, ?, ?)`,
        [planId, tipo, comida.nota?.trim() || null]
      );
      const comidaId = Number(comidaRes.lastID);

      for (const item of comida.items) {
        if (!item.nombre.trim() || !Number(item.gramos)) continue;
        await db.run(
          `insert into plan_items (
             comida_id, alimento_id, nombre, gramos, kcal, prot, cho, gras, fibra
           ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            comidaId,
            item.alimento_id || null,
            item.nombre.trim(),
            Number(item.gramos || 0),
            Number(item.kcal || 0),
            Number(item.prot || 0),
            Number(item.cho || 0),
            Number(item.gras || 0),
            Number(item.fibra || 0),
          ]
        );
      }
    }

    await db.exec("COMMIT");
    return planId;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function eliminarPlan(planId: number) {
  const db = await getDB();
  await db.run(`delete from planes where id = ?`, [planId]);
}
