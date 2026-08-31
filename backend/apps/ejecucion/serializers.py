from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import Gasto
from apps.memorias.models import MemoriaCalculo


class GastoSerializer(serializers.ModelSerializer):
    partida_id = serializers.SerializerMethodField()
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()
    memoria_codigo = serializers.CharField(source='memoria.codigo', read_only=True)
    area_id = serializers.IntegerField(source='memoria.seccion.area.id', read_only=True)
    area_nombre = serializers.CharField(source='memoria.seccion.area.nombre', read_only=True)
    seccion_nombre = serializers.CharField(source='memoria.seccion.nombre', read_only=True)
    gestion_anio = serializers.IntegerField(source='memoria.gestion.anio', read_only=True)
    gestion_id = serializers.IntegerField(source='memoria.gestion.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Gasto
        fields = [
            'id',
            'monto_ejecutado',
            'fecha_gasto',
            'comprobante_num',
            'observacion',
            'memoria',
            'partida_id',
            'partida_codigo',
            'partida_nombre',
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

    def get_partida(self, obj):
        detalle = obj.memoria.detalles.first()
        return detalle.partida if detalle else None

    def get_partida_id(self, obj):
        partida = self.get_partida(obj)
        return partida.id if partida else None

    def get_partida_codigo(self, obj):
        partida = self.get_partida(obj)
        return partida.codigo if partida else None

    def get_partida_nombre(self, obj):
        partida = self.get_partida(obj)
        return partida.nombre if partida else None

    def get_usuario_nombre(self, obj):
        if not obj.usuario_registro:
            return None
        return obj.usuario_registro.get_full_name() or obj.usuario_registro.username

    def validate(self, data):
        monto = data.get('monto_ejecutado')
        if monto is not None and monto <= Decimal('0.00'):
            raise serializers.ValidationError({'monto_ejecutado': 'El monto ejecutado debe ser mayor a 0.'})

        memoria = data.get('memoria') or (self.instance.memoria if self.instance else None)
        if memoria and monto is not None:
            precio_total = memoria.total_presupuestado or Decimal('0.00')
            gastos_qs = memoria.gastos.all()
            if self.instance:
                gastos_qs = gastos_qs.exclude(id=self.instance.id)
            total_otros_gastos = gastos_qs.aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
            saldo_maximo = max(Decimal('0.00'), precio_total - total_otros_gastos)

            if Decimal(str(monto)) > saldo_maximo:
                raise serializers.ValidationError({
                    'monto_ejecutado': f'El monto asignado (Bs. {monto}) supera el saldo disponible restante para esta memoria (Bs. {saldo_maximo:.2f}).'
                })

        return data
