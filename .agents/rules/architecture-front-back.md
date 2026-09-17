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
  - `features/<modulo>/`: Contiene `pages/`, `components/` y `services/` específicos del dominio.
  - `components/ui/`: Componentes visuales genéricos y reutilizables (botones, modales, tablas).
  - `context/GestionContext.jsx`: **Estado global obligatorio** para mantener la Gestión activa (año fiscal seleccionado) sincronizada en todas las pantallas.
  - `api/axiosClient.js`: Cliente HTTP centralizado con interceptores para inyección y refresco de tokens JWT.
- **Regla**: No hacer llamadas `fetch` o `axios` directas dentro de componentes visuales; usar siempre la capa de servicios de la feature.