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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function eliminarAnamnesisAction(formData: FormData) {
  "use server";

  const pacienteId = Number(formData.get("paciente_id"));
  const anamnesisId = Number(formData.get("anamnesis_id"));

  if (!Number.isFinite(pacienteId) || !Number.isFinite(anamnesisId)) notFound();

  const db = await getDB();

  // seguridad: borrar solo si pertenece al paciente
  const row = await db.get(
    `select id from anamnesis where id = ? and paciente_id = ?`,
    [anamnesisId, pacienteId]
  );
  if (!row) notFound();

  await db.run(`delete from anamnesis where id = ? and paciente_id = ?`, [
    anamnesisId,
    pacienteId,
  ]);

  redirect(`/dashboard/pacientes/${pacienteId}/anamnesis`);
}

export default async function EliminarAnamnesisPage(props: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id: idStr, aid: aidStr } = await props.params;

  const pacienteId = Number(idStr);
  const anamnesisId = Number(aidStr);

  if (!Number.isFinite(pacienteId) || !Number.isFinite(anamnesisId)) notFound();

  const db = await getDB();

  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const a = await db.get(
    `select id, fecha, tipo_dieta,
            consumo_verduras, consumo_frutas, consumo_carnes, consumo_agua,
            actividad_fisica, consume_suplementos, suplementos_detalle,
            frutas_no_gusta, verduras_no_gusta, observaciones
     from anamnesis
     where id = ? and paciente_id = ?`,
    [anamnesisId, pacienteId]
  );
  if (!a) notFound();

  const base = `/dashboard/pacientes/${pacienteId}/anamnesis`;

  const preferencias = [
    a.frutas_no_gusta ? `Frutas: ${compact(a.frutas_no_gusta)}` : null,
    a.verduras_no_gusta ? `Verduras: ${compact(a.verduras_no_gusta)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>¿Eliminar esta anamnesis?</CardTitle>
          <CardDescription>Esta acción no se puede deshacer.</CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="bg-muted/30 grid gap-2 rounded-lg border p-4 text-sm">
            <Dato label="Fecha">
              <span className="font-medium">{a.fecha}</span>
            </Dato>
            <Dato label="Dieta">
              <Badge variant="secondary">{labelDieta(a.tipo_dieta)}</Badge>
            </Dato>
            <Dato label="Agua">{a.consumo_agua ?? "—"}</Dato>
            <Dato label="Actividad física">{a.actividad_fisica ?? "—"}</Dato>
            {a.consume_suplementos ? (
              <Dato label="Suplementos">{a.suplementos_detalle || "Sí"}</Dato>
            ) : null}
            {preferencias ? <Dato label="Preferencias">{preferencias}</Dato> : null}
            {a.observaciones ? (
              <Dato label="Observaciones">
                <span className="text-muted-foreground">{a.observaciones}</span>
              </Dato>
            ) : null}
          </dl>
        </CardContent>

        <CardFooter className="gap-2">
          <form action={eliminarAnamnesisAction}>
            <input type="hidden" name="paciente_id" value={String(pacienteId)} />
            <input type="hidden" name="anamnesis_id" value={String(anamnesisId)} />
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

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function labelDieta(v: any) {
  if (v === "vegano") return "Vegano";
  if (v === "vegetariano") return "Vegetariano";
  return "Omnívoro";
}

function compact(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.join(", ");
    } catch {}
  }
  return s;
}
