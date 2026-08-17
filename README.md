# 🏛️ Sistema de Planificación Operativa Anual (POA) y Presupuestos

Sistema integral para la formulación, seguimiento y control de la **Planificación Operativa Anual (POA)** y asignación de presupuestos por objeto del gasto (partidas presupuestarias), diseñado bajo arquitectura modular con **Django REST Framework** y **MySQL (Laragon)** para su consumo en **React**.

---

## 📌 1. Visión General del Negocio

El sistema gestiona la **planificación y estimación presupuestaria institucional** (fondos proyectados y techos presupuestarios asignados, no contabilidad financiera de caja/bancos en tiempo real).

### ⚖️ Reglas de Negocio Clave
1. **Estructura Organizacional**:
   - `Programa Institucional` -> `Áreas` (Gerencias o Unidades) -> `Secciones` -> `Usuarios`.
   - Las **Gerencias** (ej. *Informática*, *Comercial*) contienen 1 o más Secciones.
   - Las **Unidades** se sitúan al mismo nivel que las Gerencias y cuentan con 1 Sección.
2. **Reglas de Modificaciones y Traspasos**:
   - 🚫 **No permitido**: Traspasar presupuesto entre Gerencias/Áreas distintas.
   - ✅ **Permitido**: Traspasos presupuestarios entre Partidas dentro de la **misma Área/Gerencia**.
3. **Control del "Colchón" / Sobrante**:
   - El sobrante de gestiones anteriores queda registrado como un **indicador histórico/referencial**, sin alterar automáticamente el techo oficial aprobado para el nuevo año.
4. **Memorias de Cálculo**:
   - Sustento técnico y operativo ítem por ítem (justificación, unidad de medida, cantidad, precio unitario referencial).
   - Control de ejecución unitario: cada ítem cuenta con un estado de gasto (`PENDIENTE`, `EJECUTADO`, `NO_EJECUTADO`).
5. **Flujo de Doble Control**:
   - **Elaborador**: Formula y sustenta la memoria de cálculo.
   - **Ejecutor**: Responsable operativo de llevar a cabo la tarea/adquisición.
   - **Revisor / Aprobador**: Valida la pertinencia técnica/legal y aprueba el compromiso de la partida.

---

## 🏗️ 2. Arquitectura del Backend

El backend está organizado bajo una **Arquitectura Modular por Dominios (*Feature-Driven Django Apps*)**:

```text
proyecto-poa/
├── backend/
│   ├── venv/                       # Entorno virtual de Python
│   ├── manage.py
│   ├── requirements.txt            # Dependencias del proyecto
│   ├── .env                        # Variables de entorno y credenciales
│   │
│   ├── config/                     # Configuración central de Django
│   │   ├── __init__.py             # Inicialización de PyMySQL
│   │   ├── settings.py             # Configuración de base de datos, CORS, apps
│   │   ├── urls.py                 # Enrutador global de APIs (/api/v1/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── apps/                       # Módulos del Dominio POA
│       ├── core/                   # Auditoría base (TimeStampedModel)
│       ├── organizacional/         # Programa, Area (Gerencia/Unidad), Seccion
│       ├── usuarios/               # Usuario personalizado (AbstractUser), Rol
│       ├── presupuestos/           # Gestion, Partida, PresupuestoArea, AsignacionPartida
│       ├── memorias/               # MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria
│       └── traspasos/              # TraspasoPartida (con validaciones intra-área)
│
└── frontend/                       # (Próximo paso: React + Vite + Tailwind)
```

---

## 🗄️ 3. Modelo Relacional de Base de Datos

```text
PROGRAMA (1:N) ──> AREA (Gerencia/Unidad) (1:N) ──> SECCION (1:N) ──> USUARIO
                                                          ▲
                                                          │ (solicita)
GESTION (1:N) ────> PRESUPUESTO_AREA (1:N) ──> ASIGNACION_PARTIDA (1:N) ──> TRASPASO_PARTIDA
  │                                                    ▲
  │ (año)                                              │ (imputa ítem)
  └───────────────> MEMORIA_CALCULO (1:N) ─────> DETALLE_PRESUPUESTO_MEMORIA
                           │
                           └──────────────(1:N) ─────> REGISTRO_MEMORIA_USUARIO
                                                        (Elaborador, Ejecutor, Revisor)
```

### 📋 Entidades y Módulos Implementados:

