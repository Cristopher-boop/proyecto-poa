from rest_framework import serializers
from .models import (
    MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria,
    TraspasoPresupuestario, ModificacionPresupuestaria, DetalleModificacion
)
from apps.usuarios.models import Usuario

class RegistroMemoriaUsuarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = RegistroMemoriaUsuario
        fields = ['id', 'usuario', 'usuario_nombre', 'tipo_participacion', 'created_at']
        read_only_fields = ['created_at']

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() or obj.usuario.username

class DetallePresupuestoMemoriaSerializer(serializers.ModelSerializer):
    partida_codigo = serializers.CharField(source='partida.codigo', read_only=True)
    partida_nombre = serializers.CharField(source='partida.nombre', read_only=True)
    
    class Meta:
        model = DetallePresupuestoMemoria
        fields = [
            'id', 'partida', 'partida_codigo', 'partida_nombre', 'descripcion', 
            'unidad_medida', 'mes_requerido', 'fuente_excel', 'factor_calculo',
            'cantidad', 'precio_unitario', 'total_programado', 'precio_total', 
            'estado_ejecucion', 'total_ejecutado', 'saldo_disponible'
        ]
        read_only_fields = ['precio_total', 'total_ejecutado', 'saldo_disponible']

class MemoriaCalculoSerializer(serializers.ModelSerializer):
    participantes = RegistroMemoriaUsuarioSerializer(many=True, read_only=True, source='participaciones')
    detalles = DetallePresupuestoMemoriaSerializer(many=True, read_only=True)
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True)
    area_id = serializers.IntegerField(source='seccion.area_id', read_only=True)
    area_codigo = serializers.CharField(source='seccion.area.codigo', read_only=True)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True)
    operacion_codigo = serializers.CharField(source='operacion.codigo', read_only=True)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = MemoriaCalculo
        fields = [
            'id', 'codigo', 'gestion', 'gestion_anio', 'seccion', 'seccion_nombre', 'area_id', 'area_codigo', 'area_nombre', 'operacion', 'operacion_codigo',
            'justificacion', 'motivo_rechazo', 'es_contratacion', 'estado', 'fecha_aprobacion',
            'total_presupuestado', 'total_ejecutado', 'monto_entrante', 'monto_saliente', 'saldo_disponible',
            'participantes', 'detalles', 'partida_codigo', 'partida_nombre', 'total_items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'estado', 'fecha_aprobacion', 'total_presupuestado', 'total_ejecutado',
            'monto_entrante', 'monto_saliente', 'saldo_disponible', 'codigo'
        ]

    def _get_detalles(self, obj):
        if not hasattr(obj, '_cached_detalles_list'):
            obj._cached_detalles_list = list(obj.detalles.all())
        return obj._cached_detalles_list

    def get_partida_codigo(self, obj):
        detalles = self._get_detalles(obj)
        return detalles[0].partida.codigo if detalles and detalles[0].partida else None

    def get_partida_nombre(self, obj):
        detalles = self._get_detalles(obj)
        return detalles[0].partida.nombre if detalles and detalles[0].partida else None

    def get_total_items(self, obj):
        return len(self._get_detalles(obj))

class MemoriaCalculoListSerializer(serializers.ModelSerializer):
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True)
    area_id = serializers.IntegerField(source='seccion.area_id', read_only=True)
    area_codigo = serializers.CharField(source='seccion.area.codigo', read_only=True)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True)
    operacion_codigo = serializers.CharField(source='operacion.codigo', read_only=True)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = MemoriaCalculo
        fields = [
            'id', 'codigo', 'gestion', 'gestion_anio', 'seccion', 'seccion_nombre', 'area_id', 'area_codigo', 'area_nombre', 'operacion', 'operacion_codigo',
            'justificacion', 'motivo_rechazo', 'es_contratacion', 'estado', 'fecha_aprobacion',
            'total_presupuestado', 'total_ejecutado', 'monto_entrante', 'monto_saliente', 'saldo_disponible',
            'partida_codigo', 'partida_nombre', 'total_items',
            'created_at', 'updated_at'
        ]

    def _get_detalles(self, obj):
        if not hasattr(obj, '_cached_detalles_list'):
            obj._cached_detalles_list = list(obj.detalles.all())
        return obj._cached_detalles_list

    def get_partida_codigo(self, obj):
        detalles = self._get_detalles(obj)
        return detalles[0].partida.codigo if detalles and detalles[0].partida else None

    def get_partida_nombre(self, obj):
        detalles = self._get_detalles(obj)
        return detalles[0].partida.nombre if detalles and detalles[0].partida else None

    def get_total_items(self, obj):
        return len(self._get_detalles(obj))

class TraspasoPresupuestarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraspasoPresupuestario
        fields = '__all__'
        read_only_fields = ['estado', 'usuario_registro']

TraspasoSerializer = TraspasoPresupuestarioSerializer


class DetalleModificacionSerializer(serializers.ModelSerializer):
    memoria_codigo = serializers.CharField(source='memoria.codigo', read_only=True)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)

    class Meta:
        model = DetalleModificacion
        fields = [
            'id', 'memoria', 'memoria_codigo', 'partida_codigo', 'partida_nombre',
            'tipo_movimiento', 'tipo_movimiento_display', 'monto', 'created_at'
        ]

    def get_partida_codigo(self, obj):
        primero = obj.memoria.detalles.first()
        return primero.partida.codigo if primero and primero.partida else None

    def get_partida_nombre(self, obj):
        primero = obj.memoria.detalles.first()
        return primero.partida.nombre if primero and primero.partida else None


class ModificacionPresupuestariaSerializer(serializers.ModelSerializer):
    detalles = DetalleModificacionSerializer(many=True, read_only=True)
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    usuario_registro_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origenes = serializers.SerializerMethodField()
    destinos = serializers.SerializerMethodField()

    class Meta:
        model = ModificacionPresupuestaria
        fields = [
            'id', 'codigo', 'gestion', 'gestion_anio', 'area', 'area_codigo', 'area_nombre',
            'tipo', 'tipo_display', 'motivo', 'total_monto', 'estado',
            'usuario_registro', 'usuario_registro_nombre', 'fecha', 'created_at',
            'detalles', 'origenes', 'destinos'
        ]
        read_only_fields = ['codigo', 'total_monto', 'estado', 'usuario_registro', 'fecha']

    def get_usuario_registro_nombre(self, obj):
        if obj.usuario_registro:
            return obj.usuario_registro.get_full_name() or obj.usuario_registro.username
        return None

    def get_origenes(self, obj):
        detalles = [d for d in obj.detalles.all() if d.tipo_movimiento == 'DISMINUCION']
        return DetalleModificacionSerializer(detalles, many=True).data

    def get_destinos(self, obj):
        detalles = [d for d in obj.detalles.all() if d.tipo_movimiento == 'INCREMENTO']
        return DetalleModificacionSerializer(detalles, many=True).data

