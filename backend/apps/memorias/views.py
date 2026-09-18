from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction

from .models import MemoriaCalculo, DetallePresupuestoMemoria, TraspasoPresupuestario
from .serializers import (
    MemoriaCalculoSerializer,
    MemoriaCalculoListSerializer,
    DetallePresupuestoMemoriaSerializer,
    TraspasoSerializer,
)
from .services import MemoriaCalculoService
from apps.presupuestos.models import Gestion

class RolePermissionMixin:
    def check_role_permission(self, allowed_roles):
        user = self.request.user
        if not user or not user.is_authenticated: return False
        if user.is_superuser: return True
        if not user.rol: return False
        rol = user.rol.nombre.upper()
        rol_clean = rol.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        allowed_clean = [r.upper().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U') for r in allowed_roles]
        if 'APROBADOR' in allowed_clean and rol_clean == 'ADMINISTRADOR': return True
        return rol_clean in allowed_clean or rol in allowed_roles or any(a in rol_clean for a in allowed_clean)

    def check_area_permission(self, memoria):
        user = self.request.user
        if user.is_superuser or self.check_role_permission(['ADMINISTRADOR', 'APROBADOR', 'PLANIFICACION']): 
            return True
        if user.seccion and user.seccion.area_id == memoria.seccion.area_id:
            return True
        return False

class MemoriaCalculoViewSet(RolePermissionMixin, viewsets.ModelViewSet):
    queryset = MemoriaCalculo.objects.select_related('gestion', 'seccion__area', 'operacion').prefetch_related('detalles__partida', 'participaciones__usuario').all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'list':
            return MemoriaCalculoListSerializer
        return MemoriaCalculoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user or not user.is_authenticated:
            return qs.none()
        
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        rol_clean = rol_nombre.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        is_admin_aprobador = user.is_superuser or rol_clean in ['ADMINISTRADOR', 'APROBADOR']
        is_planificador = 'PLANIFIC' in rol_clean
        
        if not (is_admin_aprobador or is_planificador):
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(seccion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        
        # Filtros por query params
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        seccion_id = self.request.query_params.get('seccion')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')
        partida_id = self.request.query_params.get('partida')

        if gestion_id: qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio: qs = qs.filter(gestion__anio=gestion_anio)
        if area_id: qs = qs.filter(seccion__area_id=area_id)
        if seccion_id: qs = qs.filter(seccion_id=seccion_id)
        if estado: qs = qs.filter(estado=estado)
        if partida_id: qs = qs.filter(detalles__partida_id=partida_id).distinct()
        if search:
            qs = qs.filter(
                Q(codigo__icontains=search) |
                Q(justificacion__icontains=search) |
                Q(detalles__descripcion__icontains=search) |
                Q(detalles__partida__codigo__icontains=search) |
                Q(detalles__partida__nombre__icontains=search)
            ).distinct()
        return qs

    def perform_create(self, serializer):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear memorias.']})
        seccion = serializer.validated_data.get('seccion')
        if seccion and not self.check_area_permission(type('obj', (object,), {'seccion': seccion})):
            raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para crear memorias en otra área.']})
        
        MemoriaCalculoService.crear_memoria(serializer.validated_data, self.request.user)

    def perform_update(self, serializer):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR', 'PLANIFICACION']):
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para editar memorias.']})
        if not self.check_area_permission(serializer.instance):
             raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para editar memorias de esta área.']})
             
        MemoriaCalculoService.actualizar_memoria(serializer.instance, serializer.validated_data)

    def perform_destroy(self, instance):
        if not self.check_role_permission(['APROBADOR', 'ELABORADOR']):
            raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para eliminar memorias.']})
        if not self.check_area_permission(instance):
             raise serializers.ValidationError({'non_field_errors': ['No puedes eliminar memorias de otra área.']})
        
        MemoriaCalculoService.eliminar_memoria(instance)

    @action(detail=True, methods=['post'], url_path='enviar-gerencia')
    def enviar_gerencia(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = MemoriaCalculoService.enviar_gerencia(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or '')
        return Response({'message': 'Memoria enviada a revisión de Gerencia.', 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=False, methods=['post'], url_path='enviar-todas-gerencia')
    def enviar_todas_gerencia(self, request):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            return Response({'error': 'No tienes permisos para enviar memorias.'}, status=status.HTTP_403_FORBIDDEN)
        
        qs = self.get_queryset() # Ya filtrado por usuario en get_queryset
        gestion_id = request.data.get('gestion') or request.query_params.get('gestion')
        seccion_id = request.data.get('seccion') or request.query_params.get('seccion')
        
        if gestion_id: qs = qs.filter(gestion_id=gestion_id)
        if seccion_id: qs = qs.filter(seccion_id=seccion_id)
            
        total = MemoriaCalculoService.enviar_todas_gerencia(qs, request.user)
        if total == 0:
            return Response({'message': 'No hay memorias en estado Borrador para enviar.'}, status=status.HTTP_200_OK)
        return Response({'message': f'Se enviaron {total} memorias a revisión de Gerencia exitosamente.', 'total_enviadas': total})

    @action(detail=True, methods=['post'], url_path='aprobar-gerencia')
    def aprobar_gerencia(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        if not self.check_area_permission(self.get_object()):
            return Response({'error': 'No puedes aprobar memorias de otra área.'}, status=status.HTTP_403_FORBIDDEN)

        memoria, msj = MemoriaCalculoService.aprobar_gerencia(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or '')
        return Response({'message': msj, 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=True, methods=['post'], url_path='aprobar-planificacion')
    def aprobar_planificacion(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'PLANIFICACION']):
            return Response({'error': 'Solo personal de Planificación o Aprobadores pueden verificar alineación.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = MemoriaCalculoService.aprobar_planificacion(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or '')
        return Response({'message': 'Memoria verificada y alineada por Planificación. Pasa a Presupuestos.', 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=True, methods=['post'], url_path='aprobar-finanzas')
    def aprobar_finanzas(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR']):
            return Response({'error': 'Solo Aprobadores pueden realizar esta acción.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = MemoriaCalculoService.aprobar_finanzas(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or 'Aprobación Presupuestaria Otorgada')
        return Response({'message': 'Memoria aprobada formalmente por Finanzas / Economía.', 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'PLANIFICACION']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        if not self.check_area_permission(self.get_object()):
             return Response({'error': 'No puedes rechazar memorias de otra área.'}, status=status.HTTP_403_FORBIDDEN)
             
        memoria, nivel = MemoriaCalculoService.rechazar(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or 'Sin motivo especificado')
        return Response({'message': f'Memoria rechazada formalmente en {nivel}.', 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=True, methods=['post'], url_path='volver-borrador')
    def volver_borrador(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR', 'PLANIFICACION']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        if not self.check_area_permission(self.get_object()):
             return Response({'error': 'No tienes permisos sobre esta área.'}, status=status.HTTP_403_FORBIDDEN)
             
        memoria = MemoriaCalculoService.volver_borrador(self.get_object(), request.user, request.data.get('motivo') or request.data.get('nota') or '')
        return Response({'message': 'Memoria devuelta a estado Borrador para correcciones.', 'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data})

    @action(detail=True, methods=['get'], url_path='saldo-disponible')
    def saldo_disponible(self, request, pk=None):
        memoria = self.get_object()
        return Response({
            'monto_asignado': str(memoria.total_presupuestado),
            'monto_ejecutado': str(memoria.total_ejecutado),
            'monto_entrante': str(memoria.monto_entrante),
            'monto_saliente': str(memoria.monto_saliente),
            'disponible': str(memoria.saldo_disponible),
        }, status=status.HTTP_200_OK)


class DetallePresupuestoMemoriaViewSet(viewsets.ModelViewSet):
    queryset = DetallePresupuestoMemoria.objects.select_related('memoria__seccion__area', 'memoria__gestion', 'partida').all()
    serializer_class = DetallePresupuestoMemoriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        memoria_id = self.request.query_params.get('memoria')
        partida_id = self.request.query_params.get('partida')

        if gestion_id: qs = qs.filter(memoria__gestion_id=gestion_id)
        if gestion_anio: qs = qs.filter(memoria__gestion__anio=gestion_anio)
        if area_id: qs = qs.filter(memoria__seccion__area_id=area_id)
        if memoria_id: qs = qs.filter(memoria_id=memoria_id)
        if partida_id: qs = qs.filter(partida_id=partida_id)
        return qs

class TraspasoViewSet(viewsets.ModelViewSet):
    queryset = TraspasoPresupuestario.objects.select_related(
        'memoria_origen__seccion__area',
        'memoria_destino__seccion__area',
        'usuario_registro'
    ).all().order_by('-created_at')
    serializer_class = TraspasoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        memoria_id = self.request.query_params.get('memoria')
        area_id = self.request.query_params.get('area')
        gestion_id = self.request.query_params.get('gestion')
        search = self.request.query_params.get('search')

        if memoria_id: qs = qs.filter(Q(memoria_origen_id=memoria_id) | Q(memoria_destino_id=memoria_id))
        if area_id: qs = qs.filter(Q(memoria_origen__seccion__area_id=area_id) | Q(memoria_destino__seccion__area_id=area_id))
        if gestion_id: qs = qs.filter(memoria_origen__gestion_id=gestion_id)
        if search:
            qs = qs.filter(
                Q(motivo__icontains=search) |
                Q(memoria_origen__codigo__icontains=search) |
                Q(memoria_destino__codigo__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        from .utils import recalcular_saldos_memoria
        with transaction.atomic():
            origen_id = serializer.validated_data['memoria_origen'].id
            destino_id = serializer.validated_data['memoria_destino'].id

            memorias = list(MemoriaCalculo.objects.select_for_update().filter(id__in=[origen_id, destino_id]))
            origen = next((m for m in memorias if m.id == origen_id), None)
            destino = next((m for m in memorias if m.id == destino_id), None)

            if origen:
                monto = serializer.validated_data['monto']
                if origen.saldo_disponible < monto:
                    raise serializers.ValidationError({'monto': [f"Saldo insuficiente en la memoria de origen. Disponible: Bs. {origen.saldo_disponible}."]})

            user = self.request.user if self.request.user and self.request.user.is_authenticated else None
            serializer.save(usuario_registro=user)

            if origen: recalcular_saldos_memoria(origen)
            if destino: recalcular_saldos_memoria(destino)
