import os
import re
from decimal import Decimal, InvalidOperation
import openpyxl
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.presupuestos.models import Gestion, Partida, PresupuestoArea
from apps.organizacional.models import Area, Seccion
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria
from apps.memorias.utils import recalcular_saldos_memoria

class Command(BaseCommand):
    help = 'Limpia y puebla la BD con las Memorias de Cálculo y sus Detalles exactos desde el Excel TAMEP'

    def handle(self, *args, **kwargs):
        excel_path = os.path.join('..', 'temporal', '1. CONSOLIDADO GENERAL POA 2026 OFICIAL.xlsx')
        if not os.path.exists(excel_path):
            excel_path = os.path.join('temporal', '1. CONSOLIDADO GENERAL POA 2026 OFICIAL.xlsx')

        if not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f"No se encontró el archivo Excel en {excel_path}"))
            return

        self.stdout.write(self.style.WARNING("=================================================="))
        self.stdout.write(self.style.WARNING("1. Eliminando datos anteriores de Memorias..."))
        self.stdout.write(self.style.WARNING("=================================================="))

        with transaction.atomic():
            DetallePresupuestoMemoria.objects.all().delete()
            MemoriaCalculo.objects.all().delete()
            PresupuestoArea.objects.all().update(monto_inicial=Decimal('0.00'), monto_actual=Decimal('0.00'))
            self.stdout.write(self.style.SUCCESS("Datos anteriores eliminados correctamente."))

            # Asegurar Gestión 2026
            gestion, _ = Gestion.objects.get_or_create(
                anio=2026,
                defaults={'estado': Gestion.EstadoGestion.FORMULACION}
            )

            # Mapeo de siglas en nombres de pestañas a Nombres de Áreas
            UNIT_MAP = {
                'PL': 'Unidad Planificación',
                'UT': 'Unidad Transparencia',
                'AI': 'Unidad Auditoria Int',
                'AJ': 'Unidad de Juridica',
                'CIAC': 'CIAC',
                'OD': 'ODECO',
                'IF': 'Gerencia de Informatica',
                'GAA': 'Gerencia de Asuntos',
                'GC': 'Gerencia Comercial',
                'GO': 'Gerencia de Operaciones',
                'AE': 'Gerencia de Aereonavegabilidad',
                'SMS': 'Gerencia de SMS (AVSEC)',
                'EA': 'Gerencia Regional El Alto',
                'LP': 'Sucursal La Paz (Agencia Montes)',
                'CBBA': 'Gerencia Regional Cochabamba',
                'SCZ': 'Gerencia Regional Santa Cruz',
                'CBJ': 'Gerencia Regional Cobija',
            }

            self.stdout.write(self.style.WARNING(f"Abriendo libro Excel: {excel_path}..."))
            wb = openpyxl.load_workbook(excel_path, data_only=True)

            sheets = wb.sheetnames[13:] # Pestañas de memorias individuales (desde la 14 en adelante)
            self.stdout.write(self.style.SUCCESS(f"Procesando {len(sheets)} pestañas de memorias de cálculo..."))

            count_memorias = 0
            count_detalles = 0
            area_counters = {}

            for sname in sheets:
                ws = wb[sname]
                sname_clean = sname.strip()

                # Extraer código de partida de la pestaña (ej. '22110PL' -> '22110')
                partida_match = re.search(r'\d{5}', sname_clean)
                partida_code = partida_match.group(0) if partida_match else None

                # Extraer sigla de unidad de la pestaña
                sigla_match = re.search(r'[A-Za-z]+', sname_clean)
                sigla = sigla_match.group(0).upper() if sigla_match else ''

                # Identificar Área y Sección
                area_nombre = UNIT_MAP.get(sigla)
                area = None
                if area_nombre:
                    area = Area.objects.filter(nombre__icontains=area_nombre).first()
                if not area:
                    area = Area.objects.first()

                seccion = Seccion.objects.filter(area=area).first()
                if not seccion:
                    seccion, _ = Seccion.objects.get_or_create(
                        area=area,
                        defaults={'nombre': area.nombre}
                    )

                # Identificar o crear Partida
                partida = None
                if partida_code:
                    partida = Partida.objects.filter(codigo=partida_code).first()
                if not partida:
                    partida, _ = Partida.objects.get_or_create(
                        codigo=partida_code or f"P-{sname_clean[:5]}",
                        defaults={'nombre': f"Partida {partida_code or sname_clean}"}
                    )

                # 1. Localizar dinámicamente la fila de cabecera de la tabla
                header_r = None
                col_num = 1
                col_desc = 2
                col_cant = 4
                col_unit = 5
                col_pu = 6
                col_just = 8

                for r in range(1, 15):
                    row_str = [str(ws.cell(row=r, column=c).value or '').strip().upper() for c in range(1, 12)]
                    combined = ' '.join(row_str)
                    if 'DESCRIPCI' in combined:
                        header_r = r
                        for idx, c_val in enumerate(row_str, start=1):
                            if c_val in ['N°', 'Nº', 'N', 'NRO', 'Nª', 'NUM']:
                                col_num = idx
                            elif 'DESCRIPCI' in c_val:
                                col_desc = idx
                            elif 'CANTIDAD' in c_val:
                                col_cant = idx
                            elif 'UNIDAD' in c_val:
                                col_unit = idx
                            elif 'PRECIO' in c_val or 'P.U' in c_val or 'UNITARIO' in c_val:
                                col_pu = idx
                            elif 'JUSTIFICACI' in c_val:
                                col_just = idx
                        break

                if not header_r:
                    continue

                # 2. Extraer los items fila por fila
                sheet_items = []
                justificacion_memoria = ''

                for r in range(header_r + 1, ws.max_row + 1):
                    c_num = ws.cell(row=r, column=col_num).value
                    c_desc = ws.cell(row=r, column=col_desc).value

                    c_num_str = str(c_num or '').strip().upper()
                    c_desc_str = str(c_desc or '').strip().upper()

                    # Terminar cuando llegue al total o a firmas
                    if 'TOTAL' in c_num_str or 'TOTAL' in c_desc_str:
                        break
                    if any(w in c_num_str or w in c_desc_str for w in ['ELABORADO', 'APROBADO', 'NOMBRE', 'CARGO', 'FIRMA']):
                        break

                    desc = str(c_desc or '').strip()
                    if not desc and c_num_str and not c_num_str.isdigit():
                        desc = c_num_str

                    if not desc:
                        continue

                    # Cantidad
                    cant_raw = ws.cell(row=r, column=col_cant).value
                    try:
                        cant = Decimal(str(cant_raw).strip().replace(',', '.')) if cant_raw is not None else Decimal('1.00')
                    except (InvalidOperation, TypeError):
                        cant = Decimal('1.00')

                    # Unidad
                    unit_raw = ws.cell(row=r, column=col_unit).value
                    unit_str = str(unit_raw or 'UNIDAD').strip()
                    if not unit_str or unit_str == 'None':
                        unit_str = 'UNIDAD'

                    # Precio Unitario
                    pu_raw = ws.cell(row=r, column=col_pu).value
                    try:
                        pu = Decimal(str(pu_raw).strip().replace(',', '.')) if pu_raw is not None else Decimal('0.00')
                    except (InvalidOperation, TypeError):
                        pu = Decimal('0.00')

                    # Justificación
                    just_raw = ws.cell(row=r, column=col_just).value
                    just_str = str(just_raw or '').strip()
                    if just_str and not justificacion_memoria:
                        justificacion_memoria = just_str

                    sheet_items.append({
                        'descripcion': desc,
                        'cantidad': cant,
                        'unidad_medida': unit_str[:50],
                        'precio_unitario': pu
                    })

                if not sheet_items:
                    continue

                # 3. Crear Memoria de Cálculo con su Justificación
                correlativo = area_counters.get(sigla, 0) + 1
                area_counters[sigla] = correlativo
                memoria_code = f"MEM-{sigla}-2026-{correlativo:03d}"
                justificacion_final = justificacion_memoria if justificacion_memoria else f"Memoria de Cálculo de la partida {partida_code or sname_clean} para {area.nombre}."

                memoria = MemoriaCalculo.objects.create(
                    codigo=memoria_code,
                    gestion=gestion,
                    seccion=seccion,
                    justificacion=justificacion_final,
                    estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
                    fecha_aprobacion=timezone.now()
                )
                count_memorias += 1

                # 4. Crear Detalles en DetallePresupuestoMemoria
                monto_total_memoria = Decimal('0.00')
                for item in sheet_items:
                    detalle = DetallePresupuestoMemoria.objects.create(
                        memoria=memoria,
                        partida=partida,
                        descripcion=item['descripcion'],
                        cantidad=item['cantidad'],
                        unidad_medida=item['unidad_medida'],
                        precio_unitario=item['precio_unitario'],
                        estado_ejecucion=DetallePresupuestoMemoria.EstadoGasto.PENDIENTE
                    )
                    monto_total_memoria += detalle.precio_total
                    count_detalles += 1

                recalcular_saldos_memoria(memoria)

                # 5. Actualizar PresupuestoArea acumulativo
                presupuesto_area, _ = PresupuestoArea.objects.get_or_create(
                    gestion=gestion,
                    area=area,
                    defaults={'monto_inicial': Decimal('0.00'), 'monto_actual': Decimal('0.00')}
                )
                presupuesto_area.monto_inicial += monto_total_memoria
                presupuesto_area.monto_actual += monto_total_memoria
                presupuesto_area.save()

            self.stdout.write(self.style.SUCCESS("=================================================="))
            self.stdout.write(self.style.SUCCESS(
                f"[OK] Carga limpia y exacta completada exitosamente!\n"
                f"   - Memorias de Calculo creadas: {count_memorias}\n"
                f"   - Detalles de Presupuesto exactos: {count_detalles}\n"
                f"   - Estado de todas: APROBADO_FINANZAS"
            ))
            self.stdout.write(self.style.SUCCESS("=================================================="))
