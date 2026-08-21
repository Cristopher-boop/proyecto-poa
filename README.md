# Sistema POA (Planificación Operativa Anual)

Sistema de gestión operativa desarrollado con **Django (Backend)** y **React + Vite (Frontend)**.

## 1. Requisitos Previos
- Python 3.10+
- Node.js 18+

## 2. Iniciar el Backend (Django)

El backend utiliza un entorno virtual (`venv`) ubicado dentro de la carpeta `/backend`. Es crucial usar siempre este entorno.

Abre una terminal (PowerShell o CMD) en la raíz del proyecto y ejecuta:

```powershell
cd backend
# Activar el entorno virtual
.\venv\Scripts\activate

# Aplicar migraciones (crear tablas de la base de datos)
python manage.py makemigrations
python manage.py migrate

# 1. Poblar Estructura Organizacional (Programas, Áreas y Secciones)
python manage.py seed_organizacional

# 2. Poblar Consolidado TAMEP (Partidas y Grupos Presupuestarios)
python manage.py seed_consolidado

# 3. Poblar Memorias de Cálculo detalladas desde el archivo Excel oficial (300+ memorias, 1400+ detalles)
python manage.py seed_memorias

# Crear un superusuario (para acceder al sistema y al /admin)
python manage.py createsuperuser

# Levantar el servidor de desarrollo
python manage.py runserver
```

*El backend quedará corriendo en `http://127.0.0.1:8000/`*

## 3. Iniciar el Frontend (React + Vite)

Abre **otra pestaña de terminal** en la raíz del proyecto y ejecuta:

```powershell
cd frontend

# Instalar dependencias (incluye React, Vite, Lucide, Tailwind y SweetAlert2)
npm install

# (Opcional) Si necesitas instalar SweetAlert2 manualmente en otro entorno:
# npm install sweetalert2

# Levantar el servidor de desarrollo
npm run dev
```

*El frontend quedará corriendo en `http://localhost:5173/`*

## 4. Alertas y Modales de Confirmación (SweetAlert2)

El proyecto utiliza **SweetAlert2** para confirmaciones de acciones críticas (como altas y bajas lógicas) y notificaciones de éxito/error, adaptándose automáticamente al tema claro u oscuro (Dark/Light mode).

### Instalación de SweetAlert2:
```powershell
cd frontend
npm install sweetalert2
```
## Notas Importantes de Arquitectura

- **Autenticación:** Utiliza JWT (SimpleJWT). Las llamadas al backend deben enviar el encabezado `Authorization: Bearer <token>`.
- **Axios Interceptors:** El frontend renueva el token automáticamente por detrás si este expira y el `refresh_token` aún es válido.
- **Bajas Lógicas:** Los endpoints de `toggle-estado` y `destroy` aplican bajas lógicas (`estado = False`) en lugar de eliminaciones físicas.
- **Tailwind y CSS:** La arquitectura del diseño está en `tailwind.config.js` e `index.css`, utilizando variables nativas (`--bg-base`, `--theme-primary`) para habilitar el modo Dark / Light automáticamente con la paleta de colores institucional.
