from rest_framework import generics, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.admin.models import LogEntry
from .models import Usuario, Rol
from .serializers import UsuarioSerializer, RegistroUsuarioSerializer, LogEntrySerializer, RolSerializer


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
    """Permite ver los logs del sistema (solo para administradores)."""
    queryset = LogEntry.objects.all().order_by('-action_time')
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Solo SuperAdmin o Administradores pueden ver logs
        if user.is_superuser or (user.rol and user.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR']):
            return super().get_queryset()
        return LogEntry.objects.none()
