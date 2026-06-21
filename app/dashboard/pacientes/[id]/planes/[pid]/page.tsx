import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { obtenerPlanGrid, type PlanGrid } from "@/lib/planes";
import { listarEvaluacionesEnergeticas } from "@/lib/evaluaciones-energeticas";
import { eliminarPlanAction, guardarPlanAction } from "../actions";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import { PlanGridEditor } from "@/components/planes/PlanGridEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function EditarPlanPage(props: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id: idStr, pid: pidStr } = await props.params;
  const pacienteId = Number(idStr);
  const planId = Number(pidStr);
  if (!Number.isFinite(pacienteId) || !Number.isFinite(planId)) notFound();

  const db = await getDB();
  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  // seguridad: el plan debe pertenecer a este paciente
  const owner = await db.get(`select paciente_id from planes where id = ?`, [planId]);
  if (!owner || Number(owner.paciente_id) !== pacienteId) notFound();

  const plan = await obtenerPlanGrid(planId);
  if (!plan) notFound();
  const evaluaciones = await listarEvaluacionesEnergeticas(pacienteId, 20);

  const grid: PlanGrid = {
    objetivo: plan.objetivo,
    kcalObjetivo: plan.kcalObjetivo,
    peso: plan.peso,
    talla: plan.talla,
    imc: plan.imc,
    semanas: plan.semanas,
  };

  return (
    <PageShell>
      <PacienteWorkspaceHeader
        paciente={paciente}
        actions={
          <form action={eliminarPlanAction.bind(null, pacienteId)}>
            <Input type="hidden" name="plan_id" value={planId} />
            <Button type="submit" variant="destructive">
              Eliminar plan
            </Button>
          </form>
        }
      />

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Editar plan</h2>
        <p className="text-muted-foreground text-sm">
          Editá la grilla por comida y día. Exportá a PDF para compartir con el paciente.
        </p>
      </div>

      <PlanGridEditor
        pacienteId={pacienteId}
        planId={planId}
        nombrePaciente={paciente.nombre_completo}
        defaultNombre={plan.nombre}
        defaultFecha={String(plan.fecha ?? "").slice(0, 10)}
        defaultGrid={grid}
        defaultEvaluacionId={plan.evaluacionEnergeticaId}
        evaluaciones={evaluaciones.map((evaluacion) => ({
          id: evaluacion.id,
          fecha: evaluacion.fecha,
          objetivoKcal: evaluacion.objetivoKcal,
          objetivoTipo: evaluacion.objetivoTipo,
          pesoKg: evaluacion.pesoKg,
          tallaCm: evaluacion.tallaCm,
          formula: evaluacion.formula,
        }))}
        action={guardarPlanAction.bind(null, pacienteId, planId)}
      />
    </PageShell>
  );
}
