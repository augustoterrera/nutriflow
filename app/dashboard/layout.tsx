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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
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
