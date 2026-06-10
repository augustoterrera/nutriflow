
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { desactivarPacienteAction } from "./actions";

export default function DesactivarPacientePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pacienteId = Number(params?.id);

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDisable() {
    setErr(null);

    if (!Number.isFinite(pacienteId)) {
      setErr("Parámetros inválidos.");
      return;
    }

    setBusy(true);
    try {
      await desactivarPacienteAction(pacienteId);
    } catch (e: any) {
      console.error(e);
      setErr(String(e?.message ?? e));
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Desactivar paciente</h1>
      <p>Esto lo oculta del listado</p>

      {err ? <div style={{ color: "tomato", marginTop: 10 }}>Error: {err}</div> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={onDisable}
          disabled={busy}
          className="bg-red-600 text-white rounded-md"
          style={{ padding: "10px 14px" }}
        >
          {busy ? "Desactivando..." : "Sí, desactivar"}
        </button>

        <Link
          href={`/dashboard/pacientes/${pacienteId}`}
          className="bg-slate-800 border rounded-md"
          style={{ padding: "10px 14px" }}
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
