import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function eliminarMedicionAction(formData: FormData) {
  "use server";

  const pacienteId = Number(formData.get("paciente_id"));
  const medicionId = Number(formData.get("medicion_id"));

  if (!Number.isFinite(pacienteId) || !Number.isFinite(medicionId)) notFound();

  const db = await getDB();

  // seguridad: borrar solo si pertenece a ese paciente
  const row = await db.get(
    `select id from mediciones where id = ? and paciente_id = ?`,
    [medicionId, pacienteId]
  );

  if (!row) notFound();

  await db.run(`delete from mediciones where id = ? and paciente_id = ?`, [
    medicionId,
    pacienteId,
  ]);

  redirect(`/dashboard/pacientes/${pacienteId}/mediciones`);
}

export default async function EliminarMedicionPage(props: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id: idStr, mid: midStr } = await props.params;

  const pacienteId = Number(idStr);
  const medicionId = Number(midStr);

  if (!Number.isFinite(pacienteId) || !Number.isFinite(medicionId)) notFound();

  const db = await getDB();

  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const m = await db.get(
    `select id, fecha, peso_kg, altura_cm, cintura_cm, cadera_cm, cuello_cm,
            grasa_pct, musculo_pct, brazo_cm, muneca_cm, observaciones
     from mediciones
     where id = ? and paciente_id = ?`,
    [medicionId, pacienteId]
  );
  if (!m) notFound();

  const base = `/dashboard/pacientes/${pacienteId}/mediciones`;

  const datos = [
    { label: "Fecha", value: String(m.fecha ?? "—") },
    { label: "Peso", value: m.peso_kg != null ? `${m.peso_kg} kg` : "—" },
    { label: "Altura", value: m.altura_cm != null ? `${m.altura_cm} cm` : "—" },
    { label: "Cintura", value: m.cintura_cm != null ? `${m.cintura_cm} cm` : "—" },
    m.cadera_cm != null ? { label: "Cadera", value: `${m.cadera_cm} cm` } : null,
    m.cuello_cm != null ? { label: "Cuello", value: `${m.cuello_cm} cm` } : null,
    m.grasa_pct != null ? { label: "Grasa", value: `${m.grasa_pct}%` } : null,
    m.musculo_pct != null ? { label: "Músculo", value: `${m.musculo_pct}%` } : null,
    m.brazo_cm != null ? { label: "Brazo", value: `${m.brazo_cm} cm` } : null,
    m.muneca_cm != null ? { label: "Muñeca", value: `${m.muneca_cm} cm` } : null,
    m.observaciones ? { label: "Observaciones", value: String(m.observaciones) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>¿Eliminar esta medición?</CardTitle>
          <CardDescription>Esta acción no se puede deshacer.</CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="bg-muted/30 grid gap-2 rounded-lg border p-4 text-sm">
            {datos.map((dato) => (
              <div
                key={dato.label}
                className="grid grid-cols-[140px_1fr] items-center gap-2"
              >
                <dt className="text-muted-foreground">{dato.label}</dt>
                <dd className="min-w-0 font-medium">{dato.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>

        <CardFooter className="gap-2">
          <form action={eliminarMedicionAction}>
            <input type="hidden" name="paciente_id" value={String(pacienteId)} />
            <input type="hidden" name="medicion_id" value={String(medicionId)} />
            <Button type="submit" variant="destructive">
              Sí, eliminar
            </Button>
          </form>
          <Button variant="outline" asChild>
            <Link href={base}>Cancelar</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}
