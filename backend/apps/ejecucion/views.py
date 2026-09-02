from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Q, F
from decimal import Decimal

from .models import Gasto, CertificacionPOA
from .serializers import GastoSerializer, CertificacionPOASerializer
from apps.memorias.models import MemoriaCalculo
from apps.memorias.utils import recalcular_saldos_memoria
from apps.presupuestos.models import PresupuestoArea, Gestion


def recalcular_estado_memoria_y_presupuesto(memoria):
    """
    Función utilitaria que actualiza:
    1. Los campos almacenados de saldo en MemoriaCalculo
    2. El monto_actual del PresupuestoArea correspondiente.
    """
    area = memoria.seccion.area
    gestion = memoria.gestion

    # 1. Actualizar saldos almacenados de la memoria
    recalcular_saldos_memoria(memoria)

    # 2. Actualizar PresupuestoArea en tiempo real: Monto_Actual = Monto_Inicial - Gastos_Ejecutados
    presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
    if presupuesto:
        total_gastos_area = Gasto.objects.filter(
            memoria__gestion=gestion,
            memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        presupuesto.monto_actual = max(Decimal('0.00'), presupuesto.monto_inicial - total_gastos_area)
        presupuesto.save(update_fields=['monto_actual'])


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.select_related(
        'memoria__gestion',
        'memoria__seccion__area',
        'usuario_registro'
    ).all().order_by('-fecha_gasto', '-created_at')
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        is_gerente = rol_nombre == 'GERENTE'

        # Trabajadores y Elaboradores solo ven gastos de su propia área
        if not (is_admin_aprobador or is_gerente):
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(memoria__seccion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()

        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        memoria_id = self.request.query_params.get('memoria')
        search = self.request.query_params.get('search')

        if gestion_id:
            qs = qs.filter(memoria__gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(memoria__gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(memoria__seccion__area_id=area_id)
        if memoria_id:
            qs = qs.filter(memoria_id=memoria_id)
        if search:
            qs = qs.filter(
                Q(comprobante_num__icontains=search) |
                Q(observacion__icontains=search) |
                Q(memoria__codigo__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        if not is_admin_aprobador:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede registrar ejecuciones presupuestarias.']})

        with transaction.atomic():
            gasto = serializer.save(usuario_registro=user)
            recalcular_estado_memoria_y_presupuesto(gasto.memoria)

    def perform_update(self, serializer):
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        if not is_admin_aprobador:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede editar ejecuciones presupuestarias.']})

        with transaction.atomic():
            gasto = serializer.save()
            recalcular_estado_memoria_y_presupuesto(gasto.memoria)

    def perform_destroy(self, instance):
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        if not is_admin_aprobador:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede anular o eliminar ejecuciones presupuestarias.']})

        memoria = instance.memoria
        with transaction.atomic():
            instance.delete()
            recalcular_estado_memoria_y_presupuesto(memoria)

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
        presupuestos_map = {
            p.area_id: p.monto_inicial
            for p in PresupuestoArea.objects.filter(gestion=gestion)
        }
        gastos_por_area_map = {
            item['memoria__seccion__area_id']: item['total'] or Decimal('0.00')
            for item in Gasto.objects.filter(memoria__gestion=gestion)
            .values('memoria__seccion__area_id')
            .annotate(total=Sum('monto_ejecutado'))
        }

        from apps.organizacional.models import Area
        areas = Area.objects.filter(estado=True)
        user = request.user
        rol_nombre = user.rol.nombre.upper() if user.rol and user.is_authenticated else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        is_gerente = rol_nombre == 'GERENTE'

        if not (is_admin_aprobador or is_gerente) and user.is_authenticated and user.seccion:
            areas = areas.filter(id=user.seccion.area_id)

        por_area = []
        for a in areas:
            m_inicial = presupuestos_map.get(a.id, Decimal('0.00'))
            gastado = gastos_por_area_map.get(a.id, Decimal('0.00'))
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
        # We need to map Gasto -> Memoria -> Detalle -> Partida.
        # But a Gasto belongs to a Memoria, which has many Detalles. Since the user said all items of a memoria belong to the same partida,
        # we can just use the partida of the first detail. But how to do it efficiently?
        # We can join with detalles, but we might multiply the monto_ejecutado if there are multiple detalles.
        # Let's get the mapping Memoria -> Partida by fetching the first detail of each Memoria that has gastos.
        qs_gastos = Gasto.objects.filter(memoria__gestion=gestion)
        if not (is_admin_aprobador or is_gerente) and user.is_authenticated and user.seccion:
            qs_gastos = qs_gastos.filter(memoria__seccion__area_id=user.seccion.area_id)

        # Get total gasto per Memoria
        gastos_por_memoria = qs_gastos.values('memoria_id').annotate(total=Sum('monto_ejecutado'))
        
        # Build mapping Memoria -> Partida Info
        memoria_ids = [m['memoria_id'] for m in gastos_por_memoria]
        from apps.memorias.models import DetallePresupuestoMemoria
        detalles = DetallePresupuestoMemoria.objects.filter(memoria_id__in=memoria_ids).select_related('partida')
        
        memoria_partida_map = {}
        for d in detalles:
            if d.memoria_id not in memoria_partida_map:
                memoria_partida_map[d.memoria_id] = {
                    'codigo': d.partida.codigo,
                    'nombre': d.partida.nombre
                }

        partidas_totales = {}
        for m_gasto in gastos_por_memoria:
            m_id = m_gasto['memoria_id']
            total = m_gasto['total']
            partida_info = memoria_partida_map.get(m_id)
            if partida_info:
                p_code = partida_info['codigo']
                if p_code not in partidas_totales:
                    partidas_totales[p_code] = {
                        'partida_codigo': p_code,
                        'partida_nombre': partida_info['nombre'],
                        'monto_ejecutado': Decimal('0.00')
                    }
                partidas_totales[p_code]['monto_ejecutado'] += total

        # Sort top 10
        por_partida_list = list(partidas_totales.values())
        por_partida_list.sort(key=lambda x: x['monto_ejecutado'], reverse=True)
        por_partida = por_partida_list[:10]
        
        # Convert Decimals to string
        for p in por_partida:
            p['monto_ejecutado'] = str(p['monto_ejecutado'])

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


class CertificacionPOAViewSet(viewsets.ModelViewSet):
    queryset = CertificacionPOA.objects.select_related(
        'gestion',
        'area',
        'partida',
        'memoria',
        'creado_por'
    ).prefetch_related(
        'operaciones__accion_corto_plazo__accion_mediano_plazo__programa',
        'operaciones__area__programa'
    ).all().order_by('-fecha', '-created_at')
    serializer_class = CertificacionPOASerializer
    permission_classes = [permissions.IsAuthenticated]

    def _check_can_edit(self, user):
        rol = user.rol.nombre.upper() if user.rol else ''
        if user.is_superuser:
            return True, 'ADMIN'
        if rol in ['ADMINISTRADOR', 'APROBADOR', 'PLANIFICADOR', 'PLANIFICACIÓN', 'PLANIFICACION']:
            return True, 'PLANIFICADOR'
        if rol == 'GERENTE':
            return True, 'GERENTE'
        return False, 'READONLY'

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        can_edit, user_kind = self._check_can_edit(user)

        # Si no es planificador ni admin, filtrar estrictamente por su área
        if user_kind not in ['ADMIN', 'PLANIFICADOR']:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(area_id=user.seccion.area_id)
            else:
                qs = qs.none()

        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')

        if gestion_id:
            qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(area_id=area_id)
        if estado:
            qs = qs.filter(estado=estado)
        if search:
            qs = qs.filter(
                Q(codigo_certificacion__icontains=search) |
                Q(numero_oficio_solicitud__icontains=search) |
                Q(concepto_gasto__icontains=search) |
                Q(area__nombre__icontains=search) |
                Q(solicitante_nombre__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        can_edit, user_kind = self._check_can_edit(user)
        if not can_edit:
            raise serializers.ValidationError({
                'non_field_errors': ['Los roles Elaborador y Trabajador NO PUEDEN crear certificaciones. Solo Gerente y Planificador tienen permisos.']
            })

        area = serializer.validated_data.get('area')
        if user_kind == 'GERENTE':
            if not (user.seccion and user.seccion.area_id):
                raise serializers.ValidationError({
                    'non_field_errors': ['Tu usuario Gerente no tiene un área asignada en la estructura organizacional. Contacta al administrador.']
                })
            if area and area.id != user.seccion.area_id:
                raise serializers.ValidationError({
                    'non_field_errors': ['Como Gerente, solo puedes crear certificaciones para tu propia área/gerencia.']
                })

        serializer.save(creado_por=user)

    def perform_update(self, serializer):
        user = self.request.user
        can_edit, user_kind = self._check_can_edit(user)
        if not can_edit:
            raise serializers.ValidationError({
                'non_field_errors': ['Los roles Elaborador y Trabajador NO PUEDEN editar certificaciones. Solo Gerente y Planificador tienen permisos.']
            })

        instance = self.get_object()
        if user_kind == 'GERENTE' and user.seccion and instance.area_id != user.seccion.area_id:
            raise serializers.ValidationError({
                'non_field_errors': ['Como Gerente, no puedes editar certificaciones de otra área.']
            })

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        can_edit, user_kind = self._check_can_edit(user)
        if not can_edit:
            raise serializers.ValidationError({
                'non_field_errors': ['Los roles Elaborador y Trabajador NO PUEDEN eliminar certificaciones. Solo Gerente y Planificador tienen permisos.']
            })

        if user_kind == 'GERENTE' and user.seccion and instance.area_id != user.seccion.area_id:
            raise serializers.ValidationError({
                'non_field_errors': ['Como Gerente, no puedes eliminar certificaciones de otra área.']
            })

        instance.delete()

    @action(detail=False, methods=['get'], url_path='siguiente-correlativo')
    def siguiente_correlativo(self, request):
        """Genera el siguiente número correlativo específico para el área y el global de planificación."""
        gestion_id = request.query_params.get('gestion')
        area_id = request.query_params.get('area')

        from apps.presupuestos.models import Gestion
        from apps.organizacional.models import Area

        gestion = Gestion.objects.filter(id=gestion_id).first() if gestion_id else Gestion.objects.first()
        if not gestion:
            return Response({'error': 'Gestión no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        anio = gestion.anio
        anio_2dig = str(anio)[-2:]

        area = Area.objects.filter(id=area_id).first() if area_id else None

        # 1. Correlativo Específico de Gerencia
        if area:
            count_area = CertificacionPOA.objects.filter(gestion=gestion, area=area).count()
            correlativo_area = count_area + 1
            codigo_area_str = area.codigo or area.nombre
            numero_oficio_solicitud = f"{codigo_area_str}.EPTAM. Stría Nº {correlativo_area:03d}/{anio_2dig}"
        else:
            correlativo_area = 1
            numero_oficio_solicitud = f"GCIA.EPTAM. Stría Nº {correlativo_area:03d}/{anio_2dig}"

        # 2. Correlativo Global de Planificación
        count_global = CertificacionPOA.objects.filter(gestion=gestion).count()
        correlativo_global = count_global + 1
        codigo_certificacion = f"UPLANIF.EPTAM.CP. Nº {correlativo_global:03d}/{anio}"

        return Response({
            'gestion_id': gestion.id,
            'gestion_anio': anio,
            'area_id': area.id if area else None,
            'correlativo_area': correlativo_area,
            'numero_oficio_solicitud': numero_oficio_solicitud,
            'correlativo_global': correlativo_global,
            'codigo_certificacion': codigo_certificacion,
        })

    @action(detail=True, methods=['post'], url_path='enviar-planificacion')
    def enviar_planificacion(self, request, pk=None):
        """El Gerente envía la certificación a Planificación para su revisión y aprobación."""
        user = request.user
        can_edit, _ = self._check_can_edit(user)
        if not can_edit:
            return Response({'error': 'No tienes permisos para enviar certificaciones.'}, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        cert.save(update_fields=['estado'])
        return Response({'status': 'Certificación enviada a Planificación exitosamente', 'estado': cert.estado})

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """SOLO Planificación / Administrador puede aprobar formalmente."""
        user = request.user
        can_edit, user_kind = self._check_can_edit(user)
        if user_kind not in ['ADMIN', 'PLANIFICADOR']:
            return Response({
                'error': 'Solo el rol de Planificación o Administrador puede aprobar formalmente la certificación. Como Gerente debes enviarla a Planificación.'
            }, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        cert.estado = CertificacionPOA.EstadoCertificacion.APROBADO
        cert.observacion_planificacion = request.data.get('observacion', '') or cert.observacion_planificacion
        cert.save(update_fields=['estado', 'observacion_planificacion'])
        return Response({'status': 'Certificación aprobada con éxito y devuelta a la gerencia', 'estado': cert.estado})

    @action(detail=True, methods=['post'], url_path='observar')
    def observar(self, request, pk=None):
        """Planificación devuelve la certificación con observaciones a la gerencia."""
        user = request.user
        can_edit, user_kind = self._check_can_edit(user)
        if user_kind not in ['ADMIN', 'PLANIFICADOR']:
            return Response({'error': 'Solo Planificación puede observar la certificación.'}, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        cert.estado = CertificacionPOA.EstadoCertificacion.OBSERVADO
        cert.observacion_planificacion = request.data.get('observacion', 'Requiere corrección de datos')
        cert.save(update_fields=['estado', 'observacion_planificacion'])
        return Response({'status': 'Certificación devuelta con observaciones', 'estado': cert.estado})


