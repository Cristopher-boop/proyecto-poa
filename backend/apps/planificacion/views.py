from rest_framework import viewsets, permissions, filters
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


class AccionCortoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionCortoPlazo.objects.select_related('accion_mediano_plazo', 'gestion').all()
    serializer_class = AccionCortoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_mediano_plazo', 'gestion', 'estado']
    search_fields = ['codigo', 'descripcion']


class OperacionViewSet(viewsets.ModelViewSet):
    queryset = Operacion.objects.select_related('accion_corto_plazo', 'area').prefetch_related('tareas').all()
    serializer_class = OperacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_corto_plazo', 'area', 'es_contratacion', 'estado']
    search_fields = ['codigo', 'descripcion', 'area__nombre']


class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.select_related('operacion').all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['operacion']
    search_fields = ['codigo', 'descripcion']
