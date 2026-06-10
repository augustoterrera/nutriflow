"use server";

import { getDB } from "@/lib/db";

export type PacienteDesactivado = {
  id: number;
  dni: string;
  nombre_completo: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado_civil: string | null;
  ocupacion: string | null;
  notas: string | null;
  activo: number;
  creado_en: string;
  actualizado_en: string;
};

export async function obtenerPacientesDesactivadosAction(): Promise<
  PacienteDesactivado[]
> {
  const db = await getDB();
  const pacientes = await db.all(
    `SELECT 
       id, dni, nombre_completo, sexo, fecha_nacimiento,
       telefono, email, direccion, estado_civil, ocupacion, notas, activo,
       creado_en, actualizado_en
     FROM pacientes
     WHERE activo = 0
     ORDER BY actualizado_en DESC`
  );

  return pacientes || [];
}

export async function activarPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  try {
    const paciente = await db.get(
      "SELECT id FROM pacientes WHERE id = ?",
      [pacienteId]
    );

    if (!paciente) {
      throw new Error("Paciente no encontrado.");
    }

    await db.run(
      "UPDATE pacientes SET activo = 1, actualizado_en = datetime('now') WHERE id = ?",
      [pacienteId]
    );

    return { success: true };
  } catch (e: any) {
    throw e;
  }
}

export async function borrarPacienteDefinitivamenteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  try {
    const paciente = await db.get(
      "SELECT id FROM pacientes WHERE id = ?",
      [pacienteId]
    );

    if (!paciente) {
      throw new Error("Paciente no encontrado.");
    }

    // Al borrar, también se borran anamnesis, mediciones y planes por FOREIGN KEY CASCADE
    await db.run("DELETE FROM pacientes WHERE id = ?", [pacienteId]);

    return { success: true };
  } catch (e: any) {
    throw e;
  }
}
