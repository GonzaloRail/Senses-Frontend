# Corrección de consultorio y excepción temporal de documentos

Fecha: 27 de octubre de 2026.

## Consultorio guardado

La ficha del usuario leía únicamente officeId, pero el backend también devuelve la relación office con su id y nombre.

Ahora se resuelve primero officeId y, si falta, office.id. Los consultorios guardados permanecen entre las opciones aunque la búsqueda no los incluya. El modo lectura muestra su nombre directamente, sin depender del estado interno del buscador.

Si realmente falta asignación, muestra “Sin consultorio asignado”. No se inventa un consultorio ni se modifica la base.

Al cargar horarios se conservan también sus minutos originales.

## Excepción temporal solicitada para pruebas

Archivo:

`src/features/systemUsers/utils/userEditPolicy.ts`

Indicador:

`ALLOW_MISSING_DOCUMENTS_ON_EXISTING_USER_EDIT = true`

- Solo aplica al formulario de usuarios existentes.
- Permite guardar cambios aunque falten documentos.
- No borra los archivos ya registrados.
- Si se adjunta un archivo nuevo, conserva el flujo existente de subida.
- La creación de usuarios nuevos mantiene la validación documental original.
- Continúan las validaciones de campos básicos, roles y consultorio.
- No modifica permisos de acceso ni validaciones del backend.
- El formulario de edición muestra un aviso de la excepción temporal.

Esta excepción queda activa en el frontend publicado y afecta a los usuarios existentes que puedan editar los roles autorizados. No se limita automáticamente a cuentas semilla.

Para restaurar la obligatoriedad después de las pruebas, cambiar el indicador a false, ejecutar las pruebas actualizando la expectativa de la política temporal y desplegar de nuevo.

No se cambia aquí la regla definitiva de documentación. El equipo debe acordarla y retirar esta excepción al terminar las pruebas.

## Pruebas

`npm run test:user-edit` comprueba:

- Edición temporal permitida y creación todavía estricta.
- Documentación requerida por rol al crear.
- Posibilidad de restaurar el modo estricto.
- Validaciones básicas conservadas.
- Lectura de officeId y office.id.
- Nombre de consultorio con catálogo vacío o filtrado.
- Renderizado en lectura y edición.
- Conexión de las correcciones en la página y conservación de minutos.
