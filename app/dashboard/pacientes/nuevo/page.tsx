import { crearPacienteAction } from "./actions";

import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PacienteForm } from "@/components/pacientes/PacienteForm";
import { FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function NuevoPacientePage() {
  return (
    <PageShell width="form">
      <PageHeader
        title="Nuevo paciente"
        description="Cargá los datos del paciente. Solo DNI y nombre son obligatorios."
      />

      <form action={crearPacienteAction}>
        <PacienteForm>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-fit">
              Crear paciente
            </Button>
            <FieldDescription>
              Si el DNI ya existe, vas a ver un mensaje de error.
            </FieldDescription>
          </div>
        </PacienteForm>
      </form>
    </PageShell>
  );
}
