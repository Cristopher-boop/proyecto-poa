from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import Usuario, Rol
from .serializers import UsuarioSerializer, RegistroUsuarioSerializer, LogEntrySerializer, RolSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Registrar LogEntry de inicio de sesión
        try:
            content_type = ContentType.objects.get_for_model(user)
            LogEntry.objects.create(
                user_id=user.id,
                content_type_id=content_type.id,
                object_id=str(user.id),
                object_repr=f"Usuario {user.get_full_name() or user.username}",
                action_flag=CHANGE,
                change_message="Inicio de Sesión (Login)"
            )
        except Exception as e:
            print("Error creando logentry de login:", e)

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """Devuelve el perfil del usuario actualmente autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class RegistroUsuarioView(generics.CreateAPIView):
    """Permite el registro de nuevos usuarios."""
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    """Permite listar los roles disponibles."""
    queryset = Rol.objects.all().order_by('id')
    serializer_class = RolSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    pagination_class = None


class LogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """Permite ver los logs del sistema (solo para superadmin y administradores)."""
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Solo SuperAdmin o Administradores pueden ver logs
        if user.is_superuser or (user.rol and user.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR']):
            qs = LogEntry.objects.all().order_by('-action_time')
            only_logins = self.request.query_params.get('only_logins')
            if only_logins == 'true':
                qs = qs.filter(change_message__icontains='Inicio de Sesión')
            return qs
        return LogEntry.objects.none()


class UltimosIngresosView(APIView):
    """Devuelve la lista de usuarios con sus últimos inicios de sesión (last_login) para superadministradores."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_superuser or (user.rol and user.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR'])):
            return Response({'error': 'No tienes permisos de superadministrador.'}, status=status.HTTP_403_FORBIDDEN)

        usuarios = Usuario.objects.all().order_by('-last_login', 'username')
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)
