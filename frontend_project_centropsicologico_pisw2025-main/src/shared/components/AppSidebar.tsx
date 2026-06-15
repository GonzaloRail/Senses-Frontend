import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMainItems } from "./NavMainItems";
import { getNavMainItemsByRole } from "../utils/getNavMainItemsByRole";
import { NavUser } from "./NavUser";
import { useAuth } from "@/store/auth/auth.store";

const rolesName = {
  ADMISSION: "Admisión",
  PSYCHOLOGIST: "Psicólogo",
  ADMIN: "Gerente",
  INTERNAL: "Interno",
};
export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {

  // TODO: get user from store
  const userStored = useAuth((state) => state.user);
  const roleSelected = useAuth((state) => state.roleSelected);

  const navMainItems = getNavMainItemsByRole(roleSelected!);

  const user = {
    name: `${userStored?.firstName} ${userStored?.lastName}`,
    email: userStored?.email ?? "",
    role: rolesName[roleSelected!] ?? "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div>
              <a href="#">
                <span className="scroll-m-20 text-2xl font-semibold tracking-tight text-white">
                  Senses Psicólogos
                </span>
              </a>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMainItems items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};
