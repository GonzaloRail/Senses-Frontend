import { SidebarTrigger } from "@/components/ui/sidebar"
import { StatCard } from "../components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import type { DashboardPsychologystListSchema } from "@/shared/interfaces/tables/DashboardPsychologystListSchema";
import { DataTable } from "@/shared/components/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getActiveInternals, getAppointmentsByWeekday, getPatientsPerAgeGroups, getPsychologistsWithPatients, getSocialCasesPerMonth, getTotalHoursPerMonth, getTotalParticularCases, getTotalPatients, getTotalPsychologists, getTotalSocialCases, type DashboardFilters } from "../api/dashboardApi";
import { Loading } from "@/shared/components/Loading";
import { searchPsychologistByName } from "@/features/systemUsers/api/systemUsersApi";
import { searchOfficesByName } from "@/features/offices/api/officesApi";
import { getAllActiveLocationsApi } from "@/features/locations/api/locationsApi";

type Period = "day" | "month" | "year" | "custom";
type FilterOption = { id: string; label: string };

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  const [locations, setLocations] = useState<FilterOption[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const invalidRange = period === "custom" && (!customFrom || !customTo || customFrom > customTo);


  const [isLoading, setIsLoading] = useState(true);
  const [settledKey, setSettledKey] = useState("");

  const filters = useMemo<DashboardFilters>(() => {
    const range = periodRange(period, customFrom, customTo);
    return {
      from: range.from ? new Date(`${range.from}T00:00:00`).toISOString() : undefined,
      to: range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined,
      psychologistId: psychologistId || undefined,
      officeId: officeId || undefined,
    };
  }, [period, customFrom, customTo, psychologistId, officeId]);
  const requestKey = JSON.stringify([filters, retry]);

  useEffect(() => {
    let current = true;
    Promise.all([searchPsychologistByName(""), searchOfficesByName("")])
      .then(([users, availableOffices]) => {
        if (!current) return;
        setPsychologists(users.map((user: { id: string; firstName: string; lastName: string }) => ({ id: user.id, label: `${user.firstName} ${user.lastName}` })));
        setOffices(availableOffices.map((office: { id: string; name: string }) => ({ id: office.id, label: office.name })));
      })
      .catch(() => { if (current) setCatalogError(true); });
    getAllActiveLocationsApi()
      .then((items) => { if (current) setLocations(items.map(({ id, name }) => ({ id, label: name }))); })
      .catch(() => { if (current) setLocationError(true); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    if (invalidRange) return () => { current = false; };
    const fetchData = async () => {
      setIsLoading(true);
      setError(false);
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

        if (!current) return;
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
        if (current) setError(true);
      } finally {
        if (current) {
          setSettledKey(requestKey);
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { current = false; };
  }, [filters, invalidRange, requestKey]);

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
      header: "Pacientes en el período",
      cell: ({ row }) => (
        <div>
          {row.original.patientNumber}
        </div>
      ),
    },
  ]

  const fetchData = useCallback(async () => {
    const data = psychologistId
      ? psychologistWithPatients.filter((psychologist: DashboardPsychologystListSchema) => psychologist.id === psychologistId)
      : psychologistWithPatients;
    return {
      data: data,
      pageCount: 1,
    };
  }, [psychologistId, psychologistWithPatients]);

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

  return (
    <>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
      </div>
      <main className="min-w-0 space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-senses-primary">Dashboard gerencial</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen de indicadores y actividad del centro.</p>
      </div>
      <Card className="gap-3 p-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium">
            Sede
            <select value="" disabled aria-describedby="location-filter-help" className="h-10 min-w-0 rounded-md border bg-muted px-3 text-muted-foreground">
              <option value="">Todas las sedes</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
            </select>
          </label>
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
        <p id="location-filter-help" className="text-sm text-muted-foreground">El filtro por sede estará disponible cuando el servidor admita este cálculo. Por ahora se muestran datos consolidados.</p>
        {locationError && <p role="alert" className="text-sm text-destructive">No se pudo cargar el catálogo de sedes.</p>}
        {catalogError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar los filtros de psicólogo y consultorio.</p>}
        <p className="text-sm text-muted-foreground">El período solo se aplica actualmente a citas y pacientes por psicólogo. El filtro de psicólogo solo afecta la tabla; el de consultorio aún no modifica los indicadores.</p>
      </Card>
      {invalidRange ? <p role="alert" className="rounded-lg border p-4 text-sm">Selecciona un rango de fechas completo y válido.</p> : isLoading || settledKey !== requestKey ? <div aria-live="polite"><Loading message="Cargando indicadores..." /></div> : error ? (
        <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
          <p>No se pudieron cargar los indicadores. Inténtalo nuevamente.</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 rounded-md border px-3 py-2 font-medium">Reintentar</button>
        </div>
      ) : <>
      <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Número de psicólogos" value={psychologistNumber} />
        <StatCard title="Número de pacientes" value={patientsNumber} />
        <StatCard title="Número de horas de trabajo al mes" value={totalMonthlyHours} />
        <StatCard title="Casos sociales realizados este mes" value={monthlySocialCases} />
        <StatCard title="Internos activos" value={activeInterns} />
      </section>
      <section aria-label="Gráficos de actividad" className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 gap-3 p-4">
          <div className="flex flex-row gap-1">
            <h2 className="text-lg font-semibold text-senses-primary">Citas por día de la semana</h2>
          </div>
          <CardContent className="min-w-0 p-0">
            <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
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
        <Card className="min-w-0 gap-3 p-4">
          <h2 className="text-lg font-semibold text-senses-primary">Casos sociales vs casos particulares</h2>
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
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            <span>Casos sociales: {totalSocialCases}</span>
            <span>Casos particulares: {totalParticularCases}</span>
          </div>
        </Card>

        <Card className="min-w-0 gap-3 p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-senses-primary">Grupos de edad de pacientes</h2>
          <ChartContainer config={barChartConfig} className="h-[250px] w-full">
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
      </section>
      <Card className="min-w-0 gap-4 p-4">
        <h2 className="text-lg font-semibold text-senses-primary">Pacientes por psicólogo</h2>
        <DataTable fetchData={fetchData} columns={columns} />
      </Card>
      </>}
      </main>
    </>
  )
}
