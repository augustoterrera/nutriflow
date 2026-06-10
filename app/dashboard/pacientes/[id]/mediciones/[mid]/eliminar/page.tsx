import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

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
    `select id, dni, nombre_completo from pacientes where id = ? and activo = 1`,
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

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ margin: 0 }}>Eliminar medición</h1>
      <div style={{ opacity: 0.75, marginTop: 6 }}>
        {paciente.nombre_completo} · DNI <b>{paciente.dni}</b>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Vas a borrar esta medición:</div>
        <div style={{ fontSize: 13, opacity: 0.9, display: "grid", gap: 4 }}>
          <div>
            <b>Fecha:</b> {medicion.fecha}
          </div>
          <div>
            <b>Peso:</b> {medicion.peso_kg ?? "-"} kg
          </div>
          <div>
            <b>Altura:</b> {medicion.altura_cm ?? "-"} cm
          </div>
          <div>
            <b>Cintura:</b> {medicion.cintura_cm ?? "-"} cm
          </div>
          {medicion.cadera_cm ? <div><b>Cadera:</b> {medicion.cadera_cm} cm</div> : null}
          {medicion.cuello_cm ? <div><b>Cuello:</b> {medicion.cuello_cm} cm</div> : null}
          {medicion.grasa_pct ? <div><b>Grasa:</b> {medicion.grasa_pct}%</div> : null}
          {medicion.musculo_pct ? <div><b>Músculo:</b> {medicion.musculo_pct}%</div> : null}
          {medicion.brazo_cm ? <div><b>Brazo:</b> {medicion.brazo_cm} cm</div> : null}
          {medicion.muneca_cm ? <div><b>Muñeca:</b> {medicion.muneca_cm} cm</div> : null}
          {medicion.observaciones ? <div><b>Observaciones:</b> {medicion.observaciones}</div> : null}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Esta acción no se puede deshacer.
        </div>
      </div>

      <form action={eliminarMedicionAction} style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <input type="hidden" name="paciente_id" value={String(pacienteId)} />
        <input type="hidden" name="medicion_id" value={String(medicionId)} />

        <button
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.15)",
            color: "#ef4444",
            fontWeight: 700,
          }}
        >
          Eliminar
        </button>

        <Link
          href={`/dashboard/pacientes/${pacienteId}/mediciones`}
          style={{ padding: "10px 12px" }}
        >
          Cancelar
        </Link>
      </form>
    </div>
  );
}
