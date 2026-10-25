# HU-0023 — Integración de la consulta diaria

Fecha: 25 de octubre de 2026.

## Punto de recuperación

El prototipo anterior está guardado en el commit `76a8169` de HU-023. El árbol de trabajo estaba limpio antes de iniciar la integración.

## Acceso

Iniciar sesión con Admisión o Gerencia y abrir:

**Horarios → Vista general por sede**.

Las rutas existentes siguen protegidas para ADMIN y ADMISSION. No se amplió el acceso del frontend a HR solo porque el backend también lo permite.

La opción **Agendas individuales** conserva los listados y calendarios anteriores.

## Backend requerido

Contrato revisado: rama `features/HU-023`, commit `101e5c2`.

Se utilizan:

- `GET /api/v1/work-schedules/consolidated-matrix/filters`.
- `GET /api/v1/work-schedules/consolidated-matrix`.

La respuesta esperada mantiene el envoltorio `{ status: "success", data: ... }`.

Consultar una rama remota no actualiza el backend local. El servidor de pruebas anterior, basado en d59fc8e, no implementa estos endpoints. Para una prueba real es necesario ejecutar una copia del backend que incluya 101e5c2.

Esta implementación de frontend no modifica ni reinicia el backend. Tampoco ejecuta migraciones, semillas o scripts que creen y eliminen datos.

## Funcionamiento

- Fecha inicial: hoy en Lima.
- Sede inicial: primera sede disponible del catálogo de la API.
- Psicólogo inicial: todos.
- Turno inicial: todos.
- Los filtros se aplican automáticamente y se incluyen en la clave de consulta.
- Al cambiar de sede, el psicólogo se restablece a todos.
- Se consultan psicólogos de la sede seleccionada.
- Las consultas reciben AbortSignal para cancelar peticiones que ya no corresponden.
- Actualizar y recuperar el foco de la ventana vuelven a consultar datos.
- Hoy y todos restablece la fecha actual, psicólogo y turno, conservando la sede.

## Presentación

Cada bloque muestra profesional, turno, horario original, consultorio, estado y observaciones.

Estados:

- Programado.
- Permiso parcial.
- En permiso durante todo el bloque.

Los intervalos de permiso se muestran en Lima y sin motivos personales sensibles. El conflicto es una advertencia independiente del estado del permiso.

El resumen utiliza los conteos recibidos del backend: profesionales únicos, bloques y consultorios asignados. No suma las celdas de mañana/tarde para evitar duplicar bloques que cruzan el corte.

El horario laboral no se presenta como disponibilidad para nuevas citas. Se indica que la consulta aplica la programación semanal actualmente registrada y no garantiza reconstrucción histórica.

## Errores y ausencia de datos

- Un resultado vacío no se sustituye por datos de demostración.
- Un error de API no se convierte en un resultado vacío.
- Los errores de permisos, conexión, validación y endpoints ausentes tienen mensajes diferenciados.
- Una respuesta antigua o incompatible se rechaza mediante validación de contrato.
- Durante los cambios de filtros no se mantienen filas de otra sede o fecha como si correspondieran a la selección actual.
- Si un psicólogo deja de estar disponible en el catálogo, se solicita seleccionar otro o todos.

Los archivos del prototipo ficticio permanecen como referencia y para sus pruebas, pero no se importan en la vista general integrada.

## Alcance de esta entrega

Consulta diaria y sus catálogos, filtros, permisos y advertencias. No se añadieron en esta entrega vista semanal, detalle de citas, exportaciones ni edición de programación. Son funciones adicionales que no forman parte de los cuatro criterios originales de esta historia.

## Validación realizada

- `npm run test:hu23`: 14 pruebas aprobadas; cuatro del prototipo y diez de integración frontend.
- Las pruebas de integración cubren peticiones, filtros, cancelación, contrato, estados de permisos, conflictos, fechas, resultados vacíos, errores y renderizado con respuestas simuladas.
- `npm run test:hu20`: 13 pruebas de regresión aprobadas.
- Compilación de producción aprobada.
- ESLint de los tres archivos nuevos de aplicación sin errores.
- `git diff --check` sin errores.

No se afirma que estas pruebas equivalgan a testeo completo en navegador ni a una integración HTTP con PostgreSQL real.

## Prueba manual pendiente con el backend actualizado

1. Iniciar backend que incluya 101e5c2 y comprobar su conexión con la base.
2. Iniciar frontend HU-023 con la URL de API adecuada.
3. Entrar como Admisión y abrir Horarios.
4. Verificar sedes y profesionales reales.
5. Consultar un día con varios bloques y cambiar sede, profesional y turno.
6. Confirmar que un bloque sin citas sigue apareciendo.
7. Revisar un bloque con permiso parcial y sus intervalos.
8. Revisar un conflicto antes y después de filtrar por profesional.
9. Probar una consulta vacía y distinguirla de un error.
10. Confirmar que las agendas individuales siguen disponibles.

No subir a main ni desplegar sin autorización.
