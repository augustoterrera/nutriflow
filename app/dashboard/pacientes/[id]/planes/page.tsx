import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { listarPlanesDePaciente } from "@/lib/planes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlanesPacientePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const db = await getDB();
  const paciente = await db.get(`select id, nombre_completo, dni from pacientes where id = ? and activo = 1`, [pacienteId]);
  if (!paciente) notFound();

  const planes = await listarPlanesDePaciente(pacienteId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Planes</h1>
          <p className="text-sm text-muted-foreground">{paciente.nombre_completo} · DNI {paciente.dni}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href={`/dashboard/pacientes/${pacienteId}/planes/nuevo`}>+ Nuevo plan</Link></Button>
        </div>
      </div>

      {planes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Todavía no hay planes cargados.</p>
            <Button className="mt-4" asChild><Link href={`/dashboard/pacientes/${pacienteId}/planes/nuevo`}>Crear primer plan</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planes.map((plan: any) => (
            <Link key={plan.id} href={`/dashboard/pacientes/${pacienteId}/planes/${plan.id}`}>
              <Card className="h-full transition hover:bg-accent">
                <CardHeader>
                  <CardTitle>{plan.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div>{plan.fecha}</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{Math.round(plan.total_kcal)} kcal</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
