from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notificacion
from .serializers import NotificacionSerializer

class NotificacionViewSet(viewsets.ModelViewSet):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(usuario_destino=self.request.user)

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        if not notificacion.leido:
            notificacion.leido = True
            notificacion.fecha_lectura = timezone.now()
            notificacion.save(update_fields=['leido', 'fecha_lectura'])
        return Response({'status': 'Notificación marcada como leída'})

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        updated_count = Notificacion.objects.filter(
            usuario_destino=request.user,
            leido=False
        ).update(leido=True, fecha_lectura=timezone.now())
        return Response({'status': f'{updated_count} notificaciones marcadas como leídas'})

    @action(detail=False, methods=['get'], url_path='no-leidas-count')
    def no_leidas_count(self, request):
        count = Notificacion.objects.filter(usuario_destino=request.user, leido=False).count()
        return Response({'unread_count': count})
