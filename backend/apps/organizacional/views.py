from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Programa, Area, Seccion, Rol
from .serializers import (
    ProgramaSerializer, AreaSerializer, SeccionSerializer, 
    RolSerializer
)


class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer

    @action(detail=True, methods=['get'])
    def areas(self, request, pk=None):
        programa = self.get_object()
        areas = programa.areas.filter(estado=True)
        serializer = AreaSerializer(areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def secciones(self, request, pk=None):
        programa = self.get_object()
        secciones = Seccion.objects.filter(area__programa=programa, estado=True)
        serializer = SeccionSerializer(secciones, many=True)
        return Response(serializer.data)


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer

    @action(detail=True, methods=['get'])
    def secciones(self, request, pk=None):
        area = self.get_object()
        secciones = area.secciones.filter(estado=True)
        serializer = SeccionSerializer(secciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_programa(self, request):
        programa_id = request.query_params.get('programa_id')
        if programa_id:
            areas = self.queryset.filter(programa_id=programa_id, estado=True)
            serializer = self.get_serializer(areas, many=True)
            return Response(serializer.data)
        return Response(
            {'error': 'Se requiere programa_id'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class SeccionViewSet(viewsets.ModelViewSet):
    queryset = Seccion.objects.all()
    serializer_class = SeccionSerializer

    @action(detail=False, methods=['get'])
    def por_area(self, request):
        area_id = request.query_params.get('area_id')
        if area_id:
            secciones = self.queryset.filter(area_id=area_id, estado=True)
            serializer = self.get_serializer(secciones, many=True)
            return Response(serializer.data)
        return Response(
            {'error': 'Se requiere area_id'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer