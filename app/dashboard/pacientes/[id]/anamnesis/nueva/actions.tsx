"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";

export async function crearAnamnesisAction(
  pacienteId: number,
  formData: FormData
) {
  const rawFecha = String(formData.get("fecha") ?? "").trim();
  const fecha = rawFecha ? rawFecha : null;

  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("Fecha inválida. Usá formato YYYY-MM-DD.");
  }

  const tipo_dieta = String(formData.get("tipo_dieta") ?? "omnivoro");
  const frutas_no_gusta =
    String(formData.get("frutas_no_gusta") ?? "").trim() || null;
  const verduras_no_gusta =
    String(formData.get("verduras_no_gusta") ?? "").trim() || null;
  const consumo_agua =
    String(formData.get("consumo_agua") ?? "").trim() || null;
  const actividad_fisica =
    String(formData.get("actividad_fisica") ?? "").trim() || null;
  const observaciones =
    String(formData.get("observaciones") ?? "").trim() || null;

  if (!["omnivoro", "vegetariano", "vegano"].includes(tipo_dieta)) {
    throw new Error("Tipo de dieta inválido.");
  }

  const db = await getDB();

  await db.run(
    `insert into anamnesis (
      paciente_id, fecha,
      tipo_dieta,
      frutas_no_gusta, verduras_no_gusta,
      consumo_agua, actividad_fisica,
      observaciones
    ) values (
      ?, coalesce(?, date('now')),
      ?, ?, ?,
      ?, ?,
      ?
    )`,
    [
      pacienteId,
      fecha,
      tipo_dieta,
      frutas_no_gusta,
      verduras_no_gusta,
      consumo_agua,
      actividad_fisica,
      observaciones,
    ]
  );

  redirect(`/dashboard/pacientes/${pacienteId}`);
}
