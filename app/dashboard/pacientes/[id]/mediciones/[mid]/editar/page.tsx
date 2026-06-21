import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

import { PageShell } from "@/components/shared/page-shell";
import { PacienteWorkspaceHeader } from "@/components/pacientes/paciente-workspace-header";
import { MedicionForm } from "@/components/mediciones/MedicionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function toNullNumber(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function editarMedicionAction(formData: FormData) {
  "use server";

  const pacienteId = Number(formData.get("paciente_id"));
  const medicionId = Number(formData.get("medicion_id"));

  const fecha = String(formData.get("fecha") ?? "").trim();
  const pesoKg = toNullNumber(formData.get("peso_kg"));
  const alturaCm = toNullNumber(formData.get("altura_cm"));
  const cinturaCm = toNullNumber(formData.get("cintura_cm"));
  const caderaCm = toNullNumber(formData.get("cadera_cm"));
  const cuelloCm = toNullNumber(formData.get("cuello_cm"));
  const grasaPct = toNullNumber(formData.get("grasa_pct"));
  const musculoPct = toNullNumber(formData.get("musculo_pct"));
  const brazoCm = toNullNumber(formData.get("brazo_cm"));
  const munecaCm = toNullNumber(formData.get("muneca_cm"));
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  if (!Number.isFinite(pacienteId) || !Number.isFinite(medicionId)) notFound();
  if (!fecha) throw new Error("La fecha es obligatoria.");

  // Mismas validaciones que al crear la medición
  if (pesoKg !== null && (pesoKg <= 0 || pesoKg > 500)) {
    throw new Error("Peso inválido.");
  }
  if (alturaCm !== null && (alturaCm <= 0 || alturaCm > 250)) {
    throw new Error("Altura inválida.");
  }

  const db = await getDB();

  // seguridad: editar solo si pertenece a ese paciente
  const row = await db.get(
    `select id from mediciones where id = ? and paciente_id = ?`,
    [medicionId, pacienteId]
  );
  if (!row) notFound();

  await db.run(
    `update mediciones
     set fecha = ?, peso_kg = ?, altura_cm = ?, cintura_cm = ?,
         cadera_cm = ?, cuello_cm = ?, grasa_pct = ?, musculo_pct = ?,
         brazo_cm = ?, muneca_cm = ?, observaciones = ?, actualizado_en = datetime('now')
     where id = ? and paciente_id = ?`,
    [fecha, pesoKg, alturaCm, cinturaCm, caderaCm, cuelloCm, grasaPct, musculoPct, brazoCm, munecaCm, observaciones, medicionId, pacienteId]
  );

  redirect(`/dashboard/pacientes/${pacienteId}/mediciones`);
}

export default async function EditarMedicionPage(props: {
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

  const medicion = await db.get(
    `select id, fecha, peso_kg, altura_cm, cintura_cm, cadera_cm, cuello_cm,
            grasa_pct, musculo_pct, brazo_cm, muneca_cm, observaciones
     from mediciones
     where id = ? and paciente_id = ?`,
    [medicionId, pacienteId]
  );
  if (!medicion) notFound();

  const base = `/dashboard/pacientes/${pacienteId}/mediciones`;

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card>
        <CardHeader>
          <CardTitle>Editar medición</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={editarMedicionAction}>
            <input type="hidden" name="paciente_id" value={String(pacienteId)} />
            <input type="hidden" name="medicion_id" value={String(medicionId)} />

            <MedicionForm
              defaultValues={{
                fecha: String(medicion.fecha ?? "").slice(0, 10),
                peso_kg: medicion.peso_kg,
                altura_cm: medicion.altura_cm,
                cintura_cm: medicion.cintura_cm,
                cadera_cm: medicion.cadera_cm,
                cuello_cm: medicion.cuello_cm,
                grasa_pct: medicion.grasa_pct,
                musculo_pct: medicion.musculo_pct,
                brazo_cm: medicion.brazo_cm,
                muneca_cm: medicion.muneca_cm,
                observaciones: medicion.observaciones,
              }}
            >
              <div className="flex gap-2">
                <Button type="submit">Guardar cambios</Button>
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
