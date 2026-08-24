from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea
from .serializers import (
    AccionMedianoPlazoSerializer,
    AccionCortoPlazoSerializer,
    OperacionSerializer,
    TareaSerializer
)

class AccionMedianoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionMedianoPlazo.objects.select_related('programa').all()
    serializer_class = AccionMedianoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['programa', 'estado']
    search_fields = ['codigo', 'descripcion', 'programa__nombre']

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        amp = self.get_object()
        amp.estado = not amp.estado
        amp.save(update_fields=['estado'])
        return Response({'status': f'AMP {"activada" if amp.estado else "desactivada (baja lógica)"}', 'estado': amp.estado})

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=['estado'])


class AccionCortoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionCortoPlazo.objects.select_related('accion_mediano_plazo', 'gestion').all()
    serializer_class = AccionCortoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_mediano_plazo', 'gestion', 'estado']
    search_fields = ['codigo', 'descripcion']

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        acp = self.get_object()
        acp.estado = not acp.estado
        acp.save(update_fields=['estado'])
        return Response({'status': f'ACP {"activada" if acp.estado else "desactivada (baja lógica)"}', 'estado': acp.estado})

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=['estado'])


class OperacionViewSet(viewsets.ModelViewSet):
    queryset = Operacion.objects.select_related('accion_corto_plazo', 'area').prefetch_related('tareas').all()
    serializer_class = OperacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_corto_plazo', 'area', 'es_contratacion', 'estado']
    search_fields = ['codigo', 'descripcion', 'area__nombre']

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        op = self.get_object()
        op.estado = not op.estado
        op.save(update_fields=['estado'])
        return Response({'status': f'Operación {"activada" if op.estado else "desactivada (baja lógica)"}', 'estado': op.estado})

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=['estado'])


class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.select_related('operacion').all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['operacion', 'estado']
    search_fields = ['codigo', 'descripcion']

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        tarea = self.get_object()
        tarea.estado = not tarea.estado
        tarea.save(update_fields=['estado'])
        return Response({'status': f'Tarea {"activada" if tarea.estado else "desactivada (baja lógica)"}', 'estado': tarea.estado})

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=['estado'])
