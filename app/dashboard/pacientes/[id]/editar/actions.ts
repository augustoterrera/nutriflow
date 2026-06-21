"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDB } from "@/lib/db";
import {
  normalizarDatosPaciente,
  type PacienteDataInput,
} from "@/lib/pacientes";

type EditPacienteInput = PacienteDataInput & {
  paciente_id: number;
};

async function actualizarPaciente(input: EditPacienteInput) {
  if (!Number.isFinite(input.paciente_id) || input.paciente_id <= 0) {
    throw new Error("ID de paciente inválido.");
  }
  const datos = normalizarDatosPaciente(input);

  const db = await getDB();

  try {
    // Primero verificar que el paciente existe
    const paciente = await db.get(
      "SELECT id FROM pacientes WHERE id = ?",
      [input.paciente_id]
    );

    if (!paciente) {
      throw new Error("Paciente no encontrado.");
    }

    // Actualizar el paciente
    await db.run(
      `UPDATE pacientes SET
         dni = ?,
         nombre_completo = ?,
         sexo = ?,
         fecha_nacimiento = ?,
         telefono = ?,
         email = ?,
         direccion = ?,
         ocupacion = ?,
         estado_civil = ?,
         notas = ?,
         actualizado_en = datetime('now')
       WHERE id = ?`,
      [
        datos.dni,
        datos.nombre_completo,
        datos.sexo,
        datos.fecha_nacimiento,
        datos.telefono,
        datos.email,
        datos.direccion,
        datos.ocupacion,
        datos.estado_civil,
        datos.notas,
        input.paciente_id,
      ]
    );

  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("UNIQUE") && msg.includes("pacientes.dni")) {
      throw new Error("Ya existe otro paciente con ese DNI.");
    }
    throw e;
  }
}

export async function editarPacienteAction(input: EditPacienteInput) {
  await actualizarPaciente(input);
  revalidatePath(`/dashboard/pacientes/${input.paciente_id}`);
  redirect(`/dashboard/pacientes/${input.paciente_id}`);
}

export async function guardarFichaPacienteAction(input: EditPacienteInput) {
  await actualizarPaciente(input);
  revalidatePath(`/dashboard/pacientes/${input.paciente_id}`);
  revalidatePath(`/dashboard/pacientes/${input.paciente_id}/ficha`);
  return { ok: true };
}

export async function obtenerPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();
  const paciente = await db.get(
    `SELECT 
       id, dni, nombre_completo, sexo, fecha_nacimiento,
       telefono, email, direccion, estado_civil, ocupacion, notas, activo
     FROM pacientes
     WHERE id = ?`,
    [pacienteId]
  );

  if (!paciente) {
    throw new Error("Paciente no encontrado.");
  }

  return paciente;
}
