import { CalculadoraForm } from "@/components/calculadora/CalculadoraForm";

export default async function CalculadoraPage(props: {
  searchParams?: Promise<{ edad?: string; peso?: string; talla?: string; sexo?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calculadora</h1>
        <p className="text-sm text-muted-foreground">Estimación de TMB, GET y objetivo calórico.</p>
      </div>
      <CalculadoraForm inicial={sp} />
    </div>
  );
}
