from rest_framework import viewsets, permissions
from .models import Programa, Area, Seccion
from .serializers import ProgramaSerializer, AreaSerializer, SeccionSerializer


class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = Programa.objects.all().order_by('codigo')
    serializer_class = ProgramaSerializer
    permission_classes = [permissions.IsAuthenticated]


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.select_related('programa').prefetch_related('secciones').all().order_by('codigo')
    serializer_class = AreaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        programa_id = self.request.query_params.get('programa')
        tipo = self.request.query_params.get('tipo')
        if programa_id:
            qs = qs.filter(programa_id=programa_id)
        if tipo:
            qs = qs.filter(tipo=tipo)
        return qs


class SeccionViewSet(viewsets.ModelViewSet):
    queryset = Seccion.objects.select_related('area').all().order_by('nombre')
    serializer_class = SeccionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        area_id = self.request.query_params.get('area')
        if area_id:
            qs = qs.filter(area_id=area_id)
        return qs
