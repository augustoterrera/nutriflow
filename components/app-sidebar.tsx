import { Apple, Home, Trash2, Users, Zap } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import Link from "next/link"

// Menu items.
const items = [
  {
    title: "Inicio",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Pacientes",
    url: "/dashboard/pacientes",
    icon: Users,
  },
  {
    title: "Calculadora",
    url: "/dashboard/calculadora",
    icon: Zap,
  },
  {
    title: "Alimentos",
    url: "/dashboard/alimentos",
    icon: Apple,
  },
  {
    title: "Papelera",
    url: "/dashboard/papelera",
    icon: Trash2,
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mt-auto p-4 border-t">
          <Button variant="destructive" className="w-full" asChild>
            <Link href="/logout">Cerrar sesión</Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
