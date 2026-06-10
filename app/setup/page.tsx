"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { crearPinServer } from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
      } catch (e) {
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
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Definí un PIN de 4 a 6 dígitos para acceder a la app.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                inputMode="numeric"
                placeholder="Ej: 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin2">Confirmar PIN</Label>
              <Input
                id="pin2"
                name="pin2"
                inputMode="numeric"
                placeholder="Repetí el PIN"
                value={pin2}
                onChange={(e) => setPin2(e.target.value)}
              />
            </div>

            {err ? <div className="text-sm text-destructive">{err}</div> : null}

            <Button type="submit" className="w-full  bg-primary hover:bg-blue-700" disabled={loading}>
              {loading ? "Guardando..." : "Guardar PIN"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            Tip: guardalo en un lugar seguro. Si lo olvidás, después lo reseteamos desde la base.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
