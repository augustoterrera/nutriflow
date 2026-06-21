"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { obtenerPacienteAction, editarPacienteAction } from "./actions";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PacienteForm } from "@/components/pacientes/PacienteForm";
import { FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <PageShell width="form">
      <PageHeader
        title="Editar paciente"
        description="Actualizá los datos del paciente."
      />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : err && !p ? (
        <FieldError>{err}</FieldError>
      ) : p ? (
        <form onSubmit={onSubmit}>
          <PacienteForm defaultValues={p}>
            <div className="flex flex-col gap-3">
              {err ? <FieldError>{err}</FieldError> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/dashboard/pacientes/${pacienteId}`}>
                    Cancelar
                  </Link>
                </Button>
              </div>
            </div>
          </PacienteForm>
        </form>
      ) : null}
    </PageShell>
  );
}
