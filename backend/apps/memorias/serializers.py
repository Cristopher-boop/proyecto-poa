from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria, TraspasoPresupuestario
from apps.presupuestos.models import Gestion, Partida
from apps.organizacional.models import Seccion
from apps.ejecucion.models import Gasto


class DetallePresupuestoMemoriaSerializer(serializers.ModelSerializer):
    partida = serializers.PrimaryKeyRelatedField(queryset=Partida.objects.all(), required=False)
    partida_codigo = serializers.CharField(source='partida.codigo', read_only=True)
    partida_nombre = serializers.CharField(source='partida.nombre', read_only=True)
    partida_clase = serializers.CharField(source='partida.clase', read_only=True)
    precio_total = serializers.SerializerMethodField()
    monto_ejecutado = serializers.SerializerMethodField()
    monto_disponible = serializers.SerializerMethodField()

    class Meta:
        model = DetallePresupuestoMemoria
        fields = [
            'id',
            'memoria',
            'partida',
            'partida_codigo',
            'partida_nombre',
            'partida_clase',
            'descripcion',
            'unidad_medida',
            'cantidad',
            'precio_unitario',
            'precio_total',
            'estado_ejecucion',
            'monto_ejecutado',
            'monto_disponible',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'memoria': {'required': False},
            'partida': {'required': False},
        }

    def get_precio_total(self, obj):
        cant = obj.cantidad or Decimal('0.00')
        precio = obj.precio_unitario or Decimal('0.00')
        return str(cant * precio)

    def get_monto_ejecutado(self, obj):
        gastos = obj.gastos.aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        return str(gastos)

    def get_monto_disponible(self, obj):
        total = (obj.cantidad or Decimal('0.00')) * (obj.precio_unitario or Decimal('0.00'))
        gastos = obj.gastos.aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        return str(max(Decimal('0.00'), total - gastos))


class RegistroMemoriaUsuarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = RegistroMemoriaUsuario
        fields = ['id', 'memoria', 'usuario', 'usuario_nombre', 'usuario_username', 'tipo_participacion', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'memoria': {'required': False}
        }

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() or obj.usuario.username


class MemoriaCalculoSerializer(serializers.ModelSerializer):
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    gestion_estado = serializers.CharField(source='gestion.estado', read_only=True)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True)
    area_id = serializers.IntegerField(source='seccion.area.id', read_only=True)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='seccion.area.codigo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Partida principal asociada
    partida_id = serializers.IntegerField(write_only=True, required=False)
    partida_codigo = serializers.SerializerMethodField()
    partida_nombre = serializers.SerializerMethodField()

    detalles = DetallePresupuestoMemoriaSerializer(many=True, required=False)
    participaciones = RegistroMemoriaUsuarioSerializer(many=True, read_only=True)

    total_presupuesto = serializers.SerializerMethodField()
    total_ejecutado = serializers.SerializerMethodField()
    total_disponible = serializers.SerializerMethodField()

    class Meta:
        model = MemoriaCalculo
        fields = [
            'id',
            'codigo',
            'gestion',
            'gestion_anio',
            'gestion_estado',
            'seccion',
            'seccion_nombre',
            'area_id',
            'area_nombre',
            'area_codigo',
            'justificacion',
            'estado',
            'estado_display',
            'fecha_aprobacion',
            'partida_id',
            'partida_codigo',
            'partida_nombre',
            'detalles',
            'participaciones',
            'total_presupuesto',
            'total_ejecutado',
            'total_disponible',
            'created_at',
            'updated_at',
        ]

    def get_partida_id(self, obj):
        primer_detalle = obj.detalles.first()
        return primer_detalle.partida.id if primer_detalle and primer_detalle.partida else None

    def get_partida_codigo(self, obj):
        primer_detalle = obj.detalles.first()
        return primer_detalle.partida.codigo if primer_detalle and primer_detalle.partida else None

    def get_partida_nombre(self, obj):
        primer_detalle = obj.detalles.first()
        return primer_detalle.partida.nombre if primer_detalle and primer_detalle.partida else None

    def get_total_presupuesto(self, obj):
        total = sum(
            ((d.cantidad or Decimal('0.00')) * (d.precio_unitario or Decimal('0.00')))
            for d in obj.detalles.all()
        )
        return str(total)

    def get_total_ejecutado(self, obj):
        gastos = Gasto.objects.filter(
            detalle_memoria__memoria=obj
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        return str(gastos)

    def get_total_disponible(self, obj):
        saldo_info = obj.obtener_saldo_calculado()
        return saldo_info['disponible']

    def validate(self, data):
        data.pop('partida_id', None)
        return data

    def create(self, validated_data):
        validated_data.pop('detalles', None)
        validated_data.pop('participaciones', None)
        validated_data.pop('partida_id', None)

        request = self.context.get('request')
        request_data = request.data if request else {}
        detalles_data = request_data.get('detalles', [])
        partida_id_global = request_data.get('partida_id') or request_data.get('partida')

        memoria = MemoriaCalculo.objects.create(**validated_data)

        # Registrar al usuario creador como ELABORADOR
        if request and request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
            )

        # Crear renglones/detalles
        for item in detalles_data:
            item_partida_id = item.get('partida') or item.get('partida_id') or partida_id_global
            if not item_partida_id:
                primer_p = Partida.objects.first()
                item_partida_id = primer_p.id if primer_p else None

            if item_partida_id:
                DetallePresupuestoMemoria.objects.create(
                    memoria=memoria,
                    partida_id=item_partida_id,
                    descripcion=item.get('descripcion', ''),
                    unidad_medida=item.get('unidad_medida', 'UNIDAD'),
                    cantidad=Decimal(str(item.get('cantidad', 1))),
                    precio_unitario=Decimal(str(item.get('precio_unitario', 0))),
                    estado_ejecucion=DetallePresupuestoMemoria.EstadoGasto.PENDIENTE,
                )

        return memoria

    def update(self, instance, validated_data):
        validated_data.pop('detalles', None)
        validated_data.pop('participaciones', None)
        validated_data.pop('partida_id', None)

        request = self.context.get('request')
        request_data = request.data if request else {}
        detalles_data = request_data.get('detalles')
        partida_id_global = request_data.get('partida_id') or request_data.get('partida')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if detalles_data is not None:
            instance.detalles.all().delete()
            for item in detalles_data:
                item_partida_id = item.get('partida') or item.get('partida_id') or partida_id_global
                if not item_partida_id:
                    primer_p = Partida.objects.first()
                    item_partida_id = primer_p.id if primer_p else None

                if item_partida_id:
                    DetallePresupuestoMemoria.objects.create(
                        memoria=instance,
                        partida_id=item_partida_id,
                        descripcion=item.get('descripcion', ''),
                        unidad_medida=item.get('unidad_medida', 'UNIDAD'),
                        cantidad=Decimal(str(item.get('cantidad', 1))),
                        precio_unitario=Decimal(str(item.get('precio_unitario', 0))),
                        estado_ejecucion=item.get('estado_ejecucion', DetallePresupuestoMemoria.EstadoGasto.PENDIENTE),
                    )

        return instance


