"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { loginActionServer } from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LockPage() {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [intentos, setIntentos] = useState<number | null>(null);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedRemaining, setBlockedRemaining] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // check session and configured pin server-side
    (async () => {
      try {
        // sesionValida and hayPinConfigurado are server functions; we call via fetch to simple endpoints
        const res = await fetch("/api/_health_lock");
        const j = await res.json();
        if (j.sesion) {
          window.location.href = "/dashboard";
          return;
        }
        if (!j.hayPin) {
          window.location.href = "/setup";
          return;
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!bloqueadoHasta) {
      setBlockedRemaining(null);
      return;
    }
    const bloqueadoHastaActual = bloqueadoHasta;

    function updateRemaining() {
      const until = new Date(bloqueadoHastaActual).getTime();
      const diff = Math.max(0, until - Date.now());
      const s = Math.ceil(diff / 1000);
      setBlockedRemaining(`${s}s`);
      if (diff <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setBloqueadoHasta(null);
        setIntentos(null);
      }
    }

    updateRemaining();
    timerRef.current = window.setInterval(updateRemaining, 1000);
  }, [bloqueadoHasta]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await loginActionServer(pin);
      if (res.ok) {
        // success: redirect
        window.location.href = "/dashboard";
        return;
      }

      // show friendly message
      if (res.error === "NO_PIN") {
        setErr("Todavía no hay PIN configurado.");
      } else if (res.error === "BLOQUEADO") {
        setErr("Demasiados intentos. Esperá unos segundos.");
      } else {
        setErr("PIN incorrecto.");
      }

      setIntentos(res.intentos_fallidos ?? null);
      setBloqueadoHasta(res.bloqueado_hasta ?? null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  const attemptsLeft = intentos === null ? null : Math.max(0, 5 - intentos);

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ingresar PIN</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} autoComplete="off" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              {err ? (
                <div className="text-sm text-destructive mt-1">{err}</div>
              ) : null}

              {attemptsLeft !== null ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Intentos restantes: {attemptsLeft}
                  {bloqueadoHasta ? ` — bloqueado: ${blockedRemaining}` : null}
                </div>
              ) : null}
            </div>

            <Button type="submit" className="w-full bg-slate-700 hover:bg-blue-700" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

