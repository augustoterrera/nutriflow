import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { ImcCard } from "@/components/pacientes/ImcCard";
import { RiesgoCardiometabolico } from "@/components/pacientes/RiesgoCardiometabolico";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Activity
} from "lucide-react";
import { EvolucionDialog } from "@/components/pacientes/EvolucionDialog";

export default async function PacientePage(props: {
    params: Promise<{ id: string }> | { id: string };
}) {

    const { id: idStr } = await props.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) notFound();

    const db = await getDB();

    const [paciente, ultimaAnamnesis, rowCountAnam, mediciones] = await Promise.all([
        db.get(`select * from pacientes where id = ? and activo = 1`, [id]),
        db.get(`select * from anamnesis where paciente_id = ? order by date(fecha) desc, id desc limit 1`, [id]),
        db.get(`select count(*) as total from anamnesis where paciente_id = ?`, [id]),
        db.all(`select * from mediciones where paciente_id = ? order by date(fecha) desc, id desc limit 50`, [id])
    ]);

    if (!paciente) notFound();

    const totalAnamnesis = Number(rowCountAnam?.total ?? 0);
    const ultimaMedicion = mediciones[0] ?? null;
    const anteriorMedicion = mediciones[1] ?? null;
    const primeraMedicion = mediciones[mediciones.length - 1] ?? null;

    const alturaRef = ultimaMedicion?.altura_cm || (mediciones.find(m => m.altura_cm)?.altura_cm) || null;

    const imc = ultimaMedicion?.peso_kg && alturaRef
        ? calcularIMC(ultimaMedicion.peso_kg, alturaRef)
        : null;

    const resumen =
        ultimaMedicion && anteriorMedicion
            ? resumenTendencia(ultimaMedicion, anteriorMedicion)
            : null;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>{paciente.nombre_completo}</h1>
                    <div style={{ opacity: 0.75, marginTop: 4 }}>
                        DNI: <b>{paciente.dni}</b>
                        {paciente.telefono ? <> · Tel: {paciente.telefono}</> : null}
                    </div>
                </div>

                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <Link href="/dashboard/pacientes" style={{ padding: 8 }} className="bg-slate-800 border-2 rounded-md">
                        Volver
                    </Link>
                    <Link href={`/dashboard/pacientes/${id}/anamnesis/nueva`} style={{ padding: 8 }} className="bg-slate-800 border-2 rounded-md">
                        Nueva anamnesis
                    </Link>
                </div>
            </div>

            <div
                style={{
                    marginTop: 18,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    alignItems: "start",
                }}
            >
                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 27 }}>
                    <h2 style={{ marginTop: 0 }}>Datos</h2>

                    <div style={{ display: "grid", gap: 8 }}>
                        <Field label="Nombre" value={paciente.nombre_completo} />
                        <Field label="DNI" value={paciente.dni} />
                        <Field label="Teléfono" value={paciente.telefono} />
                        <Field label="Email" value={paciente.email} />
                        <Field label="Dirección" value={paciente.direccion} />
                        <Field label="Fecha nacimiento" value={paciente.fecha_nacimiento} />
                        <Field label="Sexo" value={paciente.sexo} />
                    </div>
                </div>

                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16}}>
                    <h2 style={{ marginTop: 0 }}>Anamnesis</h2>

                    <p style={{ marginTop: 8 }}>
                        Total registros: <b>{totalAnamnesis}</b>
                    </p>

                    {!ultimaAnamnesis ? (
                        <p style={{ opacity: 0.8 }}>Todavía no hay anamnesis cargadas.</p>
                    ) : (
                        <div
                            style={{
                                marginTop: 10,
                                padding: 12,
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.03)",
                                display: "grid",
                                gap: 6,
                                fontSize: 13,
                            }}
                        >
                            <div>
                                <b>Última:</b> {ultimaAnamnesis.fecha} · {labelDieta(ultimaAnamnesis.tipo_dieta)}
                            </div>

                            <div style={{ opacity: 0.85 }}>
                                {ultimaAnamnesis.consumo_agua ? <>Agua: {ultimaAnamnesis.consumo_agua} · </> : null}
                                {ultimaAnamnesis.actividad_fisica ? <>AF: {ultimaAnamnesis.actividad_fisica}</> : null}
                                {!ultimaAnamnesis.consumo_agua && !ultimaAnamnesis.actividad_fisica ? <>Sin datos extra</> : null}
                            </div>

                            {(ultimaAnamnesis.frutas_no_gusta || ultimaAnamnesis.verduras_no_gusta) ? (
                                <div style={{ opacity: 0.75 }}>
                                    {ultimaAnamnesis.frutas_no_gusta ? (
                                        <>No le gustan frutas: {compact(ultimaAnamnesis.frutas_no_gusta)}. </>
                                    ) : null}
                                    {ultimaAnamnesis.verduras_no_gusta ? (
                                        <>No le gustan verduras: {compact(ultimaAnamnesis.verduras_no_gusta)}.</>
                                    ) : null}
                                </div>
                            ) : null}

                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                        <Link
                            href={`/dashboard/pacientes/${id}/anamnesis/nueva`}
                            style={{ display: "inline-block", padding: 10 }}
                            className="border border-white rounded-md mt-6 mb-5"
                        >
                            Nueva anamnesis
                        </Link>

                        <Link
                            href={`/dashboard/pacientes/${id}/anamnesis`}
                            style={{ display: "inline-block", padding: 10 }}
                            className="border border-white rounded-md mt-6 mb-5"
                        >
                            Ver historial
                        </Link>
                    </div>
                </div>

                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, marginTop: 12 }}>
                    <h2 style={{ marginTop: 0 }}>Mediciones</h2>

                    {!ultimaMedicion ? (
                        <p style={{ opacity: 0.8 }}>Todavía no hay mediciones cargadas.</p>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            <div>
                                <b>{ultimaMedicion.fecha}</b>
                            </div>

                            <div style={{ opacity: 0.85 }}>
                                {ultimaMedicion.peso_kg ? <>Peso: {ultimaMedicion.peso_kg} kg · </> : null}
                                {alturaRef ? <>Altura: {alturaRef} cm</> : null}
                            </div>
                            {imc !== null ? (
                                <ImcCard imc={imc} fecha={ultimaMedicion?.fecha} />
                            ) : (
                                <p style={{ opacity: 0.8 }}>Cargá peso y altura para calcular IMC.</p>
                            )}

                            <RiesgoCardiometabolico
                                sexo={paciente.sexo}
                                cinturaCm={ultimaMedicion?.cintura_cm ?? null}
                                alturaCm={alturaRef}
                                imc={imc}
                            />
                        </div>
                    )}
                    <Link
                        href={`/dashboard/pacientes/${id}/mediciones/nueva`}
                        style={{ display: "inline-block", marginTop: 10, padding: 10 }}
                        className="border border-white rounded-md"
                    >
                        Nueva medición
                    </Link>
                    <Link
                        href={`/dashboard/pacientes/${id}/mediciones`}
                        style={{ display: "inline-block", marginTop: 10, padding: 10 }}
                        className="border border-white rounded-md m-2"
                    >
                        Ver historial de mediciones
                    </Link>
                </div>

                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #e5e5e5",
                        background: "rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ fontWeight: 700 }}>Evolución</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                        Comparaciones automáticas según mediciones cargadas.
                    </div>

                    {ultimaMedicion && anteriorMedicion && resumen ? (
                        <div
                            style={{
                                marginTop: 10,
                                padding: 12,
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {resumen.icon}
                                <div style={{ fontWeight: 800, fontSize: 16 }}>
                                    {resumen.titulo}
                                </div>
                            </div>

                            <div style={{ fontSize: 12, opacity: 0.85 }}>
                                {resumen.detalle}
                            </div>
                        </div>
                    ) : null}


                    {!ultimaMedicion ? (
                        <p style={{ marginTop: 10, opacity: 0.8 }}>
                            Todavía no hay mediciones para calcular evolución.
                        </p>
                    ) : (
                        <div
                            style={{
                                marginTop: 10,
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                                alignItems: "start",
                            }}
                        >
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 12,
                                    background: "rgba(0,0,0,0.18)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    minHeight: 170,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    Última vs anterior{" "}
                                    <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 12 }}>
                                        ({anteriorMedicion ? `desde ${anteriorMedicion.fecha}` : "sin comparación"})
                                    </span>
                                </div>

                                {anteriorMedicion ? (
                                    <>
                                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                                            {renderDelta("Peso", "kg", ultimaMedicion.peso_kg, anteriorMedicion.peso_kg)}
                                            {renderDelta("Cintura", "cm", ultimaMedicion.cintura_cm, anteriorMedicion.cintura_cm)}
                                            {renderDeltaIMC(ultimaMedicion, anteriorMedicion)}
                                        </div>

                                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                                            {renderTendencia(ultimaMedicion, anteriorMedicion)}
                                            {" · "}
                                            {renderRitmo(ultimaMedicion, anteriorMedicion)}
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ marginTop: 8, opacity: 0.8 }}>
                                        Cargá una segunda medición para ver cambios.
                                    </p>
                                )}
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    background: "rgba(255,255,255,0.03)",
                                    minHeight: 170,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    Desde el inicio{" "}
                                    <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 12 }}>
                                        ({primeraMedicion?.fecha ? `desde ${primeraMedicion.fecha}` : "sin datos"})
                                    </span>
                                </div>
                                {primeraMedicion && primeraMedicion.id !== ultimaMedicion.id ? (
                                    <>
                                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                                            {renderDelta("Peso", "kg", ultimaMedicion.peso_kg, primeraMedicion.peso_kg)}
                                            {renderDelta("Cintura", "cm", ultimaMedicion.cintura_cm, primeraMedicion.cintura_cm)}
                                            {renderDeltaIMC(ultimaMedicion, primeraMedicion)}
                                        </div>

                                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                                            {renderRitmo(ultimaMedicion, primeraMedicion, true)}
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ marginTop: 8, opacity: 0.8 }}>
                                        Sin suficiente historial.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <EvolucionDialog mediciones={mediciones} />
                </div>
            </div>
        </div>
    );
}

