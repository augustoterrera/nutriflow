"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, RotateCcw, AlertCircle } from "lucide-react";
import {
  obtenerPacientesDesactivadosAction,
  activarPacienteAction,
  borrarPacienteDefinitivamenteAction,
  PacienteDesactivado,
} from "./actions";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

export function PapeleraClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<PacienteDesactivado[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activating, setActivating] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deletingNombre, setDeletingNombre] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await obtenerPacientesDesactivadosAction();
        if (!alive) return;
        setPacientes(res);
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
  }, []);

  async function handleActivar(id: number) {
    setActivating(id);
    try {
      await activarPacienteAction(id);
      setPacientes(pacientes.filter((p) => p.id !== id));
    } catch (e: any) {
      console.error(e);
      setErr(String(e?.message ?? e));
    } finally {
      setActivating(null);
    }
  }

  async function handleBorrar(id: number) {
    setDeleting(id);
    try {
      await borrarPacienteDefinitivamenteAction(id);
      setPacientes(pacientes.filter((p) => p.id !== id));
      setConfirmDelete(null);
    } catch (e: any) {
      console.error(e);
      setErr(String(e?.message ?? e));
      setDeleting(null);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Papelera</h1>
        <span style={{ fontSize: "0.875rem", color: "#666" }}>
          {pacientes.length} paciente{pacientes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {err ? (
        <div style={{ color: "tomato", marginBottom: 16, padding: 12, backgroundColor: "rgba(255, 99, 71, 0.1)", borderRadius: 4 }}>
          Error: {err}
        </div>
      ) : null}

      {confirmDelete !== null && (
        <Alert variant="destructive" style={{ marginBottom: 24 }}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Borrar paciente definitivamente</AlertTitle>
          <AlertDescription>
            <div style={{ marginTop: 12, lineHeight: 1.6 }}>
              <p>
                <strong>Estás a punto de borrar definitivamente a:</strong>
              </p>
              <p style={{ fontSize: "1.05rem", fontWeight: "500", marginTop: 8, marginBottom: 12 }}>
                {deletingNombre}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Esta acción es irreversible. Se eliminará:</strong>
              </p>
              <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                <li>El paciente completamente</li>
                <li>Todas sus anamnesis</li>
                <li>Todas sus mediciones</li>
              </ul>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="bg-slate-600 text-primary-foreground rounded-md hover:bg-primary"
                  style={{ padding: "8px 16px", border: "none", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleBorrar(confirmDelete)}
                  disabled={deleting === confirmDelete}
                  className="bg-red-600 text-primary-foreground rounded-md hover:bg-red-700 disabled:opacity-50"
                  style={{ padding: "8px 16px", border: "none", cursor: "pointer" }}
                >
                  {deleting === confirmDelete ? "Borrando..." : "Sí, borrar definitivamente"}
                </button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {pacientes.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#666",
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0 }}>No hay pacientes desactivados</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {pacientes.map((paciente) => (
            <div
              key={paciente.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: 12,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor: "#000000",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: 4 }}>
                  {paciente.nombre_completo}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  DNI: {paciente.dni} • Tel: {paciente.telefono || "—"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleActivar(paciente.id)}
                  disabled={activating === paciente.id}
                  className="bg-green-600 text-primary-foreground rounded-md hover:bg-green-700 disabled:opacity-50"
                  style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer" }}
                >
                  <RotateCcw size={16} />
                  {activating === paciente.id ? "Activando..." : "Activar"}
                </button>

                <button
                  onClick={() => {
                    setConfirmDelete(paciente.id);
                    setDeletingNombre(paciente.nombre_completo);
                  }}
                  disabled={deleting === paciente.id}
                  className="bg-red-600 text-primary-foreground rounded-md hover:bg-red-700 disabled:opacity-50"
                  style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                  {deleting === paciente.id ? "Borrando..." : "Borrar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
