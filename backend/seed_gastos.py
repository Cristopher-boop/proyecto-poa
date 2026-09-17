"""
seed_gastos.py
==============
Script para importar registros de ejecucion de gasto desde el Excel
"Llenado-2026-Oficial-Gastos.xlsx" a la tabla ejecucion_gasto (Gestion 2026).

Mapeo de campos:
  - monto_ejecutado    <- Monto (Columna B / 2)
  - fecha_gasto        <- Fecha (Columna C / 3)
  - comprobante_num    <- TAMP-{CODIGO_GERENCIA}-{HR}-2026 (Columna G / 7 para HR)
  - observacion        <- Observacion (Columna D / 4)
  - usuario_registro   <- Usuario superadministrador ('admin')
  - memoria            <- MemoriaCalculo de la Gestion 2026 (Columna A / 1)

Uso (desde la carpeta backend/):
    python seed_gastos.py
"""
import os
import sys
from decimal import Decimal, InvalidOperation
from datetime import date, datetime

# -- Django setup ------------------------------------------------------
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.usuarios.models import Usuario
from apps.memorias.models import MemoriaCalculo
from apps.ejecucion.models import Gasto
from apps.presupuestos.models import Gestion

# -- Dependencia para leer Excel --------------------------------------
try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl no esta instalado. Ejecuta: pip install openpyxl")
    sys.exit(1)


# -- Configuracion ----------------------------------------------------
EXCEL_FILENAME = 'Llenado-2026-Oficial-Gastos.xlsx'
SHEETS_TO_PROCESS = ['Cristopher', 'Jhair', 'Mauricio']  # Primeras 3 pestanas

# Columnas del Excel (indice base-1)
COL_CODIGO_MEMORIA = 1   # A - Codigo de la Memoria
COL_MONTO          = 2   # B - Monto
COL_FECHA          = 3   # C - Fecha
COL_OBSERVACION    = 4   # D - Observacion
COL_HR             = 7   # G - HR (Hoja de Ruta)


def find_excel_file():
    """Busca el Excel en la raiz del proyecto (un nivel arriba de backend/)."""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    excel_path = os.path.join(project_root, EXCEL_FILENAME)

    if not os.path.exists(excel_path):
        print(f"ERROR: No se encontro el archivo '{EXCEL_FILENAME}' en: {project_root}")
        sys.exit(1)

    return excel_path


def get_superadmin_user():
    """Obtiene el usuario superadministrador."""
    user = Usuario.objects.filter(username='admin').first()
    if not user:
        user = Usuario.objects.filter(is_superuser=True).first()
    if not user:
        print("ERROR: No se encontro el usuario 'admin' ni un superusuario.")
        print("       Ejecuta primero: python seed_admin.py")
        sys.exit(1)

    print(f"  Usuario para registro: {user.username} (ID: {user.id})")
    return user


def build_memoria_cache():
    """
    Construye un diccionario de codigo -> MemoriaCalculo
    exclusivamente para la Gestion 2026.
    """
    gestion_2026 = Gestion.objects.filter(anio=2026).first()
    if not gestion_2026:
        memorias = MemoriaCalculo.objects.all()
    else:
        memorias = MemoriaCalculo.objects.filter(gestion=gestion_2026)

    cache = {}
    for m in memorias:
        cache[m.codigo.strip().upper()] = m

    print(f"  Memorias cargadas de Gestion 2026: {len(cache)}")
    return cache


def parse_monto(value):
    """Convierte el valor del monto a Decimal."""
    if value is None:
        return None
    try:
        return Decimal(str(value)).quantize(Decimal('0.01'))
    except (InvalidOperation, ValueError):
        return None


