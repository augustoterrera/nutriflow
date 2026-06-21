import { CalculadoraForm } from "@/components/calculadora/CalculadoraForm";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";

export default async function CalculadoraPage(props: {
  searchParams?: Promise<{ edad?: string; peso?: string; talla?: string; sexo?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};

  return (
    <PageShell>
      <PageHeader
        title="Calculadora energética"
        description="Estimá el metabolismo basal, el gasto energético total y un objetivo calórico diario."
      />
      <CalculadoraForm inicial={sp} />
    </PageShell>
  );
}
