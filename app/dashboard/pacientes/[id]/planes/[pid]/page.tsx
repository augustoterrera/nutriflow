import { notFound } from "next/navigation";
import { listarAlimentos } from "@/lib/alimentos";
import { getDB } from "@/lib/db";
import { obtenerPlanCompleto } from "@/lib/planes";
import { PlanEditor } from "@/components/planes/PlanEditor";
import { crearCustomDesdePlanAction, eliminarPlanAction, guardarPlanAction } from "../actions";
import { Button } from "@/components/ui/button";

export default async function EditarPlanPage(props: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id: idStr, pid: pidStr } = await props.params;
  const pacienteId = Number(idStr);
  const planId = Number(pidStr);
  if (!Number.isFinite(pacienteId) || !Number.isFinite(planId)) notFound();

  const db = await getDB();
  const paciente = await db.get(`select id from pacientes where id = ? and activo = 1`, [pacienteId]);
  if (!paciente) notFound();

  const [alimentos, plan] = await Promise.all([listarAlimentos(), obtenerPlanCompleto(planId)]);
  if (!plan || Number((plan as any).paciente_id) !== pacienteId) notFound();

  const initialPlan = {
    nombre: (plan as any).nombre,
    fecha: (plan as any).fecha,
    comidas: (plan as any).comidas.map((comida: any) => ({
      tipo: comida.tipo,
      nota: comida.nota || "",
      items: comida.items.map((item: any) => ({
        alimento_id: item.alimento_id,
        nombre: item.nombre,
        gramos: Number(item.gramos),
        kcal: Number(item.kcal),
        prot: Number(item.prot),
        cho: Number(item.cho),
        gras: Number(item.gras),
        fibra: Number(item.fibra),
      })),
    })),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Editar plan</h1>
          <p className="text-sm text-muted-foreground">Los macros se guardan como snapshot de porción.</p>
        </div>
        <form action={eliminarPlanAction.bind(null, pacienteId)}>
          <input type="hidden" name="plan_id" value={planId} />
          <Button type="submit" variant="destructive">Eliminar plan</Button>
        </form>
      </div>
      <PlanEditor
        pacienteId={pacienteId}
        planId={planId}
        alimentos={alimentos}
        initialPlan={initialPlan}
        action={guardarPlanAction.bind(null, pacienteId, planId)}
        crearCustomAction={crearCustomDesdePlanAction}
      />
    </div>
  );
}
