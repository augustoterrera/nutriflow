"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDB } from "@/lib/db";

export async function activarPacienteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  const paciente = await db.get(
    "SELECT id FROM pacientes WHERE id = ? AND activo = 0",
    [pacienteId]
  );
  if (!paciente) {
    throw new Error("El paciente no está disponible en la papelera.");
  }

  await db.run(
    "UPDATE pacientes SET activo = 1, actualizado_en = datetime('now') WHERE id = ? AND activo = 0",
    [pacienteId]
  );

  revalidatePath("/dashboard/pacientes");
  revalidatePath("/dashboard/papelera");
  redirect("/dashboard/papelera?restaurado=1");
}

export async function borrarPacienteDefinitivamenteAction(pacienteId: number) {
  if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
    throw new Error("ID de paciente inválido.");
  }

  const db = await getDB();

  const paciente = await db.get(
    "SELECT id FROM pacientes WHERE id = ? AND activo = 0",
    [pacienteId]
  );
  if (!paciente) {
    throw new Error("El paciente no está disponible en la papelera.");
  }

  // Las claves foráneas eliminan también anamnesis, mediciones, evaluaciones
  // energéticas y planes. La condición activo = 0 impide borrar un paciente activo.
  await db.run("DELETE FROM pacientes WHERE id = ? AND activo = 0", [pacienteId]);

  revalidatePath("/dashboard/pacientes");
  revalidatePath("/dashboard/papelera");
  redirect("/dashboard/papelera?eliminado=1");
}
