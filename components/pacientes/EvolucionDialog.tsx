"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Medicion = {
  fecha: string; // "YYYY-MM-DD"
  peso_kg: number | null;
  altura_cm: number | null;
  cintura_cm: number | null;
};

type Punto = {
  fecha: string;
  peso_kg: number | null;
  cintura_cm: number | null;
  imc: number | null;
};

type Metrica = "peso" | "cintura" | "imc";

function calcularIMC(pesoKg: number | null, alturaCm: number | null) {
  if (pesoKg == null || alturaCm == null) return null;
  const m = alturaCm / 100;
  if (!m) return null;
  const v = pesoKg / (m * m);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
}

function formatFechaPaciente(iso: string) {
  // "2026-01-25" -> "25/01/2026"
  const s = String(iso ?? "");
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function getNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getValor(p: Punto, metrica: Metrica): number | null {
  if (metrica === "peso") return p.peso_kg ?? null;
  if (metrica === "cintura") return p.cintura_cm ?? null;
  return p.imc ?? null;
}

function unidadDe(metrica: Metrica) {
  if (metrica === "peso") return "kg";
  if (metrica === "cintura") return "cm";
  return ""; // IMC sin unidad
}

function tituloDe(metrica: Metrica) {
  if (metrica === "peso") return "Peso en el tiempo";
  if (metrica === "cintura") return "Cintura en el tiempo";
  return "IMC en el tiempo";
}

function dataKeyDe(metrica: Metrica) {
  if (metrica === "peso") return "peso_kg";
  if (metrica === "cintura") return "cintura_cm";
  return "imc";
}

// Para paciente: bajar peso/cintura/imc es mejora (verde), subir es alerta (rojo).
function claseDelta(delta: number) {
  if (delta < 0) return "text-success";
  if (delta > 0) return "text-destructive";
  return "text-muted-foreground";
}

function etiquetaCambio(delta: number, metrica: Metrica) {
  // Texto claro
  if (delta === 0) return "Sin cambios";
  const abs = Math.abs(delta);

  const u = unidadDe(metrica);
  const val = metrica === "imc" ? abs.toFixed(2) : abs.toFixed(1);

  if (delta < 0) return `Bajó ${val}${u ? " " + u : ""}`;
  return `Subió ${val}${u ? " " + u : ""}`;
}

function resumenSerie(data: Punto[], metrica: Metrica) {
  // Filtramos puntos con valor
  const withVal = data
    .map((p) => ({ ...p, v: getValor(p, metrica) }))
    .filter((p) => p.v != null) as Array<Punto & { v: number }>;

  if (!withVal.length) return null;

  const first = withVal[0];
  const last = withVal[withVal.length - 1];
  const prev = withVal.length >= 2 ? withVal[withVal.length - 2] : null;

  const deltaPrev = prev ? last.v - prev.v : null;
  const deltaFirst = last.v - first.v;

  return {
    first,
    last,
    prev,
    deltaPrev,
    deltaFirst,
  };
}

function TooltipPaciente(props: any) {
  const { active, payload, label, unidad } = props;
  if (!active || !payload || !payload.length) return null;

  const v = getNum(payload[0]?.value);
  if (v == null) return null;

  const valTxt =
    unidad === ""
      ? v.toFixed(2)
      : unidad === "kg" || unidad === "cm"
        ? v.toFixed(1)
        : String(v);

  return (
    <div className="bg-popover text-popover-foreground max-w-55 rounded-lg border p-2.5 text-xs shadow-md">
      <div className="text-muted-foreground">Fecha</div>
      <div className="mb-1.5 font-bold">{formatFechaPaciente(label)}</div>

      <div className="text-muted-foreground">Valor</div>
      <div className="text-sm font-extrabold">
        {valTxt}
        {unidad ? ` ${unidad}` : ""}
      </div>
    </div>
  );
}

export function EvolucionDialog(props: { mediciones: Medicion[] }) {
  const [metrica, setMetrica] = React.useState<Metrica>("peso");

  const data: Punto[] = React.useMemo(() => {
    const asc = [...props.mediciones].sort((a, b) =>
      a.fecha > b.fecha ? 1 : -1
    );
    // Si una medición no trae altura, usamos la última altura conocida hasta esa fecha.
    // Usamos reduce con la altura acumulada para no reasignar una variable externa.
    return asc.reduce<{ puntos: Punto[]; alturaConocida: number | null }>(
      (acc, m) => {
        const alturaConocida = m.altura_cm ?? acc.alturaConocida;
        acc.puntos.push({
          fecha: m.fecha,
          peso_kg: m.peso_kg ?? null,
          cintura_cm: m.cintura_cm ?? null,
          imc: calcularIMC(m.peso_kg ?? null, alturaConocida),
        });
        return { puntos: acc.puntos, alturaConocida };
      },
      { puntos: [], alturaConocida: null }
    ).puntos;
  }, [props.mediciones]);

  const unidad = unidadDe(metrica);
  const titulo = tituloDe(metrica);
  const dataKey = dataKeyDe(metrica);

  const resumen = React.useMemo(() => resumenSerie(data, metrica), [data, metrica]);

  const ultimoTxt = React.useMemo(() => {
    if (!resumen) return "-";
    const v = resumen.last.v;
    if (metrica === "imc") return `${v.toFixed(2)}`;
    return `${v.toFixed(1)}${unidad ? " " + unidad : ""}`;
  }, [resumen, metrica, unidad]);

  const cambioVsAnterior = React.useMemo(() => {
    if (!resumen || resumen.deltaPrev == null) return null;
    const d = resumen.deltaPrev;
    const val = metrica === "imc" ? Number(d.toFixed(2)) : Number(d.toFixed(1));
    return val;
  }, [resumen, metrica]);

  const cambioDesdeInicio = React.useMemo(() => {
    if (!resumen) return null;
    const d = resumen.deltaFirst;
    const val = metrica === "imc" ? Number(d.toFixed(2)) : Number(d.toFixed(1));
    return val;
  }, [resumen, metrica]);

  const noHayDatosDeMetrica = !resumen;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="m-2">
          Ver gráfico
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gráfico de evolución</DialogTitle>
          <DialogDescription>
            Compará peso, cintura e IMC entre las mediciones registradas.
          </DialogDescription>
        </DialogHeader>
        {/* Selector de métricas */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Métrica del gráfico">
          {(["peso", "cintura", "imc"] as Metrica[]).map((m) => {
            const activo = metrica === m;
            return (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={activo ? "default" : "outline"}
                onClick={() => setMetrica(m)}
              >
                {m === "imc" ? "IMC" : m.charAt(0).toUpperCase() + m.slice(1)}
              </Button>
            );
          })}
        </div>
        {/* Título claro */}
        <div className="mt-2">
          <div className="text-sm font-semibold">{titulo}</div>
          <div className="text-xs text-muted-foreground">
            {metrica === "imc"
              ? "IMC (sin unidad). Se calcula con peso y altura."
              : `Unidad: ${unidad}`}
          </div>
        </div>

        {/* Resumen (muy entendible) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Último valor</div>
            <div className="text-lg font-bold">{ultimoTxt}</div>
            {resumen ? (
              <div className="text-xs text-muted-foreground mt-1">
                {formatFechaPaciente(resumen.last.fecha)}
              </div>
            ) : null}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Cambio vs anterior</div>
            {cambioVsAnterior == null ? (
              <div className="text-sm text-muted-foreground mt-1">
                Se necesitan 2 mediciones
              </div>
            ) : (
              <div className={cn("text-base font-semibold mt-1", claseDelta(cambioVsAnterior))}>
                {etiquetaCambio(cambioVsAnterior, metrica)}
              </div>
            )}
            {resumen?.prev ? (
              <div className="text-xs text-muted-foreground mt-1">
                {formatFechaPaciente(resumen.prev.fecha)} →{" "}
                {formatFechaPaciente(resumen.last.fecha)}
              </div>
            ) : null}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Desde el inicio</div>
            {cambioDesdeInicio == null ? (
              <div className="text-sm text-muted-foreground mt-1">-</div>
            ) : (
              <div className={cn("text-base font-semibold mt-1", claseDelta(cambioDesdeInicio))}>
                {etiquetaCambio(cambioDesdeInicio, metrica)}
              </div>
            )}
            {resumen ? (
              <div className="text-xs text-muted-foreground mt-1">
                {formatFechaPaciente(resumen.first.fecha)} →{" "}
                {formatFechaPaciente(resumen.last.fecha)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Gráfico */}
        <div className="mt-3 h-85 w-full rounded-md border bg-background p-2">
          {!data.length ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No hay mediciones cargadas.
            </div>
          ) : noHayDatosDeMetrica ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No hay datos suficientes para esta métrica.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                accessibilityLayer
                data={data}
                margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => formatFechaPaciente(String(v))}
                  minTickGap={18}
                  stroke="var(--border)"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                />
                <Tooltip
                  content={<TooltipPaciente unidad={unidad} />}
                  cursor={{ stroke: "var(--border)" }}
                />

                {/* 1 métrica a la vez (MUCHO más claro) */}
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="var(--chart-1)"
                  dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--chart-1)" }}
                  activeDot={{ r: 6 }}
                  strokeWidth={3}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          Los cambios se calculan con los registros disponibles y deben interpretarse junto con la evaluación clínica.
        </div>
      </DialogContent>
    </Dialog>
  );
}
