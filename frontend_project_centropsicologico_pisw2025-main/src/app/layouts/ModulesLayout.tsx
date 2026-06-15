import { Outlet } from "react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/shared/components/AppSidebar"

export const ModulesLayout = () => {
  return (
    <SidebarProvider >
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-y-auto max-h-[calc(100dvh-1rem)] custom-scroll">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
