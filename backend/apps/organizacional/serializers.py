from rest_framework import serializers
from .models import Programa, Area, Seccion, Rol


class ProgramaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Programa
        fields = '__all__'


class AreaSerializer(serializers.ModelSerializer):
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    programa_codigo = serializers.CharField(source='programa.codigo', read_only=True)
    secciones_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Area
        fields = '__all__'
    
    def get_secciones_count(self, obj):
        return obj.secciones.filter(estado=True).count()


class SeccionSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo = serializers.CharField(source='area.codigo', read_only=True)
    area_tipo = serializers.CharField(source='area.tipo', read_only=True)
    
    class Meta:
        model = Seccion
        fields = '__all__'


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'