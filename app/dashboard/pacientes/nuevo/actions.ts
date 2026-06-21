"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { normalizarDatosPaciente } from "@/lib/pacientes";

export async function crearPacienteAction(formData: FormData) {
  const datos = normalizarDatosPaciente({
    dni: String(formData.get("dni") ?? ""),
    nombre_completo: String(formData.get("nombre_completo") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    sexo: String(formData.get("sexo") ?? ""),
    fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? ""),
    email: String(formData.get("email") ?? ""),
    direccion: String(formData.get("direccion") ?? ""),
    ocupacion: String(formData.get("ocupacion") ?? ""),
    estado_civil: String(formData.get("estado_civil") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  });

  const db = await getDB();

  try {
    const res = await db.run(
      `insert into pacientes (
         dni, nombre_completo, telefono, sexo, fecha_nacimiento,
         email, direccion, ocupacion, estado_civil, notas,
         actualizado_en
       ) values (
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         datetime('now')
       )`,
      [
        datos.dni,
        datos.nombre_completo,
        datos.telefono,
        datos.sexo,
        datos.fecha_nacimiento,
        datos.email,
        datos.direccion,
        datos.ocupacion,
        datos.estado_civil,
        datos.notas,
      ]
    );

    const id = res.lastID as number;
    redirect(`/dashboard/pacientes/${id}`);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("UNIQUE") && msg.includes("pacientes.dni")) {
      throw new Error("Ya existe un paciente con ese DNI.");
    }
    throw e;
  }
}

