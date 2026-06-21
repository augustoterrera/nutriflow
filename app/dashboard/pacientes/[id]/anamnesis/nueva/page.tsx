import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { crearAnamnesisAction } from "./actions";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import { AnamnesisForm } from "@/components/anamnesis/AnamnesisForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NuevaAnamnesisPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const action = crearAnamnesisAction.bind(null, pacienteId);

  const db = await getDB();
  const paciente = await db.get(
    `select id, nombre_completo, dni, fecha_nacimiento, sexo, ocupacion
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const base = `/dashboard/pacientes/${pacienteId}/anamnesis`;

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card>
        <CardHeader>
          <CardTitle>Nueva anamnesis</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <AnamnesisForm>
              <div className="flex gap-2">
                <Button type="submit">Guardar anamnesis</Button>
                <Button variant="outline" asChild>
                  <Link href={base}>Cancelar</Link>
                </Button>
              </div>
            </AnamnesisForm>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
