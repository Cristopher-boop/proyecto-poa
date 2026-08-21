from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.admin.models import LogEntry
from .models import Usuario, Rol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion']


class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True, default=None)
    area_id = serializers.IntegerField(source='seccion.area_id', read_only=True, default=None)
    area_nombre = serializers.CharField(source='seccion.area.nombre', read_only=True, default=None)
    seccion_nombre = serializers.CharField(source='seccion.nombre', read_only=True, default=None)

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
            'rol_nombre',
            'area_id',
            'area_nombre',
            'seccion_nombre',
            'seccion',
            'is_superuser'
        ]
        read_only_fields = fields


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    rol_id = serializers.IntegerField(required=False, allow_null=True)
    seccion_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Usuario
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'rol_id', 'seccion_id']

    def create(self, validated_data):
        rol_id = validated_data.pop('rol_id', None)
        seccion_id = validated_data.pop('seccion_id', None)
        raw_password = validated_data.pop('password')
        
        user = Usuario(
            **validated_data,
            rol_id=rol_id,
            seccion_id=seccion_id
        )
        user.set_password(raw_password)
        user.save()
        return user


class LogEntrySerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='user.get_full_name', read_only=True)
    usuario_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LogEntry
        fields = ['id', 'action_time', 'usuario_nombre', 'usuario_username', 'object_repr', 'action_flag', 'change_message']
