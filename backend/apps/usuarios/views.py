from rest_framework import generics, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.admin.models import LogEntry

from .models import Usuario
from .serializers import UsuarioSerializer, RegistroUsuarioSerializer, LogEntrySerializer


class MeView(APIView):
    """Devuelve el perfil del usuario actualmente autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

class RegistroUsuarioView(generics.CreateAPIView):
    """Permite registrar un nuevo usuario."""
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [permissions.AllowAny]

class LogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """Devuelve el historial de auditoria."""
    queryset = LogEntry.objects.select_related('user', 'content_type').all().order_by('-action_time')
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAdminUser]
