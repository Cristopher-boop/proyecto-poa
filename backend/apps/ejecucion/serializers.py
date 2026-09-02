from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import Gasto, CertificacionPOA
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


class CertificacionPOASerializer(serializers.ModelSerializer):
    gestion_anio = serializers.IntegerField(source='gestion.anio', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_tipo = serializers.CharField(source='area.tipo', read_only=True)
    
    partida_codigo = serializers.CharField(source='partida.codigo', read_only=True, default=None)
    partida_nombre = serializers.CharField(source='partida.nombre', read_only=True, default=None)
    memoria_codigo = serializers.CharField(source='memoria.codigo', read_only=True, default=None)
    
    creado_por_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    operaciones_detalle = serializers.SerializerMethodField()
    jerarquia_resumen = serializers.SerializerMethodField()

    class Meta:
        model = CertificacionPOA
        fields = [
            'id',
            'codigo_certificacion',
            'numero_oficio_solicitud',
            'gestion',
            'gestion_anio',
            'area',
            'area_codigo',
            'area_nombre',
            'area_tipo',
            'fecha',
            'version',
            'operaciones',
            'operaciones_detalle',
            'jerarquia_resumen',
            'memoria',
            'memoria_codigo',
            'partida',
            'partida_codigo',
            'partida_nombre',
            'partida_literal',
            'monto_solicitado',
            'concepto_gasto',
            'notas',
            'solicitante_nombre',
            'solicitante_cargo',
            'elaborador_nombre',
            'elaborador_cargo',
            'estado',
            'estado_display',
            'creado_por',
            'creado_por_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'creado_por', 'created_at', 'updated_at']

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return obj.creado_por.get_full_name() or obj.creado_por.username
        return None

    def get_operaciones_detalle(self, obj):
        detalles = []
        for op in obj.operaciones.select_related(
            'accion_corto_plazo__accion_mediano_plazo__programa',
            'area__programa'
        ).all():
            acp = op.accion_corto_plazo
            amp = acp.accion_mediano_plazo if acp else None
            prog = amp.programa if amp else (op.area.programa if op.area else None)
            detalles.append({
                'id': op.id,
                'codigo': op.codigo,
                'descripcion': op.descripcion,
                'acp_id': acp.id if acp else None,
                'acp_codigo': acp.codigo if acp else '',
                'acp_descripcion': acp.descripcion if acp else '',
                'amp_id': amp.id if amp else None,
                'amp_codigo': amp.codigo if amp else '',
                'amp_descripcion': amp.descripcion if amp else '',
                'programa_id': prog.id if prog else None,
                'programa_codigo': prog.codigo if prog else '',
                'programa_nombre': prog.nombre if prog else '',
            })
        return detalles

    def get_jerarquia_resumen(self, obj):
        """Devuelve las listas únicas agrupadas de AMPs, ACPs, Operaciones y Programas"""
        amps_dict = {}
        acps_dict = {}
        ops_list = []
        programas_dict = {}

        for op in obj.operaciones.select_related(
            'accion_corto_plazo__accion_mediano_plazo__programa',
            'area__programa'
        ).all():
            acp = op.accion_corto_plazo
            amp = acp.accion_mediano_plazo if acp else None
            prog = amp.programa if amp else (op.area.programa if op.area else None)

            if amp and amp.id not in amps_dict:
                amps_dict[amp.id] = {
                    'id': amp.id,
                    'codigo': amp.codigo,
                    'descripcion': amp.descripcion
                }

            if acp and acp.id not in acps_dict:
                acps_dict[acp.id] = {
                    'id': acp.id,
                    'codigo': acp.codigo,
                    'descripcion': acp.descripcion
                }

            if prog and prog.id not in programas_dict:
                programas_dict[prog.id] = {
                    'id': prog.id,
                    'codigo': prog.codigo,
                    'nombre': prog.nombre
                }

            ops_list.append({
                'id': op.id,
                'codigo': op.codigo,
                'descripcion': op.descripcion
            })

        return {
            'amps': list(amps_dict.values()),
            'acps': list(acps_dict.values()),
            'operaciones': ops_list,
            'programas': list(programas_dict.values()),
        }

