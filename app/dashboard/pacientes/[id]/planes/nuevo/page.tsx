import { notFound } from "next/navigation";
import { listarAlimentos } from "@/lib/alimentos";
import { getDB } from "@/lib/db";
import { PlanEditor } from "@/components/planes/PlanEditor";
import { crearCustomDesdePlanAction, guardarPlanAction } from "../actions";

export default async function NuevoPlanPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const db = await getDB();
  const paciente = await db.get(`select id from pacientes where id = ? and activo = 1`, [pacienteId]);
  if (!paciente) notFound();

  const alimentos = await listarAlimentos();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo plan</h1>
        <p className="text-sm text-muted-foreground">Armá las 5 comidas y guardá el plan.</p>
      </div>
      <PlanEditor
        pacienteId={pacienteId}
        planId={null}
        alimentos={alimentos}
        action={guardarPlanAction.bind(null, pacienteId, null)}
        crearCustomAction={crearCustomDesdePlanAction}
      />
    </div>
  );
}
