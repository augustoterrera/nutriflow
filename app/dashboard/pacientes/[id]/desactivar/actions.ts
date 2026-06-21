"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";

export async function desactivarPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  const paciente = await db.get(
    "SELECT id FROM pacientes WHERE id = ? AND activo = 1",
    [pacienteId]
  );
  if (!paciente) {
    throw new Error("El paciente no está disponible entre los pacientes activos.");
  }

  await db.run(
    "UPDATE pacientes SET activo = 0, actualizado_en = datetime('now') WHERE id = ? AND activo = 1",
    [pacienteId]
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pacientes");
  revalidatePath("/dashboard/papelera");
  redirect("/dashboard/pacientes");
}
