from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Q, F, Prefetch
from decimal import Decimal

from .models import Gasto, CertificacionPOA
from .serializers import GastoSerializer, CertificacionPOASerializer
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria
from apps.presupuestos.models import PresupuestoArea, Gestion
from apps.notificaciones.services import crear_notificacion, notificar_rol
from apps.notificaciones.models import Notificacion
from django.utils import timezone
from .services import GastoService, CertificacionService, recalcular_estado_memoria_y_presupuesto


class GastoViewSet(viewsets.ModelViewSet):
    queryset = Gasto.objects.select_related(
        'memoria__gestion',
        'memoria__seccion__area',
        'usuario_registro'
    ).prefetch_related(
        Prefetch(
            'memoria__detalles',
            queryset=DetallePresupuestoMemoria.objects.select_related('partida')
        )
    ).all().order_by('-fecha_gasto', '-created_at')
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

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

        gasto = GastoService.registrar_gasto(serializer.validated_data, user)
        serializer.instance = gasto

    def perform_update(self, serializer):
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        if not is_admin_aprobador:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede editar ejecuciones presupuestarias.']})

        gasto = GastoService.actualizar_gasto(serializer.instance, serializer.validated_data)
        serializer.instance = gasto

    def perform_destroy(self, instance):
        user = self.request.user
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        if not is_admin_aprobador:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede anular o eliminar ejecuciones presupuestarias.']})

        GastoService.eliminar_gasto(instance)

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
        'creado_por',
        'aprobado_por'
    ).prefetch_related(
        'operaciones__accion_corto_plazo__accion_mediano_plazo__programa',
        'operaciones__area__programa'
    ).all().order_by('-fecha', '-created_at')
    serializer_class = CertificacionPOASerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def _get_user_roles(self, user):
        """Determina los permisos del usuario según su rol institucional delegando al servicio."""
        return CertificacionService.get_user_roles(user)

    @staticmethod
    def _get_diminutivo_area(area):
        return CertificacionService.get_diminutivo_area(area)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        roles = self._get_user_roles(user)

        # Si NO es administrador, planificador, presupuestos ni tesorería: solo puede ver su propia área
        if not (roles['is_admin'] or roles['is_planif'] or roles['is_presupuestos'] or roles.get('is_tesoreria')):
            if roles['area_id']:
                qs = qs.filter(area_id=roles['area_id'])
            else:
                qs = qs.none()

        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        estado = self.request.query_params.get('estado')
        es_contratacion = self.request.query_params.get('es_contratacion')
        search = self.request.query_params.get('search')

        if gestion_id:
            qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(area_id=area_id)
        if estado:
            qs = qs.filter(estado=estado)
        if es_contratacion is not None and es_contratacion != '':
            if es_contratacion.lower() in ['true', '1']:
                qs = qs.filter(es_contratacion=True)
            elif es_contratacion.lower() in ['false', '0']:
                qs = qs.filter(es_contratacion=False)
        if search:
            qs = qs.filter(
                Q(codigo_certificacion__icontains=search) |
                Q(numero_oficio_solicitud__icontains=search) |
                Q(hoja_ruta__icontains=search) |
                Q(concepto_gasto__icontains=search) |
                Q(area__nombre__icontains=search) |
                Q(partida_literal__icontains=search) |
                Q(solicitante_nombre__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        roles = self._get_user_roles(user)

        if not (roles['is_admin'] or roles['is_gerente']):
            raise serializers.ValidationError({
                'non_field_errors': ['Solo el Jefe / Gerente de Área o Administrador puede solicitar certificaciones POA. Elaboradores y Trabajadores tienen acceso de solo lectura.']
            })

        area = serializer.validated_data.get('area')
        if roles['is_gerente'] and not roles['is_admin']:
            if not roles['area_id']:
                raise serializers.ValidationError({
                    'non_field_errors': ['Tu usuario Gerente no tiene un área asignada en la estructura organizacional.']
                })
            if area and area.id != roles['area_id']:
                raise serializers.ValidationError({
                    'non_field_errors': ['Como Gerente, únicamente puedes solicitar certificaciones para tu propia área.']
                })

        # Autocompletar partida y operaciones desde la memoria de cálculo si no vienen explícitas
        memoria = serializer.validated_data.get('memoria')
        extra_fields = {'creado_por': user}

        monto = serializer.validated_data.get('monto_solicitado', Decimal('0.00'))
        if monto > Decimal('2000.00'):
            extra_fields['es_contratacion'] = True

        if memoria:
            if not serializer.validated_data.get('partida'):
                primer_detalle = memoria.detalles.select_related('partida').first()
                if primer_detalle and primer_detalle.partida:
                    extra_fields['partida'] = primer_detalle.partida
                    if not serializer.validated_data.get('partida_literal'):
                        extra_fields['partida_literal'] = primer_detalle.partida.nombre
        else:
            partida = serializer.validated_data.get('partida')
            if partida and not serializer.validated_data.get('partida_literal'):
                extra_fields['partida_literal'] = partida.nombre

        # Solicitante por defecto desde user
        if not serializer.validated_data.get('solicitante_nombre'):
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            extra_fields['solicitante_nombre'] = full_name
        if not serializer.validated_data.get('solicitante_cargo'):
            extra_fields['solicitante_cargo'] = user.cargo or (
                f"GERENTE DE {user.seccion.area.nombre.upper()}"
                if hasattr(user, 'seccion') and user.seccion and user.seccion.area
                else "Encargado de Área"
            )

        instance = serializer.save(**extra_fields)

        # Si no se asignaron operaciones pero la memoria tiene operación, vincularla
        if memoria and memoria.operacion and not instance.operaciones.exists():
            instance.operaciones.add(memoria.operacion)

    def perform_update(self, serializer):
        user = self.request.user
        roles = self._get_user_roles(user)
        instance = self.get_object()

        if not (roles['is_admin'] or roles['is_gerente']):
            raise serializers.ValidationError({
                'non_field_errors': ['No tienes permisos para modificar esta certificación.']
            })

        if roles['is_gerente'] and not roles['is_admin']:
            if instance.area_id != roles['area_id']:
                raise serializers.ValidationError({
                    'non_field_errors': ['Como Gerente, no puedes editar certificaciones de otra área.']
                })
            if instance.estado not in [CertificacionPOA.EstadoCertificacion.BORRADOR, CertificacionPOA.EstadoCertificacion.OBSERVADO]:
                raise serializers.ValidationError({
                    'non_field_errors': ['Solo se pueden editar solicitudes en estado Borrador u Observado.']
                })

        extra_fields = {}
        monto = serializer.validated_data.get('monto_solicitado', instance.monto_solicitado)
        if monto > Decimal('2000.00'):
            extra_fields['es_contratacion'] = True

        serializer.save(**extra_fields)

    def perform_destroy(self, instance):
        user = self.request.user
        roles = self._get_user_roles(user)

        if not (roles['is_admin'] or roles['is_gerente']):
            raise serializers.ValidationError({
                'non_field_errors': ['No tienes permisos para eliminar certificaciones.']
            })

        if roles['is_gerente'] and not roles['is_admin']:
            if instance.area_id != roles['area_id']:
                raise serializers.ValidationError({
                    'non_field_errors': ['Como Gerente, no puedes eliminar certificaciones de otra área.']
                })
            if instance.estado != CertificacionPOA.EstadoCertificacion.BORRADOR:
                raise serializers.ValidationError({
                    'non_field_errors': ['Únicamente puedes eliminar certificaciones que se encuentren en estado Borrador.']
                })

        instance.delete()

    @action(detail=False, methods=['get'], url_path='siguiente-correlativo')
    def siguiente_correlativo(self, request):
        """Genera el siguiente número correlativo específico para el área y el global de planificación."""
        gestion_id = request.query_params.get('gestion')
        area_id = request.query_params.get('area')

        gestion = Gestion.objects.filter(id=gestion_id).first() if gestion_id else Gestion.objects.first()
        from apps.organizacional.models import Area
        area = Area.objects.filter(id=area_id).first() if area_id else None

        data = CertificacionService.obtener_siguiente_correlativo(gestion, area)
        return Response(data)

    @action(detail=True, methods=['post'], url_path='enviar-revision')
    def enviar_revision(self, request, pk=None):
        """El Gerente envía la solicitud a revisión."""
        cert = self.get_object()
        es_contratacion = request.data.get('es_contratacion')
        result = CertificacionService.enviar_revision(cert, request.user, es_contratacion=es_contratacion)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='certificar-planificacion')
    def certificar_planificacion(self, request, pk=None):
        """Planificación revisa la solicitud, alinea partida/operaciones y emite la Certificación POA oficial."""
        cert = self.get_object()
        result = CertificacionService.certificar_planificacion(cert, request.user, request.data)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='aprobar-presupuestos')
    def aprobar_presupuestos(self, request, pk=None):
        """Presupuestos otorga el visto bueno financiero definitivo."""
        cert = self.get_object()
        result = CertificacionService.aprobar_presupuestos(cert, request.user, data=request.data)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='observar')
    def observar(self, request, pk=None):
        """Planificación o Presupuestos devuelve la solicitud con observaciones a la gerencia."""
        cert = self.get_object()
        observacion = request.data.get('observacion', '')
        result = CertificacionService.observar(cert, request.user, observacion=observacion)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """Planificador o Presupuestos rechaza/deniega la solicitud."""
        cert = self.get_object()
        motivo = request.data.get('motivo', '') or request.data.get('observacion', '')
        result = CertificacionService.rechazar(cert, request.user, motivo=motivo)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """El Gerente solicitante cancela / da de baja su solicitud si ya no requiere el gasto."""
        cert = self.get_object()
        motivo = request.data.get('motivo', '')
        result = CertificacionService.cancelar(cert, request.user, motivo=motivo)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='devolver-planificacion')
    def devolver_planificacion(self, request, pk=None):
        """Presupuestos devuelve la solicitud a Planificación para reajuste técnico."""
        cert = self.get_object()
        motivo = request.data.get('motivo', '') or request.data.get('observacion', '')
        result = CertificacionService.devolver_a_planificacion(cert, request.user, motivo=motivo)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='confirmar-desembolso')
    def confirmar_desembolso(self, request, pk=None):
        """Tesorería (Lic. Zaida) confirma la salida de dinero, registrándose automáticamente como gasto."""
        cert = self.get_object()
        comprobante_pago = request.data.get('comprobante_pago', '')
        result = CertificacionService.confirmar_desembolso(cert, request.user, comprobante_pago=comprobante_pago)
        return Response(result)





