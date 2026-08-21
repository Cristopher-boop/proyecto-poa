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

# Instalar dependencias (solo la primera vez o si se añaden nuevas)
npm install

# Levantar el servidor de desarrollo
npm run dev
```

*El frontend quedará corriendo en `http://localhost:5173/`*

## 4. Reiniciar la Base de Datos desde Cero (IDs en 1)

Si deseas limpiar la base de datos por completo, reiniciar los autoincrementales (`Primary Keys` de vuelta a `1`) y precargar los datos organizacionales reales y partidas limpias en un solo paso:

Abre la terminal en la carpeta `/backend` (con el entorno virtual activo) y ejecuta:

```powershell
python reset_db.py
```

Este script automatizado:
1. Desactiva la verificación de claves foráneas.
2. Ejecuta un `TRUNCATE` en todas las tablas operativas (limpieza total sin borrar el esquema).
3. Crea un usuario superadministrador por defecto con las credenciales:
   * **Usuario:** `admin`
   * **Contraseña:** `admin`
4. Carga los programas, áreas y secciones reales de la institución mediante `seed_organizacional`.
5. Importa las partidas del catálogo oficial desde el CSV clasificando la columna clase como `INGRESO` o `EGRESO`.

---

## Notas Importantes de Arquitectura

- **Autenticación:** Utiliza JWT (SimpleJWT). Las llamadas al backend deben enviar el encabezado `Authorization: Bearer <token>`.
- **Axios Interceptors:** El frontend renueva el token automáticamente por detrás si este expira y el `refresh_token` aún es válido.
- **Clasificación de Partidas:** Las partidas presupuestarias se clasifican en la base de datos bajo el campo `clase` con los valores oficiales de `INGRESO` o `EGRESO`. El comando de importación maneja de forma automática entradas duplicadas de código si pertenecen a clases diferentes.
- **Tailwind y CSS:** La arquitectura del diseño está en `tailwind.config.js` e `index.css`, utilizando variables nativas (`--bg-base`, `--theme-primary`) para habilitar el modo Dark / Light automáticamente con la paleta de colores institucional.
