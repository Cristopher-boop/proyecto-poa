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

# Instalar las librerias de requirements
pip install -r requirements.txt

# Aplicar migraciones (crear tablas de la base de datos)
python manage.py makemigrations
python manage.py migrate

# 1. Poblar Estructura Organizacional (Programas, Áreas y Secciones)
python manage.py seed_organizacional

# 2. Poblar Catalogos de Partidas Presupuestarias (INGRESO / EGRESO)
python manage.py import_partidas

# 3. Poblar Memorias de Cálculo detalladas desde el archivo Excel oficial (300+ memorias, 1400+ detalles)
python manage.py seed_memorias

# 4. Poblar Alineación Estratégica de Planificación (AMP PEI / ACP POA por Programa y Operaciones)
python seed_planificacion.py

# 5. Poblar Usuarios de Prueba por Rol
python seed_test_users.py

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

# Levantar el servidor de desarrollo
npm run dev
```

*El frontend quedará corriendo en `http://localhost:5173/`*

---

## 4. Reiniciar la Base de Datos de Golpe (Reset Completo & Todos los Seeds en 1 Paso)

Si deseas limpiar la base de datos por completo, reiniciar los autoincrementales (Primary Keys de vuelta a 1) y precargar **TODAS** las semillas oficiales de golpe (Organizacional, Partidas, Memorias, Planificación PEI/POA y Usuarios de prueba):

Abre la terminal en la carpeta `/backend` (con el entorno virtual activo) y ejecuta:

```powershell
python reset_db.py
```

Este script automatizado ejecuta en secuencia:
1. Desactiva la verificación de claves foráneas y realiza un `DROP TABLE` limpio de todas las tablas.
2. Recrea el esquema completo aplicando todas las migraciones (`migrate`).
3. Crea un usuario superadministrador por defecto:
   * **Usuario:** `admin`
   * **Contraseña:** `admin`
4. Ejecuta `seed_organizacional` (Carga los programas, áreas y secciones reales de EPTAM).
5. Ejecuta `import_partidas` (Importa las partidas presupuestarias oficiales INGRESO/EGRESO).
6. Ejecuta `seed_memorias` y `recalcular_saldos` (Carga las memorias de cálculo y saldos reales).
7. Ejecuta `seed_planificacion` (Carga la Alineación Estratégica oficial PEI/POA por Programa: P-1, P-2, P-410, P-210, Operaciones por Área y Tareas TAMEP).
8. Ejecuta `seed_test_users` (Carga los usuarios de prueba por rol: `SoyAprobador`, `SoyPlanificador`, `SoyGerenteI`, `SoyElaboradorI`, `SoyTrabajadorI`).

---

## 5. Usuarios de Prueba por Rol (Semilla de Pruebas)

Se dispone del script `seed_test_users.py` en la carpeta `/backend` para poblar o actualizar automáticamente los 5 usuarios de prueba para la verificación de roles y permisos:

```powershell
cd backend
python seed_test_users.py
```

### Tabla de Credenciales de Prueba (Contraseña para todos: `12345678`):

| Usuario | Contraseña | Rol | Área / Sección | Descripción de Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **`SoyAprobador`** | `12345678` | **Aprobador** | General / Administrativos | Aprobación presupuestaria final de memorias, ejecuciones de gasto, consolidación y apertura/cierre de gestión. |
| **`SoyPlanificador`** | `12345678` | **Planificación** | Unidad de Planificación | Validación y aprobación de alineación estratégica POA / PAC (Contrataciones ≥ 2.000 Bs) y control del módulo de Planificación SPO. |
| **`SoyGerenteI`** | `12345678` | **Gerente** | Gerencia de Informática | Visualiza todas las áreas. Aprueba técnicamente memorias de su área derivándolas según tipo de gasto. En Planificación: Crea, edita y da de baja Operaciones/Tareas de su área. |
| **`SoyElaboradorI`** | `12345678` | **Elaborador** | Gerencia de Informática | Formula memorias, crea operaciones al vuelo y marca si corresponde a Contratación (PAC). Envía a revisión a Gerencia. |
| **`SoyTrabajadorI`** | `12345678` | **Trabajador** | Gerencia de Informática | Solo lectura de memorias, presupuestos y planificación de su área. |

---

## Notas Importantes de Arquitectura

- **Autenticación:** Utiliza JWT (SimpleJWT). Las llamadas al backend deben enviar el encabezado `Authorization: Bearer <token>`.
- **Flujo Condicional de Formulación POA:**
  - **Contrataciones (PAC) ≥ 2.000 Bs:** Elaborador ➔ Gerente de Área ➔ Planificación SPO ➔ Aprobación Presupuestos.
  - **Gasto Menor (< 2.000 Bs) o No Contratación:** Elaborador ➔ Gerente de Área ➔ Aprobación Presupuestos (omite Planificación).
- **Creación de Operaciones "On-the-Fly":** El modal de formulación permite crear y vincular una nueva Operación al vuelo sin salir de la memoria.
- **Bajas Lógicas:** Los endpoints aplican bajas lógicas (`estado = False`) preservando la trazabilidad.
- **Notificaciones en Tiempo Real:** Alertas con campana interactiva 🔔 notificando avances, notas de aprobación y motivos de rechazo en cada nivel.
- **Auditoría & Control de Accesos:** Panel exclusivo para Administradores con registro de logins (`last_login`) y sesiones.
- **Modo Oscuro / Claro:** Paleta institucional de alto contraste para máxima legibilidad.
