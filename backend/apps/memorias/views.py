from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal

from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria
from .serializers import (
    MemoriaCalculoSerializer,
    DetallePresupuestoMemoriaSerializer,
    RegistroMemoriaUsuarioSerializer
)
from apps.presupuestos.models import Gestion


class MemoriaCalculoViewSet(viewsets.ModelViewSet):
    queryset = MemoriaCalculo.objects.select_related('gestion', 'seccion__area').prefetch_related('detalles__partida', 'participaciones__usuario').all().order_by('-created_at')
    serializer_class = MemoriaCalculoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        seccion_id = self.request.query_params.get('seccion')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')
        partida_id = self.request.query_params.get('partida')

        if gestion_id:
            qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(seccion__area_id=area_id)
        if seccion_id:
            qs = qs.filter(seccion_id=seccion_id)
        if estado:
            qs = qs.filter(estado=estado)
        if partida_id:
            qs = qs.filter(detalles__partida_id=partida_id).distinct()
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
        gestion = serializer.validated_data.get('gestion')
        if gestion and gestion.estado != Gestion.EstadoGestion.FORMULACION:
            raise serializers.ValidationError({
                'non_field_errors': [f'No se pueden crear memorias en la Gestión {gestion.anio} porque la formulación está {gestion.get_estado_display().lower()}.']
            })
        serializer.save()

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.gestion.estado != Gestion.EstadoGestion.FORMULACION and 'estado' not in serializer.validated_data:
            raise serializers.ValidationError({
                'non_field_errors': [f'No se puede editar la memoria de la Gestión {instance.gestion.anio} porque la formulación está {instance.gestion.get_estado_display().lower()}.']
            })
        serializer.save()

    @action(detail=True, methods=['post'], url_path='enviar-gerencia')
    def enviar_gerencia(self, request, pk=None):
        memoria = self.get_object()
        if memoria.gestion.estado != Gestion.EstadoGestion.FORMULACION:
            return Response({'error': 'La formulación de esta gestión está cerrada.'}, status=status.HTTP_400_BAD_REQUEST)
        
        memoria.estado = MemoriaCalculo.EstadoMemoria.PENDIENTE_GERENCIA
        memoria.save()
        return Response({
            'message': 'Memoria enviada a revisión de Gerencia.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='aprobar-gerencia')
    def aprobar_gerencia(self, request, pk=None):
        memoria = self.get_object()
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA
        memoria.save()

        # Registrar revisor
        if request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.REVISOR
            )

        return Response({
            'message': 'Memoria aprobada por la Gerencia de Área.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='aprobar-finanzas')
    def aprobar_finanzas(self, request, pk=None):
        memoria = self.get_object()
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS
        memoria.fecha_aprobacion = timezone.now()
        memoria.save()

        # Registrar aprobador
        if request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.APROBADOR
            )

        return Response({
            'message': 'Memoria aprobada formalmente por Finanzas / Economía.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        memoria = self.get_object()
        motivo = request.data.get('motivo', '')
        memoria.estado = MemoriaCalculo.EstadoMemoria.RECHAZADO
        memoria.save()
        return Response({
            'message': 'Memoria rechazada.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='volver-borrador')
    def volver_borrador(self, request, pk=None):
        memoria = self.get_object()
        memoria.estado = MemoriaCalculo.EstadoMemoria.BORRADOR
        memoria.save()
        return Response({
            'message': 'Memoria devuelta a estado Borrador para correcciones.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })


class DetallePresupuestoMemoriaViewSet(viewsets.ModelViewSet):
    queryset = DetallePresupuestoMemoria.objects.select_related('memoria', 'partida').all()
    serializer_class = DetallePresupuestoMemoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        memoria_id = self.request.query_params.get('memoria')
        partida_id = self.request.query_params.get('partida')
        if memoria_id:
            qs = qs.filter(memoria_id=memoria_id)
        if partida_id:
            qs = qs.filter(partida_id=partida_id)
        return qs
