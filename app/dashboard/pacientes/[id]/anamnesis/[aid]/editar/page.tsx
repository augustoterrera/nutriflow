import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

function splitToJsonArrayOrNull(input: FormDataEntryValue | null) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  // si ya viene JSON, lo dejamos si parsea
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return JSON.stringify(arr.map((x) => String(x).trim()).filter(Boolean));
    } catch {
      // cae al modo CSV
    }
  }

  // modo CSV: "manzana, banana"
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return arr.length ? JSON.stringify(arr) : null;
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
  const actividadFisica = toNullText(formData.get("actividad_fisica"));

  const frutasNoGusta = splitToJsonArrayOrNull(formData.get("frutas_no_gusta"));
  const verdurasNoGusta = splitToJsonArrayOrNull(formData.get("verduras_no_gusta"));

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
         consumo_agua = ?,
         actividad_fisica = ?,
         frutas_no_gusta = ?,
         verduras_no_gusta = ?
     where id = ? and paciente_id = ?`,
    [
      fecha,
      dieta,
      consumoAgua,
      actividadFisica,
      frutasNoGusta,
      verdurasNoGusta,
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

  // mostramos editable en formato "manzana, banana"
  const frutasTxt = prettyList(a.frutas_no_gusta);
  const verdurasTxt = prettyList(a.verduras_no_gusta);

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ margin: 0 }}>Editar anamnesis</h1>
      <div style={{ opacity: 0.75, marginTop: 6 }}>
        {paciente.nombre_completo} · DNI <b>{paciente.dni}</b>
      </div>

      <form
        action={editarAnamnesisAction}
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
        <input type="hidden" name="anamnesis_id" value={String(anamnesisId)} />

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Fecha *</label>
          <input name="fecha" type="date" defaultValue={String(a.fecha ?? "")} style={inputStyle} required />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Tipo de dieta</label>
          <select name="tipo_dieta" defaultValue={String(a.tipo_dieta ?? "omnivoro")} style={inputStyle as any}>
            <option value="omnivoro">Omnívoro</option>
            <option value="vegetariano">Vegetariano</option>
            <option value="vegano">Vegano</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Consumo de agua</label>
          <input
            name="consumo_agua"
            defaultValue={a.consumo_agua ?? ""}
            placeholder="Ej: 2 L/día"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Actividad física</label>
          <input
            name="actividad_fisica"
            defaultValue={a.actividad_fisica ?? ""}
            placeholder="Ej: 3x semana"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Frutas que no le gustan</label>
          <input
            name="frutas_no_gusta"
            defaultValue={frutasTxt}
            placeholder="Ej: banana, manzana"
            style={inputStyle}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Separá por coma. Se guarda como lista.
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Verduras que no le gustan</label>
          <input
            name="verduras_no_gusta"
            defaultValue={verdurasTxt}
            placeholder="Ej: brócoli, espinaca"
            style={inputStyle}
          />
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Separá por coma. Se guarda como lista.
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

          <Link href={`/dashboard/pacientes/${pacienteId}/anamnesis`} style={{ padding: "10px 12px" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
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

const labelStyle: React.CSSProperties = { opacity: 0.8, fontSize: 13 };

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  outline: "none",
};
