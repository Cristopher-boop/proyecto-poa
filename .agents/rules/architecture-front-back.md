---
trigger: model_decision
description: Siempre y cuando tenga que ver o no con la arquitectura general del sistema, debe respetar el orden y estructura consolidada
---

# 🏛️ REGLAS DE ARQUITECTURA Y NEGOCIO - PROYECTO POA

## 📌 1. CONTEXTO Y ALCANCE DEL SISTEMA
- Sistema institucional de **Planificación Operativa Anual (POA)** y control presupuestario.
- Maneja **estimaciones presupuestarias y techos asignados**, NO contabilidad financiera real de caja o bancos.
- Stack tecnológico oficial: **Backend en Django REST Framework + MySQL (Laragon)** y **Frontend en React (Vite + Tailwind CSS)**.

---

## 🏗️ 2. ARQUITECTURA DEL BACKEND (DJANGO)
- **Patrón**: Arquitectura Modular por Dominios (*App-Based*) con Capa de Servicios (*Service Layer*).
- **Prohibido**: NO usar Clean Architecture estricta de 7 capas por archivo (interfaces abstractas manuales o DTOs duplicados). Usar el ORM nativo de Django.
- **División de Aplicaciones en `backend/apps/`**:
  1. `core`: Modelos abstractos (`TimeStampedModel`), excepciones globales y paginación.
  2. `usuarios`: Usuario personalizado (`AbstractUser`), roles y permisos.
  3. `organizacional`: Estructura jerárquica (`Programa`, `Area`, `Seccion`).
  4. `presupuestos`: Clasificador de partidas, techos por área, gestiones y bitácora de movimientos (`MovimientoPresupuestario`).
  5. `memorias`: Justificación técnica de requerimientos e ítems (`MemoriaCalculo`, `DetallePresupuestoMemoria`, `RegistroMemoriaUsuario`).
  6. `modificaciones`: Movimientos presupuestarios (`Traspasos` intra-área e `Incrementos` autorizados del POA).

### Convenciones de Código en Django:
- **`models.py`**: Únicamente definiciones de tablas, relaciones y validaciones de campo.
- **`serializers.py`**: Validación de formato de entrada y serialización a JSON para la API.
- **`services.py`**: **Toda la lógica de negocio y cálculo financiero debe vivir aquí**.
  - Cualquier operación que modifique saldos o afecte más de una tabla DEBE llevar el decorador `@transaction.atomic`.
  - Debe registrar cada cambio de saldo en `MovimientoPresupuestario` (patrón ledger inmutable).
- **`views.py`**: Vistas delgadas (*Thin Views*). Solo orquestan peticiones HTTP, llaman a `services.py` o serializers y retornan respuestas REST.

---

## ⚖️ 3. REGLAS DE NEGOCIO ESTRICTAS (PRESUPUESTO POA)
1. **Jerarquía Organizacional**:
   - `Programa` $\rightarrow$ `Área` (Gerencia o Unidad) $\rightarrow$ `Sección` $\rightarrow$ `Usuario`.
   - Las Gerencias tienen 1 o más Secciones. Las Unidades están al mismo nivel pero tienen 1 Sección.
   - Toda asignación y gasto está anclado a esta jerarquía.
2. **Cálculo Matemático de Saldos**:
   - $\text{Monto Vigente} = \text{Monto Inicial} + \text{Modificaciones Netas}$.
   - $\text{Monto Disponible} = \text{Monto Vigente} - \text{Monto Comprometido}$.
   - Ninguna operación puede comprometer dinero si $\text{Monto Requerido} > \text{Monto Disponible}$.
3. **Modificaciones Presupuestarias**:
   - **Traspasos**: Estrictamente permitidos SOLO entre partidas de la **misma Área/Gerencia**. Prohibido traspasar dinero entre Gerencias distintas.
   - **Incrementos**: Inyecciones de presupuesto que elevan el techo del Área y crean/amplían partidas, requiriendo registro de la autorización correspondiente.
4. **Doble Control en Memorias de Cálculo**:
   - Trazabilidad obligatoria: `Elaborador` (formula), `Ejecutor` (responsable operativo) y `Revisor / Aprobador` (valida pertinencia técnica y legal).
   - Estados de Memoria: `BORRADOR` $\rightarrow$ `ENVIADO_REVISION` $\rightarrow$ `APROBADO` / `RECHAZADO` $\rightarrow$ `EJECUTADO`.
   - Control unitario: Cada ítem de la memoria tiene su propio estado de gasto (`PENDIENTE`, `EJECUTADO`, `NO_EJECUTADO`).
5. **Colchón / Saldo Sobrante**:
   - El saldo sobrante de años anteriores se registra como **indicador referencial**, NUNCA se suma automáticamente al presupuesto vigente de la nueva gestión.

---

## ⚛️ 4. ARQUITECTURA DEL FRONTEND (REACT)
- **Patrón**: Arquitectura Basada en Características (*Feature-Driven Architecture*).
- **Estructura en `frontend/src/`**:
  - `features/<modulo>/`: Contiene `pages/`, `components/`, `hooks/` y `api/` específicos del dominio.
  - `components/commons/` (y su alias `components/ui/`): **Biblioteca institucional de componentes comunes y reutilizables**.
    1. **`Button`**: Botón unificado con soporte de variantes institucionales (`primary`, `secondary`, `outline`, `danger`, `ghost`), tamaños y estado de carga (`loading`).
    2. **`Modal`**: Ventana modal accesible con backdrop blur, bloqueo de scroll, control de Escape y múltiples tamaños preconfigurados.
    3. **`DataTable`**: Tabla tipada genérica con spinners de carga, estados vacíos personalizados, paginación integrada y anchos de columna estrictos contra truncamiento.
    4. **`StatusBadge`**: Insignias visuales consistentes para estados del POA mapeados a su color e ícono temático.
    5. **`TabsFilter`**: Pestañas horizontales para navegación interna con insignias contadoras e indicador de pestaña activa configurable.
    6. **`ResumenCards`**: Tarjetas de indicadores y KPIs métricos con diseño y proporciones idénticas al Dashboard (`card p-5`, encabezado con ícono `size={18}` en `p-2 rounded-xl`, monto en `text-2xl font-bold` y barra de progreso opcional `h-1.5`).
    7. **`FilterPanel`**: Panel común de filtros avanzados desacoplados. Soporta filtrado por días y meses acotados al año de la gestión seleccionada, rangos de importes (mínimo/máximo), selectores de partida y área, botón para restablecer filtros y buscador general desacoplado (que no solapa atributos ya filtrados).
  - `contexts/GestionContext.tsx`: **Estado global obligatorio** para mantener la Gestión activa (año fiscal seleccionado) sincronizada en todas las vistas sin peticiones redundantes.
  - `api/axiosClient.ts`: Cliente HTTP centralizado con interceptores para inyección y refresco de tokens JWT.
- **Regla Estricta**: Prohibido duplicar componentes de tablas, modales, tarjetas métricas o paneles de filtro en carpetas individuales de páginas. Todos los módulos deben consumir los componentes consolidados de `components/commons/`.
- **Regla**: No hacer llamadas `fetch` o `axios` directas dentro de componentes visuales; usar siempre la capa de servicios o hooks de la feature.