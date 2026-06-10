import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerSimple } from "@/components/pacientes/Date-picker";

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
      observaciones
    ) values (
      ?, coalesce(?, date('now')),
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?
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

  redirect(`/dashboard/pacientes/${pacienteId}`);
}

export default async function NuevaMedicionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const db = await getDB();
  const paciente = await db.get(
    `select id, nombre_completo, dni
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  );

  if (!paciente) notFound();

  const action = crearMedicionAction.bind(null, pacienteId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Nueva medición</h1>
          <p className="text-sm text-muted-foreground">
            Paciente: <b>{paciente.nombre_completo}</b> · DNI: {paciente.dni}
          </p>
        </div>

        <Button variant="secondary" asChild className="bg-primary border">
          <Link href={`/dashboard/pacientes/${pacienteId}`}>Volver</Link>
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <DatePickerSimple name="fecha"></DatePickerSimple>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="peso_kg">Peso (kg)</Label>
                <Input id="peso_kg" name="peso_kg" inputMode="decimal" placeholder="Ej: 82.5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura_cm">Altura (cm)</Label>
                <Input id="altura_cm" name="altura_cm" inputMode="decimal" placeholder="Ej: 175" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cintura_cm">Cintura (cm)</Label>
                <Input id="cintura_cm" name="cintura_cm" inputMode="decimal" placeholder="Ej: 92" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cadera_cm">Cadera (cm)</Label>
                <Input id="cadera_cm" name="cadera_cm" inputMode="decimal" placeholder="Ej: 102" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuello_cm">Cuello (cm)</Label>
                <Input id="cuello_cm" name="cuello_cm" inputMode="decimal" placeholder="Ej: 38" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="grasa_pct">Grasa (%)</Label>
                <Input id="grasa_pct" name="grasa_pct" inputMode="decimal" placeholder="Ej: 22" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musculo_pct">Músculo (%)</Label>
                <Input id="musculo_pct" name="musculo_pct" inputMode="decimal" placeholder="Ej: 38" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brazo_cm">Brazo (cm)</Label>
                <Input id="brazo_cm" name="brazo_cm" inputMode="decimal" placeholder="Ej: 32" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="muneca_cm">Muñeca (cm)</Label>
                <Input id="muneca_cm" name="muneca_cm" inputMode="decimal" placeholder="Ej: 16" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={5}
                className="w-full rounded-md border bg-background p-3 text-sm"
                placeholder="Notas de la medición..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="border border-border bg-blue-600 rounded-md">Guardar</Button>
              <Button variant="secondary" type="reset" className="border border-border bg-red-600">
                Limpiar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Nota: el IMC se calcula automáticamente con peso y altura en el perfil del paciente.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
