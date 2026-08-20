from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import Gestion, Partida, PresupuestoArea
from apps.organizacional.models import Area
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria
from apps.ejecucion.models import Gasto


class GestionSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_memorias = serializers.SerializerMethodField()
    total_presupuesto_inicial = serializers.SerializerMethodField()
    total_presupuesto_ejecutado = serializers.SerializerMethodField()
    total_presupuesto_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Gestion
        fields = [
            'id',
            'anio',
            'estado',
            'estado_display',
            'fecha_cierre',
            'total_memorias',
            'total_presupuesto_inicial',
            'total_presupuesto_ejecutado',
            'total_presupuesto_disponible',
            'created_at',
            'updated_at',
        ]

    def get_total_memorias(self, obj):
        return obj.memorias_calculo.count()

    def get_total_presupuesto_inicial(self, obj):
        total = obj.presupuestos_area.aggregate(total=Sum('monto_inicial'))['total']
        return str(total or Decimal('0.00'))

    def get_total_presupuesto_disponible(self, obj):
        total = obj.presupuestos_area.aggregate(total=Sum('monto_actual'))['total']
        return str(total or Decimal('0.00'))

    def get_total_presupuesto_ejecutado(self, obj):
        gastos = Gasto.objects.filter(
            detalle_memoria__memoria__gestion=obj
        ).aggregate(total=Sum('monto_ejecutado'))['total']
        return str(gastos or Decimal('0.00'))


class PartidaSerializer(serializers.ModelSerializer):
    clase_display = serializers.CharField(source='get_clase_display', read_only=True)

    class Meta:
        model = Partida
        fields = ['id', 'codigo', 'nombre', 'clase', 'clase_display', 'descripcion', 'estado', 'created_at']


class PresupuestoAreaSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)
    area_tipo = serializers.CharField(source='area.tipo', read_only=True)
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    gestion_estado = serializers.CharField(source='gestion.estado', read_only=True)
    monto_ejecutado = serializers.SerializerMethodField()
    porcentaje_ejecucion = serializers.SerializerMethodField()
    total_memorias_aprobadas = serializers.SerializerMethodField()

    class Meta:
        model = PresupuestoArea
        fields = [
            'id',
            'gestion',
            'gestion_anio',
            'gestion_estado',
            'area',
            'area_nombre',
            'area_codigo',
            'area_tipo',
            'monto_inicial',
            'monto_actual',
            'monto_ejecutado',
            'porcentaje_ejecucion',
            'total_memorias_aprobadas',
            'estado',
            'created_at',
            'updated_at',
        ]

    def get_monto_ejecutado(self, obj):
        gastos = Gasto.objects.filter(
            detalle_memoria__memoria__seccion__area=obj.area,
            detalle_memoria__memoria__gestion=obj.gestion
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        return str(gastos)

    def get_porcentaje_ejecucion(self, obj):
        if not obj.monto_inicial or obj.monto_inicial == Decimal('0.00'):
            return 0.0
        gastos = Gasto.objects.filter(
            detalle_memoria__memoria__seccion__area=obj.area,
            detalle_memoria__memoria__gestion=obj.gestion
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        porcentaje = (gastos / obj.monto_inicial) * Decimal('100.0')
        return round(float(porcentaje), 2)

    def get_total_memorias_aprobadas(self, obj):
        return MemoriaCalculo.objects.filter(
            gestion=obj.gestion,
            seccion__area=obj.area,
            estado__in=[MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS, MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA]
        ).count()
