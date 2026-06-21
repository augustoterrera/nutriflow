"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DatePickerSimple } from "@/components/pacientes/Date-picker";
import { obtenerPacienteAction, editarPacienteAction } from "./actions";

type P = {
  id: number;
  dni: string;
  nombre_completo: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado_civil: string | null;
  ocupacion: string | null;
  notas: string | null;
  activo: number;
};

export default function EditarPacientePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pacienteId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<P | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!Number.isFinite(pacienteId)) {
        router.replace("/dashboard/pacientes");
        return;
      }

      if (!alive) return;

      try {
        const res = await obtenerPacienteAction(pacienteId);
        if (!alive) return;
        setP(res);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [pacienteId, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);

    const dni = String(fd.get("dni") ?? "").trim();
    const nombre_completo = String(fd.get("nombre_completo") ?? "").trim();

    if (!dni) return setErr("DNI obligatorio");
    if (!nombre_completo) return setErr("Nombre obligatorio");

    const input = {
      paciente_id: pacienteId,
      dni,
      nombre_completo,
      sexo: String(fd.get("sexo") ?? "").trim() || null,
      fecha_nacimiento: String(fd.get("fecha_nacimiento") ?? "").trim() || null,
      telefono: String(fd.get("telefono") ?? "").trim() || null,
      email: String(fd.get("email") ?? "").trim() || null,
      direccion: String(fd.get("direccion") ?? "").trim() || null,
      estado_civil: String(fd.get("estado_civil") ?? "").trim() || null,
      ocupacion: String(fd.get("ocupacion") ?? "").trim() || null,
      notas: String(fd.get("notas") ?? "").trim() || null,
    };

    setSaving(true);
    try {
      await editarPacienteAction(input);
    } catch (e: any) {
      console.error(e);
      setErr(String(e?.message ?? e));
      setSaving(false);
    }
  }

  if (loading) return null;
  if (err) return <div style={{ padding: 24, color: "tomato" }}>Error: {err}</div>;
  if (!p) return null;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Editar paciente</h1>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 16, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>DNI</span>
          <input name="dni" defaultValue={p.dni} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre completo</span>
          <input name="nombre_completo" defaultValue={p.nombre_completo} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Teléfono</span>
          <input name="telefono" defaultValue={p.telefono ?? ""} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Sexo</span>
          <select name="sexo" defaultValue={(p.sexo ?? "").toUpperCase()} style={{ padding: 10 }} className="border border-white rounded-md">
            <option className="bg-black" value="">Sin especificar</option>
            <option className="bg-black" value="M">Masculino</option>
            <option className="bg-black" value="F">Femenino</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Fecha nacimiento</span>
          <DatePickerSimple name="fecha_nacimiento" defaultValue={p.fecha_nacimiento ?? ""} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input name="email" defaultValue={p.email ?? ""} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Dirección</span>
          <input name="direccion" defaultValue={p.direccion ?? ""} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Ocupación</span>
          <input name="ocupacion" defaultValue={p.ocupacion ?? ""} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Estado civil</span>
          <input name="estado_civil" defaultValue={p.estado_civil ?? ""} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        <label style={{ display: "grid", gap: 6, gridColumn: "span 2" }}>
          <span>Notas</span>
          <textarea name="notas" defaultValue={p.notas ?? ""} rows={4} style={{ padding: 10 }} className="border border-white rounded-md" />
        </label>

        {err ? <div style={{ gridColumn: "span 2", color: "tomato" }}>{err}</div> : null}

        <button type="submit" disabled={saving} className="bg-blue-700 text-white rounded-md" style={{ padding: 10, width: 220, gridColumn: "span 2" }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
