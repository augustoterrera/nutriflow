"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularGET, kcalObjetivo, tmbHarris, tmbMifflin } from "@/lib/calculos";

const actividades = [
  { value: 1.2, label: "Sedentario (poco o nada de ejercicio)" },
  { value: 1.375, label: "Actividad ligera (1-3 días/semana)" },
  { value: 1.55, label: "Actividad moderada (3-5 días/semana)" },
  { value: 1.725, label: "Muy activo (6-7 días/semana)" },
  { value: 1.9, label: "Extra activo (trabajo físico + entrenamiento)" },
];

type Props = {
  inicial: {
    sexo?: string;
    edad?: string;
    peso?: string;
    talla?: string;
  };
};

export function CalculadoraForm({ inicial }: Props) {
  const [sexo, setSexo] = React.useState((inicial.sexo || "M").toUpperCase() === "F" ? "F" : "M");
  const [edad, setEdad] = React.useState(inicial.edad || "");
  const [peso, setPeso] = React.useState(inicial.peso || "");
  const [talla, setTalla] = React.useState(inicial.talla || "");
  const [actividad, setActividad] = React.useState("1.55");
  const [formula, setFormula] = React.useState<"mifflin" | "harris">("mifflin");
  const [objetivo, setObjetivo] = React.useState<"bajar" | "mantener" | "subir">("mantener");
  const [resultado, setResultado] = React.useState<null | { tmb: number; get: number; objetivo: number }>(null);

  const calcular = () => {
    const edadN = Number(edad);
    const pesoN = Number(String(peso).replace(",", "."));
    const tallaN = Number(String(talla).replace(",", "."));
    const factor = Number(actividad);

    if (!edadN || !pesoN || !tallaN || !factor) return;

    const tmb =
      formula === "mifflin"
        ? tmbMifflin(sexo, edadN, pesoN, tallaN)
        : tmbHarris(sexo, edadN, pesoN, tallaN);
    const get = calcularGET(tmb, factor);
    setResultado({ tmb, get, objetivo: kcalObjetivo(get, objetivo) });
  };

  if (resultado) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Resultado energético</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Result label="TMB" value={resultado.tmb} suffix="kcal" />
          <Result label="GET" value={resultado.get} suffix="kcal/día" destacado />
          <Result label="Objetivo" value={resultado.objetivo} suffix="kcal/día" />
          <div className="sm:col-span-3 rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            {formula === "mifflin"
              ? "Fórmula Mifflin-St Jeor: recomendada como estimación moderna de metabolismo basal."
              : "Fórmula Harris-Benedict: estimación clásica de metabolismo basal."}
          </div>
          <Button className="sm:col-span-3 w-fit" onClick={() => setResultado(null)}>
            Nuevo cálculo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Calculadora energética</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          {(["M", "F"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={sexo === value ? "default" : "outline"}
              onClick={() => setSexo(value)}
            >
              {value === "M" ? "Masculino" : "Femenino"}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Edad" value={edad} onChange={setEdad} placeholder="30" />
          <Field label="Peso (kg)" value={peso} onChange={setPeso} placeholder="70" />
          <Field label="Talla (cm)" value={talla} onChange={setTalla} placeholder="165" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="actividad">Actividad</Label>
          <select
            id="actividad"
            value={actividad}
            onChange={(event) => setActividad(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {actividades.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={formula === "mifflin" ? "default" : "outline"} onClick={() => setFormula("mifflin")}>
            Mifflin
          </Button>
          <Button type="button" variant={formula === "harris" ? "default" : "outline"} onClick={() => setFormula("harris")}>
            Harris
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["bajar", "mantener", "subir"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={objetivo === value ? "default" : "outline"}
              onClick={() => setObjetivo(value)}
            >
              {value === "bajar" ? "Bajar" : value === "subir" ? "Subir" : "Mantener"}
            </Button>
          ))}
        </div>

        <Button type="button" onClick={calcular}>
          Calcular
        </Button>
      </CardContent>
    </Card>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid gap-2">
      <Label>{props.label}</Label>
      <Input inputMode="decimal" value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder={props.placeholder} />
    </div>
  );
}

function Result(props: { label: string; value: number; suffix: string; destacado?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${props.destacado ? "bg-primary text-primary-foreground" : "bg-card"}`}>
      <div className="text-sm opacity-80">{props.label}</div>
      <div className="mt-1 text-3xl font-semibold">{props.value}</div>
      <div className="text-sm opacity-80">{props.suffix}</div>
    </div>
  );
}
