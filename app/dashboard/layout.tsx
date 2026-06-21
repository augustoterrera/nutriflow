import { AppSidebar } from "@/components/app-sidebar"
import { BackButton } from "@/components/shared/back-button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="print:block print:min-h-0">
      <a
        href="#contenido-principal"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:fixed focus:top-2 focus:left-2 focus:not-sr-only"
      >
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <SidebarInset id="contenido-principal" tabIndex={-1} className="print:block print:w-full">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur print:hidden">
          <SidebarTrigger className="size-9" />
          <Separator orientation="vertical" className="h-4" />
          <BackButton />
          <span className="text-muted-foreground text-sm font-medium">
            Panel de gestión
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
