import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { calcularIMC } from "@/lib/calculos";
import { OBJETIVO_ENERGETICO_LABELS } from "@/lib/energia";
import { listarEvaluacionesEnergeticas } from "@/lib/evaluaciones-energeticas";
import { gridVacio } from "@/lib/planes";
import { guardarPlanAction } from "../actions";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import { PlanGridEditor } from "@/components/planes/PlanGridEditor";

export default async function NuevoPlanPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const db = await getDB();
  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  // Peso / Talla / IMC se autocompletan con la última medición (editable después).
  const medicion = await db.get(
    `select peso_kg, altura_cm from mediciones
     where paciente_id = ? order by date(fecha) desc, id desc limit 1`,
    [pacienteId]
  );
  const evaluaciones = await listarEvaluacionesEnergeticas(pacienteId, 20);
  const evaluacionReferencia = evaluaciones[0] ?? null;

  const grid = gridVacio();
  const pesoInicial = evaluacionReferencia?.pesoKg ?? medicion?.peso_kg ?? null;
  const tallaInicial = evaluacionReferencia?.tallaCm ?? medicion?.altura_cm ?? null;
  if (pesoInicial != null) grid.peso = `${pesoInicial} kg`;
  if (tallaInicial != null) grid.talla = `${tallaInicial} cm`;
  if (pesoInicial != null && tallaInicial != null) {
    const imc = calcularIMC(Number(pesoInicial), Number(tallaInicial));
    if (imc != null) grid.imc = imc.toFixed(1);
  }
  if (evaluacionReferencia) {
    grid.objetivo = OBJETIVO_ENERGETICO_LABELS[evaluacionReferencia.objetivoTipo];
    grid.kcalObjetivo = `${evaluacionReferencia.objetivoKcal} kcal`;
  }

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Nuevo plan</h2>
        <p className="text-muted-foreground text-sm">
          Completá la grilla por comida y día. Podés agregar días o semanas.
        </p>
      </div>

      <PlanGridEditor
        pacienteId={pacienteId}
        planId={null}
        nombrePaciente={paciente.nombre_completo}
        defaultNombre="Plan alimentario"
        defaultFecha={new Date().toISOString().slice(0, 10)}
        defaultGrid={grid}
        defaultEvaluacionId={evaluacionReferencia?.id ?? null}
        evaluaciones={evaluaciones.map((evaluacion) => ({
          id: evaluacion.id,
          fecha: evaluacion.fecha,
          objetivoKcal: evaluacion.objetivoKcal,
          objetivoTipo: evaluacion.objetivoTipo,
          pesoKg: evaluacion.pesoKg,
          tallaCm: evaluacion.tallaCm,
          formula: evaluacion.formula,
        }))}
        action={guardarPlanAction.bind(null, pacienteId, null)}
      />
    </PageShell>
  );
}
