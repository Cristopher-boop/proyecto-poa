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
    area_programa_id = serializers.ReadOnlyField(source='area.programa_id')
    area_programa_codigo = serializers.ReadOnlyField(source='area.programa.codigo')
    area_programa_nombre = serializers.ReadOnlyField(source='area.programa.nombre')
    acp_codigo = serializers.ReadOnlyField(source='accion_corto_plazo.codigo')
    acp_descripcion = serializers.ReadOnlyField(source='accion_corto_plazo.descripcion')
    acp_programa_id = serializers.ReadOnlyField(source='accion_corto_plazo.accion_mediano_plazo.programa_id')
    acp_programa_codigo = serializers.ReadOnlyField(source='accion_corto_plazo.accion_mediano_plazo.programa.codigo')
    amp_codigo = serializers.ReadOnlyField(source='accion_corto_plazo.accion_mediano_plazo.codigo')
    amp_descripcion = serializers.ReadOnlyField(source='accion_corto_plazo.accion_mediano_plazo.descripcion')
    gestion_id = serializers.ReadOnlyField(source='accion_corto_plazo.gestion_id')
    gestion_anio = serializers.ReadOnlyField(source='accion_corto_plazo.gestion.anio')
    tareas = TareaSerializer(many=True, read_only=True)

    class Meta:
        model = Operacion
        fields = [
            'id', 'accion_corto_plazo', 'acp_codigo', 'acp_descripcion', 'acp_programa_id', 'acp_programa_codigo',
            'amp_codigo', 'amp_descripcion', 'gestion_id', 'gestion_anio',
            'area', 'area_codigo', 'area_nombre', 'area_programa_id', 'area_programa_codigo', 'area_programa_nombre',
            'codigo', 'descripcion', 'es_contratacion', 'estado', 'tareas', 'created_at'
        ]

    def validate(self, attrs):
        area = attrs.get('area') or getattr(self.instance, 'area', None)
        acp = attrs.get('accion_corto_plazo') or getattr(self.instance, 'accion_corto_plazo', None)

        if area and acp:
            area_prog = area.programa
            acp_prog = acp.accion_mediano_plazo.programa
            if area_prog and acp_prog and area_prog.id != acp_prog.id:
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f"Inconsistencia de Programa: El Área '{area.nombre}' pertenece al Programa '{area_prog.codigo} - {area_prog.nombre}', "
                        f"mientras que la Acción a Corto Plazo '{acp.codigo}' pertenece al Programa '{acp_prog.codigo} - {acp_prog.nombre}'. "
                        f"Las operaciones deben pertenecer al mismo programa institucional."
                    ]
                })
        return attrs


class AccionCortoPlazoSerializer(serializers.ModelSerializer):
    amp_codigo = serializers.ReadOnlyField(source='accion_mediano_plazo.codigo')
    amp_descripcion = serializers.ReadOnlyField(source='accion_mediano_plazo.descripcion')
    programa_id = serializers.ReadOnlyField(source='accion_mediano_plazo.programa_id')
    programa_codigo = serializers.ReadOnlyField(source='accion_mediano_plazo.programa.codigo')
    programa_nombre = serializers.ReadOnlyField(source='accion_mediano_plazo.programa.nombre')
    gestion_anio = serializers.ReadOnlyField(source='gestion.anio')
    operaciones = OperacionSerializer(many=True, read_only=True)

    class Meta:
        model = AccionCortoPlazo
        fields = [
            'id', 'accion_mediano_plazo', 'amp_codigo', 'amp_descripcion',
            'programa_id', 'programa_codigo', 'programa_nombre',
            'gestion', 'gestion_anio',
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

