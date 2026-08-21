from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Q
from decimal import Decimal

from .models import Gasto
from .serializers import GastoSerializer
from apps.memorias.models import DetallePresupuestoMemoria, MemoriaCalculo
from apps.memorias.utils import recalcular_saldos_memoria
from apps.presupuestos.models import PresupuestoArea, Gestion


def recalcular_estado_detalle_y_presupuesto(detalle):
    """
    Función utilitaria que actualiza:
    1. El estado de ejecución del DetallePresupuestoMemoria (PENDIENTE, EJECUTADO_PARCIAL, COMPLETADO)
    2. Los campos almacenados de saldo en MemoriaCalculo y DetallePresupuestoMemoria
    3. El monto_actual del PresupuestoArea correspondiente.
    """
    memoria = detalle.memoria
    area = memoria.seccion.area
    gestion = memoria.gestion

    # 1. Actualizar saldos almacenados de la memoria y sus detalles
    recalcular_saldos_memoria(memoria)

    # 2. Actualizar estado del detalle
    monto_total_item = (detalle.cantidad or Decimal('0.00')) * (detalle.precio_unitario or Decimal('0.00'))
    total_gastado_item = detalle.total_ejecutado

    if total_gastado_item <= Decimal('0.00'):
        detalle.estado_ejecucion = DetallePresupuestoMemoria.EstadoGasto.PENDIENTE
    elif total_gastado_item < monto_total_item:
        detalle.estado_ejecucion = DetallePresupuestoMemoria.EstadoGasto.EJECUTADO_PARCIAL
    else:
        detalle.estado_ejecucion = DetallePresupuestoMemoria.EstadoGasto.COMPLETADO
    detalle.save(update_fields=['estado_ejecucion'])

    # 3. Actualizar PresupuestoArea en tiempo real: Monto_Actual = Monto_Inicial - Gastos_Ejecutados
    presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
    if presupuesto:
        total_gastos_area = Gasto.objects.filter(
            detalle_memoria__memoria__gestion=gestion,
            detalle_memoria__memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        presupuesto.monto_actual = max(Decimal('0.00'), presupuesto.monto_inicial - total_gastos_area)
        presupuesto.save(update_fields=['monto_actual'])


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.select_related(
        'detalle_memoria__memoria__gestion',
        'detalle_memoria__memoria__seccion__area',
        'detalle_memoria__partida',
        'usuario_registro'
    ).all().order_by('-fecha_gasto', '-created_at')
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        memoria_id = self.request.query_params.get('memoria')
        partida_id = self.request.query_params.get('partida')
        search = self.request.query_params.get('search')

        if gestion_id:
            qs = qs.filter(detalle_memoria__memoria__gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(detalle_memoria__memoria__gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(detalle_memoria__memoria__seccion__area_id=area_id)
        if memoria_id:
            qs = qs.filter(detalle_memoria__memoria_id=memoria_id)
        if partida_id:
            qs = qs.filter(detalle_memoria__partida_id=partida_id)
        if search:
            qs = qs.filter(
                Q(comprobante_num__icontains=search) |
                Q(observacion__icontains=search) |
                Q(detalle_memoria__descripcion__icontains=search) |
                Q(detalle_memoria__partida__codigo__icontains=search) |
                Q(detalle_memoria__partida__nombre__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            gasto = serializer.save(usuario_registro=self.request.user)
            recalcular_estado_detalle_y_presupuesto(gasto.detalle_memoria)

    def perform_update(self, serializer):
        with transaction.atomic():
            gasto = serializer.save()
            recalcular_estado_detalle_y_presupuesto(gasto.detalle_memoria)

    def perform_destroy(self, instance):
        detalle = instance.detalle_memoria
        with transaction.atomic():
            instance.delete()
            recalcular_estado_detalle_y_presupuesto(detalle)

    @action(detail=False, methods=['get'], url_path='resumen-ejecucion')
    def resumen_ejecucion(self, request):
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

        # Gastos por Área
        from apps.organizacional.models import Area
        areas = Area.objects.filter(estado=True)
        por_area = []
        for a in areas:
            pres = PresupuestoArea.objects.filter(gestion=gestion, area=a).first()
            m_inicial = pres.monto_inicial if pres else Decimal('0.00')
            gastado = Gasto.objects.filter(
                detalle_memoria__memoria__gestion=gestion,
                detalle_memoria__memoria__seccion__area=a
            ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
            disponible = max(Decimal('0.00'), m_inicial - gastado)
            pct = round((gastado / m_inicial * Decimal('100.0')), 2) if m_inicial > Decimal('0.00') else 0.0

            por_area.append({
                'area_id': a.id,
                'area_codigo': a.codigo,
                'area_nombre': a.nombre,
                'monto_inicial': str(m_inicial),
                'monto_ejecutado': str(gastado),
                'monto_disponible': str(disponible),
                'porcentaje_ejecucion': float(pct),
            })

        # Gastos por Partida (Top 10)
        from apps.presupuestos.models import Partida
        partidas_gastos = (
            Gasto.objects.filter(detalle_memoria__memoria__gestion=gestion)
            .values('detalle_memoria__partida__codigo', 'detalle_memoria__partida__nombre')
            .annotate(total=Sum('monto_ejecutado'))
            .order_by('-total')[:10]
        )

        por_partida = [
            {
                'partida_codigo': item['detalle_memoria__partida__codigo'],
                'partida_nombre': item['detalle_memoria__partida__nombre'],
                'monto_ejecutado': str(item['total'] or Decimal('0.00')),
            }
            for item in partidas_gastos
        ]

        total_inicial_global = sum(Decimal(x['monto_inicial']) for x in por_area)
        total_gastado_global = sum(Decimal(x['monto_ejecutado']) for x in por_area)
        total_disponible_global = max(Decimal('0.00'), total_inicial_global - total_gastado_global)
        pct_global = (
            round((total_gastado_global / total_inicial_global * Decimal('100.0')), 2)
            if total_inicial_global > Decimal('0.00')
            else 0.0
        )

        return Response({
            'gestion_id': gestion.id,
            'gestion_anio': gestion.anio,
            'gestion_estado': gestion.estado,
            'total_inicial': str(total_inicial_global),
            'total_ejecutado': str(total_gastado_global),
            'total_disponible': str(total_disponible_global),
            'porcentaje_global': float(pct_global),
            'por_area': por_area,
            'por_partida': por_partida,
        })
