"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell width="form">
      <PageHeader
        title="No pudimos crear el paciente"
        description="Revisá el error e intentá nuevamente."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detalle del error</CardTitle>
          <CardDescription className="text-destructive">
            {error.message || "No se pudo crear el paciente."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button onClick={() => reset()}>Intentar de nuevo</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/pacientes">Ir a pacientes</Link>
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  );
}
