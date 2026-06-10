"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearAlimentoCustom } from "@/lib/alimentos";
import { eliminarPlan, guardarPlan, type PlanInput } from "@/lib/planes";

export async function guardarPlanAction(pacienteId: number, planId: number | null, formData: FormData) {
  const raw = String(formData.get("plan") ?? "");
  const datos = JSON.parse(raw) as PlanInput;
  const savedId = await guardarPlan(pacienteId, { ...datos, id: planId });

  revalidatePath(`/dashboard/pacientes/${pacienteId}/planes`);
  redirect(`/dashboard/pacientes/${pacienteId}/planes/${savedId}`);
}

export async function eliminarPlanAction(pacienteId: number, formData: FormData) {
  const planId = Number(formData.get("plan_id"));
  await eliminarPlan(planId);

  revalidatePath(`/dashboard/pacientes/${pacienteId}/planes`);
  redirect(`/dashboard/pacientes/${pacienteId}/planes`);
}

export async function crearCustomDesdePlanAction(datos: {
  nombre: string;
  kcal: number;
  prot: number;
  cho: number;
  gras: number;
  fibra: number;
}) {
  await crearAlimentoCustom({ ...datos, grupo: "Custom" });
}
