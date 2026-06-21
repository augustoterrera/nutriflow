"use client";

import * as React from "react";
import { Calculator } from "lucide-react";

import { ResultadosEnergeticos } from "@/components/calculadora/resultados-energeticos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import {
  ACTIVIDADES_ENERGETICAS,
  calcularEvaluacionEnergetica,
  esActividadEnergetica,
  parseNumeroDecimal,
  type ActividadEnergetica,
  type ResultadoEnergetico,
} from "@/lib/energia";

type Props = {
  inicial: {
    sexo?: string;
    edad?: string;
    peso?: string;
    talla?: string;
  };
};

type FormValues = {
  sexo: "M" | "F";
  edad: string;
  peso: string;
  talla: string;
  actividad: ActividadEnergetica;
  formula: "mifflin" | "harris";
  objetivo: "bajar" | "mantener" | "subir";
};

type NumericField = "edad" | "peso" | "talla";
type FieldErrors = Partial<Record<NumericField, string>>;

export function CalculadoraForm({ inicial }: Props) {
  const [values, setValues] = React.useState<FormValues>(() => ({
    sexo: (inicial.sexo || "M").toUpperCase() === "F" ? "F" : "M",
    edad: inicial.edad || "",
    peso: inicial.peso || "",
    talla: inicial.talla || "",
    actividad: "moderada",
    formula: "mifflin",
    objetivo: "mantener",
  }));
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [resultado, setResultado] = React.useState<ResultadoEnergetico | null>(null);

  function actualizar<K extends keyof FormValues>(campo: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [campo]: value }));
    setResultado(null);

    if (campo === "edad" || campo === "peso" || campo === "talla") {
      setErrors((current) => ({ ...current, [campo]: undefined }));
    }
  }

  function calcular(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const edadN = parseNumeroDecimal(values.edad);
    const pesoN = parseNumeroDecimal(values.peso);
    const tallaN = parseNumeroDecimal(values.talla);
    const nextErrors: FieldErrors = {};

    if (!Number.isInteger(edadN) || edadN <= 0) {
      nextErrors.edad = "Ingresá una edad válida en años enteros.";
    }
    if (!Number.isFinite(pesoN) || pesoN <= 0) {
      nextErrors.peso = "Ingresá un peso mayor que cero.";
    }
    if (!Number.isFinite(tallaN) || tallaN <= 0) {
      nextErrors.talla = "Ingresá una talla mayor que cero.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setResultado(null);
      return;
    }

    setResultado(calcularEvaluacionEnergetica({
      sexo: values.sexo,
      edad: edadN,
      pesoKg: pesoN,
      tallaCm: tallaN,
      actividad: values.actividad,
      formula: values.formula,
      objetivoTipo: values.objetivo,
    }));
  }

  function restablecer() {
    setValues({
      sexo: "M",
      edad: "",
      peso: "",
      talla: "",
      actividad: "moderada",
      formula: "mifflin",
      objetivo: "mantener",
    });
    setErrors({});
    setResultado(null);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la estimación</CardTitle>
          <CardDescription>
            Completá las medidas y elegí el criterio que se usará para calcular el GET.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={calcular} noValidate>
            <FieldGroup className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="calculadora-sexo">Sexo</FieldLabel>
                <SelectNative
                  id="calculadora-sexo"
                  name="sexo"
                  value={values.sexo}
                  onChange={(event) =>
                    actualizar("sexo", event.target.value === "F" ? "F" : "M")
                  }
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </SelectNative>
              </Field>

              <NumericInput
                id="calculadora-edad"
                label="Edad"
                suffix="años"
                value={values.edad}
                placeholder="Ej: 30"
                inputMode="numeric"
                error={errors.edad}
                onChange={(value) => actualizar("edad", value)}
              />

              <NumericInput
                id="calculadora-peso"
                label="Peso"
                suffix="kg"
                value={values.peso}
                placeholder="Ej: 70,5"
                error={errors.peso}
                onChange={(value) => actualizar("peso", value)}
              />

              <NumericInput
                id="calculadora-talla"
                label="Talla"
                suffix="cm"
                value={values.talla}
                placeholder="Ej: 165"
                error={errors.talla}
                onChange={(value) => actualizar("talla", value)}
              />

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="calculadora-actividad">Nivel de actividad</FieldLabel>
                <SelectNative
                  id="calculadora-actividad"
                  name="actividad"
                  value={values.actividad}
                  onChange={(event) =>
                    actualizar(
                      "actividad",
                      esActividadEnergetica(event.target.value)
                        ? event.target.value
                        : "moderada"
                    )
                  }
                >
                  {ACTIVIDADES_ENERGETICAS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field>
                <FieldLabel htmlFor="calculadora-formula">Fórmula para el GET</FieldLabel>
                <SelectNative
                  id="calculadora-formula"
                  name="formula"
                  value={values.formula}
                  onChange={(event) =>
                    actualizar(
                      "formula",
                      event.target.value === "harris" ? "harris" : "mifflin"
                    )
                  }
                >
                  <option value="mifflin">Mifflin-St Jeor</option>
                  <option value="harris">Harris-Benedict</option>
                </SelectNative>
                <FieldDescription>
                  La fórmula elegida alimenta el GET y el objetivo.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="calculadora-objetivo">Objetivo</FieldLabel>
                <SelectNative
                  id="calculadora-objetivo"
                  name="objetivo"
                  value={values.objetivo}
                  onChange={(event) => {
                    const value = event.target.value;
                    actualizar(
                      "objetivo",
                      value === "bajar" || value === "subir" ? value : "mantener"
                    );
                  }}
                >
                  <option value="bajar">Reducir peso</option>
                  <option value="mantener">Mantener peso</option>
                  <option value="subir">Aumentar peso</option>
                </SelectNative>
                <FieldDescription>
                  Aplica un ajuste moderado sobre el GET.
                </FieldDescription>
              </Field>

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">
                  <Calculator aria-hidden="true" />
                  Calcular
                </Button>
                <Button type="button" variant="outline" onClick={restablecer}>
                  Restablecer
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="resultados-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="resultados-heading" className="text-lg font-semibold">
            Resultados
          </h2>
          <p className="text-muted-foreground text-sm">
            Comparación de fórmulas y estimación diaria según el criterio elegido.
          </p>
        </div>

        <div aria-live="polite">
          {resultado ? (
            <ResultadosEnergeticos resultado={resultado} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <Calculator className="text-muted-foreground mb-4 size-10" aria-hidden="true" />
                <p className="font-medium">Todavía no hay una estimación</p>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                  Completá edad, peso y talla. Los resultados aparecerán acá sin ocultar el formulario.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function NumericInput({
  id,
  label,
  suffix,
  value,
  placeholder,
  inputMode = "decimal",
  error,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  placeholder: string;
  inputMode?: "decimal" | "numeric";
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        {label} <span className="text-muted-foreground">({suffix})</span>
      </FieldLabel>
      <Input
        id={id}
        name={id.replace("calculadora-", "")}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}
