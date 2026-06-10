"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Ocurrió un error</h1>

      <p style={{ color: "crimson", marginTop: 10 }}>
        {error.message || "No se pudo crear el paciente."}
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => reset()} style={{ padding: 10 }}>
          Intentar de nuevo
        </button>

        <Link href="/dashboard/pacientes/nuevo" style={{ padding: 10 }}>
          Volver al formulario
        </Link>

        <Link href="/dashboard/pacientes" style={{ padding: 10 }}>
          Ir a pacientes
        </Link>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        Tip: si fue por DNI repetido, probá con otro número.
      </p>
    </div>
  );
}
