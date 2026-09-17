from rest_framework import serializers
from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria, TraspasoPresupuestario
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
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True)
    operacion_codigo = serializers.CharField(source='operacion.codigo', read_only=True)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = MemoriaCalculo
        fields = [
            'id', 'codigo', 'gestion', 'gestion_anio', 'seccion', 'seccion_nombre', 'area_nombre', 'operacion', 'operacion_codigo',
            'justificacion', 'motivo_rechazo', 'es_contratacion', 'estado', 'fecha_aprobacion',
            'total_presupuestado', 'total_ejecutado', 'monto_entrante', 'monto_saliente', 'saldo_disponible',
            'participantes', 'detalles', 'partida_codigo', 'partida_nombre', 'total_items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'estado', 'fecha_aprobacion', 'total_presupuestado', 'total_ejecutado',
            'monto_entrante', 'monto_saliente', 'saldo_disponible', 'codigo'
        ]

    def get_partida_codigo(self, obj):
        detalles = obj.detalles.all()
        if detalles:
            return detalles[0].partida.codigo
        return None

    def get_partida_nombre(self, obj):
        detalles = obj.detalles.all()
        if detalles:
            return detalles[0].partida.nombre
        return None

    def get_total_items(self, obj):
        return len(obj.detalles.all())

class MemoriaCalculoListSerializer(serializers.ModelSerializer):
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True)
    operacion_codigo = serializers.CharField(source='operacion.codigo', read_only=True)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = MemoriaCalculo
        fields = [
            'id', 'codigo', 'gestion', 'gestion_anio', 'seccion', 'seccion_nombre', 'area_nombre', 'operacion', 'operacion_codigo',
            'justificacion', 'motivo_rechazo', 'es_contratacion', 'estado', 'fecha_aprobacion',
            'total_presupuestado', 'total_ejecutado', 'monto_entrante', 'monto_saliente', 'saldo_disponible',
            'partida_codigo', 'partida_nombre', 'total_items',
            'created_at', 'updated_at'
        ]

    def get_partida_codigo(self, obj):
        detalles = obj.detalles.all()
        if detalles:
            return detalles[0].partida.codigo
        return None

    def get_partida_nombre(self, obj):
        detalles = obj.detalles.all()
        if detalles:
            return detalles[0].partida.nombre
        return None

    def get_total_items(self, obj):
        return len(obj.detalles.all())

class TraspasoPresupuestarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraspasoPresupuestario
        fields = '__all__'
        read_only_fields = ['estado', 'usuario_registro']

TraspasoSerializer = TraspasoPresupuestarioSerializer
