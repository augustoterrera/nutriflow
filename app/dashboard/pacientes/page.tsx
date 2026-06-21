import Link from "next/link";
import { Users } from "lucide-react";
import { getDB } from "@/lib/db";

import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const PAGE_SIZE = 15;

export default async function PacientesPage(props: {
  searchParams?: Promise<{ q?: string; p?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const q = (sp?.q ?? "").trim();
  const page = Math.max(1, Number(sp?.p ?? 1) || 1);

  const db = await getDB();

  const where = q
    ? `where activo = 1 and (dni like ? or nombre_completo like ?)`
    : `where activo = 1`;

  const paramsCount = q ? [`%${q}%`, `%${q}%`] : [];
  const rowCount = await db.get(
    `select count(*) as total
     from pacientes
     ${where}`,
    paramsCount
  );

  const total = Number(rowCount?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const safeOffset = (safePage - 1) * PAGE_SIZE;

  const paramsList = q
    ? [`%${q}%`, `%${q}%`, PAGE_SIZE, safeOffset]
    : [PAGE_SIZE, safeOffset];

  const pacientes = await db.all(
    `select id, dni, nombre_completo, telefono
     from pacientes
     ${where}
     order by nombre_completo asc
     limit ? offset ?`,
    paramsList
  );

  const hrefForPage = (p: number) =>
    `/dashboard/pacientes?p=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <PageShell>
      <PageHeader
        title="Pacientes"
        description={`${total} ${total === 1 ? "paciente activo" : "pacientes activos"} en el sistema.`}
        actions={
          <Button asChild>
            <Link href="/dashboard/pacientes/nuevo">Nuevo paciente</Link>
          </Button>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <Label htmlFor="buscar-paciente" className="sr-only">
          Buscar paciente por DNI o nombre
        </Label>
        <Input
          id="buscar-paciente"
          name="q"
          defaultValue={q}
          placeholder="Buscar por DNI o nombre…"
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {pacientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Sin resultados" : "Todavía no hay pacientes"}
          description={
            q
              ? "Probá con otro DNI o nombre."
              : "Creá el primero para empezar a trabajar."
          }
          action={
            q ? undefined : (
              <Button asChild>
                <Link href="/dashboard/pacientes/nuevo">Nuevo paciente</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/pacientes/${p.id}`}
                        className="hover:underline"
                      >
                        {p.nombre_completo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.dni}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.telefono ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/pacientes/${p.id}/editar`}>
                            Editar
                          </Link>
                        </Button>
                        <Button variant="destructive" size="sm" asChild>
                          <Link href={`/dashboard/pacientes/${p.id}/desactivar`}>
                            Desactivar
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            hrefFor={hrefForPage}
          />
        </div>
      )}
    </PageShell>
  );
}