class TraspasoSerializer(serializers.ModelSerializer):
    memoria_origen_codigo = serializers.CharField(source='memoria_origen.codigo', read_only=True)
    memoria_destino_codigo = serializers.CharField(source='memoria_destino.codigo', read_only=True)
    usuario_registro_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = TraspasoPresupuestario
        fields = [
            'id',
            'monto',
            'motivo',
            'estado',
            'estado_display',
            'memoria_origen',
            'memoria_origen_codigo',
            'memoria_destino',
            'memoria_destino_codigo',
            'usuario_registro',
            'usuario_registro_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'estado', 'usuario_registro', 'created_at', 'updated_at']

    def get_usuario_registro_nombre(self, obj):
        if obj.usuario_registro:
            return obj.usuario_registro.get_full_name() or obj.usuario_registro.username
        return None

    def validate(self, data):
        memoria_origen = data.get('memoria_origen')
        memoria_destino = data.get('memoria_destino')
        monto = data.get('monto')

        if not memoria_origen or not memoria_destino:
            raise serializers.ValidationError({
                'non_field_errors': ['Debe especificar tanto la memoria de origen como la de destino.']
            })

        if memoria_origen.id == memoria_destino.id:
            raise serializers.ValidationError({
                'memoria_destino': ['La memoria de origen y la memoria de destino no pueden ser la misma.']
            })

        if memoria_origen.seccion.area_id != memoria_destino.seccion.area_id:
            raise serializers.ValidationError({
                'non_field_errors': ['Solo se puede traspasar saldo entre memorias de la misma área.']
            })

        if memoria_origen.gestion_id != memoria_destino.gestion_id:
            raise serializers.ValidationError({
                'non_field_errors': ['Solo se puede traspasar saldo entre memorias de la misma gestión.']
            })

        if memoria_origen.estado != MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS:
            raise serializers.ValidationError({
                'memoria_origen': [f'La memoria de origen {memoria_origen.codigo} no está aprobada por Finanzas (Estado actual: {memoria_origen.get_estado_display()}).']
            })

        if memoria_destino.estado != MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS:
            raise serializers.ValidationError({
                'memoria_destino': [f'La memoria de destino {memoria_destino.codigo} no está aprobada por Finanzas (Estado actual: {memoria_destino.get_estado_display()}).']
            })

        if not monto or monto <= Decimal('0.00'):
            raise serializers.ValidationError({
                'monto': ['El monto del traspaso debe ser mayor a 0.']
            })

        saldo_origen = memoria_origen.obtener_saldo_calculado()
        disponible_origen = Decimal(saldo_origen['disponible'])

        if monto > disponible_origen:
            raise serializers.ValidationError({
                'monto': [f'Saldo insuficiente en la memoria de origen. Disponible: Bs. {disponible_origen:.2f}.']
            })

        return data