// --- FUNCIONES DE APOYO ---

function Field({ label, value }: { label: string; value: any }) {
    const v = value === null || value === undefined || value === "" ? "-" : String(value);
    return (
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
            <div style={{ opacity: 0.7 }}>{label}</div>
            <div>{v}</div>
        </div>
    );
}

function labelDieta(v: any) {
    if (v === "vegano") return "Vegano";
    if (v === "vegetariano") return "Vegetariano";
    return "Omnívoro";
}

function calcularIMC(pesoKg: number, alturaCm: number) {
    const m = alturaCm / 100;
    if (!m || m === 0) return NaN;
    return pesoKg / (m * m);
}

function renderRitmo(ultima: any, base: any, desdeInicio = false) {
    const d = diasEntre(ultima?.fecha, base?.fecha);
    if (!d || d < 4) return "Ritmo: (datos insuficientes)";

    const semanas = d / 7;
    const dp = Number(ultima?.peso_kg) - Number(base?.peso_kg);
    const dc = Number(ultima?.cintura_cm) - Number(base?.cintura_cm);

    const parts: string[] = [];
    if (Number.isFinite(dp)) parts.push(`${(dp / semanas).toFixed(2)} kg/sem`);
    if (Number.isFinite(dc)) parts.push(`${(dc / semanas).toFixed(2)} cm/sem`);

    const tag = desdeInicio ? "Ritmo inicial" : "Ritmo";
    return parts.length ? `${tag}: ${parts.join(" · ")}` : `${tag}: sin datos`;
}

