import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, CheckCircle2, ChevronDown, Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { useAuth } from "@/store/auth/auth.store";
import { createSuggestionApi, getSuggestionsApi, suggestionsDemoMode, updateSuggestionStatusApi } from "../api/suggestionsApi";
import {
  SUGGESTION_MESSAGE_LIMIT, suggestionCategories, suggestionInputSchema, suggestionStatuses,
  type SuggestionCategory, type SuggestionStatus,
} from "../suggestions";

const selectClass = "h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50";

function DemoNotice() {
  if (!suggestionsDemoMode) return null;
  return <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <strong>Modo demostración · sin conexión al buzón institucional</strong>
    <p className="mt-1">Los mensajes de ejemplo y los cambios solo existen en esta pestaña hasta recargar. Nada se envía a Gerencia. No ingreses información sensible.</p>
  </aside>;
}

export function SuggestionsPage() {
  const user = useAuth((state) => state.user);
  const isManager = useAuth((state) => state.roleSelected === "ADMIN");
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<"" | SuggestionCategory>("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [validationError, setValidationError] = useState("");
  const mutation = useMutation({
    mutationFn: createSuggestionApi,
    retry: false,
    onSuccess: () => {
      setCategory("");
      setMessage("");
      setIsAnonymous(true);
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const result = suggestionInputSchema.safeParse({ category, message, isAnonymous });
    setValidationError(result.success ? "" : result.error.issues[0].message);
    if (result.success) mutation.mutate(result.data);
  }

  return <>
    <SiteHeader title="Buzón de sugerencias" />
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 lg:p-6">
      <DemoNotice />
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-senses-primary">Tu opinión nos ayuda a mejorar</h2>
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">Comparte una idea, una oportunidad de mejora o tu experiencia en la clínica. La revisión de los mensajes corresponde exclusivamente a Gerencia.</p>
        {isManager && <Button asChild variant="outline"><Link to="/suggestions/received"><Inbox aria-hidden="true" />Ver sugerencias recibidas</Link></Button>}
      </header>
      {mutation.isSuccess && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2 aria-hidden="true" className="mr-2 inline size-5" />
        {suggestionsDemoMode ? "Envío simulado. Puedes revisarlo en la bandeja de demostración de Gerencia en esta pestaña." : "Sugerencia enviada. Gerencia podrá revisarla en su bandeja."}
      </div>}
      <form onSubmit={submit} className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
        <fieldset disabled={mutation.isPending} className="min-w-0 space-y-6">
          <legend className="mb-6 text-lg font-semibold text-senses-primary">Nueva sugerencia</legend>
          <div className="space-y-2">
            <Label htmlFor="suggestion-category">Categoría <span className="text-muted-foreground">(obligatoria)</span></Label>
            <select id="suggestion-category" className={selectClass} value={category} required
              onChange={(event) => { setCategory(event.target.value as SuggestionCategory); mutation.reset(); }}>
              <option value="" disabled>Selecciona una categoría</option>
              {Object.entries(suggestionCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggestion-message">Mensaje <span className="text-muted-foreground">(obligatorio)</span></Label>
            <Textarea id="suggestion-message" className="min-h-48 resize-y text-base leading-6" required
              maxLength={SUGGESTION_MESSAGE_LIMIT} value={message} aria-describedby="suggestion-help suggestion-count suggestion-error"
              aria-invalid={Boolean(validationError)} placeholder="¿Qué podríamos mejorar y cómo propones hacerlo?"
              onChange={(event) => { setMessage(event.target.value); setValidationError(""); mutation.reset(); }} />
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <p id="suggestion-help">Evita incluir datos de pacientes o información clínica.</p>
              <p id="suggestion-count" className="tabular-nums">{message.length} / {SUGGESTION_MESSAGE_LIMIT}</p>
            </div>
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">¿Cómo deseas enviarla?</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-senses-secondary has-checked:bg-senses-secondary/10">
              <input type="radio" name="suggestion-identity" value="anonymous" checked={isAnonymous} className="mt-1 size-4 accent-senses-primary" onChange={() => { setIsAnonymous(true); mutation.reset(); }} />
              <span><span className="block text-sm font-semibold">Anónima</span><span className="mt-1 block text-sm text-muted-foreground">Sin mostrar tu nombre en el mensaje. Evita identificarte en el texto.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-senses-secondary has-checked:bg-senses-secondary/10">
              <input type="radio" name="suggestion-identity" value="identified" checked={!isAnonymous} className="mt-1 size-4 accent-senses-primary" onChange={() => { setIsAnonymous(false); mutation.reset(); }} />
              <span className="min-w-0"><span className="block text-sm font-semibold">Identificada</span><span className="mt-1 block break-words text-sm text-muted-foreground">Gerencia verá tu nombre: {user?.firstName} {user?.lastName}.</span></span>
            </label>
          </fieldset>
        </fieldset>
        <div id="suggestion-error" aria-live="polite">
          {(validationError || mutation.isError) && <p role="alert" className="text-sm text-destructive">{validationError || "No se pudo enviar la sugerencia. Tu mensaje se conserva; intenta enviarlo nuevamente."}</p>}
          {mutation.isPaused && <p role="status" className="text-sm text-muted-foreground">Sin conexión. Tu mensaje se conserva; el envío continuará cuando recuperes la conexión.</p>}
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={mutation.isPending} className="min-h-11 cursor-pointer bg-senses-primary text-white hover:bg-senses-primary/90">
            <Send aria-hidden="true" />{mutation.isPending ? "Enviando…" : suggestionsDemoMode ? "Simular envío" : "Enviar sugerencia"}
          </Button>
        </div>
      </form>
    </main>
  </>;
}

const statusClasses: Record<SuggestionStatus, string> = {
  NEW: "border-amber-200 bg-amber-50 text-amber-900",
  READ: "border-sky-200 bg-sky-50 text-sky-900",
  IN_REVIEW: "border-violet-200 bg-violet-50 text-violet-900",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};
const formatDate = (value: string) => new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
}).format(new Date(value));

export function SuggestionsInboxPage() {
  const userId = useAuth((state) => state.user?.id);
  const role = useAuth((state) => state.roleSelected);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<"" | SuggestionCategory>("");
  const [status, setStatus] = useState<"" | SuggestionStatus>("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["suggestions", userId, role, { category, status, page }],
    queryFn: ({ signal }) => getSuggestionsApi({ page, category: category || undefined, status: status || undefined }, signal),
    enabled: role === "ADMIN" && Boolean(userId),
    retry: false,
    gcTime: 0,
  });
  const mutation = useMutation({
    mutationFn: updateSuggestionStatusApi,
    retry: false,
    onSuccess: async () => {
      // An item can leave the final page when a status filter is active.
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
  const data = role === "ADMIN" ? query.data : undefined;

  return <>
    <SiteHeader title="Buzón de sugerencias" />
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
      <DemoNotice />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-semibold tracking-tight text-senses-primary">Sugerencias recibidas</h2><p className="mt-2 text-sm text-muted-foreground">Revisión exclusiva de Gerencia. Abre un mensaje para leerlo y gestionar su estado.</p></div>
        <Button asChild variant="outline"><Link to="/suggestions"><Send aria-hidden="true" />Nueva sugerencia</Link></Button>
      </header>
      <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="inbox-category">Categoría</Label>
          <select id="inbox-category" className={selectClass} value={category} disabled={mutation.isPending} onChange={(event) => { setCategory(event.target.value as "" | SuggestionCategory); setPage(1); mutation.reset(); }}>
            <option value="">Todas las categorías</option>{Object.entries(suggestionCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></div>
        <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="inbox-status">Estado</Label>
          <select id="inbox-status" className={selectClass} value={status} disabled={mutation.isPending} onChange={(event) => { setStatus(event.target.value as "" | SuggestionStatus); setPage(1); mutation.reset(); }}>
            <option value="">Todos los estados</option>{Object.entries(suggestionStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></div>
        <Button variant="outline" className="min-h-11" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Actualizando…" : "Actualizar"}</Button>
      </div>
      {query.isError && <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">No se pudieron cargar las sugerencias. Usa Actualizar para reintentar.{data && " Se mantienen los últimos datos disponibles."}</div>}
      {mutation.isError && <p role="alert" className="text-sm text-destructive">No se pudo cambiar el estado. Se conserva el estado anterior; vuelve a intentarlo.</p>}
      {mutation.isPaused && <p role="status" className="text-sm text-muted-foreground">Sin conexión. El cambio de estado está pendiente de envío.</p>}
      {mutation.isSuccess && <p role="status" className="text-sm text-emerald-800">{suggestionsDemoMode ? "Estado actualizado en la demostración." : "Estado actualizado."}</p>}
      {!data && !query.isError && <p role="status" className="py-10 text-center text-sm text-muted-foreground">{query.fetchStatus === "paused" ? "Sin conexión. La bandeja se cargará al recuperar la conexión." : "Cargando sugerencias…"}</p>}
      {data && <section aria-label="Mensajes recibidos" className="overflow-hidden rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm text-muted-foreground sm:px-6">{data.total} {data.total === 1 ? "sugerencia" : "sugerencias"}{suggestionsDemoMode && " · Datos de demostración"}</p>
        {data.items.map((item) => <details key={item.id} className="group border-b last:border-b-0">
          <summary className="flex cursor-pointer list-none items-start gap-3 p-4 focus-visible:outline-2 focus-visible:outline-ring sm:p-6 [&::-webkit-details-marker]:hidden">
            <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 group-open:rotate-180" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-senses-primary">{suggestionCategories[item.category]}</span><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[item.status]}`}>{suggestionStatuses[item.status]}</span></div>
              <p className="line-clamp-2 break-words text-sm leading-6">{item.message}</p>
              <p className="break-words text-xs leading-5 text-muted-foreground">{item.isAnonymous ? "Anónima" : item.author?.displayName ?? "Autor no disponible"} · <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></p>
            </div>
          </summary>
          <div className="space-y-5 border-t bg-muted/20 p-4 sm:px-6">
            <h3 className="text-sm font-semibold">Mensaje completo</h3>
            <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-7">{item.message}</p>
            <div className="flex flex-wrap gap-2" aria-label="Cambiar estado">
              {(["READ", "IN_REVIEW", "ARCHIVED"] as const).map((nextStatus) => <Button key={nextStatus} variant="outline" disabled={mutation.isPending || item.status === nextStatus}
                className="min-h-11" onClick={() => mutation.mutate({ id: item.id, status: nextStatus })}>
                {nextStatus === "ARCHIVED" ? <Archive aria-hidden="true" /> : <Check aria-hidden="true" />}
                {mutation.isPending && mutation.variables.id === item.id && mutation.variables.status === nextStatus ? "Guardando…" : nextStatus === "READ" ? "Marcar como leída" : nextStatus === "IN_REVIEW" ? "Poner en revisión" : "Archivar"}
              </Button>)}
            </div>
          </div>
        </details>)}
        {!data.items.length && <div className="space-y-3 px-4 py-12 text-center"><Inbox aria-hidden="true" className="mx-auto size-8 text-senses-primary" /><h3 className="font-semibold">No hay sugerencias{category || status ? " con estos filtros" : " recibidas"}</h3><p className="text-sm text-muted-foreground">{category || status ? "Prueba otra categoría o estado." : "Los mensajes enviados por los colaboradores aparecerán aquí."}</p>{(category || status) && <Button variant="outline" onClick={() => { setCategory(""); setStatus(""); setPage(1); }}>Limpiar filtros</Button>}</div>}
        {data.totalPages > 1 && <nav aria-label="Páginas de sugerencias" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button><span className="text-sm tabular-nums">Página {data.page} de {data.totalPages}</span><Button variant="outline" disabled={page >= data.totalPages || query.isFetching} onClick={() => setPage(page + 1)}>Siguiente</Button></nav>}
      </section>}
    </main>
  </>;
}
