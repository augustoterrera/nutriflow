import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { crearAnamnesisAction } from "./actions";
import { DatePickerSimple } from "@/components/pacientes/Date-picker";

export default async function NuevaAnamnesisPage(props: {
    params: Promise<{ id: string }>;
}) {
    const { id: idStr } = await props.params;
    const pacienteId = Number(idStr);
    const action = crearAnamnesisAction.bind(null, pacienteId);
    if (!Number.isFinite(pacienteId)) notFound();

    const db = await getDB();

    const paciente = await db.get(
        `select id, nombre_completo, dni
     from pacientes
     where id = ? and activo = 1`,
        [pacienteId]
    );

    if (!paciente) notFound();

    return (
        <div style={{ padding: 24, maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Nueva anamnesis</h1>
                    <div style={{ opacity: 0.75, marginTop: 4 }}>
                        Paciente: <b>{paciente.nombre_completo}</b> · DNI: {paciente.dni}
                    </div>
                </div>

            </div>

            <form action={action} style={{ marginTop: 16, display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                    <span>Fecha</span>
                    <DatePickerSimple name="fecha" />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Tipo de dieta</span>
                    <select name="tipo_dieta" defaultValue="omnivoro" className="border border-white rounded-md w-60" style={{ padding: 10 }}>
                        <option className="bg-black" value="omnivoro">Omnívoro</option>
                        <option className="bg-black" value="vegetariano">Vegetariano</option>
                        <option className="bg-black" value="vegano">Vegano</option>
                    </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Frutas que no le gustan</span>
                    <input
                        name="frutas_no_gusta"
                        placeholder='Ej: "banana, manzana"'
                        style={{ padding: 10 }}
                        className="border border-white rounded-md "
                    />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Verduras que no le gustan</span>
                    <input
                        name="verduras_no_gusta"
                        placeholder='Ej: "lechuga, espinaca"'
                        style={{ padding: 10 }}
                        className="border border-white rounded-md "
                    />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Consumo de verduras</span>
                    <input className="border border-white rounded-md w-60" name="consumo_verduras" placeholder="Ej: 2 porciones/día" style={{ padding: 10 }} />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Consumo de frutas</span>
                    <input className="border border-white rounded-md w-60" name="consumo_frutas" placeholder="Ej: 1 fruta/día" style={{ padding: 10 }} />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Consumo de carnes</span>
                    <input className="border border-white rounded-md w-60" name="consumo_carnes" placeholder="Ej: 4 veces/sem" style={{ padding: 10 }} />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Agua</span>
                    <input className="border border-white rounded-md w-60" name="consumo_agua" placeholder="Ej: 2L/día" style={{ padding: 10 }} />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Actividad física</span>
                    <input
                        name="actividad_fisica"
                        placeholder="Ej: camina 3x/sem"
                        style={{ padding: 10 }}
                        className="border border-white rounded-md w-60"
                    />
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" name="consume_suplementos" value="1" />
                    <span>Consume suplementos</span>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Detalle de suplementos</span>
                    <input
                        name="suplementos_detalle"
                        placeholder="Ej: creatina, proteína"
                        style={{ padding: 10 }}
                        className="border border-white rounded-md"
                    />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>Observaciones</span>
                    <textarea className="border border-white rounded-md" name="observaciones" rows={6} style={{ padding: 10 }} />
                </label>

                <button type="submit" style={{ padding: 10 }} className="bg-blue-600 rounded-md">
                    Guardar
                </button>

            </form>
        </div>
    );
}
