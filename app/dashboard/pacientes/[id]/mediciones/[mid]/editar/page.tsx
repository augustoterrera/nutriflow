import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

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

  if (!Number.isFinite(pacienteId) || !Number.isFinite(medicionId)) notFound();
  if (!fecha) throw new Error("La fecha es obligatoria.");

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
         brazo_cm = ?, muneca_cm = ?, actualizado_en = datetime('now')
     where id = ? and paciente_id = ?`,
    [fecha, pesoKg, alturaCm, cinturaCm, caderaCm, cuelloCm, grasaPct, musculoPct, brazoCm, munecaCm, medicionId, pacienteId]
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
    `select id, dni, nombre_completo from pacientes where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const medicion = await db.get(
    `select id, fecha, peso_kg, altura_cm, cintura_cm, cadera_cm, cuello_cm,
            grasa_pct, musculo_pct, brazo_cm, muneca_cm
     from mediciones
     where id = ? and paciente_id = ?`,
    [medicionId, pacienteId]
  );
  if (!medicion) notFound();

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ margin: 0 }}>Editar medición</h1>
      <div style={{ opacity: 0.75, marginTop: 6 }}>
        {paciente.nombre_completo} · DNI <b>{paciente.dni}</b>
      </div>

      <form
        action={editarMedicionAction}
        style={{
          marginTop: 14,
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 12,
        }}
      >
        <input type="hidden" name="paciente_id" value={String(pacienteId)} />
        <input type="hidden" name="medicion_id" value={String(medicionId)} />

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Fecha *</label>
          <input
            name="fecha"
            type="date"
            defaultValue={String(medicion.fecha ?? "")}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Peso (kg)</label>
          <input
            name="peso_kg"
            inputMode="decimal"
            defaultValue={medicion.peso_kg ?? ""}
            placeholder="Ej: 78.5"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Altura (cm)</label>
          <input
            name="altura_cm"
            inputMode="decimal"
            defaultValue={medicion.altura_cm ?? ""}
            placeholder="Ej: 175"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Cintura (cm)</label>
          <input
            name="cintura_cm"
            inputMode="decimal"
            defaultValue={medicion.cintura_cm ?? ""}
            placeholder="Ej: 92"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Cadera (cm)</label>
          <input name="cadera_cm" inputMode="decimal" defaultValue={medicion.cadera_cm ?? ""} placeholder="Ej: 102" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ opacity: 0.8, fontSize: 13 }}>Cuello (cm)</label>
          <input name="cuello_cm" inputMode="decimal" defaultValue={medicion.cuello_cm ?? ""} placeholder="Ej: 38" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ opacity: 0.8, fontSize: 13 }}>Grasa (%)</label>
            <input name="grasa_pct" inputMode="decimal" defaultValue={medicion.grasa_pct ?? ""} placeholder="Ej: 22" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ opacity: 0.8, fontSize: 13 }}>Músculo (%)</label>
            <input name="musculo_pct" inputMode="decimal" defaultValue={medicion.musculo_pct ?? ""} placeholder="Ej: 38" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ opacity: 0.8, fontSize: 13 }}>Brazo (cm)</label>
            <input name="brazo_cm" inputMode="decimal" defaultValue={medicion.brazo_cm ?? ""} placeholder="Ej: 32" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ opacity: 0.8, fontSize: 13 }}>Muñeca (cm)</label>
            <input name="muneca_cm" inputMode="decimal" defaultValue={medicion.muneca_cm ?? ""} placeholder="Ej: 16" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              fontWeight: 700,
            }}
          >
            Guardar cambios
          </button>

          <Link href={`/dashboard/pacientes/${pacienteId}/mediciones`} style={{ padding: "10px 12px" }}>
            Cancelar
          </Link>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Tip: podés usar coma o punto en decimales (ej: 78,5).
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  outline: "none",
};
