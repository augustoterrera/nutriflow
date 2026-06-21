import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

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
import { Input } from "@/components/ui/input";

// Normaliza a CSV plano ("manzana, banana"), el mismo formato que usa "nueva anamnesis".
// Acepta JSON viejo ('["a","b"]') de registros editados con la versión anterior.
function toCsvOrNull(input: FormDataEntryValue | null) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  let parts: string[];
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const arr = JSON.parse(raw);
      parts = Array.isArray(arr) ? arr.map((x) => String(x)) : raw.split(",");
    } catch {
      parts = raw.split(",");
    }
  } else {
    parts = raw.split(",");
  }

  const limpio = parts.map((s) => s.trim()).filter(Boolean);
  return limpio.length ? limpio.join(", ") : null;
}

function toNullText(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

async function editarAnamnesisAction(formData: FormData) {
  "use server";

  const pacienteId = Number(formData.get("paciente_id"));
  const anamnesisId = Number(formData.get("anamnesis_id"));

  const fecha = String(formData.get("fecha") ?? "").trim();
  const tipoDieta = String(formData.get("tipo_dieta") ?? "").trim();

  const consumoAgua = toNullText(formData.get("consumo_agua"));
  const consumoVerduras = toNullText(formData.get("consumo_verduras"));
  const consumoFrutas = toNullText(formData.get("consumo_frutas"));
  const consumoCarnes = toNullText(formData.get("consumo_carnes"));
  const actividadFisica = toNullText(formData.get("actividad_fisica"));
  const consumeSuplementos = formData.get("consume_suplementos") ? 1 : 0;
  const suplementosDetalle = toNullText(formData.get("suplementos_detalle"));
  const observaciones = toNullText(formData.get("observaciones"));

  const frutasNoGusta = toCsvOrNull(formData.get("frutas_no_gusta"));
  const verdurasNoGusta = toCsvOrNull(formData.get("verduras_no_gusta"));

  if (!Number.isFinite(pacienteId) || !Number.isFinite(anamnesisId)) notFound();
  if (!fecha) throw new Error("La fecha es obligatoria.");

  // normalizamos dieta
  const dieta = tipoDieta || "omnivoro";

  const db = await getDB();

  // seguridad: editar solo si pertenece al paciente
  const row = await db.get(
    `select id from anamnesis where id = ? and paciente_id = ?`,
    [anamnesisId, pacienteId]
  );
  if (!row) notFound();

  await db.run(
    `update anamnesis
     set fecha = ?,
         tipo_dieta = ?,
         consumo_verduras = ?,
         consumo_frutas = ?,
         consumo_carnes = ?,
         consumo_agua = ?,
         actividad_fisica = ?,
         consume_suplementos = ?,
         suplementos_detalle = ?,
         frutas_no_gusta = ?,
         verduras_no_gusta = ?,
         observaciones = ?,
         actualizado_en = datetime('now')
     where id = ? and paciente_id = ?`,
    [
      fecha,
      dieta,
      consumoVerduras,
      consumoFrutas,
      consumoCarnes,
      consumoAgua,
      actividadFisica,
      consumeSuplementos,
      suplementosDetalle,
      frutasNoGusta,
      verdurasNoGusta,
      observaciones,
      anamnesisId,
      pacienteId,
    ]
  );

  redirect(`/dashboard/pacientes/${pacienteId}/anamnesis`);
}

export default async function EditarAnamnesisPage(props: {
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

  return (
    <PageShell>
      <PacienteWorkspaceHeader paciente={paciente} />

      <Card>
        <CardHeader>
          <CardTitle>Editar anamnesis</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={editarAnamnesisAction}>
            <Input type="hidden" name="paciente_id" value={String(pacienteId)} />
            <Input type="hidden" name="anamnesis_id" value={String(anamnesisId)} />

            <AnamnesisForm
              defaultValues={{
                fecha: String(a.fecha ?? "").slice(0, 10),
                tipo_dieta: a.tipo_dieta,
                consumo_verduras: a.consumo_verduras,
                consumo_frutas: a.consumo_frutas,
                consumo_carnes: a.consumo_carnes,
                consumo_agua: a.consumo_agua,
                actividad_fisica: a.actividad_fisica,
                consume_suplementos: a.consume_suplementos,
                suplementos_detalle: a.suplementos_detalle,
                frutas_no_gusta: prettyList(a.frutas_no_gusta),
                verduras_no_gusta: prettyList(a.verduras_no_gusta),
                observaciones: a.observaciones,
              }}
            >
              <div className="flex gap-2">
                <Button type="submit">Guardar cambios</Button>
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

function prettyList(v: any) {
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
