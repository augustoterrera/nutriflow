import { getDB } from "@/lib/db";

export type Alimento = {
  id: number;
  uuid: string;
  nombre: string;
  kcal: number;
  prot: number;
  cho: number;
  gras: number;
  fibra: number;
  grupo: string;
  es_custom: number;
  activo: number;
};

export type AlimentoInput = {
  nombre: string;
  kcal: number;
  prot?: number;
  cho?: number;
  gras?: number;
  fibra?: number;
  grupo?: string;
};

export async function listarAlimentos(filtros: { q?: string; grupo?: string } = {}) {
  const db = await getDB();
  const where = ["activo = 1"];
  const params: unknown[] = [];

  if (filtros.q?.trim()) {
    where.push("nombre like ?");
    params.push(`%${filtros.q.trim()}%`);
  }

  if (filtros.grupo?.trim()) {
    where.push("grupo = ?");
    params.push(filtros.grupo.trim());
  }

  return db.all<Alimento[]>(
    `select * from alimentos
     where ${where.join(" and ")}
     order by grupo asc, es_custom desc, nombre asc`,
    params
  );
}

export async function listarGruposAlimentos() {
  const db = await getDB();
  const rows = await db.all<{ grupo: string }[]>(
    `select distinct grupo from alimentos where activo = 1 order by grupo asc`
  );
  return rows.map((row) => row.grupo);
}

export async function crearAlimentoCustom(datos: AlimentoInput) {
  const db = await getDB();
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error("El nombre del alimento es obligatorio.");

  const res = await db.run(
    `insert into alimentos (nombre, kcal, prot, cho, gras, fibra, grupo, es_custom, actualizado_en)
     values (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
     on conflict(nombre) do update set
       kcal = excluded.kcal,
       prot = excluded.prot,
       cho = excluded.cho,
       gras = excluded.gras,
       fibra = excluded.fibra,
       grupo = excluded.grupo,
       es_custom = 1,
       activo = 1,
       actualizado_en = datetime('now')`,
    [
      nombre,
      Number(datos.kcal || 0),
      Number(datos.prot || 0),
      Number(datos.cho || 0),
      Number(datos.gras || 0),
      Number(datos.fibra || 0),
      datos.grupo?.trim() || "Custom",
    ]
  );

  return res.lastID;
}

export async function desactivarAlimento(id: number) {
  const db = await getDB();
  const row = await db.get<{ es_custom: number }>(
    `select es_custom from alimentos where id = ?`,
    [id]
  );

  if (!row || row.es_custom !== 1) {
    throw new Error("Solo se pueden eliminar alimentos custom.");
  }

  await db.run(
    `update alimentos set activo = 0, actualizado_en = datetime('now') where id = ? and es_custom = 1`,
    [id]
  );
}
