"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";

export async function desactivarPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  try {
    // Verificar que el paciente existe
    const paciente = await db.get(
      "SELECT id FROM pacientes WHERE id = ?",
      [pacienteId]
    );

    if (!paciente) {
      throw new Error("Paciente no encontrado.");
    }

    // Desactivar el paciente (activo = 0)
    await db.run(
      "UPDATE pacientes SET activo = 0, actualizado_en = datetime('now') WHERE id = ?",
      [pacienteId]
    );

    redirect("/dashboard/pacientes");
  } catch (e: any) {
    throw e;
  }
}
