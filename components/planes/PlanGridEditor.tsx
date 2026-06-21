"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { calcularIMC } from "@/lib/calculos";
import {
  FORMULA_ENERGETICA_LABELS,
  OBJETIVO_ENERGETICO_LABELS,
  type FormulaEnergetica,
  type ObjetivoEnergetico,
} from "@/lib/energia";
import { ORDEN_GRILLA, LABEL_COMIDA } from "@/lib/plan-constants";
import { semanaVacia, type PlanGrid, type PlanSemana } from "@/lib/plan-grid";

const cellKey = (tipo: string, dia: number) => `${tipo}:${dia}`;

export type EvaluacionPlanOption = {
  id: number;
  fecha: string;
  objetivoKcal: number;
  objetivoTipo: ObjetivoEnergetico;
  pesoKg: number;
  tallaCm: number;
  formula: FormulaEnergetica;
};

export function PlanGridEditor(props: {
  pacienteId: number;
  planId: number | null;
  nombrePaciente: string;
  defaultNombre: string;
  defaultFecha: string;
  defaultGrid: PlanGrid;
  defaultEvaluacionId: number | null;
  evaluaciones: EvaluacionPlanOption[];
  action: (formData: FormData) => void;
}) {
  const [nombre, setNombre] = React.useState(props.defaultNombre);
  const [fecha, setFecha] = React.useState(props.defaultFecha);
  const [grid, setGrid] = React.useState<PlanGrid>(props.defaultGrid);
  const [evaluacionId, setEvaluacionId] = React.useState<number | null>(
    props.defaultEvaluacionId
  );

  const updateGrid = (patch: Partial<PlanGrid>) => setGrid((g) => ({ ...g, ...patch }));

  const updateSemana = (si: number, updater: (s: PlanSemana) => PlanSemana) => {
    setGrid((g) => ({
      ...g,
      semanas: g.semanas.map((s, i) => (i === si ? updater(s) : s)),
    }));
  };

  const setCelda = (si: number, tipo: string, dia: number, value: string) => {
    updateSemana(si, (s) => ({ ...s, celdas: { ...s.celdas, [cellKey(tipo, dia)]: value } }));
  };

  const addDia = (si: number) =>
    updateSemana(si, (s) => ({ ...s, dias: Math.min(s.dias + 1, 14) }));

  const removeDia = (si: number) =>
    updateSemana(si, (s) => {
      if (s.dias <= 1) return s;
      const ultimo = s.dias - 1;
      // Limpiamos las celdas del día que se quita para no dejar datos huérfanos.
      const celdas = Object.fromEntries(
        Object.entries(s.celdas).filter(([k]) => !k.endsWith(`:${ultimo}`))
      );
      return { ...s, dias: ultimo, celdas };
    });

  const addSemana = () =>
    setGrid((g) => ({
      ...g,
      semanas: [...g.semanas, semanaVacia(`Semana ${g.semanas.length + 1}`)],
    }));

  const removeSemana = (si: number) =>
    setGrid((g) => ({
      ...g,
      semanas: g.semanas.length > 1 ? g.semanas.filter((_, i) => i !== si) : g.semanas,
    }));

  const seleccionarEvaluacion = (raw: string) => {
    const id = Number(raw);
    const evaluacion = props.evaluaciones.find((item) => item.id === id);
    setEvaluacionId(evaluacion ? evaluacion.id : null);
    if (!evaluacion) return;

    const imc = calcularIMC(evaluacion.pesoKg, evaluacion.tallaCm);
    setGrid((current) => ({
      ...current,
      peso: `${evaluacion.pesoKg} kg`,
      talla: `${evaluacion.tallaCm} cm`,
      imc: Number.isFinite(imc) ? imc.toFixed(1) : current.imc,
      objetivo: OBJETIVO_ENERGETICO_LABELS[evaluacion.objetivoTipo],
      kcalObjetivo: `${evaluacion.objetivoKcal} kcal`,
    }));
  };

  return (
    <form action={props.action} className="space-y-6">
      <Input type="hidden" name="nombre" value={nombre} />
      <Input type="hidden" name="fecha" value={fecha} />
      <Input type="hidden" name="grid" value={JSON.stringify(grid)} />
      <Input
        type="hidden"
        name="evaluacion_energetica_id"
        value={evaluacionId ?? ""}
      />

      {/* Encabezado del plan */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="plan-evaluacion">Evaluación energética de referencia</Label>
            <SelectNative
              id="plan-evaluacion"
              value={evaluacionId ?? ""}
              onChange={(event) => seleccionarEvaluacion(event.target.value)}
            >
              <option value="">Sin evaluación vinculada</option>
              {props.evaluaciones.map((evaluacion) => (
                <option key={evaluacion.id} value={evaluacion.id}>
                  {formatFecha(evaluacion.fecha)} · {evaluacion.objetivoKcal} kcal · {FORMULA_ENERGETICA_LABELS[evaluacion.formula]}
                </option>
              ))}
            </SelectNative>
            <p className="text-muted-foreground text-sm">
              Al elegir una evaluación se copian sus datos y kcal. Podés ajustar el plan después sin alterar el registro clínico.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="grid gap-2">
              <Label htmlFor="plan-nombre">Nombre del plan</Label>
              <Input
                id="plan-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Plan alimentario"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-fecha">Fecha</Label>
              <Input
                id="plan-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="plan-peso">Peso</Label>
              <Input
                id="plan-peso"
                value={grid.peso}
                onChange={(e) => updateGrid({ peso: e.target.value })}
                placeholder="Ej: 135 kg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-talla">Talla</Label>
              <Input
                id="plan-talla"
                value={grid.talla}
                onChange={(e) => updateGrid({ talla: e.target.value })}
                placeholder="Ej: 1.63 cm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-imc">IMC</Label>
              <Input
                id="plan-imc"
                value={grid.imc}
                onChange={(e) => updateGrid({ imc: e.target.value })}
                placeholder="Ej: 50.8"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="grid gap-2">
              <Label htmlFor="plan-objetivo">Objetivo</Label>
              <Input
                id="plan-objetivo"
                value={grid.objetivo}
                onChange={(e) => updateGrid({ objetivo: e.target.value })}
                placeholder="Ej: bajar de peso"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-kcal">Plan (kcal)</Label>
              <Input
                id="plan-kcal"
                value={grid.kcalObjetivo}
                onChange={(e) => updateGrid({ kcalObjetivo: e.target.value })}
                placeholder="Ej: 2700 kcal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semanas */}
      {grid.semanas.map((semana, si) => (
        <SemanaGrid
          key={si}
          semana={semana}
          puedeEliminar={grid.semanas.length > 1}
          onTitulo={(titulo) => updateSemana(si, (s) => ({ ...s, titulo }))}
          onCelda={(tipo, dia, value) => setCelda(si, tipo, dia, value)}
          onAddDia={() => addDia(si)}
          onRemoveDia={() => removeDia(si)}
          onRemove={() => removeSemana(si)}
        />
      ))}

      <Button type="button" variant="outline" onClick={addSemana}>
        <Plus />
        Agregar semana
      </Button>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Guardar plan</Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/pacientes/${props.pacienteId}/planes`}>Cancelar</Link>
        </Button>
        {props.planId ? (
          <Button type="button" variant="outline" asChild>
            <Link
              target="_blank"
              href={`/dashboard/pacientes/${props.pacienteId}/planes/${props.planId}/imprimir`}
            >
              Exportar PDF
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function formatFecha(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function SemanaGrid(props: {
  semana: PlanSemana;
  puedeEliminar: boolean;
  onTitulo: (titulo: string) => void;
  onCelda: (tipo: string, dia: number, value: string) => void;
  onAddDia: () => void;
  onRemoveDia: () => void;
  onRemove: () => void;
}) {
  const { semana } = props;
  const dias = Array.from({ length: semana.dias }, (_, i) => i);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <Input
          value={semana.titulo}
          onChange={(e) => props.onTitulo(e.target.value)}
          className="h-9 max-w-60 font-semibold"
          placeholder="Semana"
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={props.onRemoveDia} disabled={semana.dias <= 1}>
            <Minus />
            Día
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={props.onAddDia} disabled={semana.dias >= 14}>
            <Plus />
            Día
          </Button>
          {props.puedeEliminar ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={props.onRemove}
            >
              <Trash2 />
              Quitar semana
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        {/* Grilla comidas × días. gridTemplateColumns es dinámico (cantidad de días):
            única razón para usar style inline. */}
        <div
          className="grid min-w-160 gap-2"
          style={{ gridTemplateColumns: `8rem repeat(${semana.dias}, minmax(11rem, 1fr))` }}
        >
          {/* Encabezado: esquina + Día N */}
          <div />
          {dias.map((d) => (
            <div key={`h-${d}`} className="text-muted-foreground px-1 pb-1 text-sm font-medium">
              Día {d + 1}
            </div>
          ))}

          {/* Filas por comida */}
          {ORDEN_GRILLA.map((tipo) => (
            <React.Fragment key={tipo}>
              <div className="flex items-start pt-2 text-sm font-semibold">
                {LABEL_COMIDA[tipo]}
              </div>
              {dias.map((d) => (
                <Textarea
                  key={`${tipo}-${d}`}
                  value={semana.celdas[cellKey(tipo, d)] ?? ""}
                  onChange={(e) => props.onCelda(tipo, d, e.target.value)}
                  rows={4}
                  className="min-h-24 resize-y text-sm"
                  placeholder="—"
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
}
