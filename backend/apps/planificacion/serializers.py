from rest_framework import serializers
from .models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea

class TareaSerializer(serializers.ModelSerializer):
    operacion_codigo = serializers.ReadOnlyField(source='operacion.codigo')

    class Meta:
        model = Tarea
        fields = ['id', 'operacion', 'operacion_codigo', 'codigo', 'descripcion', 'estado', 'created_at']


class OperacionSerializer(serializers.ModelSerializer):
    area_codigo = serializers.ReadOnlyField(source='area.codigo')
    area_nombre = serializers.ReadOnlyField(source='area.nombre')
    acp_codigo = serializers.ReadOnlyField(source='accion_corto_plazo.codigo')
    tareas = TareaSerializer(many=True, read_only=True)

    class Meta:
        model = Operacion
        fields = [
            'id', 'accion_corto_plazo', 'acp_codigo', 'area', 'area_codigo', 'area_nombre',
            'codigo', 'descripcion', 'es_contratacion', 'estado', 'tareas', 'created_at'
        ]


class AccionCortoPlazoSerializer(serializers.ModelSerializer):
    amp_codigo = serializers.ReadOnlyField(source='accion_mediano_plazo.codigo')
    gestion_anio = serializers.ReadOnlyField(source='gestion.anio')
    operaciones = OperacionSerializer(many=True, read_only=True)

    class Meta:
        model = AccionCortoPlazo
        fields = [
            'id', 'accion_mediano_plazo', 'amp_codigo', 'gestion', 'gestion_anio',
            'codigo', 'descripcion', 'estado', 'operaciones', 'created_at'
        ]


class AccionMedianoPlazoSerializer(serializers.ModelSerializer):
    programa_codigo = serializers.ReadOnlyField(source='programa.codigo')
    programa_nombre = serializers.ReadOnlyField(source='programa.nombre')
    acciones_corto_plazo = AccionCortoPlazoSerializer(many=True, read_only=True)

    class Meta:
        model = AccionMedianoPlazo
        fields = [
            'id', 'programa', 'programa_codigo', 'programa_nombre', 'codigo',
            'descripcion', 'periodo_inicio', 'periodo_fin', 'estado',
            'acciones_corto_plazo', 'created_at'
        ]
