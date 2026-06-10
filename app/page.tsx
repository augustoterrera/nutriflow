import { redirect } from "next/navigation";
import { hayPinConfigurado, sesionValida } from "@/lib/auth";

export default async function Home() {
  // Si ya hay sesión válida, ir a dashboard
  if (await sesionValida()) {
    redirect("/dashboard");
  }

  // Si no hay PIN configurado, ir a setup
  const hayPin = await hayPinConfigurado();
  if (!hayPin) {
    redirect("/setup");
  }

  // Si hay PIN pero no hay sesión, ir a lock
  redirect("/lock");
}
