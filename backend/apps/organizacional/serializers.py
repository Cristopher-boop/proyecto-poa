from rest_framework import serializers
from .models import Programa, Area, Seccion


class SeccionSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)

    class Meta:
        model = Seccion
        fields = ['id', 'area', 'area_nombre', 'area_codigo', 'nombre', 'descripcion', 'estado', 'created_at']


class AreaSerializer(serializers.ModelSerializer):
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    secciones = SeccionSerializer(many=True, read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Area
        fields = ['id', 'programa', 'programa_nombre', 'codigo', 'nombre', 'tipo', 'tipo_display', 'descripcion', 'estado', 'secciones', 'created_at']


class ProgramaSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)

    class Meta:
        model = Programa
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'estado', 'areas', 'created_at']