function resumenTendencia(ultima: any, anterior: any) {
    const dp = Number(ultima?.peso_kg) - Number(anterior?.peso_kg);
    const dc = Number(ultima?.cintura_cm) - Number(anterior?.cintura_cm);

    const pesoOk = Number.isFinite(dp);
    const cinturaOk = Number.isFinite(dc);

    if (!pesoOk && !cinturaOk) {
        return { titulo: "Sin datos", detalle: "Cargá mediciones.", icon: <Minus size={18} /> };
    }

    if (dc <= -1 && dp >= -0.3 && dp <= 0.5) {
        return {
            titulo: "Recomposición Corporal",
            detalle: "Cintura bajó manteniendo peso (posible mejora muscular).",
            icon: <Activity size={18} color="#3b82f6" />,
        };
    }

    if (dp <= 0 && dc <= 0) {
        return { titulo: "Tendencia: Mejorando", detalle: "Peso y cintura en descenso.", icon: <TrendingDown size={18} color="#22c55e" /> };
    }

    if (dp > 0 && dc > 0) {
        return { titulo: "Tendencia: Alerta", detalle: "Aumento de peso y medidas.", icon: <TrendingUp size={18} color="#ef4444" /> };
    }

    return { titulo: "Tendencia: Mixta", detalle: "Valores con cambios irregulares.", icon: <Minus size={18} /> };
}

function renderDelta(label: string, unidad: string, actual: any, previo: any) {
    if (actual === null || previo === null) return <div style={{ fontSize: 13, opacity: 0.5 }}>{label}: -</div>;

    const a = Number(actual);
    const p = Number(previo);
    const delta = a - p;
    const color = delta < 0 ? "#22c55e" : delta > 0 ? "#ef4444" : "#e5e7eb";

    return (
        <div style={{ fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>{label}</span>:{" "}
            <b style={{ color, fontSize: 15 }}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} {unidad}
            </b>{" "}
            <span style={{ opacity: 0.6, fontSize: 11 }}>
                ({a.toFixed(1)} hoy vs {p.toFixed(1)})
            </span>
        </div>
    );
}

function renderDeltaIMC(actual: any, previo: any) {
    const imcA = calcularIMC(actual.peso_kg, actual.altura_cm || 1);
    const imcP = calcularIMC(previo.peso_kg, previo.altura_cm || 1);

    if (isNaN(imcA) || isNaN(imcP)) return null;

    const delta = imcA - imcP;
    const color = delta < 0 ? "#22c55e" : delta > 0 ? "#ef4444" : "#e5e7eb";

    return (
        <div style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>IMC:</span>{" "}
            <b style={{ color, fontSize: 15 }}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</b>{" "}
            <span style={{ opacity: 0.6, fontSize: 11 }}>({imcA.toFixed(1)} vs {imcP.toFixed(1)})</span>
        </div>
    );
}

function renderTendencia(ultima: any, anterior: any) {
    const dp = Number(ultima?.peso_kg) - Number(anterior?.peso_kg);
    return dp < 0 ? "Tendencia: descendente" : dp > 0 ? "Tendencia: ascendente" : "Tendencia: estable";
}

function diasEntre(a: any, b: any) {
    const da = new Date(a);
    const db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
    return Math.abs(da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24);
}

// SOLUCIÓN AL ERROR: Definición de la función compact
function compact(text: string | null) {
    if (!text) return "";
    // Elimina espacios extra y comas al final/principio
    return text.split(',').map(s => s.trim()).filter(Boolean).join(', ');
}