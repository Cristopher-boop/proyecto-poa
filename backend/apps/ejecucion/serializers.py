from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import Gasto
from apps.memorias.models import DetallePresupuestoMemoria


class GastoSerializer(serializers.ModelSerializer):
    detalle_descripcion = serializers.CharField(source='detalle_memoria.descripcion', read_only=True)
    partida_id = serializers.IntegerField(source='detalle_memoria.partida.id', read_only=True)
    partida_codigo = serializers.CharField(source='detalle_memoria.partida.codigo', read_only=True)
    partida_nombre = serializers.CharField(source='detalle_memoria.partida.nombre', read_only=True)
    memoria_codigo = serializers.CharField(source='detalle_memoria.memoria.codigo', read_only=True)
    memoria_id = serializers.IntegerField(source='detalle_memoria.memoria.id', read_only=True)
    area_id = serializers.IntegerField(source='detalle_memoria.memoria.seccion.area.id', read_only=True)
    area_nombre = serializers.CharField(source='detalle_memoria.memoria.seccion.area.nombre', read_only=True)
    seccion_nombre = serializers.CharField(source='detalle_memoria.memoria.seccion.nombre', read_only=True)
    gestion_anio = serializers.IntegerField(source='detalle_memoria.memoria.gestion.anio', read_only=True)
    gestion_id = serializers.IntegerField(source='detalle_memoria.memoria.gestion.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Gasto
        fields = [
            'id',
            'monto_ejecutado',
            'fecha_gasto',
            'comprobante_num',
            'observacion',
            'detalle_memoria',
            'detalle_descripcion',
            'partida_id',
            'partida_codigo',
            'partida_nombre',
            'memoria_id',
            'memoria_codigo',
            'area_id',
            'area_nombre',
            'seccion_nombre',
            'gestion_id',
            'gestion_anio',
            'usuario_registro',
            'usuario_nombre',
            'created_at',
        ]
        read_only_fields = ['id', 'usuario_registro', 'created_at']

    def get_usuario_nombre(self, obj):
        if not obj.usuario_registro:
            return None
        return obj.usuario_registro.get_full_name() or obj.usuario_registro.username

    def validate(self, data):
        monto = data.get('monto_ejecutado')
        if monto is not None and monto <= Decimal('0.00'):
            raise serializers.ValidationError({'monto_ejecutado': 'El monto ejecutado debe ser mayor a 0.'})

        detalle = data.get('detalle_memoria') or (self.instance.detalle_memoria if self.instance else None)
        if detalle and monto is not None:
            cant = detalle.cantidad or Decimal('0.00')
            precio = detalle.precio_unitario or Decimal('0.00')
            precio_total = cant * precio
            gastos_qs = detalle.gastos.all()
            if self.instance:
                gastos_qs = gastos_qs.exclude(id=self.instance.id)
            total_otros_gastos = gastos_qs.aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
            saldo_maximo = max(Decimal('0.00'), precio_total - total_otros_gastos)

            if Decimal(str(monto)) > saldo_maximo:
                raise serializers.ValidationError({
                    'monto_ejecutado': f'El monto asignado (Bs. {monto}) supera el saldo disponible restante para este ítem (Bs. {saldo_maximo:.2f}).'
                })

        return data
