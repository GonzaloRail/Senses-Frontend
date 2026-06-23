import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { SiteHeaderProps } from "../interfaces/ui/SiteHeaderProps"
import { IoArrowBackOutline } from "react-icons/io5";
import { NotificationBell } from "./NotificationBell";

export const SiteHeader = ({ title, backButton, onBackButtonClick }: SiteHeaderProps) => {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-15 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {backButton && (
          <>
            <IoArrowBackOutline onClick={onBackButtonClick} className="-ml-1 cursor-pointer text-2xl" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-8"
            />
          </>

        )}
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <div className="lg:flex flex-1 lg:items-center lg:justify-center">
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight first:mt-0">{title}</h1>
        </div>
        <div className="flex items-center ml-auto pl-4">
          <NotificationBell />
        </div>

      </div>
    </header>
  )
}
