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
from .services import GastoService, recalcular_estado_memoria_y_presupuesto


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
        """Determina de manera robusta los permisos del usuario según su rol institucional."""
        if not user or not user.is_authenticated:
            return {'is_admin': False, 'is_planif': False, 'is_presupuestos': False, 'is_gerente': False, 'is_readonly': True, 'area_id': None}

        is_admin = bool(user.is_superuser)
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        rol_clean = rol_nombre.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')

        if 'ADMIN' in rol_clean:
            is_admin = True

        is_planif = is_admin or ('PLANIFIC' in rol_clean)
        is_presupuestos = is_admin or ('APROBAD' in rol_clean) or ('PRESUPUEST' in rol_clean) or ('FINANZ' in rol_clean)
        is_gerente = 'GERENT' in rol_clean
        is_readonly = not (is_admin or is_planif or is_presupuestos or is_gerente)

        area_id = None
        if hasattr(user, 'seccion') and user.seccion:
            area_id = user.seccion.area_id
        elif hasattr(user, 'area') and user.area:
            area_id = user.area.id

        return {
            'is_admin': is_admin,
            'is_planif': is_planif,
            'is_presupuestos': is_presupuestos,
            'is_gerente': is_gerente,
            'is_readonly': is_readonly,
            'area_id': area_id,
        }

    @staticmethod
    def _get_diminutivo_area(area):
        if not area:
            return "OPS"
        codigo = (area.codigo or "").strip().upper()
        nombre = (area.nombre or "").strip().upper()

        if 'OPERACIONES' in nombre or codigo.endswith('-GO'):
            return 'OPS'
        if 'INFORM' in nombre or codigo.endswith('-IF'):
            return 'IF'
        if 'ADMIN' in nombre or codigo.endswith('-GAA'):
            return 'GAA'
        if 'COMERCIAL' in nombre or codigo.endswith('-GC'):
            return 'GC'
        if 'AERONAVE' in nombre or codigo.endswith('-AE'):
            return 'AE'
        if 'SMS' in nombre or codigo.endswith('-SMS'):
            return 'SMS'

        if '-' in codigo:
            tokens = codigo.split('-')
            last = tokens[-1].strip()
            if last and not last.isdigit():
                return last

        clean = (
            nombre.replace('GERENCIA DE ', '')
            .replace('GERENCIA REGIONAL ', '')
            .replace('GERENCIA ', '')
            .replace('UNIDAD DE ', '')
            .replace('UNIDAD ', '')
            .replace('AGENCIA ', '')
            .replace('SUCURSAL ', '')
            .strip()
        )
        return clean[:4] if clean else "OPS"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        roles = self._get_user_roles(user)

        # Si NO es administrador, planificador ni presupuestos: solo puede ver su propia área
        if not (roles['is_admin'] or roles['is_planif'] or roles['is_presupuestos']):
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
        if not gestion:
            return Response({'error': 'Gestión no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        anio = gestion.anio
        anio_2dig = str(anio)[-2:]

        from apps.organizacional.models import Area
        area = Area.objects.filter(id=area_id).first() if area_id else None

        # 1. Correlativo Específico de Gerencia (solo certificaciones emitidas)
        if area:
            count_area = CertificacionPOA.objects.filter(
                gestion=gestion, area=area
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            correlativo_area = count_area + 1
            area_code = self._get_diminutivo_area(area)
            numero_oficio_solicitud = f"GCIA.{area_code}.EPTAM. Stría Nº {correlativo_area}/{anio_2dig}"
        else:
            correlativo_area = 1
            numero_oficio_solicitud = f"GCIA.OPS.EPTAM. Stría Nº {correlativo_area}/{anio_2dig}"

        # 2. Correlativo Global de Planificación (solo certificaciones emitidas)
        count_global = CertificacionPOA.objects.filter(
            gestion=gestion
        ).exclude(codigo_certificacion="").exclude(estado__in=[
            CertificacionPOA.EstadoCertificacion.BORRADOR,
            CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
            CertificacionPOA.EstadoCertificacion.ANULADO
        ]).count()
        correlativo_global = count_global + 1
        codigo_certificacion = f"UPLANIF.EPTAM.CP. Nº {correlativo_global}/{anio}"

        return Response({
            'gestion_id': gestion.id,
            'gestion_anio': anio,
            'area_id': area.id if area else None,
            'correlativo_area': correlativo_area,
            'numero_oficio_solicitud': numero_oficio_solicitud,
            'correlativo_global': correlativo_global,
            'codigo_certificacion': codigo_certificacion,
        })

    @action(detail=True, methods=['post'], url_path='enviar-revision')
    def enviar_revision(self, request, pk=None):
        """
        El Gerente envía la solicitud a revisión:
        - Si pertenece a Contrataciones -> pasa a Planificación (PENDIENTE_PLANIFICACION)
        - Si NO pertenece a Contrataciones -> pasa directo a Presupuestos (PENDIENTE_PRESUPUESTOS)
        - Si el monto es mayor a 2000 Bs -> automáticamente es Contrataciones sin preguntar
        """
        user = request.user
        roles = self._get_user_roles(user)
        cert = self.get_object()

        if not (roles['is_admin'] or roles['is_gerente']):
            return Response({'error': 'No tienes permisos para enviar solicitudes.'}, status=status.HTTP_403_FORBIDDEN)

        if roles['is_gerente'] and not roles['is_admin'] and cert.area_id != roles['area_id']:
            return Response({'error': 'No puedes enviar solicitudes pertenecientes a otra área.'}, status=status.HTTP_403_FORBIDDEN)

        if cert.estado not in [CertificacionPOA.EstadoCertificacion.BORRADOR, CertificacionPOA.EstadoCertificacion.OBSERVADO]:
            return Response({'error': 'Solo se pueden enviar solicitudes en estado Borrador u Observado.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cert.hoja_ruta or not str(cert.hoja_ruta).strip():
            return Response({'error': 'La Hoja de Ruta / CITE / Razón de la solicitud es OBLIGATORIA antes de enviar.'}, status=status.HTTP_400_BAD_REQUEST)

        if cert.monto_solicitado <= Decimal('0.00'):
            return Response({'error': 'El monto solicitado debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        if cert.memoria:
            saldo_disp = Decimal(str(cert.memoria.saldo_disponible or '0.00'))
            if cert.monto_solicitado > saldo_disp:
                return Response({
                    'error': f'El monto solicitado (Bs. {cert.monto_solicitado:,.2f}) supera el saldo disponible de la memoria de cálculo (Bs. {saldo_disp:,.2f}).'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Determinar si es Contrataciones:
        # Si el monto supera Bs. 2000, automáticamente es Contratación POA
        if cert.monto_solicitado > Decimal('2000.00'):
            cert.es_contratacion = True
        elif 'es_contratacion' in request.data:
            val = request.data.get('es_contratacion')
            if isinstance(val, str):
                cert.es_contratacion = val.strip().lower() in ['true', '1']
            else:
                cert.es_contratacion = bool(val)

        if cert.es_contratacion:
            cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
            cert.save(update_fields=['estado', 'es_contratacion'])
            notificar_rol(
                'PLANIFICADOR',
                f"Nueva Solicitud de Contratación POA ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha remitido la solicitud de Contratación con Hoja de Ruta {cert.hoja_ruta} para revisión técnica y certificación POA.",
                tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            return Response({
                'status': 'Solicitud de contratación enviada a Planificación para revisión técnica y certificación POA exitosamente.',
                'estado': cert.estado,
                'es_contratacion': cert.es_contratacion
            })
        else:
            cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS
            cert.save(update_fields=['estado', 'es_contratacion'])
            notificar_rol(
                'APROBADOR',
                f"Nueva Solicitud de Gasto Menor ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha remitido la solicitud de gasto menor (Hoja de Ruta {cert.hoja_ruta}) directamente para visto bueno presupuestario.",
                tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            return Response({
                'status': 'Solicitud enviada directamente a Presupuestos para visto bueno financiero exitosamente.',
                'estado': cert.estado,
                'es_contratacion': cert.es_contratacion
            })

    @action(detail=True, methods=['post'], url_path='certificar-planificacion')
    def certificar_planificacion(self, request, pk=None):
        """
        Planificación revisa la solicitud (alineación de operaciones ACP y fondos en partida)
        y emite la Certificación POA oficial con sus 2 códigos correlativos:
        1. Código Propio de Certificación (Global): ej. UPLANIF.EPTAM.CP. Nº 001/2026
        2. Número de Oficio según Gerencia: ej. GCIA.INF.EPTAM. Stría Nº 001/26
        Notifica a la Gerencia solicitante para que recoja el certificado y remite a Presupuestos.
        """
        user = request.user
        roles = self._get_user_roles(user)
        if not roles['is_planif']:
            return Response({'error': 'Solo el rol de Planificación o Administrador puede emitir la Certificación POA.'}, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION:
            return Response({'error': 'La certificación no se encuentra en revisión de Planificación.'}, status=status.HTTP_400_BAD_REQUEST)

        codigo_certificacion = request.data.get('codigo_certificacion', '').strip()
        numero_oficio = request.data.get('numero_oficio_solicitud', '').strip()
        observacion = request.data.get('observacion', '').strip()
        categoria_prog_cod = request.data.get('categoria_programatica_codigo', '').strip()
        categoria_prog = request.data.get('categoria_programatica', '').strip()
        notas = request.data.get('notas', '').strip()

        # 1. Asignar/Confirmar Código Oficial Global de Certificación POA
        if codigo_certificacion:
            cert.codigo_certificacion = codigo_certificacion
        elif not cert.codigo_certificacion:
            anio = cert.gestion.anio
            count_global = CertificacionPOA.objects.filter(
                gestion=cert.gestion
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            cert.codigo_certificacion = f"UPLANIF.EPTAM.CP. Nº {count_global + 1}/{anio}"

        # 2. Asignar/Confirmar Número de Oficio Correlativo según Gerencia
        if numero_oficio:
            cert.numero_oficio_solicitud = numero_oficio
        elif not cert.numero_oficio_solicitud:
            anio = cert.gestion.anio
            anio_2dig = str(anio)[-2:]
            count_area = CertificacionPOA.objects.filter(
                gestion=cert.gestion, area=cert.area
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            area_code = self._get_diminutivo_area(cert.area)
            cert.numero_oficio_solicitud = f"GCIA.{area_code}.EPTAM. Stría Nº {count_area + 1}/{anio_2dig}"

        if observacion:
            cert.observacion_planificacion = observacion
        if categoria_prog_cod:
            cert.categoria_programatica_codigo = categoria_prog_cod
        if categoria_prog:
            cert.categoria_programatica = categoria_prog
        if notas:
            cert.notas = notas

        # Validar disponibilidad si hay memoria vinculada
        if cert.memoria:
            saldo_disp = Decimal(str(cert.memoria.saldo_disponible or '0.00'))
            if cert.monto_solicitado > saldo_disp:
                return Response({
                    'error': f'No hay saldo suficiente en la Memoria de Cálculo ({cert.memoria.codigo}). Solicitado: Bs. {cert.monto_solicitado:,.2f}, Disponible: Bs. {saldo_disp:,.2f}.'
                }, status=status.HTTP_400_BAD_REQUEST)

        cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS
        cert.save(update_fields=[
            'estado',
            'codigo_certificacion',
            'numero_oficio_solicitud',
            'observacion_planificacion',
            'categoria_programatica_codigo',
            'categoria_programatica',
            'notas'
        ])

        # Notificar a la Gerencia Solicitante para que recoja el certificado emitido
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Certificación POA Emitida - Lista para recojo ({cert.codigo_certificacion})",
                f"Planificación ha emitido la certificación POA de tu solicitud (Hoja de Ruta {cert.hoja_ruta}). Puedes pasar a recoger el certificado; la solicitud fue remitida a Presupuestos para el visto bueno financiero.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Notificar a Presupuestos para el double check financiero
        notificar_rol(
            'APROBADOR',
            f"Certificación POA para Visto Bueno Financiero ({cert.codigo_certificacion})",
            f"Planificación ha certificado la solicitud de {cert.area.nombre} (Hoja de Ruta {cert.hoja_ruta}). Pendiente verificación y visto bueno presupuestario.",
            tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        return Response({
            'status': 'Certificación POA emitida exitosamente. Se notificó a la gerencia para recojo y se remitió a Presupuestos.',
            'estado': cert.estado,
            'codigo_certificacion': cert.codigo_certificacion,
            'numero_oficio_solicitud': cert.numero_oficio_solicitud
        })

    @action(detail=True, methods=['post'], url_path='aprobar-presupuestos')
    def aprobar_presupuestos(self, request, pk=None):
        """
        Presupuestos otorga el visto bueno financiero definitivo ("el okey en cuestión de plata"):
        - Pasa a APROBADO
        - Registra aprobado_por y fecha_aprobacion
        """
        user = request.user
        roles = self._get_user_roles(user)
        if not roles['is_presupuestos']:
            return Response({'error': 'Solo el rol de Presupuestos / Aprobador o Administrador puede otorgar el visto bueno financiero.'}, status=status.HTTP_403_FORBIDDEN)

        cert = self.get_object()
        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS:
            return Response({'error': 'La certificación no se encuentra pendiente de visto bueno en Presupuestos.'}, status=status.HTTP_400_BAD_REQUEST)

        observacion = request.data.get('observacion', '').strip()
        if observacion:
            cert.observacion_presupuestos = observacion

        cert.estado = CertificacionPOA.EstadoCertificacion.APROBADO
        cert.aprobado_por = user
        cert.fecha_aprobacion = timezone.now()
        cert.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'observacion_presupuestos'])

        # Notificar al solicitante / creador
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Certificación Aprobada y Concluida",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha recibido el visto bueno financiero y aprobación final.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Si era de contrataciones, notificar a Planificación del cierre exitoso
        if cert.es_contratacion:
            notificar_rol(
                'PLANIFICADOR',
                f"Certificación Aprobada por Presupuestos ({cert.codigo_certificacion or cert.hoja_ruta})",
                f"Presupuestos ha aprobado formalmente la certificación del área {cert.area.nombre}.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return Response({
            'status': 'Visto bueno presupuestario otorgado y certificación aprobada formalmente.',
            'estado': cert.estado
        })

    @action(detail=True, methods=['post'], url_path='observar')
    def observar(self, request, pk=None):
        """
        Planificación o Presupuestos devuelve la solicitud con observaciones a la gerencia:
        - Requiere motivo obligatorio
        - Pasa a OBSERVADO
        """
        user = request.user
        roles = self._get_user_roles(user)
        cert = self.get_object()

        can_observe = False
        is_planif_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        is_presup_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS

        if roles['is_admin']:
            can_observe = True
        elif is_planif_phase and roles['is_planif']:
            can_observe = True
        elif is_presup_phase and roles['is_presupuestos']:
            can_observe = True

        if not can_observe:
            return Response({'error': 'No tienes permisos para observar esta certificación en su estado actual.'}, status=status.HTTP_403_FORBIDDEN)

        observacion = request.data.get('observacion', '').strip()
        if not observacion:
            return Response({'error': 'El motivo de la observación es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_planif_phase:
            cert.observacion_planificacion = observacion
            update_fields = ['estado', 'observacion_planificacion']
        else:
            cert.observacion_presupuestos = observacion
            update_fields = ['estado', 'observacion_presupuestos']

        cert.estado = CertificacionPOA.EstadoCertificacion.OBSERVADO
        cert.save(update_fields=update_fields)

        # Notificar al creador/gerente
        if cert.creado_por:
            origen_str = "Planificación" if is_planif_phase else "Presupuestos"
            crear_notificacion(
                cert.creado_por,
                f"Certificación Observada por {origen_str} ({cert.hoja_ruta})",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha sido observada: {observacion}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return Response({
            'status': 'Certificación devuelta con observaciones a la gerencia solicitante.',
            'estado': cert.estado
        })

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """
        Planificador o Presupuestos rechaza/deniega la solicitud por errores insubsanables o falta de fondos:
        - Planificador en PENDIENTE_PLANIFICACION
        - Presupuestos en PENDIENTE_PRESUPUESTOS
        - Requiere motivo obligatorio
        - Pasa a RECHAZADO
        - Notifica a la gerencia solicitante y a la otra unidad
        """
        user = request.user
        roles = self._get_user_roles(user)
        cert = self.get_object()

        can_reject = False
        is_planif_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        is_presup_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS

        if roles['is_admin']:
            can_reject = True
        elif is_planif_phase and roles['is_planif']:
            can_reject = True
        elif is_presup_phase and roles['is_presupuestos']:
            can_reject = True

        if not can_reject:
            return Response({'error': 'No tienes permisos para rechazar esta certificación en su estado actual.'}, status=status.HTTP_403_FORBIDDEN)

        motivo = request.data.get('motivo', '').strip() or request.data.get('observacion', '').strip()
        if not motivo:
            return Response({'error': 'El motivo del rechazo es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_planif_phase:
            cert.observacion_planificacion = f"[RECHAZADO POR PLANIFICACIÓN]: {motivo}"
            update_fields = ['estado', 'observacion_planificacion']
        else:
            cert.observacion_presupuestos = f"[RECHAZADO POR PRESUPUESTOS]: {motivo}"
            update_fields = ['estado', 'observacion_presupuestos']

        cert.estado = CertificacionPOA.EstadoCertificacion.RECHAZADO
        cert.save(update_fields=update_fields)

        origen_str = "Planificación" if is_planif_phase else "Presupuestos"

        # Notificar a la gerencia solicitante
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Solicitud Rechazada por {origen_str} ({cert.hoja_ruta})",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha sido rechazada por {origen_str}. Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Notificar entre Planificación y Presupuestos
        if is_planif_phase:
            notificar_rol(
                'APROBADOR',
                f"Solicitud Rechazada en Planificación ({cert.hoja_ruta})",
                f"Planificación ha rechazado la solicitud del área {cert.area.nombre} (Hoja de Ruta {cert.hoja_ruta}). Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )
        else:
            notificar_rol(
                'PLANIFICADOR',
                f"Certificación Denegada en Presupuestos ({cert.codigo_certificacion or cert.hoja_ruta})",
                f"Presupuestos ha denegado la certificación del área {cert.area.nombre}. Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return Response({
            'status': f'Solicitud rechazada formalmente por {origen_str}. Se enviaron las notificaciones correspondientes.',
            'estado': cert.estado
        })

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """
        El Gerente solicitante cancela / da de baja su solicitud si ya no requiere el gasto.
        """
        user = request.user
        roles = self._get_user_roles(user)
        cert = self.get_object()

        if not (roles['is_admin'] or roles['is_gerente']):
            return Response({'error': 'Solo el Gerente solicitante o Administrador puede cancelar la solicitud.'}, status=status.HTTP_403_FORBIDDEN)

        if roles['is_gerente'] and not roles['is_admin'] and cert.area_id != roles['area_id']:
            return Response({'error': 'No puedes cancelar solicitudes pertenecientes a otra área.'}, status=status.HTTP_403_FORBIDDEN)

        if cert.estado in [CertificacionPOA.EstadoCertificacion.APROBADO, CertificacionPOA.EstadoCertificacion.ANULADO]:
            return Response({'error': 'No se puede cancelar una certificación ya aprobada o concluida.'}, status=status.HTTP_400_BAD_REQUEST)

        motivo = request.data.get('motivo', '').strip()
        estado_anterior = cert.estado
        cert.estado = CertificacionPOA.EstadoCertificacion.ANULADO
        if motivo:
            cert.notas = f"{cert.notas}\n[CANCELADA POR EL ÁREA]: {motivo}"
        cert.save(update_fields=['estado', 'notas'])

        # Notificar si estaba en revisión de Planificación o Presupuestos
        if estado_anterior in [CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION, CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS]:
            notificar_rol(
                'PLANIFICADOR',
                f"Solicitud Cancelada por Gerencia ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha cancelado su solicitud con Hoja de Ruta {cert.hoja_ruta}.",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            notificar_rol(
                'APROBADOR',
                f"Solicitud Cancelada por Gerencia ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha cancelado su solicitud con Hoja de Ruta {cert.hoja_ruta}.",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return Response({
            'status': 'Solicitud cancelada por el área solicitante.',
            'estado': cert.estado
        })



