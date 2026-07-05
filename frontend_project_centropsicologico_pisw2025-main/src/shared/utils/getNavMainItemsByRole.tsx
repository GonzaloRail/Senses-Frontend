import { TbLayoutDashboardFilled, TbBuildings } from "react-icons/tb";
import { FaUser, FaCalendarAlt } from "react-icons/fa";
import { GiHealthNormal } from "react-icons/gi";
import { PiOfficeChairBold } from "react-icons/pi";
import { IoIosDocument } from "react-icons/io";
import { MdInventory } from "react-icons/md";
import { FaUserCog } from "react-icons/fa";
import { TbReceipt } from "react-icons/tb";

export const getNavMainItemsByRole = (role: string) => {
  switch (role) {
    case "ADMIN":
      return [
        {
          title: "Analíticas",
          icon: TbLayoutDashboardFilled,
          url: "/dashboard",
        },
        {
          title: "Gestión de usuarios del sistema",
          icon: FaUser,
          url: "/system-users",
        },
        {
          title: "Historias clínicas",
          icon: GiHealthNormal,
          url: "/clinical-histories",
        },
        {
          title: "Gestión de consultorios",
          icon: PiOfficeChairBold,
          url: "/offices",
        },
        {
          title: "Horarios",
          icon: FaCalendarAlt,
          url: "/schedules",
        },
        {
          title: "Gestión de sedes",
          icon: TbBuildings,
          url: "/locations",
        },
        {
          title: "Gestión de evaluaciones",
          icon: IoIosDocument,
          url: "/evaluations",
        },
        {
          title: "Gestión de inventarios",
          icon: MdInventory,
          url: "/inventory",
        },
        {
          title: "Registro de ingresos",
          icon: TbReceipt,
          url: "/ingresos",
        },
      ];
    case "ADMISSION":
      return [
        {
          title: "Gestión de citas",
          icon: GiHealthNormal,
          url: "/appointments",
        },
        {
          title: "Gestión de pacientes",
          icon: FaUser,
          url: "/patients",
        },
        {
          title: "Gestión de horarios",
          icon: FaCalendarAlt,
          url: "/schedules",
        },
        {
          title: "Gestión de permisos",
          icon: FaUserCog,
          url: "/employee-leaves",
        },
        {
          title: "Registro de ingresos",
          icon: TbReceipt,
          url: "/ingresos",
        },
      ];
    case "PSYCHOLOGIST":
      return [
        {
          title: "Mis pacientes",
          icon: FaUser,
          url: "/my-patients",
        },
        {
          title: "Mi horario",
          icon: FaCalendarAlt,
          url: "/my-schedule",
        },
        {
          title: "Citas",
          icon: GiHealthNormal,
          url: "/my-appointments",
        },
      ];
    case "AUDITOR":
      return [
        {
          title: "Registro de ingresos",
          icon: TbReceipt,
          url: "/ingresos",
        },
      ];
    default:
      return [];
  }
};
