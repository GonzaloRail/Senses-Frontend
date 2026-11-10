# Senses Frontend

Aplicacion web para la gestion del centro psicologico Senses. Provee los modulos de autenticacion, pacientes, citas, historias clinicas, evaluaciones, inventario, ingresos y administracion.

## Tecnologias

- React 19 y TypeScript
- Vite
- Tailwind CSS
- TanStack React Query
- Zustand
- React Router

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalacion

```bash
npm install
```

## Configuracion

Por defecto, la aplicacion consume el backend desplegado. Para usar otra instancia, cree un archivo `.env` en la raiz del proyecto:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_AUTH_CLIENT_ID=tu-client-id-publico.apps.googleusercontent.com
```

`VITE_API_URL` debe contener la URL base de la API, sin una ruta adicional.
`VITE_GOOGLE_AUTH_CLIENT_ID` debe ser el ID de cliente web público configurado en
Google y coincidir con `GOOGLE_AUTH_CLIENT_ID` del backend. Autoriza el origen
del frontend en Google y en `CORS_ORIGINS` del backend. Esta variable se incluye
en el bundle del navegador; no pongas secretos en variables `VITE_`.

## Comandos

```bash
# Iniciar el servidor de desarrollo
npm run dev

# Generar la compilacion de produccion
npm run build

# Ejecutar el linter
npm run lint

# Previsualizar la compilacion de produccion
npm run preview
```

## Estructura

```text
src/
  api/          Cliente HTTP compartido
  app/          Rutas y layouts de la aplicacion
  components/   Componentes de interfaz reutilizables
  features/     Modulos funcionales
  shared/       Tipos, componentes y utilidades compartidas
  store/        Estado global
```
