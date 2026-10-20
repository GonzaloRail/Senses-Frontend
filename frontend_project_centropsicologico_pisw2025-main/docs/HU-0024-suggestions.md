# HU-0024 · Buzón de sugerencias

## Alcance y rutas

- `/suggestions`: envío para `PSYCHOLOGIST`, `ADMISSION`, `CASHIER` y `ADMIN`.
- `/suggestions/received`: recepción y cambios de estado solo para `ADMIN` (Gerente).
- No se amplían permisos de `HR`, `INTERNAL`, `AUDITOR` ni pacientes.
- Categoría obligatoria, mensaje de 1–3000 caracteres después de quitar espacios
  extremos, envío anónimo por defecto o identificado con la cuenta autenticada.

## Estado de la integración

En el backend local revisado no se encontraron rutas/modelos de sugerencias
(`server.ts`, `src` y `prisma`). **Las rutas de API siguientes son una propuesta,
no endpoints existentes ni confirmados.** No se modificó el backend.

Por defecto funciona en **demostración**, claramente señalada en ambas pantallas.
Incluye cuatro mensajes ficticios; permite simular envíos y cambios de estado.
Los datos solo viven en memoria en esta pestaña y se pierden al recargar; no se
guardan en localStorage/sessionStorage ni se transmiten al servidor. No sirve
para recibir feedback real ni comparte datos entre dispositivos/pestañas.

## Contrato propuesto para backend

Implementación del cliente concentrada en
`src/features/suggestions/api/suggestionsApi.ts`; validadores y tipos en
`src/features/suggestions/suggestions.ts`.

| Método | Ruta propuesta | Permisos | Resultado |
| --- | --- | --- | --- |
| POST | `/api/v1/suggestions` | Roles habilitados para envío | `Suggestion` (201) |
| GET | `/api/v1/suggestions?page=1&take=10&category=PROCESSES&status=NEW` | Solo ADMIN | `{ items: Suggestion[], total, page, totalPages }` |
| PATCH | `/api/v1/suggestions/:id/status` | Solo ADMIN | `Suggestion` actualizado |

POST: `{ category, message, isAnonymous }`. PATCH: `{ status }`.
Filtros de categoría y estado opcionales, paginación desde 1, orden de más reciente
a más antigua. Categorías: `WORK_ENVIRONMENT`, `PROCESSES`, `INFRASTRUCTURE`, `OTHER`.
Estados: `NEW` (inicial), `READ`, `IN_REVIEW`, `ARCHIVED`.

```ts
type Suggestion = {
  id: string;
  category: "WORK_ENVIRONMENT" | "PROCESSES" | "INFRASTRUCTURE" | "OTHER";
  message: string;
  isAnonymous: boolean;
  author: { displayName: string } | null;
  status: "NEW" | "READ" | "IN_REVIEW" | "ARCHIVED";
  createdAt: string; // ISO 8601 con zona horaria
};
```

Backend deberá validar entradas y permisos independientemente del frontend,
obtener la identidad de la sesión (no del cuerpo enviado) y decidir/documentar
la política de anonimato: no devolver identidad, rol, correo, ID ni metadatos
identificativos en sugerencias anónimas. Evitar registrar mensaje/identidad en
logs y evaluar si se puede guardar autoría interna; ocultar el nombre en UI no
garantiza anonimato. La autenticación actual se reutiliza mediante `api`.

Una vez acordado el contrato, ajustar ese módulo si las rutas/DTOs cambian y
configurar `VITE_SUGGESTIONS_MODE=api` en el entorno de despliegue. Reiniciar Vite
o recompilar para aplicar la variable. En modo API los errores se muestran sin
simular éxito ni recurrir a datos demo; el borrador se conserva si falla el envío.

Comprobación: `npm run test:hu24` y `npm run build`.
