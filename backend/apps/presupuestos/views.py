from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F
from decimal import Decimal

from .models import Gestion, Partida, PresupuestoArea
from .serializers import GestionSerializer, PartidaSerializer, PresupuestoAreaSerializer
from apps.organizacional.models import Area
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria
from apps.ejecucion.models import Gasto


class GestionViewSet(viewsets.ModelViewSet):
    queryset = Gestion.objects.all().order_by('-anio')
    serializer_class = GestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='cerrar-formulacion')
    def cerrar_formulacion(self, request, pk=None):
        """
        Cierra la fase de formulación para la gestión indicada.
        Bloquea nuevas memorias y consolida automáticamente el Presupuesto Inicial de cada Área
        a partir de la sumatoria de sus memorias aprobadas (APROBADO_FINANZAS o APROBADO_GERENCIA).
        """
        gestion = self.get_object()

        with transaction.atomic():
            gestion.estado = Gestion.EstadoGestion.CERRADO_FORMULACION
            gestion.fecha_cierre = timezone.now()
            gestion.save()

            # Consolidar presupuestos por Área
            areas = Area.objects.filter(estado=True)
            consolidados_count = 0

            for area in areas:
                # Sumar montos de detalles de memorias aprobadas para esta área y gestión
                detalles_aprobados = DetallePresupuestoMemoria.objects.filter(
                    memoria__gestion=gestion,
                    memoria__seccion__area=area,
                    memoria__estado__in=[
                        MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
                        MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA,
                    ]
                )

                total_monto = Decimal('0.00')
                for d in detalles_aprobados:
                    total_monto += (d.cantidad or Decimal('0.00')) * (d.precio_unitario or Decimal('0.00'))

                # Obtener gastos ya ejecutados si los hubiera
                gastos_area = Gasto.objects.filter(
                    detalle_memoria__memoria__gestion=gestion,
                    detalle_memoria__memoria__seccion__area=area
                ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

                monto_disponible = max(Decimal('0.00'), total_monto - gastos_area)

                presupuesto_obj, _ = PresupuestoArea.objects.update_or_create(
                    gestion=gestion,
                    area=area,
                    defaults={
                        'monto_inicial': total_monto,
                        'monto_actual': monto_disponible,
                        'estado': PresupuestoArea.EstadoPresupuesto.ABIERTO,
                    }
                )
                consolidados_count += 1

        return Response({
            'message': f'Formulación de la Gestión {gestion.anio} cerrada exitosamente. Presupuestos consolidados para {consolidados_count} áreas.',
            'gestion': GestionSerializer(gestion).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='pasar-a-ejecucion')
    def pasar_a_ejecucion(self, request, pk=None):
        gestion = self.get_object()
        gestion.estado = Gestion.EstadoGestion.EN_EJECUCION
        gestion.save()
        return Response({
            'message': f'La Gestión {gestion.anio} ahora se encuentra En Ejecución.',
            'gestion': GestionSerializer(gestion).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reabrir-formulacion')
    def reabrir_formulacion(self, request, pk=None):
        gestion = self.get_object()
        gestion.estado = Gestion.EstadoGestion.FORMULACION
        gestion.fecha_cierre = None
        gestion.save()
        return Response({
            'message': f'La Formulación de la Gestión {gestion.anio} ha sido reabierta.',
            'gestion': GestionSerializer(gestion).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='consolidar-presupuestos')
    def consolidar_presupuestos(self, request, pk=None):
        """Recalcula y consolida los montos de PresupuestoArea sin cambiar el estado de la gestión."""
        gestion = self.get_object()
        with transaction.atomic():
            areas = Area.objects.filter(estado=True)
            for area in areas:
                detalles_aprobados = DetallePresupuestoMemoria.objects.filter(
                    memoria__gestion=gestion,
                    memoria__seccion__area=area,
                    memoria__estado__in=[
                        MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
                        MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA,
                    ]
                )

                total_monto = Decimal('0.00')
                for d in detalles_aprobados:
                    total_monto += (d.cantidad or Decimal('0.00')) * (d.precio_unitario or Decimal('0.00'))

                gastos_area = Gasto.objects.filter(
                    detalle_memoria__memoria__gestion=gestion,
                    detalle_memoria__memoria__seccion__area=area
                ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

                monto_disponible = max(Decimal('0.00'), total_monto - gastos_area)

                PresupuestoArea.objects.update_or_create(
                    gestion=gestion,
                    area=area,
                    defaults={
                        'monto_inicial': total_monto,
                        'monto_actual': monto_disponible,
                        'estado': PresupuestoArea.EstadoPresupuesto.ABIERTO,
                    }
                )

        return Response({
            'message': f'Presupuestos de la Gestión {gestion.anio} recalculados y consolidados.',
            'gestion': GestionSerializer(gestion).data
        }, status=status.HTTP_200_OK)


class PartidaViewSet(viewsets.ModelViewSet):
    queryset = Partida.objects.all().order_by('codigo')
    serializer_class = PartidaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        clase = self.request.query_params.get('clase')
        estado = self.request.query_params.get('estado')

        if search:
            qs = qs.filter(Q(codigo__icontains=search) | Q(nombre__icontains=search) | Q(descripcion__icontains=search))
        if clase:
            qs = qs.filter(clase=clase)
        if estado is not None:
            qs = qs.filter(estado=(estado.lower() == 'true'))
        return qs


class PresupuestoAreaViewSet(viewsets.ModelViewSet):
    queryset = PresupuestoArea.objects.select_related('gestion', 'area').all().order_by('-gestion__anio', 'area__codigo')
    serializer_class = PresupuestoAreaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')

        if gestion_id:
            qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(area_id=area_id)
        return qs

    @action(detail=False, methods=['get'], url_path='resumen-gestion')
    def resumen_gestion(self, request):
        """Devuelve un resumen general consolidado para la gestión seleccionada."""
        gestion_id = request.query_params.get('gestion')
        anio = request.query_params.get('anio')

        if gestion_id:
            gestion = Gestion.objects.filter(id=gestion_id).first()
        elif anio:
            gestion = Gestion.objects.filter(anio=anio).first()
        else:
            gestion = Gestion.objects.first()

        if not gestion:
            return Response({'error': 'No se encontró la gestión solicitada.'}, status=status.HTTP_404_NOT_FOUND)

        presupuestos = PresupuestoArea.objects.filter(gestion=gestion).select_related('area')
        total_inicial = presupuestos.aggregate(total=Sum('monto_inicial'))['total'] or Decimal('0.00')
        total_disponible = presupuestos.aggregate(total=Sum('monto_actual'))['total'] or Decimal('0.00')

        total_gastos = Gasto.objects.filter(
            detalle_memoria__memoria__gestion=gestion
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        porcentaje_global = Decimal('0.0')
        if total_inicial > Decimal('0.00'):
            porcentaje_global = round((total_gastos / total_inicial) * Decimal('100.0'), 2)

        return Response({
            'gestion': GestionSerializer(gestion).data,
            'total_inicial': str(total_inicial),
            'total_disponible': str(total_disponible),
            'total_ejecutado': str(total_gastos),
            'porcentaje_global': float(porcentaje_global),
            'areas': PresupuestoAreaSerializer(presupuestos, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='detalle-area')
    def detalle_area(self, request):
        """
        Devuelve el desglose completo de un Área específica:
        - Presupuesto del área
        - Por cada Sección: memorias aprobadas, partidas usadas y gastos ejecutados con fecha
        """
        gestion_id = request.query_params.get('gestion')
        area_id = request.query_params.get('area')

        if not gestion_id or not area_id:
            return Response({'error': 'Se requieren los parámetros gestion y area.'}, status=status.HTTP_400_BAD_REQUEST)

        gestion = Gestion.objects.filter(id=gestion_id).first()
        area = Area.objects.filter(id=area_id).first()

        if not gestion or not area:
            return Response({'error': 'Gestión o Área no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Presupuesto del área
        presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()

        # Gastos totales del área
        gastos_area_total = Gasto.objects.filter(
            detalle_memoria__memoria__gestion=gestion,
            detalle_memoria__memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        # Desglose por Sección
        from apps.organizacional.models import Seccion
        secciones = Seccion.objects.filter(area=area)
        secciones_data = []

        for seccion in secciones:
            # Memorias aprobadas de esta sección
            memorias = MemoriaCalculo.objects.filter(
                gestion=gestion,
                seccion=seccion,
            ).prefetch_related('detalles__partida', 'detalles__gastos')

            memorias_data = []
            for memoria in memorias:
                # Gastos imputados a esta memoria agrupados por partida
                partidas_data = {}
                for detalle in memoria.detalles.all():
                    codigo = detalle.partida.codigo if detalle.partida else 'SIN_PARTIDA'
                    nombre = detalle.partida.nombre if detalle.partida else 'Sin Partida'
                    pkey = f"{codigo}"
                    if pkey not in partidas_data:
                        partidas_data[pkey] = {
                            'partida_codigo': codigo,
                            'partida_nombre': nombre,
                            'presupuestado': Decimal('0.00'),
                            'gastado': Decimal('0.00'),
                            'gastos_detalle': [],
                        }
                    subtotal = (detalle.cantidad or Decimal('0')) * (detalle.precio_unitario or Decimal('0'))
                    partidas_data[pkey]['presupuestado'] += subtotal

                    # Gastos individuales de este detalle
                    for gasto in detalle.gastos.all():
                        monto_g = gasto.monto_ejecutado or Decimal('0.00')
                        partidas_data[pkey]['gastado'] += Decimal(str(monto_g))
                        partidas_data[pkey]['gastos_detalle'].append({
                            'gasto_id': gasto.id,
                            'fecha_gasto': str(gasto.fecha_gasto),
                            'monto': str(monto_g),
                            'comprobante': gasto.comprobante_num or '',
                            'observacion': gasto.observacion or '',
                            'item_descripcion': detalle.descripcion,
                        })

                total_pres_mem = sum(p['presupuestado'] for p in partidas_data.values())
                total_gast_mem = sum(p['gastado'] for p in partidas_data.values())

                memorias_data.append({
                    'memoria_id': memoria.id,
                    'memoria_codigo': memoria.codigo,
                    'estado': memoria.estado,
                    'estado_display': memoria.get_estado_display(),
                    'justificacion': memoria.justificacion,
                    'total_presupuestado': str(total_pres_mem),
                    'total_gastado': str(total_gast_mem),
                    'total_disponible': str(max(Decimal('0.00'), total_pres_mem - total_gast_mem)),
                    'partidas': [
                        {
                            **v,
                            'presupuestado': str(v['presupuestado']),
                            'gastado': str(v['gastado']),
                            'disponible': str(max(Decimal('0.00'), v['presupuestado'] - v['gastado'])),
                        }
                        for v in partidas_data.values()
                    ],
                })

            # Totales de la sección
            gastos_seccion = Gasto.objects.filter(
                detalle_memoria__memoria__gestion=gestion,
                detalle_memoria__memoria__seccion=seccion,
            ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

            pres_seccion = sum(
                Decimal(m['total_presupuestado']) for m in memorias_data
            )

            secciones_data.append({
                'seccion_id': seccion.id,
                'seccion_nombre': seccion.nombre,
                'total_presupuestado': str(pres_seccion),
                'total_gastado': str(gastos_seccion),
                'total_disponible': str(max(Decimal('0.00'), pres_seccion - gastos_seccion)),
                'memorias': memorias_data,
            })

        return Response({
            'area_id': area.id,
            'area_codigo': area.codigo,
            'area_nombre': area.nombre,
            'area_tipo': area.tipo,
            'gestion_anio': gestion.anio,
            'gestion_estado': gestion.estado,
            'monto_inicial': str(presupuesto.monto_inicial) if presupuesto else '0.00',
            'monto_actual': str(presupuesto.monto_actual) if presupuesto else '0.00',
            'monto_ejecutado': str(gastos_area_total),
            'porcentaje_ejecucion': float(
                round(gastos_area_total / presupuesto.monto_inicial * Decimal('100'), 2)
                if presupuesto and presupuesto.monto_inicial > Decimal('0')
                else 0
            ),
            'secciones': secciones_data,
        })

