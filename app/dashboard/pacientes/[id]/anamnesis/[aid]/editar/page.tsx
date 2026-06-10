import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDB } from "@/lib/db";

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
    `select id, dni, nombre_completo from pacientes where id = ? and activo = 1`,
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
          <label style={labelStyle}>Consumo de verduras</label>
          <input
            name="consumo_verduras"
            defaultValue={a.consumo_verduras ?? ""}
            placeholder="Ej: 2 porciones/día"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Consumo de frutas</label>
          <input
            name="consumo_frutas"
            defaultValue={a.consumo_frutas ?? ""}
            placeholder="Ej: 1 fruta/día"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Consumo de carnes</label>
          <input
            name="consumo_carnes"
            defaultValue={a.consumo_carnes ?? ""}
            placeholder="Ej: 4 veces/sem"
            style={inputStyle}
          />
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

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            name="consume_suplementos"
            value="1"
            defaultChecked={Boolean(a.consume_suplementos)}
          />
          <span style={labelStyle}>Consume suplementos</span>
        </label>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Detalle de suplementos</label>
          <input
            name="suplementos_detalle"
            defaultValue={a.suplementos_detalle ?? ""}
            placeholder="Ej: creatina, proteína"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={labelStyle}>Observaciones</label>
          <textarea
            name="observaciones"
            rows={5}
            defaultValue={a.observaciones ?? ""}
            style={inputStyle}
          />
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
