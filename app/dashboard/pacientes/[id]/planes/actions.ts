"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eliminarPlan, guardarPlanGrid, type PlanGrid } from "@/lib/planes";

export async function guardarPlanAction(pacienteId: number, planId: number | null, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim() || null;
  const grid = JSON.parse(String(formData.get("grid") ?? "{}")) as PlanGrid;
  const evaluacionRaw = Number(formData.get("evaluacion_energetica_id"));
  const evaluacionEnergeticaId =
    Number.isFinite(evaluacionRaw) && evaluacionRaw > 0 ? evaluacionRaw : null;

  const savedId = await guardarPlanGrid(pacienteId, {
    id: planId,
    nombre,
    fecha,
    grid,
    evaluacionEnergeticaId,
  });

  revalidatePath(`/dashboard/pacientes/${pacienteId}/planes`);
  redirect(`/dashboard/pacientes/${pacienteId}/planes/${savedId}`);
}

export async function eliminarPlanAction(pacienteId: number, formData: FormData) {
  const planId = Number(formData.get("plan_id"));
  await eliminarPlan(planId, pacienteId);

  revalidatePath(`/dashboard/pacientes/${pacienteId}/planes`);
  redirect(`/dashboard/pacientes/${pacienteId}/planes`);
}
