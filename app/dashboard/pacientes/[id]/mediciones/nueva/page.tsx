import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import { MedicionForm } from "@/components/mediciones/MedicionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function crearMedicionAction(pacienteId: number, formData: FormData) {
  "use server";

  const fecha = String(formData.get("fecha") ?? "").trim() || null;

  const pesoRaw = String(formData.get("peso_kg") ?? "").trim();
  const alturaRaw = String(formData.get("altura_cm") ?? "").trim();
  const cinturaRaw = String(formData.get("cintura_cm") ?? "").trim();
  const caderaRaw = String(formData.get("cadera_cm") ?? "").trim();
  const cuelloRaw = String(formData.get("cuello_cm") ?? "").trim();
  const grasaRaw = String(formData.get("grasa_pct") ?? "").trim();
  const musculoRaw = String(formData.get("musculo_pct") ?? "").trim();
  const brazoRaw = String(formData.get("brazo_cm") ?? "").trim();
  const munecaRaw = String(formData.get("muneca_cm") ?? "").trim();
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  const toNum = (v: string) => {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const peso_kg = toNum(pesoRaw);
  const altura_cm = toNum(alturaRaw);
  const cintura_cm = toNum(cinturaRaw);
  const cadera_cm = toNum(caderaRaw);
  const cuello_cm = toNum(cuelloRaw);
  const grasa_pct = toNum(grasaRaw);
  const musculo_pct = toNum(musculoRaw);
  const brazo_cm = toNum(brazoRaw);
  const muneca_cm = toNum(munecaRaw);

  if (peso_kg !== null && (peso_kg <= 0 || peso_kg > 500)) {
    throw new Error("Peso inválido.");
  }
  if (altura_cm !== null && (altura_cm <= 0 || altura_cm > 250)) {
    throw new Error("Altura inválida.");
  }

  const db = await getDB();

  await db.run(
    `insert into mediciones (
      paciente_id, fecha,
      peso_kg, altura_cm,
      cintura_cm, cadera_cm, cuello_cm,
      grasa_pct, musculo_pct, brazo_cm, muneca_cm,
      observaciones, actualizado_en
    ) values (
      ?, coalesce(?, date('now')),
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, datetime('now')
    )`,
    [
      pacienteId,
      fecha,
      peso_kg,
      altura_cm,
      cintura_cm,
      cadera_cm,
      cuello_cm,
      grasa_pct,
      musculo_pct,
      brazo_cm,
      muneca_cm,
      observaciones,
    ]
  );

  redirect(`/dashboard/pacientes/${pacienteId}/mediciones`);
}

export default async function NuevaMedicionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const db = await getDB();
  const paciente = await db.get(
    `select id, dni, nombre_completo, fecha_nacimiento, sexo, ocupacion
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const action = crearMedicionAction.bind(null, pacienteId);
  const base = `/dashboard/pacientes/${pacienteId}/mediciones`;

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card>
        <CardHeader>
          <CardTitle>Nueva medición</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <MedicionForm>
              <div className="flex gap-2">
                <Button type="submit">Guardar medición</Button>
                <Button variant="outline" asChild>
                  <Link href={base}>Cancelar</Link>
                </Button>
              </div>
            </MedicionForm>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
