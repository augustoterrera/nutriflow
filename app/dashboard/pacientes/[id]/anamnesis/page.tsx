import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";

const PAGE_SIZE = 15;

export default async function AnamnesisHistorialPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ p?: string }>;
}) {
  const { id: idStr } = await props.params;
  const pacienteId = Number(idStr);
  if (!Number.isFinite(pacienteId)) notFound();

  const sp = (await props.searchParams) ?? {};
  const page = Math.max(1, Number(sp.p ?? 1) || 1);

  const db = await getDB();

  const paciente = await db.get(
    `select id, dni, nombre_completo
     from pacientes
     where id = ? and activo = 1`,
    [pacienteId]
  );
  if (!paciente) notFound();

  const rowCount = await db.get(
    `select count(*) as total
     from anamnesis
     where paciente_id = ?`,
    [pacienteId]
  );

  const total = Number(rowCount?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const anamnesis = await db.all(
    `select id, fecha, tipo_dieta,
            consumo_verduras, consumo_frutas, consumo_carnes, consumo_agua,
            actividad_fisica, consume_suplementos, suplementos_detalle,
            frutas_no_gusta, verduras_no_gusta, observaciones
     from anamnesis
     where paciente_id = ?
     order by date(fecha) desc, id desc
     limit ? offset ?`,
    [pacienteId, PAGE_SIZE, offset]
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Anamnesis</h1>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            {paciente.nombre_completo} · DNI <b>{paciente.dni}</b>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={`/dashboard/pacientes/${pacienteId}/anamnesis/nueva`}
            style={{ padding: 10 }}
            className="bg-slate-800 border-2 rounded-md"
          >
            Nueva anamnesis
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 16, opacity: 0.8, fontSize: 13 }}>
        Total: <b>{total}</b> · Página <b>{safePage}</b> de <b>{totalPages}</b>
      </div>

      {anamnesis.length === 0 ? (
        <p style={{ marginTop: 12, opacity: 0.8 }}>No hay anamnesis cargadas.</p>
      ) : (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ opacity: 0.85, textAlign: "left" }}>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Dieta</th>
                <th style={thStyle}>Consumos</th>
                <th style={thStyle}>Actividad física</th>
                <th style={thStyle}>Suplementos</th>
                <th style={thStyle}>Preferencias</th>
                <th style={thStyle}>Obs.</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {anamnesis.map((a: any) => {
                const pref = [
                  a.frutas_no_gusta ? `Frutas: ${compact(a.frutas_no_gusta)}` : null,
                  a.verduras_no_gusta ? `Verduras: ${compact(a.verduras_no_gusta)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                const consumos = [
                  a.consumo_verduras ? `Verd: ${a.consumo_verduras}` : null,
                  a.consumo_frutas ? `Frutas: ${a.consumo_frutas}` : null,
                  a.consumo_carnes ? `Carnes: ${a.consumo_carnes}` : null,
                  a.consumo_agua ? `Agua: ${a.consumo_agua}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr key={a.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={tdStyle}>{a.fecha}</td>
                    <td style={tdStyle}>{labelDieta(a.tipo_dieta)}</td>
                    <td style={tdStyle}>{consumos || "-"}</td>
                    <td style={tdStyle}>{a.actividad_fisica ?? "-"}</td>
                    <td style={tdStyle}>{a.consume_suplementos ? (a.suplementos_detalle || "Sí") : "-"}</td>
                    <td style={tdStyle}>{pref || "-"}</td>
                    <td style={tdStyle}>{a.observaciones ?? "-"}</td>

                    <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/dashboard/pacientes/${pacienteId}/anamnesis/${a.id}/editar`}
                        style={{ padding: "6px 10px", display: "inline-block" }}
                        className="bg-blue-700 hover:bg-blue-500 text-white rounded-md"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/dashboard/pacientes/${pacienteId}/anamnesis/${a.id}/eliminar`}
                        style={{ padding: "6px 10px", display: "inline-block", opacity: 0.85 }}
                        className="bg-red-600 hover:bg-red-500 text-white m-2 rounded-md"
                      >
                        Eliminar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <Link
          href={`/dashboard/pacientes/${pacienteId}/anamnesis?p=${Math.max(1, safePage - 1)}`}
          style={{
            padding: "8px 10px",
            pointerEvents: safePage <= 1 ? "none" : "auto",
            opacity: safePage <= 1 ? 0.4 : 1,
          }}
        >
          ← Anterior
        </Link>

        <Link
          href={`/dashboard/pacientes/${pacienteId}/anamnesis?p=${Math.min(totalPages, safePage + 1)}`}
          style={{
            padding: "8px 10px",
            pointerEvents: safePage >= totalPages ? "none" : "auto",
            opacity: safePage >= totalPages ? 0.4 : 1,
          }}
        >
          Siguiente →
        </Link>
      </div>
    </div>
  );
}

function labelDieta(v: any) {
  if (v === "vegano") return "Vegano";
  if (v === "vegetariano") return "Vegetariano";
  return "Omnívoro";
}

function compact(v: any) {
  // si guardás arrays como JSON string, lo mostramos lindo
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.join(", ");
    } catch { }
  }
  return s;
}

const thStyle: React.CSSProperties = {
  padding: "8px 8px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 8px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};
