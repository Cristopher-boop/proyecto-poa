from rest_framework import viewsets
from .models import Usuario
from .serializers import UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol', 'seccion').all()
    serializer_class = UsuarioSerializer
