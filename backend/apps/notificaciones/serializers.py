from rest_framework import serializers
from .models import Notificacion

class NotificacionSerializer(serializers.ModelSerializer):
    origen_nombre = serializers.ReadOnlyField(source='usuario_origen.get_full_name')
    origen_username = serializers.ReadOnlyField(source='usuario_origen.username')

    class Meta:
        model = Notificacion
        fields = [
            'id', 'usuario_destino', 'usuario_origen', 'origen_nombre', 'origen_username',
            'titulo', 'mensaje', 'tipo', 'enlace', 'leido', 'fecha_lectura', 'created_at'
        ]
