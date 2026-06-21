"use client";

import { useState, useEffect } from "react";
import { crearPinServer } from "./actions";

import { AuthShell } from "@/components/shared/auth-shell";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/_health_lock");
        const j = await res.json();
        if (j.sesion) {
          window.location.href = "/dashboard";
          return;
        }
        if (j.hayPin) {
          window.location.href = "/lock";
          return;
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!pin || !pin2) return setErr("Ambos campos son obligatorios.");
    if (pin !== pin2) return setErr("Los PIN no coinciden.");

    setLoading(true);
    try {
      const res = await crearPinServer(pin, pin2);
      if (res.ok) {
        window.location.href = "/lock";
        return;
      }
      setErr(String(res.error ?? "Error al guardar PIN."));
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crear PIN"
      description="Definí un PIN de 4 a 6 dígitos para acceder a la app."
    >
      <form onSubmit={onSubmit} autoComplete="off">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="pin">PIN</FieldLabel>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              placeholder="Ej: 1234"
              autoComplete="new-password"
              autoFocus
              aria-invalid={!!err}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="pin2">Confirmar PIN</FieldLabel>
            <Input
              id="pin2"
              name="pin2"
              type="password"
              inputMode="numeric"
              placeholder="Repetí el PIN"
              autoComplete="new-password"
              aria-invalid={!!err}
              value={pin2}
              onChange={(e) => setPin2(e.target.value)}
            />
          </Field>

          {err ? <FieldError>{err}</FieldError> : null}

          <Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar PIN"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Tip: guardalo en un lugar seguro. Si lo olvidás, después lo
            reseteamos desde la base.
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
