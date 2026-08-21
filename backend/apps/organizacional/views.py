from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Programa, Area, Seccion
from .serializers import ProgramaSerializer, AreaSerializer, SeccionSerializer


class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = (
        Programa.objects.all()
        .prefetch_related('areas__secciones')
        .order_by('codigo')
    )
    serializer_class = ProgramaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'areas', 'secciones']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def areas(self, request, pk=None):
        programa = self.get_object()
        areas = programa.areas.filter(estado=True).order_by('codigo')
        return Response(AreaSerializer(areas, many=True).data)

    @action(detail=True, methods=['get'])
    def secciones(self, request, pk=None):
        programa = self.get_object()
        secciones = (
            Seccion.objects
            .filter(area__programa=programa, estado=True)
            .select_related('area')
            .order_by('nombre')
        )
        return Response(SeccionSerializer(secciones, many=True).data)


class AreaViewSet(viewsets.ModelViewSet):
    queryset = (
        Area.objects
        .select_related('programa')
        .prefetch_related('secciones')
        .all()
        .order_by('codigo')
    )
    serializer_class = AreaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = False
        instance.save(update_fields=['estado'])
        return Response(
            {'detail': 'Registro dado de baja lógicamente.', 'estado': False},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post', 'patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        instance = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado is None:
            instance.estado = not instance.estado
        else:
            instance.estado = bool(nuevo_estado)
        instance.save(update_fields=['estado'])
        return Response({
            'detail': f'Área {"activada" if instance.estado else "desactivada"} con éxito.',
            'estado': instance.estado,
            'id': instance.id,
        }, status=status.HTTP_200_OK)

    def get_queryset(self):
        qs = super().get_queryset()
        programa_id = self.request.query_params.get('programa')
        if not programa_id:
            programa_id = self.request.query_params.get('programa_id')
        tipo = self.request.query_params.get('tipo')
        estado = self.request.query_params.get('estado')

        if programa_id:
            qs = qs.filter(programa_id=programa_id)
        if tipo:
            qs = qs.filter(tipo=tipo)
        if estado is not None:
            qs = qs.filter(estado=estado.lower() in ('true', '1', 'si', 'activo'))

        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'por_programa', 'secciones']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def secciones(self, request, pk=None):
        area = self.get_object()
        secciones = area.secciones.filter(estado=True).order_by('nombre')
        return Response(SeccionSerializer(secciones, many=True).data)

    @action(detail=False, methods=['get'])
    def por_programa(self, request):
        programa_id = request.query_params.get('programa_id') or request.query_params.get('programa')
        if not programa_id:
            return Response(
                {'error': 'Se requiere programa_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        areas = self.get_queryset().filter(programa_id=programa_id, estado=True)
        return Response(self.get_serializer(areas, many=True).data)


class SeccionViewSet(viewsets.ModelViewSet):
    queryset = (
        Seccion.objects
        .select_related('area', 'area__programa')
        .all()
        .order_by('nombre')
    )
    serializer_class = SeccionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = False
        instance.save(update_fields=['estado'])
        return Response(
            {'detail': 'Registro dado de baja lógicamente.', 'estado': False},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post', 'patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        instance = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado is None:
            instance.estado = not instance.estado
        else:
            instance.estado = bool(nuevo_estado)
        instance.save(update_fields=['estado'])
        return Response({
            'detail': f'Sección {"activada" if instance.estado else "desactivada"} con éxito.',
            'estado': instance.estado,
            'id': instance.id,
        }, status=status.HTTP_200_OK)

    def get_queryset(self):
        qs = super().get_queryset()
        area_id = self.request.query_params.get('area')
        if not area_id:
            area_id = self.request.query_params.get('area_id')
        estado = self.request.query_params.get('estado')

        if area_id:
            qs = qs.filter(area_id=area_id)
        if estado is not None:
            qs = qs.filter(estado=estado.lower() in ('true', '1', 'si', 'activo'))

        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'por_area']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def por_area(self, request):
        area_id = request.query_params.get('area_id') or request.query_params.get('area')
        if not area_id:
            return Response(
                {'error': 'Se requiere area_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secciones = self.get_queryset().filter(area_id=area_id, estado=True)
        return Response(self.get_serializer(secciones, many=True).data)
