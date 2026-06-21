import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { obtenerPlanGrid } from "@/lib/planes";
import { obtenerEvaluacionEnergetica } from "@/lib/evaluaciones-energeticas";
import { ORDEN_GRILLA, LABEL_COMIDA } from "@/lib/plan-constants";
import { PrintButton } from "@/components/planes/PrintButton";

export default async function ImprimirPlanPage(props: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id: idStr, pid: pidStr } = await props.params;
  const pacienteId = Number(idStr);
  const planId = Number(pidStr);
  if (!Number.isFinite(pacienteId) || !Number.isFinite(planId)) notFound();

  const db = await getDB();
  const paciente = await db.get(
    `select * from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const owner = await db.get(`select paciente_id from planes where id = ?`, [planId]);
  if (!owner || Number(owner.paciente_id) !== pacienteId) notFound();

  const plan = await obtenerPlanGrid(planId);
  if (!plan) notFound();
  const evaluacion = plan.evaluacionEnergeticaId
    ? await obtenerEvaluacionEnergetica(plan.evaluacionEnergeticaId, pacienteId)
    : null;

  const datosCabecera = [
    plan.peso ? { label: "Peso", value: plan.peso } : null,
    plan.talla ? { label: "Talla", value: plan.talla } : null,
    plan.imc ? { label: "IMC", value: plan.imc } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    // Documento claro independiente del tema oscuro de la app. Escala neutral + impresión apaisada.
    <main className="min-h-screen bg-neutral-100 p-6 text-neutral-900 print:bg-white print:p-0">
      <style>{`@media print { @page { size: landscape; margin: 10mm; } }`}</style>

      <div className="mx-auto max-w-6xl">
        <PrintButton />

        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-8 shadow print:border-0 print:p-0 print:shadow-none">
          <header className="mb-6">
            <h1 className="text-center text-2xl font-bold tracking-wide">PLAN ALIMENTARIO</h1>
            <h2 className="mt-4 text-lg font-semibold">{paciente.nombre_completo}</h2>

            {datosCabecera.length ? (
              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                {datosCabecera.map((d) => (
                  <span key={d.label}>
                    <span className="text-neutral-500">{d.label}:</span> {d.value}
                  </span>
                ))}
              </div>
            ) : null}

            {plan.objetivo || plan.kcalObjetivo || evaluacion ? (
              <div className="mt-3 inline-block rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm">
                {plan.objetivo ? (
                  <div>
                    <span className="text-neutral-500">Objetivo:</span> {plan.objetivo}
                  </div>
                ) : null}
                {plan.kcalObjetivo ? (
                  <div>
                    <span className="text-neutral-500">Plan:</span> {plan.kcalObjetivo}
                  </div>
                ) : null}
                {evaluacion ? (
                  <div>
                    <span className="text-neutral-500">Referencia energética:</span>{" "}
                    {formatFecha(evaluacion.fecha)} · {evaluacion.objetivoKcal} kcal/día
                  </div>
                ) : null}
              </div>
            ) : null}
          </header>

          <div className="space-y-8">
            {plan.semanas.map((semana, si) => {
              const dias = Array.from({ length: semana.dias }, (_, i) => i);
              return (
                <section
                  key={si}
                  className={si > 0 ? "break-before-page" : undefined}
                >
                  {plan.semanas.length > 1 ? (
                    <h3 className="mb-2 text-base font-semibold">{semana.titulo}</h3>
                  ) : null}
                  <table className="w-full table-fixed border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-100 text-left">
                        <th className="w-28 border border-neutral-300 p-2 font-semibold">Alimentación</th>
                        {dias.map((d) => (
                          <th key={d} className="border border-neutral-300 p-2 font-semibold">
                            DÍA {d + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ORDEN_GRILLA.map((tipo) => (
                        <tr key={tipo} className="align-top">
                          <th className="border border-neutral-300 bg-neutral-50 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">
                            {LABEL_COMIDA[tipo]}
                          </th>
                          {dias.map((d) => (
                            <td key={d} className="border border-neutral-200 p-2">
                              <Celda texto={semana.celdas[`${tipo}:${d}`] ?? ""} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              );
            })}
          </div>

          <footer className="mt-6 border-t border-neutral-200 pt-4 text-center text-sm text-neutral-500">
            Elaborado por Álvaro Tomás Terrera · Técnico en Nutrición · @alvaro.nutre
          </footer>
        </section>
      </div>
    </main>
  );
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

// Renderiza una celda: si tiene varias líneas, la primera va en negrita (título del plato).
function Celda({ texto }: { texto: string }) {
  const limpio = (texto ?? "").trim();
  if (!limpio) return <span className="text-neutral-400">—</span>;

  const lineas = limpio.split("\n");
  if (lineas.length === 1) {
    return <span className="whitespace-pre-wrap">{limpio}</span>;
  }

  const [titulo, ...resto] = lineas;
  return (
    <span className="whitespace-pre-wrap">
      <span className="font-semibold">{titulo}</span>
      {resto.length ? `\n${resto.join("\n")}` : null}
    </span>
  );
}