#### A. Módulo Organizacional (`apps/organizacional`)
- **`Programa`**: Código institucional único, nombre, descripción, estado activo.
- **`Area`**: Clave foránea a `Programa`, código, nombre, tipo (`GERENCIA` / `UNIDAD`), estado activo.
- **`Seccion`**: Clave foránea a `Area`, nombre de la sección, descripción, estado activo.

#### B. Módulo de Usuarios (`apps/usuarios`)
- **`Rol`**: Nombre único del rol (`Elaborador`, `Aprobador`, `Planificación`, `Administrador`), descripción.
- **`Usuario`**: Extiende de `AbstractUser` de Django + Clave foránea a `Rol`, clave foránea a `Seccion`, cargo y estado activo.

#### C. Módulo Presupuestario (`apps/presupuestos`)
- **`Gestion`**: Año fiscal único (ej. `2026`), estado (`FORMULACION`, `VIGENTE`, `CERRADA`), fecha de aprobación ministerial.
- **`Partida`**: Código de partida (ej. `22100`), nombre, clase (`GASTO_CORRIENTE` o `GASTO_CAPITAL`), estado activo.
- **`PresupuestoArea`**: Clave foránea a `Gestion`, clave foránea a `Area`, techo presupuestario asignado e indicador referencial de sobrante de gestión anterior.
- **`AsignacionPartida`**: Clave foránea a `PresupuestoArea`, clave foránea a `Partida`, saldos en tiempo real (`monto_inicial`, `monto_modificaciones`, `monto_vigente`, `monto_comprometido`, `monto_disponible`).

#### D. Módulo de Memorias de Cálculo (`apps/memorias`)
- **`MemoriaCalculo`**: Código autogenerado, clave foránea a `Gestion`, clave foránea a `Seccion` solicitante, justificación técnica, estado (`BORRADOR`, `ENVIADO_REVISION`, `APROBADO`, `RECHAZADO`, `EJECUTADO`), observaciones de revisión y fecha de aprobación.
- **`RegistroMemoriaUsuario`**: Trazabilidad de usuarios intervinientes (`ELABORADOR`, `EJECUTOR`, `REVISOR_APROBADOR`) por memoria de cálculo.
- **`DetallePresupuestoMemoria`**: Clave foránea a `MemoriaCalculo`, clave foránea a `Partida`, descripción del ítem, unidad de medida, cantidad, precio unitario, `@property precio_total` y estado de gasto (`PENDIENTE`, `EJECUTADO`, `NO_EJECUTADO`).

#### E. Módulo de Traspasos (`apps/traspasos`)
- **`TraspasoPartida`**: Clave foránea a `Gestion`, clave foránea a `Area`, partida de origen, partida de destino (validadas estrictamente a nivel de modelo para que pertenezcan a la misma área), monto, justificación, usuario solicitante, usuario aprobador, estado (`PENDIENTE`, `APROBADO`, `RECHAZADO`) y fechas de registro/aprobación.

---

## ⚙️ 4. Requisitos Previos e Instalación

### Requisitos
- **Python 3.10+** (verificado con Python 3.13).
- **Laragon** con servicio MySQL activo en el puerto `3306`.

### Paso 1: Configurar el Entorno Virtual
Desde la raíz del proyecto (`proyecto-poa`):
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Paso 2: Instalar Dependencias
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

*Dependencias incluidas en `requirements.txt`*:
```text
Django>=5.0,<6.0
djangorestframework>=3.15.0
django-cors-headers>=4.3.1
django-filter>=24.2
PyMySQL>=1.1.0
cryptography>=42.0.0
python-dotenv>=1.0.0
```

### Paso 3: Configurar Variables de Entorno (`backend/.env`)
Verifica que el archivo `backend/.env` contenga los parámetros correctos de tu servidor MySQL (Laragon):
```env
SECRET_KEY=poa-super-secret-key-2026-production-ready
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Configuración MySQL (Laragon por defecto)
DB_NAME=poa_db
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Paso 4: Migrar la Base de Datos
Asegúrate de que Laragon esté iniciado (*Start All*) y ejecuta:
```powershell
python manage.py makemigrations core organizacional usuarios presupuestos memorias traspasos
python manage.py migrate
```

---

## 🚀 5. Ejecución del Servidor y Panel de Administración

Para iniciar el servidor de desarrollo de Django:
```powershell
python manage.py runserver
```

- **URL de la API**: `http://127.0.0.1:8000/api/v1/`
- **Panel de Administración**: `http://127.0.0.1:8000/admin/`

### 🔑 Credenciales del Superusuario por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin`
- **Email**: `admin@poa.local`

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

1. Instala las dependencias:

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
