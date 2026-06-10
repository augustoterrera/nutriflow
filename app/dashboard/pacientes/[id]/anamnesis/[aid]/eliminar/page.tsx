import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

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
  params:
    | Promise<{ id: string; aid: string }>
    | { id: string; aid: string };
}) {
  const { id: idStr, aid: aidStr } = await props.params;

  const pacienteId = Number(idStr);
  const anamnesisId = Number(aidStr);

  if (!Number.isFinite(pacienteId) || !Number.isFinite(anamnesisId)) notFound();

  const db = await getDB();

  const paciente = await db.get(
    `select id, dni, nombre_completo from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const a = await db.get(
    `select id, fecha, tipo_dieta, consumo_agua, actividad_fisica, frutas_no_gusta, verduras_no_gusta
     from anamnesis
     where id = ? and paciente_id = ?`,
    [anamnesisId, pacienteId]
  );
  if (!a) notFound();

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ margin: 0 }}>Eliminar anamnesis</h1>
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
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Vas a borrar este registro:</div>

        <div style={{ fontSize: 13, opacity: 0.9, display: "grid", gap: 4 }}>
          <div>
            <b>Fecha:</b> {a.fecha}
          </div>
          <div>
            <b>Dieta:</b> {labelDieta(a.tipo_dieta)}
          </div>
          <div>
            <b>Agua:</b> {a.consumo_agua ?? "-"}
          </div>
          <div>
            <b>Actividad física:</b> {a.actividad_fisica ?? "-"}
          </div>

          {(a.frutas_no_gusta || a.verduras_no_gusta) ? (
            <div style={{ marginTop: 6, opacity: 0.9 }}>
              <b>Preferencias:</b>{" "}
              {a.frutas_no_gusta ? <>Frutas: {compact(a.frutas_no_gusta)}. </> : null}
              {a.verduras_no_gusta ? <>Verduras: {compact(a.verduras_no_gusta)}.</> : null}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Esta acción no se puede deshacer.
        </div>
      </div>

      <form action={eliminarAnamnesisAction} style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <input type="hidden" name="paciente_id" value={String(pacienteId)} />
        <input type="hidden" name="anamnesis_id" value={String(anamnesisId)} />

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

        <Link href={`/dashboard/pacientes/${pacienteId}/anamnesis`} style={{ padding: "10px 12px" }}>
          Cancelar
        </Link>
      </form>
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
