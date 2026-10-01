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
            'is_superuser',
            'last_login',
            'date_joined',
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
    usuario_id = serializers.IntegerField(source='user.id', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    usuario_username = serializers.CharField(source='user.username', read_only=True, default='sistema')
    usuario_cargo = serializers.CharField(source='user.cargo', read_only=True, default='')
    usuario_rol = serializers.SerializerMethodField()
    usuario_area = serializers.SerializerMethodField()
    action_flag_display = serializers.SerializerMethodField()
    modulo = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = [
            'id',
            'action_time',
            'usuario_id',
            'usuario_nombre',
            'usuario_username',
            'usuario_cargo',
            'usuario_rol',
            'usuario_area',
            'object_repr',
            'action_flag',
            'action_flag_display',
            'change_message',
            'modulo',
        ]

    def get_usuario_nombre(self, obj):
        if not obj.user:
            return "Sistema Institucional"
        full = obj.user.get_full_name()
        return full.strip() if full and full.strip() else obj.user.username

    def get_usuario_rol(self, obj):
        if not obj.user:
            return "SISTEMA"
        if obj.user.is_superuser:
            return "SUPERADMINISTRADOR"
        return obj.user.rol.nombre if obj.user.rol else "USUARIO"

    def get_usuario_area(self, obj):
        if not obj.user:
            return "Administración Central"
        if hasattr(obj.user, 'seccion') and obj.user.seccion and obj.user.seccion.area:
            return obj.user.seccion.area.nombre
        return "Dirección General"

    def get_action_flag_display(self, obj):
        msg = (obj.change_message or '').lower()
        if 'inicio de sesión' in msg or 'login' in msg:
            return 'LOGIN'
        mapping = {1: 'CREACIÓN', 2: 'MODIFICACIÓN', 3: 'ELIMINACIÓN'}
        return mapping.get(obj.action_flag, 'MODIFICACIÓN')

    def get_modulo(self, obj):
        ct = str(obj.content_type).lower() if obj.content_type else ''
        repr_str = (obj.object_repr or '').lower()
        msg_str = (obj.change_message or '').lower()

        if 'inicio de sesión' in msg_str or 'login' in msg_str:
            return 'AUTENTICACIÓN'
        if 'memoria' in ct or 'memoria' in repr_str:
            return 'MEMORIAS'
        if 'gasto' in ct or 'gasto' in repr_str or 'comprobante' in msg_str:
            return 'EJECUCIÓN'
        if 'traspaso' in ct or 'traspaso' in repr_str:
            return 'MODIFICACIONES'
        if 'certificacion' in ct or 'certificación' in repr_str:
            return 'CERTIFICACIONES'
        if 'partida' in ct or 'techo' in repr_str or 'presupuesto' in ct:
            return 'PRESUPUESTOS'
        if 'gestion' in ct or 'gestión' in repr_str:
            return 'GESTIONES'
        if 'operacion' in ct or 'acp' in repr_str or 'amp' in repr_str or 'planificacion' in ct:
            return 'PLANIFICACIÓN'
        if 'area' in ct or 'seccion' in ct or 'programa' in ct:
            return 'ORGANIZACIONAL'
        if 'usuario' in ct or 'user' in ct:
            return 'USUARIOS'
        return 'SISTEMA'

