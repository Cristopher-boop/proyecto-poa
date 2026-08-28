from rest_framework import serializers
from .models import Programa, Area, Seccion


class SeccionSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)
    area_tipo = serializers.CharField(source='area.tipo', read_only=True)

    class Meta:
        model = Seccion
        fields = [
            'id', 'area', 'area_nombre', 'area_codigo', 'area_tipo',
            'nombre', 'descripcion', 'estado', 'created_at', 'updated_at'
        ]


class AreaSerializer(serializers.ModelSerializer):
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    programa_codigo = serializers.CharField(source='programa.codigo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    secciones_count = serializers.SerializerMethodField()
    secciones = SeccionSerializer(many=True, read_only=True)
    gestion_id = serializers.SerializerMethodField()
    gestion_anio = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = [
            'id', 'programa', 'programa_nombre', 'programa_codigo',
            'gestion_id', 'gestion_anio',
            'codigo', 'nombre', 'tipo', 'tipo_display', 'descripcion',
            'estado', 'secciones_count', 'secciones', 'created_at', 'updated_at'
        ]

    def get_secciones_count(self, obj):
        return obj.secciones.filter(estado=True).count()

    def get_gestion_id(self, obj):
        presupuesto = obj.presupuestos.select_related('gestion').order_by('created_at').last()
        return presupuesto.gestion.id if presupuesto and presupuesto.gestion else None

    def get_gestion_anio(self, obj):
        presupuesto = obj.presupuestos.select_related('gestion').order_by('created_at').last()
        return presupuesto.gestion.anio if presupuesto and presupuesto.gestion else None


class ProgramaSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)
    areas_count = serializers.SerializerMethodField()

    class Meta:
        model = Programa
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'estado',
            'areas_count', 'areas', 'created_at', 'updated_at'
        ]

    def get_areas_count(self, obj):
        return obj.areas.filter(estado=True).count()
