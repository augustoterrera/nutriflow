import Link from "next/link";
import { Fragment } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desactivarAlimento, listarAlimentos, listarGruposAlimentos, crearAlimentoCustom } from "@/lib/alimentos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function crearAlimentoAction(formData: FormData) {
  "use server";

  const num = (name: string) => Number(String(formData.get(name) ?? "0").replace(",", ".")) || 0;
  await crearAlimentoCustom({
    nombre: String(formData.get("nombre") ?? ""),
    kcal: num("kcal"),
    prot: num("prot"),
    cho: num("cho"),
    gras: num("gras"),
    fibra: num("fibra"),
    grupo: String(formData.get("grupo") ?? "Custom"),
  });

  revalidatePath("/dashboard/alimentos");
  redirect("/dashboard/alimentos?vista=tabla");
}

async function desactivarAlimentoAction(formData: FormData) {
  "use server";

  await desactivarAlimento(Number(formData.get("id")));
  revalidatePath("/dashboard/alimentos");
}

export default async function AlimentosPage(props: {
  searchParams?: Promise<{ q?: string; grupo?: string; vista?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const q = String(sp.q ?? "").trim();
  const grupo = String(sp.grupo ?? "").trim();
  const vista = sp.vista === "tabla" ? "tabla" : "banco";
  const [alimentos, grupos] = await Promise.all([
    listarAlimentos({ q, grupo }),
    listarGruposAlimentos(),
  ]);

  const grouped = alimentos.reduce<Map<string, typeof alimentos>>((acc, item) => {
    const current = acc.get(item.grupo) ?? [];
    current.push(item);
    acc.set(item.grupo, current);
    return acc;
  }, new Map());

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Alimentos</h1>
          <p className="text-sm text-muted-foreground">Banco y tabla nutricional por 100 g.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={vista === "banco" ? "default" : "outline"} asChild>
            <Link href={`/dashboard/alimentos?${qs({ q, grupo, vista: "banco" })}`}>Banco</Link>
          </Button>
          <Button variant={vista === "tabla" ? "default" : "outline"} asChild>
            <Link href={`/dashboard/alimentos?${qs({ q, grupo, vista: "tabla" })}`}>Tabla</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-2">
            <Input name="q" defaultValue={q} placeholder="Buscar alimento..." className="w-72" />
            <input type="hidden" name="vista" value={vista} />
            {grupo ? <input type="hidden" name="grupo" value={grupo} /> : null}
            <Button type="submit">Buscar</Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/alimentos?vista=${vista}`}>Limpiar</Link>
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant={!grupo ? "default" : "outline"} asChild>
              <Link href={`/dashboard/alimentos?${qs({ q, vista })}`}>Todos</Link>
            </Button>
            {grupos.map((g) => (
              <Button key={g} size="sm" variant={grupo === g ? "default" : "outline"} asChild>
                <Link href={`/dashboard/alimentos?${qs({ q, grupo: g, vista })}`}>{g}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo alimento custom</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={crearAlimentoAction} className="grid gap-3 md:grid-cols-7">
            <Field name="nombre" label="Nombre" className="md:col-span-2" required />
            <Field name="kcal" label="Kcal" inputMode="decimal" required />
            <Field name="prot" label="Prot" inputMode="decimal" />
            <Field name="cho" label="CHO" inputMode="decimal" />
            <Field name="gras" label="Gras" inputMode="decimal" />
            <Field name="fibra" label="Fibra" inputMode="decimal" />
            <div className="grid gap-2 md:col-span-2">
              <Label>Grupo</Label>
              <Input name="grupo" defaultValue="Custom" />
            </div>
            <Button type="submit" className="md:col-span-2 md:self-end">Guardar custom</Button>
          </form>
        </CardContent>
      </Card>

      {vista === "banco" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...grouped.entries()].map(([nombreGrupo, items]) => (
            <Card key={nombreGrupo}>
              <CardHeader>
                <CardTitle>{nombreGrupo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{item.es_custom ? "* " : ""}{item.nombre}</div>
                      <div className="text-sm text-muted-foreground">{item.kcal} kcal / 100 g</div>
                    </div>
                    {item.es_custom ? <DeleteFood id={item.id} /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="border-b p-2">Alimento</th>
                    <th className="border-b p-2 text-right">Kcal</th>
                    <th className="border-b p-2 text-right">Prot</th>
                    <th className="border-b p-2 text-right">CHO</th>
                    <th className="border-b p-2 text-right">Gras</th>
                    <th className="border-b p-2 text-right">Fibra</th>
                    <th className="border-b p-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...grouped.entries()].map(([nombreGrupo, items]) => (
                    <Fragment key={nombreGrupo}>
                      <tr key={`${nombreGrupo}-header`} className="bg-muted">
                        <td className="p-2 font-semibold" colSpan={7}>{nombreGrupo}</td>
                      </tr>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{item.es_custom ? "* " : ""}{item.nombre}</td>
                          <td className="p-2 text-right">{item.kcal}</td>
                          <td className="p-2 text-right">{item.prot}</td>
                          <td className="p-2 text-right">{item.cho}</td>
                          <td className="p-2 text-right">{item.gras}</td>
                          <td className="p-2 text-right">{item.fibra}</td>
                          <td className="p-2 text-right">{item.es_custom ? <DeleteFood id={item.id} /> : null}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field(props: { name: string; label: string; className?: string; inputMode?: "decimal"; required?: boolean }) {
  return (
    <div className={`grid gap-2 ${props.className ?? ""}`}>
      <Label>{props.label}</Label>
      <Input name={props.name} inputMode={props.inputMode} required={props.required} />
    </div>
  );
}

function DeleteFood({ id }: { id: number }) {
  return (
    <form action={desactivarAlimentoAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">Eliminar</Button>
    </form>
  );
}

function qs(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
