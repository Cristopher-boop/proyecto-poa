import os

with open(r'c:\Users\hp\Desktop\proyecto-poa\backend\apps\memorias\serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''class MemoriaCalculoSerializer(serializers.ModelSerializer):
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
'''

start = content.find('class MemoriaCalculoSerializer(serializers.ModelSerializer):')
end = content.find('class MemoriaCalculoListSerializer(serializers.ModelSerializer):')

content = content[:start] + replacement + '\n' + content[end:]

with open(r'c:\Users\hp\Desktop\proyecto-poa\backend\apps\memorias\serializers.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated MemoriaCalculoSerializer')
