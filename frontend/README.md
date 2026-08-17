# POA — Frontend

Sistema de Gestión Presupuestaria. Esqueleto del frontend (React + TypeScript + Vite + Tailwind), con los módulos navegables sin backend.

## Requisitos previos

- **Node.js** v18 o superior
- **npm** (viene incluido con Node.js)

Verifica tu versión de Node:

```bash
node -v
```

## Instalación

1. Descomprime el proyecto y entra a la carpeta:

```bash
unzip POA-frontend-dashboard-v2
cd frontend
```

2. Instala las dependencias:

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Esto levanta el servidor de Vite. Abre en el navegador:

```
http://localhost:5173
```

## Otros comandos

```bash
npm run build     # compila TypeScript y genera el build de producción en /dist
npm run preview   # sirve localmente el build de producción
npm run lint      # corre ESLint sobre src/
```

## Variables de entorno

Definidas en `.env`:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=SIGEP
```

Ajusta `VITE_API_BASE_URL` cuando el backend Django esté disponible.

## Estado del proyecto

Módulos con navegación funcionando pero **sin lógica de negocio real** (pantallas vacías / placeholders):

- Organizacional
- Presupuestos (Partidas, Techos por área)
- Memorias (Listado, Formulario, Revisión)
- Traspasos

El Dashboard muestra datos de ejemplo (mock) hasta que se conecte el backend.
