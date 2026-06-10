import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { obtenerPlanCompleto } from "@/lib/planes";
import { edadDesdeFechaNacimiento, totalesPlan } from "@/lib/calculos";
import { PrintButton } from "@/components/planes/PrintButton";

export default async function ImprimirPlanPage(props: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id: idStr, pid: pidStr } = await props.params;
  const pacienteId = Number(idStr);
  const planId = Number(pidStr);
  if (!Number.isFinite(pacienteId) || !Number.isFinite(planId)) notFound();

  const db = await getDB();
  const [paciente, medicion, plan] = await Promise.all([
    db.get(`select * from pacientes where id = ? and activo = 1`, [pacienteId]),
    db.get(`select * from mediciones where paciente_id = ? order by date(fecha) desc, id desc limit 1`, [pacienteId]),
    obtenerPlanCompleto(planId),
  ]);
  if (!paciente || !plan || Number((plan as any).paciente_id) !== pacienteId) notFound();

  const comidas = (plan as any).comidas;
  const items = comidas.flatMap((comida: any) => comida.items);
  const total = totalesPlan(items);
  const edad = edadDesdeFechaNacimiento(paciente.fecha_nacimiento);

  return (
    <main className="min-h-screen bg-[#F7FBF8] p-6 text-[#1A2E23] print:bg-white print:p-0">
      <PrintButton />
      <section className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow print:shadow-none">
        <header className="bg-gradient-to-r from-[#1B4332] to-[#40916C] p-8 text-white">
          <h1 className="text-3xl font-semibold">{(plan as any).nombre}</h1>
          <p className="mt-2">{paciente.nombre_completo} {edad != null ? `· ${edad} años` : ""} {medicion?.peso_kg ? `· ${medicion.peso_kg} kg` : ""}</p>
          <p className="mt-1 text-sm opacity-90">Fecha: {(plan as any).fecha} · {total.kcal} kcal/día</p>
        </header>

        <div className="space-y-6 p-8">
          {comidas.map((comida: any) => (
            <section key={comida.tipo}>
              <h2 className="mb-2 text-xl font-semibold capitalize">{labelComida(comida.tipo)}</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#D8F3DC] text-left">
                    <th className="p-2">Alimento</th>
                    <th className="p-2 text-right">Gramos</th>
                    <th className="p-2 text-right">Kcal</th>
                  </tr>
                </thead>
                <tbody>
                  {comida.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-[#DFF0E7]">
                      <td className="p-2">{item.nombre}</td>
                      <td className="p-2 text-right">{item.gramos} g</td>
                      <td className="p-2 text-right">{Math.round(item.kcal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comida.nota ? <div className="mt-2 rounded-md border border-[#F4A261] bg-[#FFF4EA] p-3 text-sm">{comida.nota}</div> : null}
            </section>
          ))}

          <section className="grid gap-3 rounded-lg bg-[#F0FBF4] p-4 sm:grid-cols-4">
            <Summary label="Proteínas" value={`${total.prot} g`} extra={`${total.pProt}%`} />
            <Summary label="Carbohidratos" value={`${total.cho} g`} extra={`${total.pCho}%`} />
            <Summary label="Grasas" value={`${total.gras} g`} extra={`${total.pGras}%`} />
            <Summary label="Fibra" value={`${total.fibra} g`} extra="" />
          </section>

          <footer className="border-t border-[#DFF0E7] pt-4 text-center text-sm text-[#4A6357]">
            Elaborado por Álvaro Tomás Terrera · Técnico en Nutrición · @alvaro.nutre
          </footer>
        </div>
      </section>
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
    </main>
  );
}

function Summary(props: { label: string; value: string; extra: string }) {
  return (
    <div>
      <div className="text-sm text-[#4A6357]">{props.label}</div>
      <div className="text-xl font-semibold">{props.value}</div>
      <div className="text-sm text-[#4A6357]">{props.extra}</div>
    </div>
  );
}

function labelComida(tipo: string) {
  if (tipo === "colacion") return "Colación";
  return tipo;
}