def parse_fecha(value):
    """Convierte el valor de fecha a date."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value).strip(), '%Y-%m-%d').date()
    except ValueError:
        try:
            return datetime.strptime(str(value).strip(), '%d/%m/%Y').date()
        except ValueError:
            return None


def format_comprobante_num(codigo_memoria, hr_raw):
    """
    Formatea el numero de comprobante como:
    TAMP-{CODIGO_GERENCIA}-{HR}/2026

    Ejemplo:
      MEM-AE-2026-002 con HR=674 -> TAMP-AE-674-2026
      MEM-GAA-2026-005 con HR=1191 -> TAMP-GAA-1191-2026
    """
    parts = codigo_memoria.split('-')
    gerencia = parts[1] if len(parts) > 1 else 'GER'

    if hr_raw is None or str(hr_raw).strip() == '':
        hr_str = 'SN'
    elif isinstance(hr_raw, float) and hr_raw.is_integer():
        hr_str = str(int(hr_raw))
    else:
        hr_str = str(hr_raw).strip().replace('.0', '')

    return f"TAMP-{gerencia}-{hr_str}/2026"


def process_sheets(excel_path, user, memoria_cache):
    """Procesa las pestanas del Excel y crea registros de Gasto (ejecucion_gasto)."""
    wb = openpyxl.load_workbook(excel_path, data_only=True)

    total_created = 0
    total_skipped_no_memoria = 0
    total_skipped_no_data = 0
    memorias_not_found = set()
    mapped_2027_to_2026 = 0

    for sheet_name in SHEETS_TO_PROCESS:
        if sheet_name not in wb.sheetnames:
            print(f"\n  AVISO: Pestana '{sheet_name}' no encontrada, saltando...")
            continue

        ws = wb[sheet_name]
        print(f"\n  {'_'*50}")
        print(f"  Pestana: {sheet_name} ({ws.max_row} filas)")
        print(f"  {'_'*50}")

        registros_to_create = []

        # Empezar desde fila 2 (fila 1 es encabezado)
        for row_idx in range(2, ws.max_row + 1):
            codigo_raw = ws.cell(row=row_idx, column=COL_CODIGO_MEMORIA).value
            monto_raw = ws.cell(row=row_idx, column=COL_MONTO).value
            fecha_raw = ws.cell(row=row_idx, column=COL_FECHA).value
            observacion_raw = ws.cell(row=row_idx, column=COL_OBSERVACION).value
            hr_raw = ws.cell(row=row_idx, column=COL_HR).value

            # Saltar filas vacias
            if not codigo_raw and not monto_raw:
                continue

            # Validar codigo de memoria
            if not codigo_raw:
                total_skipped_no_data += 1
                continue

            codigo = str(codigo_raw).strip().upper()

            # Buscar memoria en cache de 2026 (si viene con 2027 escrito en el excel, ajustar a 2026)
            memoria = memoria_cache.get(codigo)
            if not memoria and '2027' in codigo:
                codigo_2026 = codigo.replace('2027', '2026')
                memoria = memoria_cache.get(codigo_2026)
                if memoria:
                    mapped_2027_to_2026 += 1

            if not memoria:
                memorias_not_found.add(codigo)
                total_skipped_no_memoria += 1
                continue

            # Parsear monto
            monto = parse_monto(monto_raw)
            if monto is None:
                total_skipped_no_data += 1
                continue

            # Parsear fecha
            fecha = parse_fecha(fecha_raw)
            if fecha is None:
                total_skipped_no_data += 1
                continue

            # Comprobante formateado: TAMP-{CODIGO_GERENCIA}-{HR}-2026
            comprobante = format_comprobante_num(codigo, hr_raw)

            # Observacion completa
            texto_obs = str(observacion_raw).strip() if observacion_raw else ''

            # Crear registro
            registros_to_create.append(Gasto(
                monto_ejecutado=monto,
                fecha_gasto=fecha,
                comprobante_num=comprobante,
                observacion=texto_obs,
                usuario_registro=user,
                memoria=memoria,
            ))

        # Bulk create para eficiencia
        if registros_to_create:
            Gasto.objects.bulk_create(registros_to_create, batch_size=100)

        print(f"    Registros creados: {len(registros_to_create)}")
        total_created += len(registros_to_create)

    return total_created, total_skipped_no_memoria, total_skipped_no_data, memorias_not_found, mapped_2027_to_2026


def sembrar_gastos():
    """Funcion reutilizable para sembrar gastos desde seed_gastos.py o reset_db.py."""
    print("  [*] Importando ejecucion de gastos oficiales 2026 desde Excel...")

    # 1. Encontrar el Excel
    excel_path = find_excel_file()

    # 2. Obtener usuario superadministrador
    user = get_superadmin_user()

    # 3. Construir cache de memorias 2026
    memoria_cache = build_memoria_cache()

    if not memoria_cache:
        print("\n  [!] No hay memorias de la Gestion 2026 en la base de datos.")
        return 0

    # 4. Limpiar registros existentes
    existing_count = Gasto.objects.count()
    if existing_count > 0:
        deleted, _ = Gasto.objects.all().delete()
        print(f"      - Se eliminaron {deleted} gastos anteriores para reemplazarlos.")

    # 5. Procesar pestanas
    total_created, skipped_no_mem, skipped_no_data, not_found, mapped_fix = process_sheets(
        excel_path, user, memoria_cache
    )

    # 6. Recalcular saldos de memorias y presupuestos de area
    print("      - Recalculando saldos de memorias y presupuestos...")
    from apps.ejecucion.views import recalcular_estado_memoria_y_presupuesto
    for m in memoria_cache.values():
        recalcular_estado_memoria_y_presupuesto(m)

    print(f"  [OK] {total_created} registros de gastos 2026 importados y saldos sincronizados.")
    return total_created


def main():
    print()
    print("  ===================================================")
    print("    SEED: Ejecucion de Gastos desde Excel (2026)")
    print("  ===================================================")
    sembrar_gastos()
    print("  Proceso finalizado con exito.\n")


if __name__ == '__main__':
    main()
