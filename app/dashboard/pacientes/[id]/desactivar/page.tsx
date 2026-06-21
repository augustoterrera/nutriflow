"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { desactivarPacienteAction } from "./actions";
import { PageShell } from "@/components/shared/page-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function DesactivarPacientePage() {
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
    <PageShell width="form">
      <Card>
        <CardHeader>
          <CardTitle>¿Desactivar paciente?</CardTitle>
          <CardDescription>
            El paciente deja de aparecer en el listado. Podés revertirlo desde la
            papelera.
          </CardDescription>
        </CardHeader>

        {err ? (
          <CardContent>
            <FieldError>{err}</FieldError>
          </CardContent>
        ) : null}

        <CardFooter className="gap-2">
          <Button variant="destructive" onClick={onDisable} disabled={busy}>
            {busy ? "Desactivando..." : "Sí, desactivar"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/pacientes/${pacienteId}`}>Cancelar</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}
