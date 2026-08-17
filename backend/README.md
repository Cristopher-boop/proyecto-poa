# 🏛️ Sistema de Planificación Operativa Anual (POA) y Presupuestos

Sistema integral para la formulación, seguimiento y control de la **Planificación Operativa Anual (POA)** y asignación de presupuestos por objeto del gasto (partidas presupuestarias), diseñado bajo arquitectura modular con **Django REST Framework** y **MySQL (Laragon)** para su consumo en **React**.

---

## 📌 1. Visión General del Negocio

El sistema gestiona la **planificación y estimación presupuestaria institucional** (fondos proyectados y techos presupuestarios asignados, no contabilidad financiera de caja/bancos en tiempo real).

### ⚖️ Reglas de Negocio Clave
1. **Estructura Organizacional**:
   - `Programa Institucional` $\rightarrow$ `Áreas` (Gerencias o Unidades) $\rightarrow$ `Secciones` $\rightarrow$ `Usuarios`.
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