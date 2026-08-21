from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.admin.models import LogEntry
from .models import Usuario, Rol
from apps.organizacional.models import Seccion

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion']

class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True, default=None)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True, default=None)
    area_id = serializers.IntegerField(source='seccion.area.id', read_only=True, default=None)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True, default=None)

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'cargo',
            'estado',
            'is_superuser',
            'rol_nombre',
            'rol',
            'seccion',
            'seccion_nombre',
            'area_id',
            'area_nombre',
        ]
        read_only_fields = ['id', 'is_superuser', 'rol_nombre', 'seccion_nombre', 'area_id', 'area_nombre']

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'rol_nombre', 'seccion']

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol_nombre')
        rol, _ = Rol.objects.get_or_create(nombre=rol_nombre.upper())
        validated_data['rol'] = rol
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class LogEntrySerializer(serializers.ModelSerializer):
    actor = serializers.CharField(source='user.username', read_only=True)
    accion = serializers.CharField(source='get_action_flag_display', read_only=True)
    modelo = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = LogEntry
        fields = ['id', 'action_time', 'actor', 'accion', 'modelo', 'object_repr', 'change_message']

