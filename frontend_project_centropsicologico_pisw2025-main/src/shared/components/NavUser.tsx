import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import type { NavUserProps } from "../interfaces/ui/NavUserProps";
import { useLogoutMutation } from "@/features/auth/hooks";

export const NavUser = ({ user }: NavUserProps) => {
  const { name, email, role } = user;

  const logout = useLogoutMutation();

  const handleLogout = () => {
    logout.mutate();
  };
  return (
    <SidebarMenu>
      <SidebarMenuItem className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="scroll-m-20 text-xl font-semibold tracking-tight text-white">
            {name}
          </span>
          <span className=" text-white h-5">{role}</span>
          <span className="text-white h-5">{email}</span>
        </div>
        <SidebarMenuButton
          onClick={handleLogout}
          size="default"
          className="my-2 cursor-pointer bg-senses-danger flex justify-center text-white hover:bg-senses-danger/80 hover:text-white"
        >
          Cerrar sesión
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
