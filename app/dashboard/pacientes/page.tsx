import Link from "next/link";
import { getDB } from "@/lib/db";

const PAGE_SIZE = 15;

export default async function PacientesPage(props: {
  searchParams?: Promise<{ q?: string; p?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const q = (sp?.q ?? "").trim();
  const page = Math.max(1, Number(sp?.p ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const db = await getDB();

  const where = q
    ? `where activo = 1 and (dni like ? or nombre_completo like ?)`
    : `where activo = 1`;

  const paramsCount = q ? [`%${q}%`, `%${q}%`] : [];
  const rowCount = await db.get(
    `select count(*) as total
     from pacientes
     ${where}`,
    paramsCount
  );

  const total = Number(rowCount?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const safeOffset = (safePage - 1) * PAGE_SIZE;

  const paramsList = q
    ? [`%${q}%`, `%${q}%`, PAGE_SIZE, safeOffset]
    : [PAGE_SIZE, safeOffset];

  const pacientes = await db.all(
    q
      ? `select id, dni, nombre_completo, telefono
         from pacientes
         ${where}
         order by nombre_completo asc
         limit ? offset ?`
      : `select id, dni, nombre_completo, telefono
         from pacientes
         ${where}
         order by nombre_completo asc
         limit ? offset ?`,
    paramsList
  );

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0 }}>Pacientes</h1>

      <form style={{ margin: "12px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por DNI o nombre…"
          style={{ padding: 10, width: 320 }}
        />
        <button style={{ padding: 10 }}>Buscar</button>

        <Link href="/dashboard/pacientes/nuevo" style={{ padding: 10 }}>
          Nuevo paciente
        </Link>
      </form>

      <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>
        Total: <b>{total}</b> · Página <b>{safePage}</b> de <b>{totalPages}</b>
      </div>

      {pacientes.length === 0 ? (
        <p>No hay pacientes todavía.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.85 }}>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>DNI</th>
                <th style={thStyle}>Teléfono</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pacientes.map((p: any) => (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/pacientes/${p.id}`}>{p.nombre_completo}</Link>
                  </td>
                  <td style={tdStyle}>{p.dni}</td>
                  <td style={tdStyle}>{p.telefono ?? "-"}</td>

                  <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/dashboard/pacientes/${p.id}/editar`}
                      style={{ padding: "6px 10px", display: "inline-block" }}
                      className="bg-blue-700 hover:bg-blue-500 text-primary-foreground rounded-md"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/dashboard/pacientes/${p.id}/desactivar`}
                      style={{ padding: "6px 10px", display: "inline-block", opacity: 0.85 }}
                      className="bg-red-600 hover:bg-red-500 text-primary-foreground m-2 rounded-md"
                    >
                      Desactivar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <Link
          href={`/dashboard/pacientes?p=${Math.max(1, safePage - 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          style={{
            padding: "8px 10px",
            pointerEvents: safePage <= 1 ? "none" : "auto",
            opacity: safePage <= 1 ? 0.4 : 1,
          }}
        >
          ← Anterior
        </Link>

        <Link
          href={`/dashboard/pacientes?p=${Math.min(totalPages, safePage + 1)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
