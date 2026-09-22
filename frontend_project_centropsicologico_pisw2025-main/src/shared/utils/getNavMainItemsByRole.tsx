import { TbLayoutDashboardFilled, TbBuildings } from "react-icons/tb";
import { FaUser, FaCalendarAlt, FaMoneyBillWave, FaChartPie, FaFileAlt, FaPercentage, FaClipboardList } from "react-icons/fa";
import { GiHealthNormal } from "react-icons/gi";
import { PiOfficeChairBold } from "react-icons/pi";
import { IoIosDocument } from "react-icons/io";
import { MdInventory, MdAnnouncement, MdNotificationsActive } from "react-icons/md";
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
          title: "Gestión de permisos",
          icon: FaUserCog,
          url: "/employee-leaves",
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
          title: "Gestión de comunicados",
          icon: MdAnnouncement,
          url: "/announcements",
        },
        {
          title: "Libro de Egresos",
          icon: FaMoneyBillWave,
          url: "/admin-expenses",
        },
        {
          title: "Registro de ingresos",
          icon: TbReceipt,
          url: "/ingresos",
        },
        {
          title: "Dashboard Financiero",
          icon: FaChartPie,
          url: "/financial-dashboard",
        },
        {
          title: "Reportes",
          icon: FaFileAlt,
          url: "/reports",
        },
        {
          title: "Comisiones de Psicólogos",
          icon: FaPercentage,
          url: "/commissions",
        },
        {
          title: "Auditoría Contable",
          icon: FaClipboardList,
          url: "/audit-logs",
      
        },
        {
          title: "Recordatorios de citas",
          icon: MdNotificationsActive,
          url: "/appointment-notifications",
        }
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
          title: "Mis Gastos",
          icon: FaMoneyBillWave,
          url: "/my-expenses",
        },
        {
          title: "Recordatorios de citas",
          icon: MdNotificationsActive,
          url: "/appointment-notifications",
        }
      ];
    case "CASHIER":
      return [
        {
          title: "Registro de ingresos",
          icon: TbReceipt,
          url: "/ingresos",
        },
        {
          title: "Libro de Egresos",
          icon: FaMoneyBillWave,
          url: "/admin-expenses",
        },
        {
          title: "Gestión de inventarios",
          icon: MdInventory,
          url: "/inventory",
        },
        {
          title: "Reportes",
          icon: FaFileAlt,
          url: "/reports",
        },
      ];
    case "HR":
      return [
        {
          title: "Gestión de usuarios del sistema",
          icon: FaUser,
          url: "/system-users",
        },
        {
          title: "Gestión de comunicados",
          icon: MdAnnouncement,
          url: "/announcements",
        },
        {
          title: "Gestión de permisos",
          icon: FaUserCog,
          url: "/employee-leaves",
        },
        {
          title: "Comisiones de Psicólogos",
          icon: FaPercentage,
          url: "/commissions",
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
