"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Apple, HeartPulse, Home, LogOut, Trash2, Users, Zap } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/logout/actions"

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
    title: "Cálculo rápido",
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
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  function closeMobileMenu() {
    if (isMobile) setOpenMobile(false)
  }

  function isItemActive(url: string) {
    if (url === "/dashboard") return pathname === url
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="NutriFlow" asChild>
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <HeartPulse className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NutriFlow</span>
                  <span className="text-sidebar-foreground/70 truncate text-xs">
                    Gestión nutricional
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.url}
                      aria-current={isItemActive(item.url) ? "page" : undefined}
                      onClick={closeMobileMenu}
                    >
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
        <div className="border-t pt-2">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
              onClick={closeMobileMenu}
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">
                Cerrar sesión
              </span>
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
