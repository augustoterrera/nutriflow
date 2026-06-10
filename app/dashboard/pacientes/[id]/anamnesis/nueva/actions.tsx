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
  const consumo_verduras =
    String(formData.get("consumo_verduras") ?? "").trim() || null;
  const consumo_frutas =
    String(formData.get("consumo_frutas") ?? "").trim() || null;
  const consumo_carnes =
    String(formData.get("consumo_carnes") ?? "").trim() || null;
  const actividad_fisica =
    String(formData.get("actividad_fisica") ?? "").trim() || null;
  const consume_suplementos = formData.get("consume_suplementos") ? 1 : 0;
  const suplementos_detalle =
    String(formData.get("suplementos_detalle") ?? "").trim() || null;
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
      consumo_verduras, consumo_frutas, consumo_carnes,
      consumo_agua, actividad_fisica,
      consume_suplementos, suplementos_detalle,
      observaciones, actualizado_en
    ) values (
      ?, coalesce(?, date('now')),
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, datetime('now')
    )`,
    [
      pacienteId,
      fecha,
      tipo_dieta,
      frutas_no_gusta,
      verduras_no_gusta,
      consumo_verduras,
      consumo_frutas,
      consumo_carnes,
      consumo_agua,
      actividad_fisica,
      consume_suplementos,
      suplementos_detalle,
      observaciones,
    ]
  );

  redirect(`/dashboard/pacientes/${pacienteId}`);
}
