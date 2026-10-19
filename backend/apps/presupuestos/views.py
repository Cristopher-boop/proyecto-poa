from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F, Max
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
    pagination_class = None

    def check_admin_permission(self):
        user = self.request.user
        if user.is_superuser: return True
        rol = user.rol.nombre.upper() if user.rol else ''
        return rol in ['ADMINISTRADOR', 'APROBADOR']

    def perform_create(self, serializer):
        gestion = serializer.save()
        areas_activas = Area.objects.filter(estado=True)
        presupuestos = [
            PresupuestoArea(
                gestion=gestion,
                area=area,
                monto_inicial=Decimal('0.00'),
                monto_actual=Decimal('0.00'),
                estado=PresupuestoArea.EstadoPresupuesto.ABIERTO,
            )
            for area in areas_activas
        ]
        if presupuestos:
            PresupuestoArea.objects.bulk_create(presupuestos)

    @action(detail=False, methods=['get'], url_path='siguiente-anio')
    def siguiente_anio(self, request):
        max_anio = Gestion.objects.aggregate(m=Max('anio'))['m']
        if max_anio:
            siguiente = max_anio + 1
        else:
            siguiente = timezone.now().year + 1

        areas_activas = Area.objects.filter(estado=True).order_by('codigo')
        areas_data = [
            {
                'id': a.id,
                'codigo': a.codigo,
                'nombre': a.nombre,
                'programa_id': getattr(a, 'programa_id', None),
                'programa_codigo': a.programa.codigo if getattr(a, 'programa', None) else None,
                'programa_nombre': a.programa.nombre if getattr(a, 'programa', None) else None,
            }
            for a in areas_activas
        ]

        return Response({
            'siguiente_anio': siguiente,
            'ultimo_anio': max_anio,
            'areas': areas_data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='crear-con-techos')
    def crear_con_techos(self, request):
        if not self.check_admin_permission():
            return Response({'error': 'Solo la Lic. Acha / Administrador de presupuestos puede crear gestiones y fijar techos institucionales.'}, status=status.HTTP_403_FORBIDDEN)

        max_anio = Gestion.objects.aggregate(m=Max('anio'))['m']
        siguiente_esperado = (max_anio + 1) if max_anio else (timezone.now().year + 1)

        anio = request.data.get('anio')
        if not anio:
            anio = siguiente_esperado
        else:
            try:
                anio = int(anio)
            except (ValueError, TypeError):
                return Response({'error': 'Año inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if max_anio and anio != siguiente_esperado:
            return Response({'error': f'El año de la nueva gestión debe ser estrictamente la siguiente ({siguiente_esperado}).'}, status=status.HTTP_400_BAD_REQUEST)

        if Gestion.objects.filter(anio=anio).exists():
            return Response({'error': f'La Gestión {anio} ya existe en el sistema.'}, status=status.HTTP_400_BAD_REQUEST)

        techo_general_raw = request.data.get('techo_general')
        try:
            techo_general = Decimal(str(techo_general_raw or '0.00'))
            if techo_general <= Decimal('0.00'):
                return Response({'error': 'Debe ingresar un Techo Presupuestario General del POA mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'El Techo General debe ser un monto numérico válido.'}, status=status.HTTP_400_BAD_REQUEST)

        distribucion = request.data.get('distribucion', [])
        if not isinstance(distribucion, list) or not distribucion:
            return Response({'error': 'Debe asignar el techo presupuestario para cada una de las gerencias activas.'}, status=status.HTTP_400_BAD_REQUEST)

        areas_activas = list(Area.objects.filter(estado=True))
        areas_activas_ids = {a.id for a in areas_activas}

        dist_dict = {}
        for item in distribucion:
            area_id = item.get('area_id')
            monto_raw = item.get('monto_inicial', 0)
            try:
                monto = Decimal(str(monto_raw or '0.00'))
                if monto < Decimal('0.00'):
                    return Response({'error': f'El monto del área {area_id} no puede ser negativo.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({'error': f'Monto inválido para el área {area_id}.'}, status=status.HTTP_400_BAD_REQUEST)
            if area_id in areas_activas_ids:
                dist_dict[area_id] = monto

        # Validar que obligadamente se asignen todas las áreas activas
        faltantes = areas_activas_ids - set(dist_dict.keys())
        if faltantes:
            areas_faltantes_nombres = [a.nombre for a in areas_activas if a.id in faltantes]
            return Response({
                'error': f'Obligatoriamente debe asignar el techo presupuestario para todas las gerencias. Falta asignar: {", ".join(areas_faltantes_nombres[:5])}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        total_distribuido = sum(dist_dict.values())
        if total_distribuido > techo_general:
            exceso = total_distribuido - techo_general
            return Response({
                'error': f'La suma de techos por gerencias (Bs. {total_distribuido:,.2f}) supera el Techo General del POA (Bs. {techo_general:,.2f}) por Bs. {exceso:,.2f}. Ajuste los montos para no sobrepasar el techo global.'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            gestion = Gestion.objects.create(
                anio=anio,
                estado=Gestion.EstadoGestion.FORMULACION,
                techo_general=techo_general,
            )

            nuevos_presupuestos = [
                PresupuestoArea(
                    gestion=gestion,
                    area=area,
                    monto_inicial=dist_dict[area.id],
                    monto_actual=dist_dict[area.id],
                    estado=PresupuestoArea.EstadoPresupuesto.ABIERTO,
                )
                for area in areas_activas
            ]
            PresupuestoArea.objects.bulk_create(nuevos_presupuestos)

        return Response({
            'message': f'Gestión {gestion.anio} creada exitosamente con Techo General de Bs. {techo_general:,.2f} y techos asignados a {len(nuevos_presupuestos)} gerencias.',
            'gestion': GestionSerializer(gestion).data,
            'total_distribuido': str(total_distribuido),
            'techo_general': str(techo_general),
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='asignar-techos')
    def asignar_techos(self, request, pk=None):
        if not self.check_admin_permission():
            return Response({'error': 'Solo la Lic. Acha / Administrador de presupuestos puede fijar o reasignar techos.'}, status=status.HTTP_403_FORBIDDEN)

        gestion = self.get_object()
        if gestion.estado not in [Gestion.EstadoGestion.FORMULACION, Gestion.EstadoGestion.CERRADO_FORMULACION]:
            return Response({'error': 'Solo se pueden asignar techos en fase de Formulación.'}, status=status.HTTP_400_BAD_REQUEST)

        techo_general_raw = request.data.get('techo_general')
        try:
            techo_general = Decimal(str(techo_general_raw or '0.00'))
            if techo_general <= Decimal('0.00'):
                return Response({'error': 'Debe ingresar un Techo Presupuestario General del POA mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'El Techo General debe ser un monto numérico válido.'}, status=status.HTTP_400_BAD_REQUEST)

        distribucion = request.data.get('distribucion', [])
        if not isinstance(distribucion, list) or not distribucion:
            return Response({'error': 'Debe enviar la distribución de techos por gerencia.'}, status=status.HTTP_400_BAD_REQUEST)

        areas_activas = list(Area.objects.filter(estado=True))
        areas_activas_ids = {a.id for a in areas_activas}

        dist_dict = {}
        for item in distribucion:
            area_id = item.get('area_id')
            monto_raw = item.get('monto_inicial', 0)
            try:
                monto = Decimal(str(monto_raw or '0.00'))
                if monto < Decimal('0.00'):
                    return Response({'error': f'El monto del área {area_id} no puede ser negativo.'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({'error': f'Monto inválido para el área {area_id}.'}, status=status.HTTP_400_BAD_REQUEST)
            if area_id in areas_activas_ids:
                dist_dict[area_id] = monto

        # Validar que obligadamente se asignen todas las áreas activas
        faltantes = areas_activas_ids - set(dist_dict.keys())
        if faltantes:
            areas_faltantes_nombres = [a.nombre for a in areas_activas if a.id in faltantes]
            return Response({
                'error': f'Obligatoriamente debe asignar el techo presupuestario para todas las gerencias. Falta asignar: {", ".join(areas_faltantes_nombres[:5])}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        total_distribuido = sum(dist_dict.values())
        if total_distribuido > techo_general:
            exceso = total_distribuido - techo_general
            return Response({
                'error': f'La suma de techos por gerencias (Bs. {total_distribuido:,.2f}) supera el Techo General del POA (Bs. {techo_general:,.2f}) por Bs. {exceso:,.2f}. Ajuste los montos para no sobrepasar el techo global.'
            }, status=status.HTTP_400_BAD_REQUEST)

        user_name = request.user.get_full_name() or request.user.username
        with transaction.atomic():
            gestion.techo_general = techo_general
            gestion.save(update_fields=['techo_general'])

            for area in areas_activas:
                nuevo_monto = dist_dict[area.id]
                presupuesto, created = PresupuestoArea.objects.get_or_create(
                    gestion=gestion,
                    area=area,
                    defaults={
                        'monto_inicial': nuevo_monto,
                        'monto_actual': nuevo_monto,
                        'estado': PresupuestoArea.EstadoPresupuesto.ABIERTO,
                    }
                )
                if not created:
                    if nuevo_monto < presupuesto.monto_inicial:
                        presupuesto.techo_reducido = True
                        presupuesto.motivo_reduccion = f"Reajuste de Techos POA por {user_name}"
                        presupuesto.fecha_reduccion = timezone.now()
                    presupuesto.monto_inicial = nuevo_monto
                    presupuesto.monto_actual = nuevo_monto
                    presupuesto.save()

        return Response({
            'message': f'Techos de la Gestión {gestion.anio} actualizados exitosamente (Techo General: Bs. {techo_general:,.2f}).',
            'gestion': GestionSerializer(gestion).data,
            'total_distribuido': str(total_distribuido),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cerrar-formulacion')
    def cerrar_formulacion(self, request, pk=None):
        if not self.check_admin_permission():
            return Response({'error': 'No tienes permisos para cerrar la gestión.'}, status=status.HTTP_403_FORBIDDEN)
        """
        Cierra la fase de formulación para la gestión indicada.
        Bloquea nuevas memorias y consolida automáticamente el Presupuesto Inicial de cada Área
        a partir de la sumatoria de sus memorias vigentes (se excluyen las rechazadas).
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
                # Durante la formulación también se muestran las memorias
                # importadas/en borrador. De otro modo, consolidar una gestión
                # recién importada deja todos los presupuestos en Bs 0,00.
                memorias_vigentes = MemoriaCalculo.objects.filter(
                    gestion=gestion,
                    seccion__area=area,
                ).exclude(estado=MemoriaCalculo.EstadoMemoria.RECHAZADO)

                total_monto = memorias_vigentes.aggregate(
                    total=Sum('total_presupuestado')
                )['total'] or Decimal('0.00')

                # Obtener gastos ya ejecutados si los hubiera
                gastos_area = Gasto.objects.filter(
                    memoria__gestion=gestion,
                    memoria__seccion__area=area
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
        if not self.check_admin_permission():
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        gestion = self.get_object()
        gestion.estado = Gestion.EstadoGestion.EN_EJECUCION
        gestion.save()
        return Response({
            'message': f'La Gestión {gestion.anio} ahora se encuentra En Ejecución.',
            'gestion': GestionSerializer(gestion).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reabrir-formulacion')
    def reabrir_formulacion(self, request, pk=None):
        if not self.check_admin_permission():
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
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
        if not self.check_admin_permission():
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        """Recalcula y consolida los montos de PresupuestoArea sin cambiar el estado de la gestión."""
        gestion = self.get_object()
        with transaction.atomic():
            areas = Area.objects.filter(estado=True)
            for area in areas:
                memorias_vigentes = MemoriaCalculo.objects.filter(
                    gestion=gestion,
                    seccion__area=area,
                ).exclude(
                    estado=MemoriaCalculo.EstadoMemoria.RECHAZADO
                )

                total_monto = memorias_vigentes.aggregate(
                    total=Sum('total_presupuestado')
                )['total'] or Decimal('0.00')

                gastos_area = Gasto.objects.filter(
                    memoria__gestion=gestion,
                    memoria__seccion__area=area
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
    pagination_class = None  # El catálogo de partidas se sirve completo, sin paginar

    def check_manage_permission(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        rol = user.rol.nombre.upper() if user.rol else ''
        rol_clean = rol.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        return rol_clean in ['ADMINISTRADOR', 'APROBADOR']

    def create(self, request, *args, **kwargs):
        if not self.check_manage_permission():
            return Response(
                {'detail': 'No tiene permisos para registrar nuevas partidas presupuestarias. Solo Aprobador y Administrador pueden gestionar el clasificador.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(estado=True)

    def update(self, request, *args, **kwargs):
        if not self.check_manage_permission():
            return Response(
                {'detail': 'No tiene permisos para modificar partidas presupuestarias. Solo Aprobador y Administrador pueden gestionar el clasificador.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Desactivación (baja lógica) al recibir DELETE"""
        if not self.check_manage_permission():
            return Response(
                {'detail': 'No tiene permisos para desactivar partidas presupuestarias. Solo Aprobador y Administrador pueden gestionar el clasificador.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        instance.estado = False
        instance.save(update_fields=['estado'])
        return Response(
            {'detail': 'Partida desactivada con éxito.', 'estado': False},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post', 'patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        """Activar o desactivar partida (baja lógica / reactivación)"""
        if not self.check_manage_permission():
            return Response(
                {'detail': 'No tiene permisos para cambiar el estado de partidas presupuestarias. Solo Aprobador y Administrador pueden gestionar el clasificador.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado is None:
            instance.estado = not instance.estado
        else:
            instance.estado = bool(nuevo_estado)
        instance.save(update_fields=['estado'])
        return Response({
            'detail': f'Partida {"activada" if instance.estado else "desactivada"} con éxito.',
            'estado': instance.estado,
            'id': instance.id,
        }, status=status.HTTP_200_OK)

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
            qs = qs.filter(estado=estado.lower() in ('true', '1', 'si', 'activo'))
        return qs


class PresupuestoAreaViewSet(viewsets.ModelViewSet):
    queryset = PresupuestoArea.objects.select_related('gestion', 'area__programa').all().order_by('-gestion__anio', 'area__codigo')
    serializer_class = PresupuestoAreaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')

        if gestion_anio and not gestion_id:
            g = Gestion.objects.filter(anio=gestion_anio).first()
            if g:
                gestion_id = g.id

        if gestion_id:
            gestion = Gestion.objects.filter(id=gestion_id).first()
            if gestion:
                areas_activas = Area.objects.filter(estado=True)
                existentes = set(PresupuestoArea.objects.filter(gestion=gestion).values_list('area_id', flat=True))
                faltantes = [
                    PresupuestoArea(
                        gestion=gestion,
                        area=a,
                        monto_inicial=Decimal('0.00'),
                        monto_actual=Decimal('0.00'),
                        estado=PresupuestoArea.EstadoPresupuesto.ABIERTO,
                    )
                    for a in areas_activas if a.id not in existentes
                ]
                if faltantes:
                    PresupuestoArea.objects.bulk_create(faltantes)
            qs = qs.filter(gestion_id=gestion_id)

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

        areas_activas = Area.objects.filter(estado=True)
        existentes = set(PresupuestoArea.objects.filter(gestion=gestion).values_list('area_id', flat=True))
        faltantes = [
            PresupuestoArea(
                gestion=gestion,
                area=a,
                monto_inicial=Decimal('0.00'),
                monto_actual=Decimal('0.00'),
                estado=PresupuestoArea.EstadoPresupuesto.ABIERTO,
            )
            for a in areas_activas if a.id not in existentes
        ]
        if faltantes:
            PresupuestoArea.objects.bulk_create(faltantes)

        presupuestos = PresupuestoArea.objects.filter(gestion=gestion).select_related('area')
        total_inicial = presupuestos.aggregate(total=Sum('monto_inicial'))['total'] or Decimal('0.00')
        total_disponible = presupuestos.aggregate(total=Sum('monto_actual'))['total'] or Decimal('0.00')

        total_gastos = Gasto.objects.filter(
            memoria__gestion=gestion
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
            memoria__gestion=gestion,
            memoria__seccion__area=area
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
            ).prefetch_related('detalles__partida', 'gastos')

            memorias_data = []
            for memoria in memorias:
                # ── Ítems individuales (DetallePresupuestoMemoria) ──────────────
                items_data = []
                for detalle in memoria.detalles.all():
                    precio_total = detalle.precio_total
                    items_data.append({
                        'detalle_id': detalle.id,
                        'descripcion': detalle.descripcion,
                        'unidad_medida': detalle.unidad_medida,
                        'cantidad': str(detalle.cantidad or Decimal('0')),
                        'precio_unitario': str(detalle.precio_unitario or Decimal('0')),
                        'precio_total': str(precio_total),
                        'total_ejecutado': '0.00',
                        'saldo_sobrante': str(precio_total),
                        'estado_ejecucion': detalle.estado_ejecucion,
                        'partida_codigo': detalle.partida.codigo if detalle.partida else '',
                        'partida_nombre': detalle.partida.nombre if detalle.partida else '',
                        'gastos': [],
                    })

                # ── Traspasos y Modificaciones involucrados en esta memoria ───
                from apps.memorias.models import TraspasoPresupuestario, DetalleModificacion
                traspasos_data = []
                for t in memoria.traspasos_entrada.all():
                    traspasos_data.append({
                        'traspaso_id': t.id,
                        'tipo': 'ENTRADA',
                        'memoria_contraparte_codigo': t.memoria_origen.codigo,
                        'monto': str(t.monto),
                        'motivo': t.motivo,
                        'fecha': str(t.created_at.date()),
                    })
                for t in memoria.traspasos_salida.all():
                    traspasos_data.append({
                        'traspaso_id': t.id,
                        'tipo': 'SALIDA',
                        'memoria_contraparte_codigo': t.memoria_destino.codigo,
                        'monto': str(t.monto),
                        'motivo': t.motivo,
                        'fecha': str(t.created_at.date()),
                    })
                for dm in memoria.detalles_modificacion.select_related('modificacion').all():
                    traspasos_data.append({
                        'traspaso_id': dm.modificacion.id,
                        'tipo': 'ENTRADA' if dm.tipo_movimiento == DetalleModificacion.TipoMovimiento.INCREMENTO else 'SALIDA',
                        'memoria_contraparte_codigo': dm.modificacion.codigo,
                        'monto': str(dm.monto),
                        'motivo': dm.modificacion.motivo,
                        'fecha': str(dm.modificacion.fecha.date() if dm.modificacion.fecha else dm.created_at.date()),
                    })

                # ── Agrupación por partida (mantener compatibilidad existente) ──
                # Asumimos que todos los ítems de la memoria comparten la misma partida
                primer_detalle = memoria.detalles.first()
                if primer_detalle and primer_detalle.partida:
                    codigo = primer_detalle.partida.codigo
                    nombre = primer_detalle.partida.nombre
                else:
                    codigo = 'SIN_PARTIDA'
                    nombre = 'Sin Partida'

                total_pres_mem = sum(d.precio_total for d in memoria.detalles.all())
                
                gastos_detalle = []
                total_gast_mem = Decimal('0.00')
                for gasto in memoria.gastos.all():
                    monto_g = gasto.monto_ejecutado or Decimal('0.00')
                    total_gast_mem += Decimal(str(monto_g))
                    gastos_detalle.append({
                        'gasto_id': gasto.id,
                        'fecha_gasto': str(gasto.fecha_gasto),
                        'monto': str(monto_g),
                        'comprobante': gasto.comprobante_num or '',
                        'observacion': gasto.observacion or '',
                        'item_descripcion': 'Gasto a nivel memoria',
                    })

                monto_entrante = memoria.monto_entrante
                monto_saliente = memoria.monto_saliente
                disponible_real = memoria.saldo_disponible

                p_disponible = (total_pres_mem + monto_entrante - monto_saliente) - total_gast_mem

                partidas_list = [{
                    'partida_codigo': codigo,
                    'partida_nombre': nombre,
                    'presupuestado': str(total_pres_mem),
                    'monto_entrante': str(monto_entrante),
                    'monto_saliente': str(monto_saliente),
                    'gastado': str(total_gast_mem),
                    'disponible': str(p_disponible),
                    'gastos_detalle': gastos_detalle,
                }]

                memorias_data.append({
                    'memoria_id': memoria.id,
                    'memoria_codigo': memoria.codigo,
                    'estado': memoria.estado,
                    'estado_display': memoria.get_estado_display(),
                    'justificacion': memoria.justificacion,
                    'total_presupuestado': str(total_pres_mem),
                    'monto_entrante': str(monto_entrante),
                    'monto_saliente': str(monto_saliente),
                    'total_gastado': str(total_gast_mem),
                    'total_disponible': str(disponible_real),
                    'partidas': partidas_list,
                    'items': items_data,
                    'traspasos': traspasos_data,
                })

            # Totales de la sección
            gastos_seccion = Gasto.objects.filter(
                memoria__gestion=gestion,
                memoria__seccion=seccion,
            ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

            pres_seccion = sum(
                Decimal(m['total_presupuestado']) for m in memorias_data
            )

            disponible_seccion = sum(
                Decimal(m['total_disponible']) for m in memorias_data
            )

            secciones_data.append({
                'seccion_id': seccion.id,
                'seccion_nombre': seccion.nombre,
                'total_presupuestado': str(pres_seccion),
                'total_gastado': str(gastos_seccion),
                'total_disponible': str(disponible_seccion),
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

    @action(detail=True, methods=['post', 'patch'], url_path='ajustar-techo')
    def ajustar_techo(self, request, pk=None):
        user = request.user
        rol = user.rol.nombre.upper() if user.rol else ''
        rol_clean = rol.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        if not (user.is_superuser or rol_clean in ['ADMINISTRADOR', 'APROBADOR']):
            return Response({'error': 'Solo el Aprobador (Lic. Acha) o Administrador pueden fijar o ajustar los techos presupuestarios.'}, status=status.HTTP_403_FORBIDDEN)

        presupuesto = self.get_object()
        nuevo_monto_raw = request.data.get('monto_inicial')
        motivo = request.data.get('motivo_reduccion') or request.data.get('motivo') or ''

        if nuevo_monto_raw is None:
            return Response({'error': 'Debe especificar el nuevo monto inicial (techo).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            nuevo_techo = Decimal(str(nuevo_monto_raw)).quantize(Decimal('0.01'))
            if nuevo_techo < Decimal('0.00'):
                return Response({'error': 'El techo presupuestario no puede ser negativo.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'El monto proporcionado es inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            memorias_vigentes = MemoriaCalculo.objects.filter(
                gestion=presupuesto.gestion,
                seccion__area=presupuesto.area,
            ).exclude(
                estado=MemoriaCalculo.EstadoMemoria.RECHAZADO
            ).exclude(
                excluida_por_techo=True
            )

            total_formulado = memorias_vigentes.aggregate(
                total=Sum('total_presupuestado')
            )['total'] or Decimal('0.00')

            gastos_area = Gasto.objects.filter(
                memoria__gestion=presupuesto.gestion,
                memoria__seccion__area=presupuesto.area
            ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

            monto_disponible = max(Decimal('0.00'), nuevo_techo - gastos_area)

            es_reduccion = nuevo_techo < total_formulado
            presupuesto.monto_inicial = nuevo_techo
            presupuesto.monto_actual = monto_disponible
            presupuesto.techo_reducido = es_reduccion
            presupuesto.motivo_reduccion = motivo if motivo else ("Reducción de techo presupuestario" if es_reduccion else None)
            if es_reduccion:
                presupuesto.fecha_reduccion = timezone.now()
            else:
                presupuesto.fecha_reduccion = None
            presupuesto.save()

            diferencia = nuevo_techo - total_formulado

            if es_reduccion:
                try:
                    from apps.notificaciones.services import crear_notificacion
                    from apps.usuarios.models import Usuario
                    usuarios_area = Usuario.objects.filter(seccion__area=presupuesto.area, is_active=True)
                    deficit = abs(diferencia)
                    for u in usuarios_area:
                        crear_notificacion(
                            usuario_destino=u,
                            usuario_origen=user,
                            titulo=f"⚠️ ALERTA: Techo Reducido ({presupuesto.area.codigo})",
                            mensaje=f"Presupuestos (Lic. Acha) redujo el techo presupuestario a Bs. {nuevo_techo:,.2f}. Su área tiene formulado Bs. {total_formulado:,.2f}. Debe recortar -Bs. {deficit:,.2f} en sus Memorias de Cálculo para acceder al Pase Directo." + (f" Motivo: {motivo}" if motivo else ""),
                            enlace="/memorias"
                        )
                except Exception as notif_err:
                    print("Error notificando reducción de techo:", notif_err)

        return Response({
            'message': f'Techo presupuestario de {presupuesto.area.nombre} actualizado a Bs. {nuevo_techo:,.2f}.' + (' Se activó la Alerta de Ajuste por recorte de techo.' if es_reduccion else ''),
            'presupuesto': PresupuestoAreaSerializer(presupuesto).data,
            'total_formulado': str(total_formulado),
            'diferencia': str(diferencia),
            'techo_reducido': es_reduccion,
        }, status=status.HTTP_200_OK)

