import { SidebarTrigger } from "@/components/ui/sidebar"
import { StatCard } from "../components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import type { DashboardPsychologystListSchema } from "@/shared/interfaces/tables/DashboardPsychologystListSchema";
import { DataTable } from "@/shared/components/DataTable";
import { useEffect, useMemo, useState } from "react";
import { getActiveInternals, getAppointmentsByWeekday, getPatientsPerAgeGroups, getPsychologistsWithPatients, getSocialCasesPerMonth, getTotalHoursPerMonth, getTotalParticularCases, getTotalPatients, getTotalPsychologists, getTotalSocialCases, type DashboardFilters } from "../api/dashboardApi";
import { Loading } from "@/shared/components/Loading";
import { searchPsychologistByName } from "@/features/systemUsers/api/systemUsersApi";
import { searchOfficesByName } from "@/features/offices/api/officesApi";

type Period = "day" | "month" | "year" | "custom";
type FilterOption = { id: string; label: string };

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const periodRange = (period: Period, customFrom: string, customTo: string) => {
  const now = new Date();
  if (period === "custom") return { from: customFrom, to: customTo };
  const from = new Date(now);
  if (period === "day") from.setHours(0, 0, 0, 0);
  if (period === "month") from.setDate(1);
  if (period === "year") from.setMonth(0, 1);
  return { from: toInputDate(from), to: toInputDate(now) };
};

