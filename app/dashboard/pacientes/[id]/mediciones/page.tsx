import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";

const PAGE_SIZE = 15;

export default async function MedicionesHistorialPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ p?: string }>;
}) {
  const { id: idStr } = await props.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const sp = (await props.searchParams) ?? {};
  const page = Math.max(1, Number(sp.p ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const db = await getDB();

  const paciente = await db.get(
    `select id, dni, nombre_completo
     from pacientes
     where id = ? and activo = 1`,
    [id]
  );
  if (!paciente) notFound();

  const rowCount = await db.get(
    `select count(*) as total
     from mediciones
     where paciente_id = ?`,
    [id]
  );

  const total = Number(rowCount?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // si p es demasiado grande, corregimos bajando a la última
  const safePage = Math.min(page, totalPages);
  const safeOffset = (safePage - 1) * PAGE_SIZE;

  const mediciones = await db.all(
    `select id, fecha, peso_kg, altura_cm, cintura_cm, cadera_cm,
            grasa_pct, musculo_pct, brazo_cm, muneca_cm
     from mediciones
     where paciente_id = ?
     order by date(fecha) desc, id desc
     limit ? offset ?`,
    [id, PAGE_SIZE, safeOffset]
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Mediciones</h1>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            {paciente.nombre_completo} · DNI <b>{paciente.dni}</b>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link 
          href={`/dashboard/pacientes/${id}`} 
          style={{ padding: 10 }} 
          className="bg-slate-800 rounded-md border">
            Volver al paciente
          </Link>
          <Link 
          href={`/dashboard/pacientes/${id}/mediciones/nueva`}
           style={{ padding: 10 }} 
           className="bg-slate-800 rounded-md border">
            Nueva medición
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 16, opacity: 0.8, fontSize: 13 }}>
        Total: <b>{total}</b> · Página <b>{safePage}</b> de <b>{totalPages}</b>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ opacity: 0.8, textAlign: "left" }}>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Peso</th>
              <th style={thStyle}>Altura</th>
              <th style={thStyle}>Cintura</th>
              <th style={thStyle}>IMC</th>
              <th style={thStyle}>WHtR</th>
              <th style={thStyle}>Extra</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {mediciones.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={8}>
                  No hay mediciones cargadas.
                </td>
              </tr>
            ) : (
              mediciones.map((m: any) => {
                const imc =
                  m?.peso_kg && m?.altura_cm
                    ? calcularIMC(Number(m.peso_kg), Number(m.altura_cm))
                    : null;

                const whtr =
                  m?.cintura_cm && m?.altura_cm
                    ? Number(m.cintura_cm) / Number(m.altura_cm)
                    : null;

                return (
                  <tr key={m.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={tdStyle}>{m.fecha}</td>
                    <td style={tdStyle}>{m.peso_kg ? `${Number(m.peso_kg).toFixed(1)} kg` : "-"}</td>
                    <td style={tdStyle}>{m.altura_cm ? `${Number(m.altura_cm).toFixed(0)} cm` : "-"}</td>
                    <td style={tdStyle}>{m.cintura_cm ? `${Number(m.cintura_cm).toFixed(1)} cm` : "-"}</td>
                    <td style={tdStyle}>{imc !== null ? imc.toFixed(1) : "-"}</td>
                    <td style={tdStyle}>{whtr !== null ? whtr.toFixed(2) : "-"}</td>
                    <td style={tdStyle}>
                      {[
                        m.grasa_pct ? `Grasa ${Number(m.grasa_pct).toFixed(1)}%` : null,
                        m.musculo_pct ? `Músculo ${Number(m.musculo_pct).toFixed(1)}%` : null,
                        m.brazo_cm ? `Brazo ${Number(m.brazo_cm).toFixed(1)} cm` : null,
                        m.muneca_cm ? `Muñeca ${Number(m.muneca_cm).toFixed(1)} cm` : null,
                      ].filter(Boolean).join(" · ") || "-"}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/dashboard/pacientes/${id}/mediciones/${m.id}/editar`}
                        style={{ padding: "6px 10px", display: "inline-block" }}
                        className="bg-blue-700 hover:bg-blue-500 text-white rounded-md"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/dashboard/pacientes/${id}/mediciones/${m.id}/eliminar`}
                        style={{ padding: "6px 10px", display: "inline-block", opacity: 0.85 }}
                        className="bg-red-600 hover:bg-red-500 text-white m-2 rounded-md"
                      >
                        Eliminar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <Link
          href={`/dashboard/pacientes/${id}/mediciones?p=${Math.max(1, safePage - 1)}`}
          style={{
            padding: "8px 10px",
            pointerEvents: safePage <= 1 ? "none" : "auto",
            opacity: safePage <= 1 ? 0.4 : 1,
          }}
        >
          ← Anterior
        </Link>

        <Link
          href={`/dashboard/pacientes/${id}/mediciones?p=${Math.min(totalPages, safePage + 1)}`}
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

function calcularIMC(pesoKg: number, alturaCm: number) {
  const m = alturaCm / 100;
  if (!m) return NaN;
  return pesoKg / (m * m);
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
