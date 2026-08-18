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
│   ├── seed_admin.py               # Script para sembrar el usuario admin por defecto
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

## ⚙️ 3. Requisitos Previos e Instalación Paso a Paso

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

### Paso 3: Configurar Variables de Entorno (`backend/.env`)
Verifica que el archivo `backend/.env` contenga los parámetros de tu servidor MySQL (Laragon):
```env
SECRET_KEY=poa-super-secret-key-2026-production-ready
DEBUG=True
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Configuración MySQL (Laragon por defecto)
DB_NAME=poa_db
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Paso 4: Migrar las Tablas a MySQL
Con Laragon iniciado (*Start All*), crea la estructura de tablas corriendo:
```powershell
python manage.py makemigrations core organizacional usuarios presupuestos memorias traspasos
python manage.py migrate
```

### Paso 5: 🔑 Crear el Usuario Inicial (`admin` / `admin`)
**¡PASO OBLIGATORIO PARA CADA COMPAÑERO!**
Al migrar la base de datos por primera vez en una máquina nueva, la base de datos está vacía. Para crear automáticamente el usuario administrador inicial, ejecuta:

```powershell
python seed_admin.py
```

*Esto creará en tu MySQL local*:
- **Usuario**: `admin`
- **Contraseña**: `admin`

---

## 🚀 4. Ejecución del Servidor y Acceso

Para iniciar el servidor de desarrollo:
```powershell
python manage.py runserver
```

- **URL de la API**: `http://127.0.0.1:8000/api/v1/`
- **Panel de Administración**: `http://127.0.0.1:8000/admin/`
- **Credenciales**: `admin` / `admin`

---

## 🌐 5. ¿Cómo conectarse en Red Local (Varios dev en la misma Wi-Fi)?

Si tú tienes la base de datos e iniciaste el servidor y tus compañeros quieren ingresar a tu laptop desde sus navegadores:

1. **Corre el servidor abriendo la escucha de red**:
   ```powershell
   cd backend
   python manage.py runserver 0.0.0.0:8000
   ```
2. **Revisa tu IP local**:
   Abre una terminal y pon `ipconfig` (ejemplo de IP: `192.168.1.15`).
3. **Tus compañeros ingresan desde su navegador**:
   `http://192.168.1.15:8000/admin/` e inician sesión con `admin` / `admin`.

---

## 🗺️ 6. Próximos Pasos

1. [ ] Desarrollar los **Serializers** y **ViewSets** (CRUDs y Endpoints de negocio en Django REST Framework).
2. [ ] Configurar autenticación mediante **JWT (SimpleJWT)** para login desde el frontend.
3. [ ] Implementar la capa de servicios (`services.py`) para validaciones automáticas de saldos y traspasos.
4. [ ] Inicializar la aplicación **React con Vite, Tailwind CSS / Shadcn UI** y enrutamiento protegido.