export const Dashboard = () => {
  const [psychologistNumber, setPsychologistNumber] = useState(0);
  const [patientsNumber, setPatientsNumber] = useState(0);
  const [totalMonthlyHours, setTotalMonthlyHours] = useState(0);
  const [monthlySocialCases, setMonthlySocialCases] = useState(0);
  const [activeInterns, setActiveInterns] = useState(0);
  const [totalSocialCases, setTotalSocialCases] = useState(0);
  const [totalParticularCases, setTotalParticularCases] = useState(0);
  const [patientsAgeGroups, setPatientsAgeGroups] = useState([]);
  const [psychologistWithPatients, setPsychologistWithPatients] = useState([]);
  const [appointmentsCountByRange, setAppointmentsCountByRange] = useState([]);
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toInputDate(new Date()));
  const [psychologistId, setPsychologistId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [psychologists, setPsychologists] = useState<FilterOption[]>([]);
  const [offices, setOffices] = useState<FilterOption[]>([]);


  const [isLoading, setIsLoading] = useState(true);

  const filters = useMemo<DashboardFilters>(() => {
    const range = periodRange(period, customFrom, customTo);
    return {
      from: range.from ? new Date(`${range.from}T00:00:00`).toISOString() : undefined,
      to: range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined,
      psychologistId: psychologistId || undefined,
      officeId: officeId || undefined,
    };
  }, [period, customFrom, customTo, psychologistId, officeId]);

  useEffect(() => {
    Promise.all([searchPsychologistByName(""), searchOfficesByName("")])
      .then(([users, availableOffices]) => {
        setPsychologists(users.map((user: { id: string; firstName: string; lastName: string }) => ({ id: user.id, label: `${user.firstName} ${user.lastName}` })));
        setOffices(availableOffices.map((office: { id: string; name: string }) => ({ id: office.id, label: office.name })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          psychologistData,
          patientsData,
          hoursData,
          casesData,
          internsData,
          totalSocialCasesData,
          totalParticularCasesData,
          patientsAgeGroupsData,
          psychologistsWithPatientsData,
          appointmentsByWeekdayData,
        ] = await Promise.all([
          getTotalPsychologists(filters),
          getTotalPatients(filters),
          getTotalHoursPerMonth(filters),
          getSocialCasesPerMonth(filters),
          getActiveInternals(filters),
          getTotalSocialCases(filters),
          getTotalParticularCases(filters),
          getPatientsPerAgeGroups(filters),
          getPsychologistsWithPatients(filters),
          getAppointmentsByWeekday(filters),
        ]);

        setPsychologistNumber(psychologistData.count);
        setPatientsNumber(patientsData.count);
        setTotalMonthlyHours(hoursData.hours);
        setMonthlySocialCases(casesData.count);
        setActiveInterns(internsData.count);
        setTotalSocialCases(totalSocialCasesData.count);
        setTotalParticularCases(totalParticularCasesData.count);
        setPatientsAgeGroups(patientsAgeGroupsData);
        setPsychologistWithPatients(psychologistsWithPatientsData);
        setAppointmentsCountByRange(appointmentsByWeekdayData);

      } catch (error) {
        console.error("Error al obtener datos del Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const lineChartData = appointmentsCountByRange;

  const lineChartConfig = {
    appointments: {
      label: "Citas",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const columns: ColumnDef<DashboardPsychologystListSchema>[] = [
    {
      accessorKey: "name",
      header: "Psicólogo",
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey: "patientNumber",
      header: "Pacientes por mes",
      cell: ({ row }) => (
        <div>
          {row.original.patientNumber}
        </div>
      ),
    },
  ]

  const fetchData = async () => {
    const data = psychologistId
      ? psychologistWithPatients.filter((psychologist: DashboardPsychologystListSchema) => psychologist.id === psychologistId)
      : psychologistWithPatients;
    return {
      data: data,
      pageCount: 1,
    };
  }

  const pieChartData = [
    { type: "socialCases", appointments: totalSocialCases, fill: "var(--color-senses-secondary)" },
    { type: "particularCases", appointments: totalParticularCases, fill: "var(--color-senses-primary)" },
  ]

  const pieChartConfig = {
    socialCases: {
      label: "Casos sociales",
    },
    particularCases: {
      label: "Casos particulares",
    },
  } satisfies ChartConfig

  const barChartData = patientsAgeGroups;

  const barChartConfig = {
    value: {
      label: "Pacientes",
      color: "var(--color-senses-secondary)",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <Loading message="Cargando..." />
    );
  }

  return (
    <>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
      </div>
      <Card className="mx-4 mt-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm font-medium">
            Período
            <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="h-9 rounded-md border bg-background px-3">
              <option value="day">Diario</option>
              <option value="month">Mensual</option>
              <option value="year">Anual</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          {period === "custom" && <>
            <label className="grid gap-1 text-sm font-medium">Desde<input type="date" value={customFrom} max={customTo} onChange={(event) => setCustomFrom(event.target.value)} className="h-9 rounded-md border bg-background px-3" /></label>
            <label className="grid gap-1 text-sm font-medium">Hasta<input type="date" value={customTo} min={customFrom} onChange={(event) => setCustomTo(event.target.value)} className="h-9 rounded-md border bg-background px-3" /></label>
          </>}
          <label className="grid gap-1 text-sm font-medium">
            Psicólogo
            <select value={psychologistId} onChange={(event) => setPsychologistId(event.target.value)} className="h-9 rounded-md border bg-background px-3">
              <option value="">Todos</option>
              {psychologists.map((psychologist) => <option key={psychologist.id} value={psychologist.id}>{psychologist.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Consultorio
            <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="h-9 rounded-md border bg-background px-3">
              <option value="">Todos</option>
              {offices.map((office) => <option key={office.id} value={office.id}>{office.label}</option>)}
            </select>
          </label>
        </div>
      </Card>
      <div className="flex flex-row flex-wrap gap-1 p-4 justify-center">
        <StatCard title="Número de psicólogos" value={psychologistNumber} />
        <StatCard title="Número de pacientes" value={patientsNumber} />
        <StatCard title="Número de horas de trabajo al mes" value={totalMonthlyHours} />
        <StatCard title="Casos sociales realizados este mes" value={monthlySocialCases} />
        <StatCard title="Internos activos" value={activeInterns} />
      </div>
      <div className="flex flex-col p-3 lg:grid lg:grid-cols-10 justify-center items-center">
        <Card className="p-3 lg:col-span-5 h-fit w-full">
          <div className="flex flex-row gap-1">
            <h3 className="text-3xl font-semibold text-senses-primary mr-3">Citas</h3>
          </div>
          <CardContent>
            <ChartContainer config={lineChartConfig}>
              <LineChart
                accessibilityLayer
                data={lineChartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  dataKey="appointments"
                  type="linear"
                  stroke="var(--color-senses-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <DataTable fetchData={fetchData}
          columns={columns}
          className="lg:col-span-5"
        />
      </div>

      <div className="flex flex-col p-3 gap-3 lg:flex-row lg:gap-3 items-center justify-evenly w-full">
        <Card className="p-3 flex flex-col items-center w-full lg:w-2/5">
          <h3 className="text-2xl text-center font-semibold text-senses-primary">Casos sociales vs casos particulares</h3>
          <ChartContainer
            config={pieChartConfig}
            className="mx-auto aspect-square max-h-[250px]"
            style={{ width: "100%" }}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieChartData}
                dataKey="appointments"
                nameKey="type"
                innerRadius={60}
              />
            </PieChart>
          </ChartContainer>
        </Card>

        
        <Card className="p-3 flex flex-col items-center w-full lg:w-5/10">
          <h3 className="text-2xl text-center font-semibold text-senses-primary">Grupos de edad de pacientes</h3>
          <ChartContainer config={barChartConfig} style={{ width: "100%" }}>
            <BarChart
              accessibilityLayer
              data={barChartData}
              margin={{
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="range"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="value" fill="var(--color-senses-secondary)" radius={8}>
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
      </div>
    </>
  )
}
