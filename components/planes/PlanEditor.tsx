"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { totalesPlan } from "@/lib/calculos";
import { TIPOS_COMIDA, type TipoComida } from "@/lib/plan-constants";

type Alimento = {
  id: number;
  nombre: string;
  kcal: number;
  prot: number;
  cho: number;
  gras: number;
  fibra: number;
  grupo: string;
  es_custom: number;
};

type Item = {
  alimento_id: number | null;
  nombre: string;
  gramos: number;
  kcal: number;
  prot: number;
  cho: number;
  gras: number;
  fibra: number;
};

type Comida = { tipo: TipoComida; nota: string; items: Item[] };
type PlanState = { nombre: string; fecha: string; comidas: Comida[] };

const labels: Record<TipoComida, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export function PlanEditor(props: {
  pacienteId: number;
  planId: number | null;
  alimentos: Alimento[];
  initialPlan?: Partial<PlanState> | null;
  action: (formData: FormData) => void;
  crearCustomAction: (datos: { nombre: string; kcal: number; prot: number; cho: number; gras: number; fibra: number }) => Promise<void>;
}) {
  const [plan, setPlan] = React.useState<PlanState>(() => ({
    nombre: props.initialPlan?.nombre || "Plan alimentario",
    fecha: props.initialPlan?.fecha || new Date().toISOString().slice(0, 10),
    comidas: TIPOS_COMIDA.map((tipo) => ({
      tipo,
      nota: props.initialPlan?.comidas?.find((c) => c.tipo === tipo)?.nota || "",
      items: props.initialPlan?.comidas?.find((c) => c.tipo === tipo)?.items || [],
    })),
  }));

  const items = plan.comidas.flatMap((comida) => comida.items);
  const total = totalesPlan(items);
  const payload = JSON.stringify(plan);

  const updateComida = (tipo: TipoComida, updater: (comida: Comida) => Comida) => {
    setPlan((current) => ({
      ...current,
      comidas: current.comidas.map((comida) => (comida.tipo === tipo ? updater(comida) : comida)),
    }));
  };

  const addItem = (tipo: TipoComida, item: Item) => {
    updateComida(tipo, (comida) => ({ ...comida, items: [...comida.items, item] }));
  };

  const removeItem = (tipo: TipoComida, index: number) => {
    updateComida(tipo, (comida) => ({ ...comida, items: comida.items.filter((_, i) => i !== index) }));
  };

  return (
    <form action={props.action} className="space-y-6">
      <input type="hidden" name="plan" value={payload} />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_180px_auto]">
          <div className="grid gap-2">
            <Label>Nombre del plan</Label>
            <Input value={plan.nombre} onChange={(event) => setPlan({ ...plan, nombre: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Input type="date" value={plan.fecha} onChange={(event) => setPlan({ ...plan, fecha: event.target.value })} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Guardar</Button>
            {props.planId ? (
              <Button type="button" variant="outline" asChild>
                <Link target="_blank" href={`/dashboard/pacientes/${props.pacienteId}/planes/${props.planId}/imprimir`}>
                  Exportar
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {plan.comidas.map((comida) => {
          const parcial = totalesPlan(comida.items);
          return (
            <details key={comida.tipo} open className="rounded-md border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <span className="font-semibold">{labels[comida.tipo]}</span>
                <span className="text-sm text-muted-foreground">{parcial.kcal} kcal</span>
              </summary>
              <div className="space-y-3 border-t p-4">
                {comida.items.map((item, index) => (
                  <div key={`${item.nombre}-${index}`} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_90px_90px_auto] sm:items-center">
                    <div>
                      <div className="font-medium">{item.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        P {item.prot.toFixed(1)} g · C {item.cho.toFixed(1)} g · G {item.gras.toFixed(1)} g · Fib {item.fibra.toFixed(1)} g
                      </div>
                    </div>
                    <div>{item.gramos} g</div>
                    <div>{Math.round(item.kcal)} kcal</div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeItem(comida.tipo, index)}>
                      Quitar
                    </Button>
                  </div>
                ))}

                <textarea
                  value={comida.nota}
                  onChange={(event) => updateComida(comida.tipo, (c) => ({ ...c, nota: event.target.value }))}
                  className="w-full rounded-md border bg-background p-3 text-sm"
                  placeholder="Nota de la comida..."
                  rows={2}
                />

                <FoodPicker
                  tipo={comida.tipo}
                  alimentos={props.alimentos}
                  onAdd={addItem}
                  crearCustomAction={props.crearCustomAction}
                />
              </div>
            </details>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-semibold">{total.kcal} kcal</div>
          <MacroBar label="Proteínas" value={total.pProt} color="var(--v5)" grams={total.prot} />
          <MacroBar label="Carbohidratos" value={total.pCho} color="var(--ama)" grams={total.cho} />
          <MacroBar label="Grasas" value={total.pGras} color="var(--az)" grams={total.gras} />
          <MacroBar label="Fibra" value={Math.min(100, Math.round((total.fibra / 30) * 100))} color="var(--v6)" grams={total.fibra} />
        </CardContent>
      </Card>
    </form>
  );
}

function FoodPicker(props: {
  tipo: TipoComida;
  alimentos: Alimento[];
  onAdd: (tipo: TipoComida, item: Item) => void;
  crearCustomAction: (datos: { nombre: string; kcal: number; prot: number; cho: number; gras: number; fibra: number }) => Promise<void>;
}) {
  const [tab, setTab] = React.useState<"buscar" | "manual" | "guardados">("buscar");
  const [q, setQ] = React.useState("");
  const [gramos, setGramos] = React.useState("100");
  const [manual, setManual] = React.useState({ nombre: "", kcal: "", prot: "", cho: "", gras: "", fibra: "", guardar: false });
  const [open, setOpen] = React.useState(false);

  // Con ~100 alimentos alcanza memoizar el filtrado; virtualizar sumaría complejidad sin beneficio real.
  const filtrados = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = tab === "guardados" ? props.alimentos.filter((a) => a.es_custom === 1) : props.alimentos;
    if (!query) return base;
    return base.filter((a) => a.nombre.toLowerCase().includes(query));
  }, [props.alimentos, q, tab]);

  const addAlimento = (alimento: Alimento) => {
    const g = Number(gramos.replace(",", ".")) || 100;
    props.onAdd(props.tipo, porcion(alimento, g));
    setOpen(false);
  };

  const addManual = async () => {
    const g = Number(gramos.replace(",", ".")) || 100;
    const base = {
      id: 0,
      nombre: manual.nombre.trim() || "Alimento manual",
      kcal: Number(manual.kcal.replace(",", ".")) || 0,
      prot: Number(manual.prot.replace(",", ".")) || 0,
      cho: Number(manual.cho.replace(",", ".")) || 0,
      gras: Number(manual.gras.replace(",", ".")) || 0,
      fibra: Number(manual.fibra.replace(",", ".")) || 0,
      grupo: "Custom",
      es_custom: 1,
    };

    if (manual.guardar) {
      await props.crearCustomAction(base);
    }

    props.onAdd(props.tipo, porcion(base, g));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">Agregar alimento</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar alimento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {(["buscar", "manual", "guardados"] as const).map((value) => (
            <Button key={value} type="button" size="sm" variant={tab === value ? "default" : "outline"} onClick={() => setTab(value)}>
              {value === "buscar" ? "Buscar" : value === "manual" ? "Manual" : "Guardados"}
            </Button>
          ))}
        </div>

        <div className="grid gap-2">
          <Label>Gramos</Label>
          <Input value={gramos} onChange={(event) => setGramos(event.target.value)} inputMode="decimal" />
        </div>

        {tab === "manual" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Input className="sm:col-span-3" placeholder="Nombre" value={manual.nombre} onChange={(e) => setManual({ ...manual, nombre: e.target.value })} />
            {(["kcal", "prot", "cho", "gras", "fibra"] as const).map((key) => (
              <Input key={key} placeholder={key.toUpperCase()} value={manual[key]} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} inputMode="decimal" />
            ))}
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input type="checkbox" checked={manual.guardar} onChange={(e) => setManual({ ...manual, guardar: e.target.checked })} />
              Guardar para usar siempre
            </label>
            <Button type="button" onClick={addManual}>Agregar manual</Button>
          </div>
        ) : (
          <>
            <Input placeholder="Buscar..." value={q} onChange={(event) => setQ(event.target.value)} />
            <div className="grid max-h-80 gap-2 overflow-y-auto">
              {filtrados.map((alimento) => (
                <FoodRow key={alimento.id} alimento={alimento} onAdd={addAlimento} />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const FoodRow = React.memo(function FoodRow({ alimento, onAdd }: { alimento: Alimento; onAdd: (alimento: Alimento) => void }) {
  return (
    <button type="button" onClick={() => onAdd(alimento)} className="flex items-center justify-between rounded-md border p-3 text-left hover:bg-accent">
      <span>
        <span className="font-medium">{alimento.es_custom ? "* " : ""}{alimento.nombre}</span>
        <span className="block text-xs text-muted-foreground">{alimento.grupo}</span>
      </span>
      <span className="text-sm">{alimento.kcal} kcal</span>
    </button>
  );
});

function porcion(alimento: Alimento, gramos: number): Item {
  const factor = gramos / 100;
  return {
    alimento_id: alimento.id || null,
    nombre: alimento.nombre,
    gramos,
    kcal: alimento.kcal * factor,
    prot: alimento.prot * factor,
    cho: alimento.cho * factor,
    gras: alimento.gras * factor,
    fibra: alimento.fibra * factor,
  };
}

function MacroBar(props: { label: string; value: number; grams: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{props.label}</span>
        <span>{props.grams.toFixed(1)} g · {props.value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, props.value)}%`, background: props.color }} />
      </div>
    </div>
  );
}
